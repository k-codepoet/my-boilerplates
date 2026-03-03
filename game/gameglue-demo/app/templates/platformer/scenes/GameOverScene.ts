import type { Collision, InputState } from "~/engine/types";
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

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);

    if (input?.justPressed.has("jump")) {
      this.changeScene("title");
    }
  }
}
