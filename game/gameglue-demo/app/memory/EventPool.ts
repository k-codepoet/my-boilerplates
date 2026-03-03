export interface PooledEvent {
  type: string;
  data: unknown;
}

const MAX_PER_TYPE = 32;

export class EventPool {
  private pools = new Map<string, PooledEvent[]>();

  acquire(type: string, data: unknown): PooledEvent {
    const pool = this.pools.get(type);
    if (pool && pool.length > 0) {
      const event = pool.pop()!;
      event.data = data;
      return event;
    }
    return { type, data };
  }

  release(event: PooledEvent): void {
    let pool = this.pools.get(event.type);
    if (!pool) {
      pool = [];
      this.pools.set(event.type, pool);
    }
    if (pool.length < MAX_PER_TYPE) {
      event.data = null;
      pool.push(event);
    }
  }

  clear(): void {
    this.pools.clear();
  }
}
