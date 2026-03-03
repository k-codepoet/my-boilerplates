import type {
  ObjectState,
  VisualState,
  Transform,
  Vector2,
  EventCallback,
} from "./types";
import type { Trait } from "./Trait";
import type { Scene } from "./Scene";
import { TransformBuffer } from "../memory/TransformBuffer";

const sharedTransformBuffer = new TransformBuffer();

export class GameObject {
  readonly state: ObjectState;
  scene: Scene | null = null;
  private _traits = new Map<string, Trait>();
  children: GameObject[] = [];
  layer = 0;

  private transformIndex: number;
  private localListeners = new Map<string, Set<EventCallback>>();

  constructor(id: string, type: string) {
    this.transformIndex = sharedTransformBuffer.allocate();

    const buffer = sharedTransformBuffer;
    const idx = this.transformIndex;

    // Proxy-backed scale: mutations flow to Float32Array
    const scale = {} as Vector2;
    Object.defineProperties(scale, {
      x: {
        get: () => buffer.getScaleX(idx),
        set: (v: number) => {
          buffer.setScaleX(idx, v);
        },
        enumerable: true,
        configurable: true,
      },
      y: {
        get: () => buffer.getScaleY(idx),
        set: (v: number) => {
          buffer.setScaleY(idx, v);
        },
        enumerable: true,
        configurable: true,
      },
    });

    // Proxy-backed transform: mutations flow to Float32Array
    const transform = {} as Transform;
    Object.defineProperties(transform, {
      x: {
        get: () => buffer.getX(idx),
        set: (v: number) => {
          buffer.setX(idx, v);
        },
        enumerable: true,
        configurable: true,
      },
      y: {
        get: () => buffer.getY(idx),
        set: (v: number) => {
          buffer.setY(idx, v);
        },
        enumerable: true,
        configurable: true,
      },
      rotation: {
        get: () => buffer.getRotation(idx),
        set: (v: number) => {
          buffer.setRotation(idx, v);
        },
        enumerable: true,
        configurable: true,
      },
      scale: {
        value: scale,
        enumerable: true,
        configurable: true,
      },
    });

    this.state = {
      id,
      type,
      active: true,
      transform,
      visual: {
        assetKey: "",
        state: "default",
        flipX: false,
        visible: true,
        opacity: 1,
      },
      traits: {},
      tags: [],
    };
  }

  // --- Convenience accessors ---

  get id(): string {
    return this.state.id;
  }

  get type(): string {
    return this.state.type;
  }

  get active(): boolean {
    return this.state.active;
  }

  set active(value: boolean) {
    this.state.active = value;
  }

  // --- Transform convenience accessors ---

  get x(): number {
    return this.state.transform.x;
  }

  set x(v: number) {
    this.state.transform.x = v;
  }

  get y(): number {
    return this.state.transform.y;
  }

  set y(v: number) {
    this.state.transform.y = v;
  }

  get rotation(): number {
    return this.state.transform.rotation;
  }

  set rotation(v: number) {
    this.state.transform.rotation = v;
  }

  get scaleX(): number {
    return this.state.transform.scale.x;
  }

  set scaleX(v: number) {
    this.state.transform.scale.x = v;
  }

  get scaleY(): number {
    return this.state.transform.scale.y;
  }

  set scaleY(v: number) {
    this.state.transform.scale.y = v;
  }

  // --- Visual convenience accessor ---

  get visual(): VisualState {
    return this.state.visual;
  }

  set visual(v: VisualState) {
    this.state.visual = v;
  }

  // --- Lifecycle ---

  update(dt: number): void {
    if (!this.state.active) return;
    for (const trait of this._traits.values()) {
      trait.update(dt);
    }
    for (const child of this.children) {
      child.update(dt);
    }
  }

  // --- Traits ---

  addTrait(trait: Trait): void {
    this._traits.set(trait.name, trait);
    this.state.traits[trait.name] = {};
    trait.attach(this);
  }

  removeTrait(name: string): void {
    const trait = this._traits.get(name);
    if (trait) {
      trait.detach();
      this._traits.delete(name);
      delete this.state.traits[name];
    }
  }

  getTrait<T extends Trait>(name: string): T | undefined {
    return this._traits.get(name) as T | undefined;
  }

  hasTrait(name: string): boolean {
    return this._traits.has(name);
  }

  // --- Tags ---

  hasTag(tag: string): boolean {
    return this.state.tags.includes(tag);
  }

  addTag(tag: string): void {
    if (!this.state.tags.includes(tag)) {
      this.state.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    const idx = this.state.tags.indexOf(tag);
    if (idx !== -1) this.state.tags.splice(idx, 1);
  }

  // --- Events ---

  emit(event: string, data?: unknown): void {
    const local = this.localListeners.get(event);
    if (local) {
      for (const cb of local) cb(data);
    }
    this.scene?.eventBus.emit(`${this.id}:${event}`, data);
  }

  on(event: string, callback: EventCallback): () => void {
    let set = this.localListeners.get(event);
    if (!set) {
      set = new Set();
      this.localListeners.set(event, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
      if (set.size === 0) this.localListeners.delete(event);
    };
  }

  // --- Children ---

  addChild(child: GameObject): void {
    child.scene = this.scene;
    this.children.push(child);
  }

  removeChild(id: string): void {
    const idx = this.children.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.children[idx].scene = null;
      this.children.splice(idx, 1);
    }
  }

  // --- Cleanup ---

  destroy(): void {
    for (const trait of this._traits.values()) {
      trait.detach();
    }
    this._traits.clear();
    this.state.traits = {};
    for (const child of this.children) {
      child.destroy();
    }
    this.children.length = 0;
    this.localListeners.clear();
    sharedTransformBuffer.free(this.transformIndex);
    this.state.active = false;
    if (this.scene) {
      this.scene.removeObject(this.id);
      this.scene = null;
    }
  }
}
