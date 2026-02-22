import Phaser from "phaser";
import type {
  CameraState,
  DrawCommand,
  EngineAsset,
  EngineStateMap,
  EngineTexture,
} from "~/engine/types";

interface SpriteEntry {
  gameObject: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  assetKey: string;
  assetState: string;
  layer: number;
  frameIndex: number;
  frameTimer: number;
  fps: number;
  frames: ImageBitmap[];
  textureKeys: string[];
}

type SFXHandler = (soundId: string, volume: number) => void;
type BGMHandler = (soundId: string, action: "play" | "stop") => void;

/** Passive Phaser scene — used only for rendering, no game logic. */
class MSWRenderScene extends Phaser.Scene {
  constructor() {
    super({ key: "MSWRenderScene" });
  }
}

export class PhaserRenderer {
  private phaserGame: Phaser.Game | null = null;
  private scene: Phaser.Scene | null = null;
  private sprites = new Map<string, SpriteEntry>();
  private cameraState: CameraState = { x: 0, y: 0, zoom: 1 };
  private assetRegistry: Map<string, EngineAsset> | null = null;
  private width = 0;
  private height = 0;
  private sceneReady = false;
  private sceneReadyPromise: Promise<void>;
  private resolveSceneReady!: () => void;
  private textureCounter = 0;

  onSFX: SFXHandler | null = null;
  onBGM: BGMHandler | null = null;

  constructor() {
    this.sceneReadyPromise = new Promise<void>((resolve) => {
      this.resolveSceneReady = resolve;
    });
  }

  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.phaserGame = new Phaser.Game({
      type: Phaser.CANVAS,
      canvas,
      width,
      height,
      backgroundColor: "#000000",
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      physics: undefined,
      render: { pixelArt: true },
      scene: MSWRenderScene,
    });

    // Get scene reference once ready
    this.phaserGame.events.on("ready", () => {
      const scene = this.phaserGame!.scene.getScene("MSWRenderScene");
      if (scene) {
        this.scene = scene;
        // Pause scene updates — we only use it for rendering
        scene.scene.pause();
        this.sceneReady = true;
        this.resolveSceneReady();
      }
    });

    // Stop Phaser's own game loop — we'll call render manually
    this.phaserGame.events.on("ready", () => {
      this.phaserGame!.loop.sleep();
    });
  }

  async waitForScene(): Promise<void> {
    await this.sceneReadyPromise;
  }

  setAssetRegistry(registry: Map<string, EngineAsset>): void {
    this.assetRegistry = registry;
  }

  processDrawQueue(commands: DrawCommand[]): void {
    if (!this.scene || !this.sceneReady) return;

    for (const cmd of commands) {
      switch (cmd.type) {
        case "CLEAR":
          this.scene.cameras.main.setBackgroundColor(cmd.color);
          break;

        case "SPAWN": {
          const frames = this.resolveFrames(cmd.assetKey, cmd.assetState);
          const textureKeys = this.registerTextures(frames);
          let gameObject: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

          if (textureKeys.length > 0) {
            gameObject = this.scene.add.image(cmd.x, cmd.y, textureKeys[0]);
          } else {
            // Placeholder colored rect
            gameObject = this.scene.add.rectangle(cmd.x, cmd.y, 32, 32, 0xff00ff);
          }

          gameObject.setDepth(cmd.layer);

          this.sprites.set(cmd.id, {
            gameObject,
            assetKey: cmd.assetKey,
            assetState: cmd.assetState,
            layer: cmd.layer,
            frameIndex: 0,
            frameTimer: 0,
            fps: this.resolveFps(cmd.assetKey, cmd.assetState),
            frames,
            textureKeys,
          });
          break;
        }

        case "DESTROY": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.gameObject.destroy();
            this.sprites.delete(cmd.id);
          }
          break;
        }

        case "MOVE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.gameObject.setPosition(cmd.x, cmd.y);
          }
          break;
        }

        case "ROTATE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.gameObject.setRotation(cmd.rotation);
          }
          break;
        }

        case "SCALE": {
          const entry = this.sprites.get(cmd.id);
          if (entry && "setScale" in entry.gameObject) {
            (entry.gameObject as Phaser.GameObjects.Image).setScale(cmd.scaleX, cmd.scaleY);
          }
          break;
        }

        case "STATE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.assetState = cmd.assetState;
            entry.frames = this.resolveFrames(entry.assetKey, cmd.assetState);
            entry.textureKeys = this.registerTextures(entry.frames);
            entry.fps = this.resolveFps(entry.assetKey, cmd.assetState);
            entry.frameIndex = 0;
            entry.frameTimer = 0;
            if (entry.textureKeys.length > 0 && "setTexture" in entry.gameObject) {
              (entry.gameObject as Phaser.GameObjects.Image).setTexture(entry.textureKeys[0]);
            }
          }
          break;
        }

        case "FLIP": {
          const entry = this.sprites.get(cmd.id);
          if (entry && "setFlipX" in entry.gameObject) {
            (entry.gameObject as Phaser.GameObjects.Image).setFlipX(cmd.flipX);
          }
          break;
        }

        case "OPACITY": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.gameObject.setAlpha(cmd.opacity);
          }
          break;
        }

        case "VISIBLE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.gameObject.setVisible(cmd.visible);
          }
          break;
        }

        case "CAMERA": {
          this.cameraState = { x: cmd.x, y: cmd.y, zoom: cmd.zoom };
          const cam = this.scene.cameras.main;
          cam.setScroll(cmd.x - this.width / 2, cmd.y - this.height / 2);
          cam.setZoom(cmd.zoom);
          break;
        }

        case "UI":
          break;

        case "SFX":
          this.onSFX?.(cmd.soundId, cmd.volume);
          break;

        case "BGM":
          this.onBGM?.(cmd.soundId, cmd.action);
          break;
      }
    }
  }

  render(dt: number): void {
    if (!this.phaserGame || !this.scene || !this.sceneReady) return;

    // Advance animations
    for (const entry of this.sprites.values()) {
      if (entry.textureKeys.length > 1 && entry.fps > 0) {
        entry.frameTimer += dt;
        const frameDuration = 1 / entry.fps;
        while (entry.frameTimer >= frameDuration) {
          entry.frameTimer -= frameDuration;
          entry.frameIndex = (entry.frameIndex + 1) % entry.textureKeys.length;
        }
        if ("setTexture" in entry.gameObject) {
          (entry.gameObject as Phaser.GameObjects.Image).setTexture(
            entry.textureKeys[entry.frameIndex],
          );
        }
      }
    }

    // Force a single Phaser render frame
    this.phaserGame.loop.tick();
  }

  destroy(): void {
    for (const entry of this.sprites.values()) {
      entry.gameObject.destroy();
    }
    this.sprites.clear();
    if (this.phaserGame) {
      this.phaserGame.destroy(true);
      this.phaserGame = null;
    }
    this.scene = null;
    this.assetRegistry = null;
  }

  /** Register ImageBitmaps as Phaser textures and return their keys. */
  private registerTextures(bitmaps: ImageBitmap[]): string[] {
    if (!this.scene) return [];
    const keys: string[] = [];
    for (const bitmap of bitmaps) {
      const key = `__msw_tex_${this.textureCounter++}`;
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        this.scene.textures.addCanvas(key, canvas);
        keys.push(key);
      }
    }
    return keys;
  }

  private resolveFrames(assetKey: string, assetState: string): ImageBitmap[] {
    if (!this.assetRegistry) return [];

    const asset = this.assetRegistry.get(assetKey);
    if (!asset) return [];

    if ("states" in asset && "defaultState" in asset) {
      const stateMap = asset as EngineStateMap;
      const texture = stateMap.states[assetState] ?? stateMap.states[stateMap.defaultState];
      return texture?.frames ?? [];
    }

    if ("frames" in asset && "fps" in asset) {
      return (asset as EngineTexture).frames;
    }

    return [];
  }

  private resolveFps(assetKey: string, assetState: string): number {
    if (!this.assetRegistry) return 0;

    const asset = this.assetRegistry.get(assetKey);
    if (!asset) return 0;

    if ("states" in asset && "defaultState" in asset) {
      const stateMap = asset as EngineStateMap;
      const texture = stateMap.states[assetState] ?? stateMap.states[stateMap.defaultState];
      return texture?.fps ?? 0;
    }

    if ("frames" in asset && "fps" in asset) {
      return (asset as EngineTexture).fps;
    }

    return 0;
  }
}
