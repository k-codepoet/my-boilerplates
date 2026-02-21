import type {
  EngineAdapterConfig,
  EngineAdapterInterface,
  InputState,
  ObjectState,
  WorldState,
} from "./types";
import type { Scene } from "./Scene";
import { GameLoop } from "./GameLoop";
import { GameState } from "./GameState";
import { EventBus } from "./EventBus";

export class Game {
  readonly adapter: EngineAdapterInterface;
  private _state: GameState;
  private _events: EventBus;
  private scenes = new Map<string, Scene>();
  private _activeScene: Scene | null = null;
  readonly loop: GameLoop;
  private _lastInput: InputState | null = null;

  /** Optional pre-set config. If set, start() can be called with just sceneName. */
  config: EngineAdapterConfig | null = null;

  constructor(adapter: EngineAdapterInterface) {
    this.adapter = adapter;
    this._state = new GameState();
    this._events = new EventBus();
    this.loop = new GameLoop();
  }

  getState(): GameState {
    return this._state;
  }

  getEvents(): EventBus {
    return this._events;
  }

  get activeScene(): Scene | null {
    return this._activeScene;
  }

  getLoop(): GameLoop {
    return this.loop;
  }

  registerScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
    scene.game = this;
  }

  async start(
    sceneName: string,
    canvas?: HTMLCanvasElement,
    width?: number,
    height?: number,
  ): Promise<void> {
    // Use explicit args or fall back to pre-set config
    if (canvas && width && height) {
      this.adapter.init({ canvas, width, height });
    } else if (this.config) {
      this.adapter.init(this.config);
    }

    this.loop.onFrameRequest = (cb) => this.adapter.requestFrame(cb);
    this.loop.onFrameCancel = () => this.adapter.cancelFrame();

    this.loop.onUpdate = (dt) => {
      const input = this.adapter.input.poll();
      this._lastInput = input;
      this.adapter.physics.step(dt);
      const collisions = this.adapter.physics.getCollisions();
      this._activeScene?.update(dt, collisions);
    };

    this.loop.onRender = () => {
      // Render pipeline wired externally (e.g. by PlatformerGame)
    };

    await this.changeScene(sceneName);
    this.loop.start();
  }

  async changeScene(
    name: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (this._activeScene) {
      this._activeScene.destroy();
    }
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene "${name}" not found`);
    }
    this._activeScene = scene;
    await scene.preload();
    scene.create(data);
  }

  stop(): void {
    this.loop.stop();
    if (this._activeScene) {
      this._activeScene.destroy();
      this._activeScene = null;
    }
    this.adapter.destroy();
  }

  get worldState(): WorldState {
    const objects: Record<string, ObjectState> = {};
    if (this._activeScene) {
      for (const obj of this._activeScene.getAllObjects()) {
        objects[obj.id] = obj.state;
      }
    }
    return {
      activeScene: this._activeScene?.name ?? "",
      global: this._state.snapshot(),
      objects,
      time: {
        elapsed: 0,
        delta: 0,
        frameCount: this.loop.frameCount,
      },
      input: this._lastInput ?? {
        active: new Set(),
        justPressed: new Set(),
        justReleased: new Set(),
        pointer: { x: 0, y: 0 },
      },
    };
  }
}
