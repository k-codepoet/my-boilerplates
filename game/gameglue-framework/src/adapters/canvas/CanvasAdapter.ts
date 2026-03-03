import type {
  DrawCommand,
  EngineAdapterConfig,
  EngineAdapterInterface,
  EngineAsset,
} from "~/engine/types";
import { CanvasAudio } from "./CanvasAudio";
import { CanvasAssetFactory } from "./CanvasAssetFactory";
import { CanvasInput } from "./CanvasInput";
import { CanvasPhysics } from "./CanvasPhysics";
import { CanvasRenderer } from "./CanvasRenderer";

export class CanvasAdapter implements EngineAdapterInterface {
  readonly input: CanvasInput;
  readonly physics: CanvasPhysics;
  readonly audio: CanvasAudio;
  readonly assetFactory: CanvasAssetFactory;

  private renderer: CanvasRenderer;
  private rafId = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastTimestamp = 0;
  private assetRegistry = new Map<string, EngineAsset>();

  constructor() {
    this.audio = new CanvasAudio();
    this.input = new CanvasInput(document.createElement("canvas")); // Placeholder until init
    this.physics = new CanvasPhysics();
    this.assetFactory = new CanvasAssetFactory(this.audio);
    this.renderer = new CanvasRenderer();
  }

  init(config: EngineAdapterConfig): void {
    const { canvas, width, height, physics } = config;

    canvas.width = width;
    canvas.height = height;

    this.ctx = canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Failed to get 2d rendering context");
    }

    // Re-create input with the actual canvas
    (this as { input: CanvasInput }).input = new CanvasInput(canvas);

    // Init subsystems
    this.physics.init({ gravity: physics?.gravity });

    // Setup renderer
    this.renderer.setContext(this.ctx);
    this.renderer.setAssetRegistry(this.assetRegistry);

    // Wire audio handlers
    this.renderer.onSFX = (soundId, volume) => {
      this.audio.play(soundId, { volume });
    };
    this.renderer.onBGM = (soundId, action) => {
      if (action === "play") {
        this.audio.playBGM(soundId);
      } else {
        this.audio.stopBGM();
      }
    };
  }

  destroy(): void {
    this.cancelFrame();
    this.input.destroy();
    this.physics.destroy();
    this.audio.stopAll();
    this.renderer.destroy();
    this.assetRegistry.clear();
    this.ctx = null;
  }

  requestFrame(callback: (timestamp: number) => void): void {
    this.rafId = requestAnimationFrame(callback);
  }

  cancelFrame(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  processDrawQueue(commands: DrawCommand[]): void {
    const now = performance.now() / 1000;
    const dt = this.lastTimestamp > 0 ? now - this.lastTimestamp : 1 / 60;
    this.lastTimestamp = now;

    this.renderer.processDrawQueue(commands);
    this.renderer.render(dt);
  }

  getAssetRegistry(): Map<string, EngineAsset> {
    return this.assetRegistry;
  }
}
