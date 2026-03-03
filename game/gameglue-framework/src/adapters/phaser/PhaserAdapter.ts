import type {
  DrawCommand,
  EngineAdapterConfig,
  EngineAdapterInterface,
  EngineAsset,
} from "~/engine/types";
import { PhaserAudio } from "./PhaserAudio";
import { PhaserAssetFactory } from "./PhaserAssetFactory";
import { PhaserInput } from "./PhaserInput";
import { PhaserPhysics } from "./PhaserPhysics";
import { PhaserRenderer } from "./PhaserRenderer";

export class PhaserAdapter implements EngineAdapterInterface {
  readonly input: PhaserInput;
  readonly physics: PhaserPhysics;
  readonly audio: PhaserAudio;
  readonly assetFactory: PhaserAssetFactory;

  private renderer: PhaserRenderer;
  private rafId = 0;
  private lastTimestamp = 0;
  private assetRegistry = new Map<string, EngineAsset>();

  constructor() {
    this.audio = new PhaserAudio();
    this.input = new PhaserInput(document.createElement("canvas"));
    this.physics = new PhaserPhysics();
    this.assetFactory = new PhaserAssetFactory(this.audio);
    this.renderer = new PhaserRenderer();
  }

  init(config: EngineAdapterConfig): void {
    const { canvas, width, height, physics } = config;

    canvas.width = width;
    canvas.height = height;

    // Re-create input with the actual canvas
    (this as { input: PhaserInput }).input = new PhaserInput(canvas);

    // Init subsystems
    this.physics.init({ gravity: physics?.gravity });

    // Setup renderer
    this.renderer.init(canvas, width, height);
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

  /** Wait for Phaser scene to be ready. */
  async waitForScene(): Promise<void> {
    await this.renderer.waitForScene();
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
