export class GameState {
  private state = new Map<string, unknown>();
  private subscribers = new Map<string, Set<(value: unknown) => void>>();
  private globalSubscribers = new Set<(key: string, value: unknown) => void>();

  get<T = unknown>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.state.set(key, value);
    const subs = this.subscribers.get(key);
    if (subs) {
      for (const cb of subs) cb(value);
    }
    for (const cb of this.globalSubscribers) cb(key, value);
  }

  has(key: string): boolean {
    return this.state.has(key);
  }

  subscribe(key: string, callback: (value: unknown) => void): () => void {
    let set = this.subscribers.get(key);
    if (!set) {
      set = new Set();
      this.subscribers.set(key, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
      if (set.size === 0) this.subscribers.delete(key);
    };
  }

  subscribeAll(callback: (key: string, value: unknown) => void): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  snapshot(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of this.state) {
      obj[k] = v;
    }
    return obj;
  }

  restore(data: Record<string, unknown>): void {
    this.state.clear();
    for (const [k, v] of Object.entries(data)) {
      this.state.set(k, v);
    }
  }

  clear(): void {
    this.state.clear();
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }
}
