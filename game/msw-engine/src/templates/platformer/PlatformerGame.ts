import type { DrawCommand } from "~/engine/types";
import { Game } from "~/engine/Game";
import { CanvasAdapter } from "~/adapters/canvas/CanvasAdapter";
import { TitleScene } from "./scenes/TitleScene";
import { PlayScene } from "./scenes/PlayScene";
import { GameOverScene } from "./scenes/GameOverScene";
import gameDefinition from "./game.json";

export async function createPlatformerGame(
  canvas: HTMLCanvasElement,
  width = 800,
  height = 600,
): Promise<Game> {
  const adapter = new CanvasAdapter();
  const game = new Game(adapter);

  // Register scenes
  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());

  // Start the game (inits adapter, changes to entry scene, starts loop)
  await game.start(gameDefinition.entryScene, canvas, width, height);

  // Init input mapping after adapter is initialized
  game.adapter.input.init(gameDefinition.inputMap);

  // Wire up the render pipeline
  const spawnedIds = new Set<string>();

  game.getLoop().onRender = () => {
    const scene = game.activeScene;
    if (!scene) return;

    const commands: DrawCommand[] = [];
    commands.push({ type: "CLEAR", color: "#87CEEB" });
    commands.push({ type: "CAMERA", x: width / 2, y: height / 2, zoom: 1 });

    const currentIds = new Set<string>();

    for (const obj of scene.getAllObjects()) {
      if (!obj.active || !obj.state.visual.visible) {
        if (spawnedIds.has(obj.id)) {
          commands.push({ type: "DESTROY", id: obj.id });
          spawnedIds.delete(obj.id);
        }
        continue;
      }

      currentIds.add(obj.id);

      if (!spawnedIds.has(obj.id)) {
        commands.push({
          type: "SPAWN",
          id: obj.id,
          assetKey: obj.state.visual.assetKey,
          assetState: obj.state.visual.state,
          x: obj.state.transform.x,
          y: obj.state.transform.y,
          layer: obj.layer,
        });
        commands.push({
          type: "SCALE",
          id: obj.id,
          scaleX: obj.state.transform.scale.x,
          scaleY: obj.state.transform.scale.y,
        });
        spawnedIds.add(obj.id);
      } else {
        commands.push({
          type: "MOVE",
          id: obj.id,
          x: obj.state.transform.x,
          y: obj.state.transform.y,
        });
      }

      commands.push({
        type: "FLIP",
        id: obj.id,
        flipX: obj.state.visual.flipX,
      });
    }

    // Destroy sprites that no longer exist in the scene
    for (const id of spawnedIds) {
      if (!currentIds.has(id)) {
        commands.push({ type: "DESTROY", id });
        spawnedIds.delete(id);
      }
    }

    game.adapter.processDrawQueue(commands);
  };

  return game;
}
