import type {
  DrawCommand,
  EngineAdapterConfig,
  EngineAdapterInterface,
  EngineAsset,
} from "~/engine/types";
import { PixiAudio } from "./PixiAudio";
import { PixiAssetFactory } from "./PixiAssetFactory";
import { PixiInput } from "./PixiInput";
import { PixiPhysics } from "./PixiPhysics";
import { PixiRenderer } from "./PixiRenderer";

export class PixiAdapter implements EngineAdapterInterface {
  readonly input: PixiInput;
  readonly physics: PixiPhysics;
  readonly audio: PixiAudio;
  readonly assetFactory: PixiAssetFactory;

  private renderer: PixiRenderer;
  private rafId = 0;
  private lastTimestamp = 0;
  private assetRegistry = new Map<string, EngineAsset>();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.audio = new PixiAudio();
    this.input = new PixiInput(document.createElement("canvas"));
    this.physics = new PixiPhysics();
    this.assetFactory = new PixiAssetFactory(this.audio);
    this.renderer = new PixiRenderer();
  }

  init(config: EngineAdapterConfig): void {
    const { canvas, width, height, physics } = config;

    canvas.width = width;
    canvas.height = height;

    // Re-create input with the actual canvas
    (this as { input: PixiInput }).input = new PixiInput(canvas);

    // Init subsystems
    this.physics.init({ gravity: physics?.gravity });

    // Setup renderer (async — store promise)
    this.initPromise = this.renderer.init(canvas, width, height).then(() => {
      this.renderer.setAssetRegistry(this.assetRegistry);

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
    });
  }

  /** Wait for PixiJS Application to be fully initialized. */
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  destroy(): void {
    this.cancelFrame();
    this.input.destroy();
    this.physics.destroy();
    this.audio.stopAll();
    this.renderer.destroy();
    this.assetRegistry.clear();
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
