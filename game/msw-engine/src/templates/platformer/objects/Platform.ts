import { GameObject } from "~/engine/GameObject";

export function createPlatform(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): GameObject {
  const platform = new GameObject(id, "platform");

  platform.state.transform.x = x + width / 2;
  platform.state.transform.y = y + height / 2;
  platform.state.transform.scale.x = width / 32;
  platform.state.transform.scale.y = height / 32;

  platform.state.visual.assetKey = "platform";
  platform.state.visual.state = "default";
  platform.state.visual.visible = true;
  platform.state.visual.opacity = 1;

  platform.addTag("platform");
  platform.addTag("solid");
  platform.layer = 5;

  return platform;
}
