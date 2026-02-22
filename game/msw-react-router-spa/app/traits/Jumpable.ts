import { Trait } from "~/engine/Trait";
import type { Movable } from "./Movable";

interface JumpableConfig {
  jumpForce?: number;
  gravity?: number;
  groundY?: number;
}

export class Jumpable extends Trait {
  readonly name = "jumpable";

  isGrounded = true;

  private config: Required<JumpableConfig>;

  constructor(config: JumpableConfig = {}) {
    super();
    this.config = {
      jumpForce: config.jumpForce ?? -400,
      gravity: config.gravity ?? 900,
      groundY: config.groundY ?? 500,
    };
  }

  private getMovable(): Movable | null {
    return (this.gameObject?.getTrait("movable") as Movable) ?? null;
  }

  update(dt: number): void {
    const movable = this.getMovable();
    const transform = this.gameObject?.state.transform;
    if (!transform || !movable) return;

    if (!this.isGrounded) {
      // Apply gravity to vertical velocity
      movable.vy += this.config.gravity * dt;

      // Hard ground limit (fallback safety)
      if (transform.y >= this.config.groundY) {
        transform.y = this.config.groundY;
        movable.vy = 0;
        this.isGrounded = true;
      }
    } else {
      // Reset vertical velocity when grounded
      movable.vy = 0;
    }
  }

  jump(): void {
    if (!this.isGrounded) return;

    const movable = this.getMovable();
    if (movable) {
      movable.vy = this.config.jumpForce;
      this.isGrounded = false;
    }
  }
}
