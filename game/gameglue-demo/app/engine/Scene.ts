import type { Collision, InputState } from "./types";
import type { GameObject } from "./GameObject";
import type { Game } from "./Game";
import { EventBus } from "./EventBus";

export class Scene {
  readonly name: string;
  readonly type: string;
  game: Game | null = null;
  protected objects = new Map<string, GameObject>();
  eventBus = new EventBus();

  constructor(name: string, type = "gameplay") {
    this.name = name;
    this.type = type;
  }

  async preload(): Promise<void> {
    // Override for asset loading
  }

  create(_data?: Record<string, unknown>): void {
    // Override for scene setup
  }

  update(dt: number, collisions: Collision[], _input?: InputState): void {
    for (const obj of this.objects.values()) {
      if (obj.active) {
        obj.update(dt);
      }
    }
    for (const collision of collisions) {
      this.eventBus.emit("collision", collision);
      this.eventBus.emit(`collision:${collision.a}`, collision);
      this.eventBus.emit(`collision:${collision.b}`, collision);
    }
  }

  destroy(): void {
    const objects = [...this.objects.values()];
    this.objects.clear();
    for (const obj of objects) {
      obj.scene = null;
      obj.destroy();
    }
    this.eventBus.clear();
  }

  addObject(obj: GameObject): void {
    this.objects.set(obj.id, obj);
    obj.scene = this;
  }

  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.scene = null;
      this.objects.delete(id);
    }
  }

  getObject(id: string): GameObject | undefined {
    return this.objects.get(id);
  }

  getObjectsByTag(tag: string): GameObject[] {
    const result: GameObject[] = [];
    for (const obj of this.objects.values()) {
      if (obj.hasTag(tag)) result.push(obj);
    }
    return result;
  }

  getObjectsByType(type: string): GameObject[] {
    const result: GameObject[] = [];
    for (const obj of this.objects.values()) {
      if (obj.type === type) result.push(obj);
    }
    return result;
  }

  getObjectCount(): number {
    return this.objects.size;
  }

  getAllObjects(): IterableIterator<GameObject> {
    return this.objects.values();
  }

  changeScene(name: string, data?: Record<string, unknown>): void {
    void this.game?.changeScene(name, data);
  }
}
