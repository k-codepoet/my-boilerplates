import type { Collision } from "~/engine/types";
import { Scene } from "~/engine/Scene";

export class TitleScene extends Scene {
  constructor() {
    super("title");
  }

  create(): void {
    this.game!.getState().set("screen", "title");
  }

  update(dt: number, collisions: Collision[]): void {
    super.update(dt, collisions);

    const input = this.game?.adapter.input.poll();
    if (input?.justPressed.has("jump")) {
      this.changeScene("play");
    }
  }
}
