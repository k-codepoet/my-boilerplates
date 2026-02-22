import type { CameraState, Drawable, DrawCommand, RenderStateData } from "~/engine/types";
import { CommandPool } from "./DrawCommand";
import {
  cameraCmd,
  clearCmd,
  destroyCmd,
  flipCmd,
  moveCmd,
  opacityCmd,
  rotateCmd,
  scaleCmd,
  spawnCmd,
  stateCmd,
  visibleCmd,
} from "./DrawCommand";

const EPSILON = 0.001;

function floatEq(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

function cameraEq(a: CameraState, b: CameraState): boolean {
  return floatEq(a.x, b.x) && floatEq(a.y, b.y) && floatEq(a.zoom, b.zoom);
}

function bgEq(
  a: { color?: string; image?: string },
  b: { color?: string; image?: string },
): boolean {
  return a.color === b.color && a.image === b.image;
}

export class DirtyTracker {
  private pool = new CommandPool();
  private prevMap: Map<string, Drawable> = new Map();
  private currMap: Map<string, Drawable> = new Map();

  diff(
    prev: RenderStateData | null,
    curr: RenderStateData,
  ): DrawCommand[] {
    const pool = this.pool;
    pool.reset();

    // First frame — full scene init
    if (prev === null) {
      const bgColor = curr.background.color ?? "#000000";
      pool.push(clearCmd(bgColor));

      const drawables = curr.drawables;
      for (let i = 0; i < drawables.length; i++) {
        const d = drawables[i];
        pool.push(
          spawnCmd(d.id, d.assetKey, d.assetState, d.x, d.y, d.layer),
        );
      }

      pool.push(cameraCmd(curr.camera.x, curr.camera.y, curr.camera.zoom));
      return pool.toArray();
    }

    // Build lookup maps (reuse map instances)
    const prevMap = this.prevMap;
    const currMap = this.currMap;
    prevMap.clear();
    currMap.clear();

    const prevDrawables = prev.drawables;
    for (let i = 0; i < prevDrawables.length; i++) {
      prevMap.set(prevDrawables[i].id, prevDrawables[i]);
    }

    const currDrawables = curr.drawables;
    for (let i = 0; i < currDrawables.length; i++) {
      currMap.set(currDrawables[i].id, currDrawables[i]);
    }

    // Spawns: in curr but not prev
    currMap.forEach((d, id) => {
      if (!prevMap.has(id)) {
        pool.push(
          spawnCmd(d.id, d.assetKey, d.assetState, d.x, d.y, d.layer),
        );
      }
    });

    // Destroys: in prev but not curr
    prevMap.forEach((_, id) => {
      if (!currMap.has(id)) {
        pool.push(destroyCmd(id));
      }
    });

    // Updates: in both
    currMap.forEach((c, id) => {
      const p = prevMap.get(id);
      if (p === undefined) return;

      if (!floatEq(p.x, c.x) || !floatEq(p.y, c.y)) {
        pool.push(moveCmd(id, c.x, c.y));
      }
      if (!floatEq(p.rotation, c.rotation)) {
        pool.push(rotateCmd(id, c.rotation));
      }
      if (!floatEq(p.scale.x, c.scale.x) || !floatEq(p.scale.y, c.scale.y)) {
        pool.push(scaleCmd(id, c.scale.x, c.scale.y));
      }
      if (p.assetState !== c.assetState) {
        pool.push(stateCmd(id, c.assetState));
      }
      if (p.flipX !== c.flipX) {
        pool.push(flipCmd(id, c.flipX));
      }
      if (!floatEq(p.opacity, c.opacity)) {
        pool.push(opacityCmd(id, c.opacity));
      }
      if (p.visible !== c.visible) {
        pool.push(visibleCmd(id, c.visible));
      }
    });

    // Camera
    if (!cameraEq(prev.camera, curr.camera)) {
      pool.push(cameraCmd(curr.camera.x, curr.camera.y, curr.camera.zoom));
    }

    // Background
    if (!bgEq(prev.background, curr.background)) {
      pool.push(clearCmd(curr.background.color ?? "#000000"));
    }

    return pool.toArray();
  }
}
