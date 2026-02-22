import type { InputMap, InputState, InputSubsystem, Vector2 } from "~/engine/types";

export class ThreeInput implements InputSubsystem {
  private readonly canvas: HTMLCanvasElement;
  private keyToActions = new Map<string, string[]>();
  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();
  private keysJustReleased = new Set<string>();
  private pointer: Vector2 = { x: 0, y: 0 };

  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private handlePointerMove: (e: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.handleKeyDown = (e: KeyboardEvent) => {
      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysDown.add(e.code);
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
      this.keysJustReleased.add(e.code);
    };

    this.handlePointerMove = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
  }

  init(inputMap: InputMap): void {
    this.keyToActions.clear();
    for (const [action, keys] of Object.entries(inputMap)) {
      for (const key of keys) {
        const existing = this.keyToActions.get(key);
        if (existing) {
          existing.push(action);
        } else {
          this.keyToActions.set(key, [action]);
        }
      }
    }

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
  }

  poll(): InputState {
    const active = new Set<string>();
    const justPressed = new Set<string>();
    const justReleased = new Set<string>();

    for (const key of this.keysDown) {
      const actions = this.keyToActions.get(key);
      if (actions) {
        for (const action of actions) active.add(action);
      }
    }

    for (const key of this.keysJustPressed) {
      const actions = this.keyToActions.get(key);
      if (actions) {
        for (const action of actions) justPressed.add(action);
      }
    }

    for (const key of this.keysJustReleased) {
      const actions = this.keyToActions.get(key);
      if (actions) {
        for (const action of actions) justReleased.add(action);
      }
    }

    this.keysJustPressed.clear();
    this.keysJustReleased.clear();

    return {
      active,
      justPressed,
      justReleased,
      pointer: { ...this.pointer },
    };
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.keyToActions.clear();
  }
}
