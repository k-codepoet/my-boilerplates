import type {
  Collision,
  PhysicsBodyOptions,
  PhysicsBodyType,
  PhysicsSubsystem,
  Vector2,
} from "~/engine/types";

interface PhysicsBody {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PhysicsBodyType;
  options: PhysicsBodyOptions;
}

export class PixiPhysics implements PhysicsSubsystem {
  private bodies = new Map<string, PhysicsBody>();
  private gravity: Vector2 = { x: 0, y: 0 };
  private collisions: Collision[] = [];

  init(config: { gravity?: Vector2 }): void {
    if (config.gravity) {
      this.gravity = { ...config.gravity };
    }
  }

  addBody(objectId: string, options: PhysicsBodyOptions): void {
    this.bodies.set(objectId, {
      x: 0,
      y: 0,
      width: options.width,
      height: options.height,
      type: options.type,
      options,
    });
  }

  removeBody(objectId: string): void {
    this.bodies.delete(objectId);
  }

  step(dt: number): void {
    for (const body of this.bodies.values()) {
      if (body.type === "dynamic") {
        body.x += this.gravity.x * dt;
        body.y += this.gravity.y * dt;
      }
    }
    this.collisions = this.detectCollisions();
  }

  getCollisions(): Collision[] {
    return this.collisions;
  }

  setGravity(x: number, y: number): void {
    this.gravity = { x, y };
  }

  destroy(): void {
    this.bodies.clear();
    this.collisions = [];
  }

  private detectCollisions(): Collision[] {
    const result: Collision[] = [];
    const entries = Array.from(this.bodies.entries());

    for (let i = 0; i < entries.length; i++) {
      const [idA, bodyA] = entries[i];
      if (bodyA.type === "static") continue;

      for (let j = 0; j < entries.length; j++) {
        if (i === j) continue;
        const [idB, bodyB] = entries[j];

        const overlap = this.aabbOverlap(bodyA, bodyB);
        if (overlap) {
          result.push({ a: idA, b: idB, overlap });
        }
      }
    }

    return result;
  }

  private aabbOverlap(a: PhysicsBody, b: PhysicsBody): Vector2 | null {
    const overlapX =
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY =
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    if (overlapX > 0 && overlapY > 0) {
      return { x: overlapX, y: overlapY };
    }
    return null;
  }
}
