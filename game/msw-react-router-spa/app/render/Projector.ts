import type {
  CameraState,
  Drawable,
  RenderStateData,
  UIElement,
  WorldState,
} from "~/engine/types";

export class Projector {
  project(world: WorldState): RenderStateData {
    const drawables: Drawable[] = [];

    const objects = world.objects;
    const keys = Object.keys(objects);
    for (let i = 0; i < keys.length; i++) {
      const obj = objects[keys[i]];
      if (!obj.active) continue;

      const layer =
        typeof obj.traits["layer"] === "number"
          ? (obj.traits["layer"] as number)
          : 0;

      drawables.push({
        id: obj.id,
        layer,
        x: obj.transform.x,
        y: obj.transform.y,
        rotation: obj.transform.rotation,
        scale: { x: obj.transform.scale.x, y: obj.transform.scale.y },
        assetKey: obj.visual.assetKey,
        assetState: obj.visual.state,
        flipX: obj.visual.flipX,
        visible: obj.visual.visible,
        opacity: obj.visual.opacity,
      });
    }

    drawables.sort((a, b) => a.layer - b.layer);

    const g = world.global;

    const ui = Array.isArray(g["ui"]) ? (g["ui"] as UIElement[]) : [];

    const camera: CameraState = {
      x: typeof g["camera.x"] === "number" ? (g["camera.x"] as number) : 0,
      y: typeof g["camera.y"] === "number" ? (g["camera.y"] as number) : 0,
      zoom:
        typeof g["camera.zoom"] === "number" ? (g["camera.zoom"] as number) : 1,
    };

    const bgRaw = g["background"] as
      | { color?: string; image?: string }
      | undefined;
    const background: { color?: string; image?: string } = bgRaw
      ? { color: bgRaw.color, image: bgRaw.image }
      : {};

    return { drawables, ui, camera, background };
  }
}
