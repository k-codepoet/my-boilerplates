import { GameObject } from "~/engine/GameObject";

export function createCoin(id: string, x: number, y: number): GameObject {
  const coin = new GameObject(id, "coin");

  coin.state.transform.x = x;
  coin.state.transform.y = y;
  coin.state.transform.scale.x = 0.5;
  coin.state.transform.scale.y = 0.5;

  coin.state.visual.assetKey = "coin";
  coin.state.visual.state = "default";
  coin.state.visual.visible = true;
  coin.state.visual.opacity = 1;

  coin.addTag("coin");
  coin.addTag("collectible");
  coin.layer = 8;

  return coin;
}
