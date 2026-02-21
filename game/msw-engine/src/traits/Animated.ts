import { Trait } from "~/engine/Trait";

interface AnimatedConfig {
  states?: string[];
  defaultState?: string;
  fps?: number;
}

export class Animated extends Trait {
  readonly name = "animated";

  currentState: string;
  frameIndex = 0;
  frameTimer = 0;

  private config: Required<AnimatedConfig>;

  constructor(config: AnimatedConfig = {}) {
    super();
    this.config = {
      states: config.states ?? ["idle"],
      defaultState: config.defaultState ?? "idle",
      fps: config.fps ?? 8,
    };
    this.currentState = this.config.defaultState;
  }

  init(): void {
    const visual = this.gameObject?.state.visual;
    if (visual) {
      visual.state = this.currentState;
    }
  }

  update(dt: number): void {
    if (this.config.fps <= 0) return;

    this.frameTimer += dt;
    const frameDuration = 1 / this.config.fps;

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.frameIndex++;

      const visual = this.gameObject?.state.visual;
      if (visual) {
        visual.state = this.currentState;
      }
    }
  }

  setState(name: string): void {
    if (name === this.currentState) return;
    if (!this.config.states.includes(name)) return;

    this.currentState = name;
    this.frameIndex = 0;
    this.frameTimer = 0;

    const visual = this.gameObject?.state.visual;
    if (visual) {
      visual.state = this.currentState;
    }
  }

  getCurrentFrame(): number {
    return this.frameIndex;
  }
}
