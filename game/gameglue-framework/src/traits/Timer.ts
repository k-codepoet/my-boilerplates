import { Trait } from "~/engine/Trait";

interface TimerConfig {
  duration?: number;
  mode?: "countdown" | "countup";
}

export class Timer extends Trait {
  readonly name = "timer";

  currentTime: number;
  running = false;

  private config: Required<TimerConfig>;

  constructor(config: TimerConfig = {}) {
    super();
    this.config = {
      duration: config.duration ?? 60,
      mode: config.mode ?? "countdown",
    };
    this.currentTime =
      this.config.mode === "countdown" ? this.config.duration : 0;
  }

  update(dt: number): void {
    if (!this.running) return;

    if (this.config.mode === "countdown") {
      this.currentTime -= dt;
      if (this.currentTime <= 0) {
        this.currentTime = 0;
        this.running = false;

        const events = this.gameObject?.scene?.game?.getEvents();
        events?.emit("timerExpired", {
          objectId: this.gameObject?.state.id,
        });
      }
    } else {
      this.currentTime += dt;
    }
  }

  start(): void {
    this.running = true;
  }

  pause(): void {
    this.running = false;
  }

  reset(): void {
    this.currentTime =
      this.config.mode === "countdown" ? this.config.duration : 0;
    this.running = false;
  }

  isExpired(): boolean {
    return this.config.mode === "countdown" && this.currentTime <= 0;
  }

  getTime(): number {
    return this.currentTime;
  }

  getFormattedTime(): string {
    const totalSeconds = Math.max(0, Math.ceil(this.currentTime));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}
