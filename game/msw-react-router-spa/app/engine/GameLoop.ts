export class GameLoop {
  private fixedDt = 1 / 60;
  private maxFrameSkip = 5;
  private accumulator = 0;
  private lastTimestamp = 0;
  private _running = false;
  private _fps = 0;
  private _frameCount = 0;
  private fpsTimer = 0;
  private fpsCount = 0;

  onUpdate: ((dt: number) => void) | null = null;
  onRender: (() => void) | null = null;
  onFrameRequest:
    | ((callback: (timestamp: number) => void) => void)
    | null = null;
  onFrameCancel: (() => void) | null = null;

  start(): void {
    this._running = true;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this._frameCount = 0;
    this._fps = 0;
    this.fpsTimer = 0;
    this.fpsCount = 0;
    this.requestNextFrame();
  }

  stop(): void {
    this._running = false;
    this.onFrameCancel?.();
  }

  get running(): boolean {
    return this._running;
  }

  get fps(): number {
    return this._fps;
  }

  get frameCount(): number {
    return this._frameCount;
  }

  private requestNextFrame(): void {
    if (this.onFrameRequest) {
      this.onFrameRequest((ts) => this.frame(ts));
    }
  }

  private frame(timestamp: number): void {
    if (!this._running) return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.fpsTimer = timestamp;
      this.requestNextFrame();
      return;
    }

    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    const delta = Math.min(rawDelta, 0.25); // Cap at 250ms to prevent spiral of death
    this.lastTimestamp = timestamp;
    this.accumulator += delta;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxFrameSkip) {
      this.onUpdate?.(this.fixedDt);
      this.accumulator -= this.fixedDt;
      this._frameCount++;
      steps++;
    }

    this.onRender?.();

    // FPS calculation (every second)
    this.fpsCount++;
    if (timestamp - this.fpsTimer >= 1000) {
      this._fps = this.fpsCount;
      this.fpsCount = 0;
      this.fpsTimer = timestamp;
    }

    this.requestNextFrame();
  }
}
