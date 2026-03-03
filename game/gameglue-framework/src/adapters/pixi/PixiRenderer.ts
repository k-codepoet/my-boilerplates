import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  ImageSource,
} from "pixi.js";
import type {
  CameraState,
  DrawCommand,
  EngineAsset,
  EngineStateMap,
  EngineTexture,
} from "~/engine/types";

interface SpriteEntry {
  displayObject: Sprite | Graphics;
  assetKey: string;
  assetState: string;
  layer: number;
  frameIndex: number;
  frameTimer: number;
  fps: number;
  frames: ImageBitmap[];
  textures: Texture[];
  isPlaceholder: boolean;
  currentScaleX: number;
  currentScaleY: number;
  flipX: boolean;
}

type SFXHandler = (soundId: string, volume: number) => void;
type BGMHandler = (soundId: string, action: "play" | "stop") => void;

export class PixiRenderer {
  private app: Application | null = null;
  private worldContainer: Container | null = null;
  private sprites = new Map<string, SpriteEntry>();
  private camera: CameraState = { x: 0, y: 0, zoom: 1 };
  private assetRegistry: Map<string, EngineAsset> | null = null;
  private width = 0;
  private height = 0;

  onSFX: SFXHandler | null = null;
  onBGM: BGMHandler | null = null;

  async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    this.width = width;
    this.height = height;

    this.app = new Application();
    await this.app.init({
      canvas,
      width,
      height,
      backgroundColor: 0x000000,
      autoStart: false,
      hello: false,
    });

    this.worldContainer = new Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);
  }

  setAssetRegistry(registry: Map<string, EngineAsset>): void {
    this.assetRegistry = registry;
  }

  processDrawQueue(commands: DrawCommand[]): void {
    const world = this.worldContainer;
    if (!world) return;

    for (const cmd of commands) {
      switch (cmd.type) {
        case "CLEAR":
          if (this.app) {
            this.app.renderer.background.color = cmd.color;
          }
          break;

        case "SPAWN": {
          const frames = this.resolveFrames(cmd.assetKey, cmd.assetState);
          const textures = this.framesToTextures(frames);
          let displayObject: Sprite | Graphics;
          let isPlaceholder = false;

          if (textures.length > 0) {
            const sprite = new Sprite(textures[0]);
            sprite.anchor.set(0.5);
            displayObject = sprite;
          } else {
            // Lite pipeline: use Graphics colored rectangle
            const gfx = new Graphics();
            gfx.rect(-16, -16, 32, 32);
            gfx.fill(0xff00ff);
            displayObject = gfx;
            isPlaceholder = true;
          }

          displayObject.position.set(cmd.x, cmd.y);
          displayObject.zIndex = cmd.layer;
          world.addChild(displayObject);

          this.sprites.set(cmd.id, {
            displayObject,
            assetKey: cmd.assetKey,
            assetState: cmd.assetState,
            layer: cmd.layer,
            frameIndex: 0,
            frameTimer: 0,
            fps: this.resolveFps(cmd.assetKey, cmd.assetState),
            frames,
            textures,
            isPlaceholder,
            currentScaleX: 1,
            currentScaleY: 1,
            flipX: false,
          });
          break;
        }

        case "DESTROY": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.displayObject.destroy();
            this.sprites.delete(cmd.id);
          }
          break;
        }

        case "MOVE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.displayObject.position.set(cmd.x, cmd.y);
          }
          break;
        }

        case "ROTATE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.displayObject.rotation = cmd.rotation;
          }
          break;
        }

        case "SCALE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.currentScaleX = cmd.scaleX;
            entry.currentScaleY = cmd.scaleY;
            this.applyScale(entry);
          }
          break;
        }

        case "STATE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.assetState = cmd.assetState;
            entry.frames = this.resolveFrames(entry.assetKey, cmd.assetState);
            entry.textures = this.framesToTextures(entry.frames);
            entry.fps = this.resolveFps(entry.assetKey, cmd.assetState);
            entry.frameIndex = 0;
            entry.frameTimer = 0;
            if (entry.textures.length > 0 && entry.displayObject instanceof Sprite) {
              entry.displayObject.texture = entry.textures[0];
            }
          }
          break;
        }

        case "FLIP": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.flipX = cmd.flipX;
            this.applyScale(entry);
          }
          break;
        }

        case "OPACITY": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.displayObject.alpha = cmd.opacity;
          }
          break;
        }

        case "VISIBLE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.displayObject.visible = cmd.visible;
          }
          break;
        }

        case "CAMERA":
          this.camera = { x: cmd.x, y: cmd.y, zoom: cmd.zoom };
          break;

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
    const world = this.worldContainer;
    if (!world || !this.app) return;

    // Update camera
    world.position.set(
      this.width / 2 - this.camera.x * this.camera.zoom,
      this.height / 2 - this.camera.y * this.camera.zoom,
    );
    world.scale.set(this.camera.zoom);

    // Advance animations
    for (const entry of this.sprites.values()) {
      if (entry.textures.length > 1 && entry.fps > 0 && entry.displayObject instanceof Sprite) {
        entry.frameTimer += dt;
        const frameDuration = 1 / entry.fps;
        while (entry.frameTimer >= frameDuration) {
          entry.frameTimer -= frameDuration;
          entry.frameIndex = (entry.frameIndex + 1) % entry.textures.length;
        }
        entry.displayObject.texture = entry.textures[entry.frameIndex];
      }
    }

    // Trigger manual render
    this.app.render();
  }

  destroy(): void {
    for (const entry of this.sprites.values()) {
      entry.displayObject.destroy();
    }
    this.sprites.clear();
    if (this.worldContainer) {
      this.worldContainer.destroy({ children: true });
      this.worldContainer = null;
    }
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }
    this.assetRegistry = null;
  }

  private applyScale(entry: SpriteEntry): void {
    const flipSign = entry.flipX ? -1 : 1;
    entry.displayObject.scale.set(
      entry.currentScaleX * flipSign,
      entry.currentScaleY,
    );
  }

  /** Convert ImageBitmaps to PixiJS v8 Textures via ImageSource */
  private framesToTextures(frames: ImageBitmap[]): Texture[] {
    return frames.map((bmp) => {
      const source = new ImageSource({ resource: bmp });
      return new Texture({ source });
    });
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
