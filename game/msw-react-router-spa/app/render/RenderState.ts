import type {
  CameraState,
  Drawable,
  RenderStateData,
  UIElement,
  WorldState,
} from "~/engine/types";

export class RenderState {
  drawables: Drawable[];
  ui: UIElement[];
  camera: CameraState;
  background: { color?: string; image?: string };

  constructor(data: RenderStateData) {
    this.drawables = data.drawables;
    this.ui = data.ui;
    this.camera = data.camera;
    this.background = data.background;
  }

  static fromWorldState(world: WorldState): RenderStateData {
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
    const camera: CameraState = {
      x: typeof g["camera.x"] === "number" ? (g["camera.x"] as number) : 0,
      y: typeof g["camera.y"] === "number" ? (g["camera.y"] as number) : 0,
      zoom:
        typeof g["camera.zoom"] === "number" ? (g["camera.zoom"] as number) : 1,
    };

    const ui = Array.isArray(g["ui"]) ? (g["ui"] as UIElement[]) : [];

    const bgRaw = g["background"] as
      | { color?: string; image?: string }
      | undefined;
    const background: { color?: string; image?: string } = bgRaw
      ? { color: bgRaw.color, image: bgRaw.image }
      : {};

    return { drawables, ui, camera, background };
  }

  clone(): RenderStateData {
    const drawables: Drawable[] = new Array(this.drawables.length);
    for (let i = 0; i < this.drawables.length; i++) {
      const d = this.drawables[i];
      drawables[i] = {
        id: d.id,
        layer: d.layer,
        x: d.x,
        y: d.y,
        rotation: d.rotation,
        scale: { x: d.scale.x, y: d.scale.y },
        assetKey: d.assetKey,
        assetState: d.assetState,
        flipX: d.flipX,
        visible: d.visible,
        opacity: d.opacity,
      };
    }

    const ui: UIElement[] = new Array(this.ui.length);
    for (let i = 0; i < this.ui.length; i++) {
      const u = this.ui[i];
      ui[i] = {
        id: u.id,
        type: u.type,
        props: { ...u.props },
        position: { x: u.position.x, y: u.position.y },
      };
    }

    return {
      drawables,
      ui,
      camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom },
      background: { ...this.background },
    };
  }
}
