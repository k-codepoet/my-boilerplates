import type { Collision, InputState } from "~/engine/types";
import { Scene } from "~/engine/Scene";

export class TitleScene extends Scene {
  constructor() {
    super("title");
  }

  create(): void {
    this.game!.getState().set("screen", "title");
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);

    if (input?.justPressed.has("jump")) {
      this.changeScene("play");
    }
  }
}
