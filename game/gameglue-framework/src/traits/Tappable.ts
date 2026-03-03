import { Trait } from "~/engine/Trait";

interface TappableConfig {
  width?: number;
  height?: number;
}

export class Tappable extends Trait {
  readonly name = "tappable";

  private config: TappableConfig;

  constructor(config: TappableConfig = {}) {
    super();
    this.config = config;
  }

  update(_dt: number): void {
    const go = this.gameObject;
    if (!go) return;

    const input = go.scene?.game?.worldState?.input;
    if (!input) return;

    const isTapAction =
      input.justPressed.has("tap") || input.justPressed.has("pointer_down");
    if (!isTapAction) return;

    const transform = go.state.transform;
    const width = this.config.width ?? transform.scale.x * 32;
    const height = this.config.height ?? transform.scale.y * 32;

    const px = input.pointer.x;
    const py = input.pointer.y;

    const left = transform.x - width / 2;
    const top = transform.y - height / 2;

    if (px >= left && px <= left + width && py >= top && py <= top + height) {
      const events = go.scene?.game?.getEvents();
      events?.emit("tapped", {
        objectId: go.state.id,
        x: px,
        y: py,
      });
    }
  }
}
