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
    this.vx *= this.config.friction;
    this.vy *= this.config.friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

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
