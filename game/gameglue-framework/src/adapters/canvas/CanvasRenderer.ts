import type {
  CameraState,
  DrawCommand,
  EngineAsset,
  EngineStateMap,
  EngineTexture,
} from "~/engine/types";

interface SpriteEntry {
  image: ImageBitmap | null;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  assetKey: string;
  assetState: string;
  flipX: boolean;
  visible: boolean;
  opacity: number;
  layer: number;
  frameIndex: number;
  frameTimer: number;
  fps: number;
  frames: ImageBitmap[];
}

type SFXHandler = (soundId: string, volume: number) => void;
type BGMHandler = (soundId: string, action: "play" | "stop") => void;
type UIHandler = (id: string, props: Record<string, unknown>) => void;

export class CanvasRenderer {
  private sprites = new Map<string, SpriteEntry>();
  private camera: CameraState = { x: 0, y: 0, zoom: 1 };
  private backgroundColor = "#000000";
  private assetRegistry: Map<string, EngineAsset> | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  onSFX: SFXHandler | null = null;
  onBGM: BGMHandler | null = null;
  onUI: UIHandler | null = null;

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  setAssetRegistry(registry: Map<string, EngineAsset>): void {
    this.assetRegistry = registry;
  }

  processDrawQueue(commands: DrawCommand[]): void {
    for (const cmd of commands) {
      switch (cmd.type) {
        case "CLEAR":
          this.backgroundColor = cmd.color;
          break;

        case "SPAWN": {
          const frames = this.resolveFrames(cmd.assetKey, cmd.assetState);
          this.sprites.set(cmd.id, {
            image: frames.length > 0 ? frames[0] : null,
            x: cmd.x,
            y: cmd.y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            assetKey: cmd.assetKey,
            assetState: cmd.assetState,
            flipX: false,
            visible: true,
            opacity: 1,
            layer: cmd.layer,
            frameIndex: 0,
            frameTimer: 0,
            fps: this.resolveFps(cmd.assetKey, cmd.assetState),
            frames,
          });
          break;
        }

        case "DESTROY":
          this.sprites.delete(cmd.id);
          break;

        case "MOVE": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) {
            sprite.x = cmd.x;
            sprite.y = cmd.y;
          }
          break;
        }

        case "ROTATE": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) sprite.rotation = cmd.rotation;
          break;
        }

        case "SCALE": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) {
            sprite.scaleX = cmd.scaleX;
            sprite.scaleY = cmd.scaleY;
          }
          break;
        }

        case "STATE": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) {
            sprite.assetState = cmd.assetState;
            const frames = this.resolveFrames(sprite.assetKey, cmd.assetState);
            sprite.frames = frames;
            sprite.fps = this.resolveFps(sprite.assetKey, cmd.assetState);
            sprite.frameIndex = 0;
            sprite.frameTimer = 0;
            sprite.image = frames.length > 0 ? frames[0] : null;
          }
          break;
        }

        case "FLIP": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) sprite.flipX = cmd.flipX;
          break;
        }

        case "OPACITY": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) sprite.opacity = cmd.opacity;
          break;
        }

        case "VISIBLE": {
          const sprite = this.sprites.get(cmd.id);
          if (sprite) sprite.visible = cmd.visible;
          break;
        }

        case "CAMERA":
          this.camera = { x: cmd.x, y: cmd.y, zoom: cmd.zoom };
          break;

        case "UI":
          this.onUI?.(cmd.id, cmd.props);
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
    const ctx = this.ctx;
    if (!ctx) return;

    const canvas = ctx.canvas;

    // Clear
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Sort sprites by layer
    const sorted = Array.from(this.sprites.values())
      .filter((s) => s.visible)
      .sort((a, b) => a.layer - b.layer);

    for (const sprite of sorted) {
      // Advance animation
      if (sprite.frames.length > 1 && sprite.fps > 0) {
        sprite.frameTimer += dt;
        const frameDuration = 1 / sprite.fps;
        while (sprite.frameTimer >= frameDuration) {
          sprite.frameTimer -= frameDuration;
          sprite.frameIndex = (sprite.frameIndex + 1) % sprite.frames.length;
        }
        sprite.image = sprite.frames[sprite.frameIndex];
      }

      ctx.save();
      ctx.translate(sprite.x, sprite.y);
      ctx.rotate(sprite.rotation);
      ctx.scale(sprite.scaleX * (sprite.flipX ? -1 : 1), sprite.scaleY);
      ctx.globalAlpha = sprite.opacity;

      if (sprite.image) {
        ctx.drawImage(
          sprite.image,
          -sprite.image.width / 2,
          -sprite.image.height / 2,
        );
      } else {
        // Placeholder colored rect
        ctx.fillStyle = "#ff00ff";
        ctx.fillRect(-16, -16, 32, 32);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  destroy(): void {
    this.sprites.clear();
    this.assetRegistry = null;
    this.ctx = null;
  }

  private resolveFrames(assetKey: string, assetState: string): ImageBitmap[] {
    if (!this.assetRegistry) return [];

    const asset = this.assetRegistry.get(assetKey);
    if (!asset) return [];

    // EngineStateMap
    if ("states" in asset && "defaultState" in asset) {
      const stateMap = asset as EngineStateMap;
      const texture = stateMap.states[assetState] ?? stateMap.states[stateMap.defaultState];
      return texture?.frames ?? [];
    }

    // EngineTexture
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
