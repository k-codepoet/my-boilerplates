import type { Collision } from "~/engine/types";
import { Scene } from "~/engine/Scene";

export class GameOverScene extends Scene {
  constructor() {
    super("gameover");
  }

  create(data?: Record<string, unknown>): void {
    const state = this.game!.getState();
    state.set("screen", "gameover");
    state.set("won", data?.won ?? false);
  }

  update(dt: number, collisions: Collision[]): void {
    super.update(dt, collisions);

    const input = this.game?.adapter.input.poll();
    if (input?.justPressed.has("jump")) {
      this.changeScene("title");
    }
  }
}
