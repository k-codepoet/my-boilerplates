import { Trait } from "~/engine/Trait";
import type { ColliderShape, PhysicsBodyType } from "~/engine/types";

interface CollidableConfig {
  bodyType?: PhysicsBodyType;
  collider?: ColliderShape;
  width?: number;
  height?: number;
  bounce?: number;
  friction?: number;
}

export class Collidable extends Trait {
  readonly name = "collidable";

  private config: Required<CollidableConfig>;

  constructor(config: CollidableConfig = {}) {
    super();
    this.config = {
      bodyType: config.bodyType ?? "dynamic",
      collider: config.collider ?? "box",
      width: config.width ?? 32,
      height: config.height ?? 32,
      bounce: config.bounce ?? 0,
      friction: config.friction ?? 0.1,
    };
  }

  init(): void {
    const go = this.gameObject;
    if (!go) return;

    const physics = go.scene?.game?.adapter?.physics;
    physics?.addBody(go.state.id, {
      type: this.config.bodyType,
      collider: this.config.collider,
      width: this.config.width,
      height: this.config.height,
      bounce: this.config.bounce,
      friction: this.config.friction,
    });
  }

  update(_dt: number): void {
    const go = this.gameObject;
    if (!go) return;

    const physics = go.scene?.game?.adapter?.physics;
    if (!physics) return;

    const transform = go.state.transform;
    if ("updateBodyPosition" in physics) {
      (
        physics as typeof physics & {
          updateBodyPosition: (id: string, x: number, y: number) => void;
        }
      ).updateBodyPosition(go.state.id, transform.x, transform.y);
    }
  }

  destroy(): void {
    const go = this.gameObject;
    if (!go) return;

    const physics = go.scene?.game?.adapter?.physics;
    physics?.removeBody(go.state.id);
  }
}
