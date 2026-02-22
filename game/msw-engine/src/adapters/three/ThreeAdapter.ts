import type {
  DrawCommand,
  EngineAdapterConfig,
  EngineAdapterInterface,
  EngineAsset,
} from "~/engine/types";
import { ThreeAudio } from "./ThreeAudio";
import { ThreeAssetFactory } from "./ThreeAssetFactory";
import { ThreeInput } from "./ThreeInput";
import { ThreePhysics } from "./ThreePhysics";
import { ThreeRenderer } from "./ThreeRenderer";

export class ThreeAdapter implements EngineAdapterInterface {
  readonly input: ThreeInput;
  readonly physics: ThreePhysics;
  readonly audio: ThreeAudio;
  readonly assetFactory: ThreeAssetFactory;

  private renderer: ThreeRenderer;
  private rafId = 0;
  private lastTimestamp = 0;
  private assetRegistry = new Map<string, EngineAsset>();

  constructor() {
    this.audio = new ThreeAudio();
    this.input = new ThreeInput(document.createElement("canvas"));
    this.physics = new ThreePhysics();
    this.assetFactory = new ThreeAssetFactory(this.audio);
    this.renderer = new ThreeRenderer();
  }

  init(config: EngineAdapterConfig): void {
    const { canvas, width, height, physics } = config;

    canvas.width = width;
    canvas.height = height;

    // Re-create input with the actual canvas
    (this as { input: ThreeInput }).input = new ThreeInput(canvas);

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
