export class ObjectPool<T> {
  private pool: T[] = [];
  private _active = 0;
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, prewarm = 64) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < prewarm; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    this._active++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this._active--;
    this.reset(obj);
    this.pool.push(obj);
  }

  clear(): void {
    this.pool.length = 0;
    this._active = 0;
  }

  get available(): number {
    return this.pool.length;
  }

  get active(): number {
    return this._active;
  }
}
