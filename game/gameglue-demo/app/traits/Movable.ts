import { Trait } from "~/engine/Trait";

interface MovableConfig {
  speed?: number;
  friction?: number;
  maxSpeed?: number;
}

export class Movable extends Trait {
  readonly name = "movable";

  vx = 0;
  vy = 0;

  private config: Required<MovableConfig>;

  constructor(config: MovableConfig = {}) {
    super();
    this.config = {
      speed: config.speed ?? 200,
      friction: config.friction ?? 0.85,
      maxSpeed: config.maxSpeed ?? 400,
    };
  }

  update(dt: number): void {
    // Friction only applies to horizontal movement
    this.vx *= this.config.friction;

    // Clamp horizontal speed
    if (Math.abs(this.vx) > this.config.maxSpeed) {
      this.vx = Math.sign(this.vx) * this.config.maxSpeed;
    }

    // Stop tiny drift
    if (Math.abs(this.vx) < 0.5) this.vx = 0;

    const transform = this.gameObject?.state.transform;
    if (transform) {
      transform.x += this.vx * dt;
      transform.y += this.vy * dt;
    }
  }

  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  accelerate(ax: number, ay: number): void {
    this.vx += ax;
    this.vy += ay;
  }
}
