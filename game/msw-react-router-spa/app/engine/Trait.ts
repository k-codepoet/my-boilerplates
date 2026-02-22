import type { GameObject } from "./GameObject";

export abstract class Trait {
  abstract readonly name: string;
  gameObject: GameObject | null = null;

  abstract update(dt: number): void;

  attach(gameObject: GameObject): void {
    this.gameObject = gameObject;
    this.init();
  }

  detach(): void {
    this.destroy();
    this.gameObject = null;
  }

  init(): void {
    // Override in subclass
  }

  destroy(): void {
    // Override in subclass
  }
}
