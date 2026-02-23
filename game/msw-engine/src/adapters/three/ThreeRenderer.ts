import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
  Color,
  type Object3D,
} from "three";
import type {
  CameraState,
  DrawCommand,
  EngineAsset,
  EngineStateMap,
  EngineTexture,
} from "~/engine/types";

interface SpriteEntry {
  object: Object3D;
  material: SpriteMaterial | MeshBasicMaterial;
  assetKey: string;
  assetState: string;
  layer: number;
  frameIndex: number;
  frameTimer: number;
  fps: number;
  frames: ImageBitmap[];
  isPlaceholder: boolean;
  currentScaleX: number;
  currentScaleY: number;
  flipX: boolean;
}

type SFXHandler = (soundId: string, volume: number) => void;
type BGMHandler = (soundId: string, action: "play" | "stop") => void;

export class ThreeRenderer {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private worldGroup: Group | null = null;
  private sprites = new Map<string, SpriteEntry>();
  private cameraState: CameraState = { x: 0, y: 0, zoom: 1 };
  private assetRegistry: Map<string, EngineAsset> | null = null;
  private width = 0;
  private height = 0;

  onSFX: SFXHandler | null = null;
  onBGM: BGMHandler | null = null;

  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.renderer = new WebGLRenderer({ canvas, antialias: false });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);

    // Orthographic camera: top-left origin, y-down to match MSW coordinate system
    // Three.js convention: (left, right, top, bottom)
    // For y-down: top=height, bottom=0 then negate Y in positions
    this.camera = new OrthographicCamera(0, width, 0, -height, -10000, 10000);
    this.camera.position.z = 100;

    this.scene = new Scene();
    this.worldGroup = new Group();
    this.scene.add(this.worldGroup);
  }

  setAssetRegistry(registry: Map<string, EngineAsset>): void {
    this.assetRegistry = registry;
  }

  processDrawQueue(commands: DrawCommand[]): void {
    const world = this.worldGroup;
    if (!world) return;

    for (const cmd of commands) {
      switch (cmd.type) {
        case "CLEAR":
          if (this.renderer) {
            this.renderer.setClearColor(new Color(cmd.color));
          }
          break;

        case "SPAWN": {
          const frames = this.resolveFrames(cmd.assetKey, cmd.assetState);
          const texture = this.bitmapToTexture(frames[0]);
          let object: Object3D;
          let material: SpriteMaterial | MeshBasicMaterial;
          let isPlaceholder = false;

          if (texture) {
            const spriteMat = new SpriteMaterial({ map: texture, transparent: true });
            const sprite = new Sprite(spriteMat);
            sprite.center.set(0.5, 0.5);
            object = sprite;
            material = spriteMat;
          } else {
            // Lite pipeline: magenta colored rectangle placeholder
            const mat = new MeshBasicMaterial({ color: 0xff00ff });
            const geom = new PlaneGeometry(1, 1);
            object = new Mesh(geom, mat);
            material = mat;
            isPlaceholder = true;
          }

          const baseW = frames[0]?.width ?? 32;
          const baseH = frames[0]?.height ?? 32;
          object.position.set(cmd.x, -cmd.y, cmd.layer * 0.01);
          object.scale.set(baseW, baseH, 1);
          world.add(object);

          this.sprites.set(cmd.id, {
            object,
            material,
            assetKey: cmd.assetKey,
            assetState: cmd.assetState,
            layer: cmd.layer,
            frameIndex: 0,
            frameTimer: 0,
            fps: this.resolveFps(cmd.assetKey, cmd.assetState),
            frames,
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
            world.remove(entry.object);
            entry.material.dispose();
            if ("map" in entry.material && entry.material.map) {
              entry.material.map.dispose();
            }
            this.sprites.delete(cmd.id);
          }
          break;
        }

        case "MOVE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.object.position.x = cmd.x;
            entry.object.position.y = -cmd.y;
          }
          break;
        }

        case "ROTATE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.object.rotation.z = -cmd.rotation;
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
            entry.fps = this.resolveFps(entry.assetKey, cmd.assetState);
            entry.frameIndex = 0;
            entry.frameTimer = 0;
            const tex = this.bitmapToTexture(entry.frames[0]);
            if (entry.material.map) entry.material.map.dispose();
            entry.material.map = tex;
            entry.material.needsUpdate = true;
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
            entry.material.opacity = cmd.opacity;
            entry.material.transparent = true;
          }
          break;
        }

        case "VISIBLE": {
          const entry = this.sprites.get(cmd.id);
          if (entry) {
            entry.object.visible = cmd.visible;
          }
          break;
        }

        case "CAMERA":
          this.cameraState = { x: cmd.x, y: cmd.y, zoom: cmd.zoom };
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
    if (!this.renderer || !this.scene || !this.camera || !this.worldGroup) return;

    // Apply camera (negate Y for y-down → y-up mapping)
    this.worldGroup.position.set(
      this.width / 2 - this.cameraState.x * this.cameraState.zoom,
      -(this.height / 2 - this.cameraState.y * this.cameraState.zoom),
      0,
    );
    this.worldGroup.scale.set(this.cameraState.zoom, this.cameraState.zoom, 1);

    // Advance animations
    for (const entry of this.sprites.values()) {
      if (entry.frames.length > 1 && entry.fps > 0) {
        entry.frameTimer += dt;
        const frameDuration = 1 / entry.fps;
        while (entry.frameTimer >= frameDuration) {
          entry.frameTimer -= frameDuration;
          entry.frameIndex = (entry.frameIndex + 1) % entry.frames.length;
        }
        const tex = this.bitmapToTexture(entry.frames[entry.frameIndex]);
        if (entry.material.map) entry.material.map.dispose();
        entry.material.map = tex;
        entry.material.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private applyScale(entry: SpriteEntry): void {
    const baseW = entry.frames[0]?.width ?? 32;
    const baseH = entry.frames[0]?.height ?? 32;
    const flipSign = entry.flipX ? -1 : 1;
    entry.object.scale.set(
      baseW * entry.currentScaleX * flipSign,
      baseH * entry.currentScaleY,
      1,
    );
  }

  destroy(): void {
    for (const entry of this.sprites.values()) {
      if ("map" in entry.material && entry.material.map) {
        entry.material.map.dispose();
      }
      entry.material.dispose();
    }
    this.sprites.clear();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.worldGroup = null;
    this.assetRegistry = null;
  }

  private bitmapToTexture(bitmap: ImageBitmap | undefined): CanvasTexture | null {
    if (!bitmap) return null;
    // Draw bitmap to a temporary canvas for Three.js texture
    const cvs = document.createElement("canvas");
    cvs.width = bitmap.width;
    cvs.height = bitmap.height;
    const ctx = cvs.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const tex = new CanvasTexture(cvs);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    return tex;
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
