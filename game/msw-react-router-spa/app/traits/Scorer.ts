import { Trait } from "~/engine/Trait";

interface ScorerConfig {
  stateKey?: string;
}

export class Scorer extends Trait {
  readonly name = "scorer";

  private config: Required<ScorerConfig>;

  constructor(config: ScorerConfig = {}) {
    super();
    this.config = {
      stateKey: config.stateKey ?? "score",
    };
  }

  init(): void {
    const state = this.gameObject?.scene?.game?.getState();
    if (state && state.get(this.config.stateKey) == null) {
      state.set(this.config.stateKey, 0);
    }
  }

  update(_dt: number): void {
    // no-op
  }

  addScore(points: number): void {
    const state = this.gameObject?.scene?.game?.getState();
    if (!state) return;

    const current = (state.get(this.config.stateKey) as number) ?? 0;
    state.set(this.config.stateKey, current + points);

    const events = this.gameObject?.scene?.game?.getEvents();
    events?.emit("scoreChanged", {
      objectId: this.gameObject?.state.id,
      score: current + points,
      added: points,
    });
  }

  getScore(): number {
    const state = this.gameObject?.scene?.game?.getState();
    return (state?.get(this.config.stateKey) as number) ?? 0;
  }
}
