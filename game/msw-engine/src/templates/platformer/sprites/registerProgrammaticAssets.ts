import type { EngineAsset, EngineStateMap } from "~/engine/types";
import {
  drawPlayerIdle,
  drawPlayerWalk1,
  drawPlayerWalk2,
  drawPlayerJump,
  drawPlatform,
  drawGround,
  drawCoin,
  drawEnemy,
} from "./SpriteFactory";

/**
 * Create and register programmatic sprites into the adapter's asset registry.
 * The registry is a Map<string, EngineAsset> obtained via adapter.getAssetRegistry().
 */
export async function registerProgrammaticAssets(
  registry: Map<string, EngineAsset>,
): Promise<void> {
  // Player — state map with idle, walk, jump
  const [playerIdle, playerWalk1, playerWalk2, playerJump] = await Promise.all([
    drawPlayerIdle(),
    drawPlayerWalk1(),
    drawPlayerWalk2(),
    drawPlayerJump(),
  ]);

  const playerStateMap: EngineStateMap = {
    id: "player",
    states: {
      idle: { id: "player-idle", width: 28, height: 36, frames: [playerIdle], fps: 0 },
      walk: { id: "player-walk", width: 28, height: 36, frames: [playerWalk1, playerWalk2], fps: 6 },
      jump: { id: "player-jump", width: 28, height: 36, frames: [playerJump], fps: 0 },
    },
    defaultState: "idle",
  };
  registry.set("player", playerStateMap);

  // Platform, Ground, Coin, Enemy — load in parallel
  const [platformBitmap, groundBitmap, coinBitmap, enemyBitmap] = await Promise.all([
    drawPlatform(),
    drawGround(),
    drawCoin(),
    drawEnemy(),
  ]);

  // Platform
  registry.set("platform", {
    id: "platform",
    states: {
      default: {
        id: "platform-default",
        width: platformBitmap.width,
        height: platformBitmap.height,
        frames: [platformBitmap],
        fps: 0,
      },
    },
    defaultState: "default",
  } satisfies EngineStateMap);

  // Ground
  registry.set("ground", {
    id: "ground",
    states: {
      default: {
        id: "ground-default",
        width: groundBitmap.width,
        height: groundBitmap.height,
        frames: [groundBitmap],
        fps: 0,
      },
    },
    defaultState: "default",
  } satisfies EngineStateMap);

  // Coin
  registry.set("coin", {
    id: "coin",
    states: {
      default: {
        id: "coin-default",
        width: 14,
        height: 14,
        frames: [coinBitmap],
        fps: 0,
      },
    },
    defaultState: "default",
  } satisfies EngineStateMap);

  // Enemy
  registry.set("enemy", {
    id: "enemy",
    states: {
      walk: {
        id: "enemy-walk",
        width: 26,
        height: 26,
        frames: [enemyBitmap],
        fps: 0,
      },
    },
    defaultState: "walk",
  } satisfies EngineStateMap);
}
