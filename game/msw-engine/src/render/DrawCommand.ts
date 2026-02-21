import type { DrawCommand } from "~/engine/types";

// --- Factory Functions ---

export function clearCmd(color: string): DrawCommand {
  return { type: "CLEAR", color };
}

export function spawnCmd(
  id: string,
  assetKey: string,
  assetState: string,
  x: number,
  y: number,
  layer: number,
): DrawCommand {
  return { type: "SPAWN", id, assetKey, assetState, x, y, layer };
}

export function destroyCmd(id: string): DrawCommand {
  return { type: "DESTROY", id };
}

export function moveCmd(id: string, x: number, y: number): DrawCommand {
  return { type: "MOVE", id, x, y };
}

export function rotateCmd(id: string, rotation: number): DrawCommand {
  return { type: "ROTATE", id, rotation };
}

export function scaleCmd(
  id: string,
  scaleX: number,
  scaleY: number,
): DrawCommand {
  return { type: "SCALE", id, scaleX, scaleY };
}

export function stateCmd(id: string, assetState: string): DrawCommand {
  return { type: "STATE", id, assetState };
}

export function flipCmd(id: string, flipX: boolean): DrawCommand {
  return { type: "FLIP", id, flipX };
}

export function opacityCmd(id: string, opacity: number): DrawCommand {
  return { type: "OPACITY", id, opacity };
}

export function visibleCmd(id: string, visible: boolean): DrawCommand {
  return { type: "VISIBLE", id, visible };
}

export function uiCmd(
  id: string,
  props: Record<string, unknown>,
): DrawCommand {
  return { type: "UI", id, props };
}

export function cameraCmd(x: number, y: number, zoom: number): DrawCommand {
  return { type: "CAMERA", x, y, zoom };
}

export function sfxCmd(soundId: string, volume: number): DrawCommand {
  return { type: "SFX", soundId, volume };
}

export function bgmCmd(
  soundId: string,
  action: "play" | "stop",
): DrawCommand {
  return { type: "BGM", soundId, action };
}

// --- Command Pool (zero-alloc per frame) ---

export class CommandPool {
  private commands: DrawCommand[] = [];
  private length = 0;

  reset(): void {
    this.length = 0;
  }

  push(cmd: DrawCommand): void {
    if (this.length < this.commands.length) {
      this.commands[this.length] = cmd;
    } else {
      this.commands.push(cmd);
    }
    this.length++;
  }

  toArray(): DrawCommand[] {
    return this.commands.slice(0, this.length);
  }
}
