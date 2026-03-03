import type { DrawCommand, EngineAdapterInterface, EngineAsset } from "~/engine/types";
import type { GameObject } from "~/engine/GameObject";
import { Game } from "~/engine/Game";
import { CanvasAdapter } from "~/adapters/canvas/CanvasAdapter";
import { PixiAdapter } from "~/adapters/pixi/PixiAdapter";
import { ThreeAdapter } from "~/adapters/three/ThreeAdapter";
import { PhaserAdapter } from "~/adapters/phaser/PhaserAdapter";
import type { Damageable } from "~/traits/Damageable";
import { registerProgrammaticAssets } from "./sprites/registerProgrammaticAssets";
import { fileDescriptors } from "./sprites/assetDescriptors";
import { AssetRegistry } from "~/resources/AssetRegistry";
import { PLAYER_W, PLAYER_H } from "./objects/Player";
import { COIN_SIZE } from "./objects/Coin";
import { ENEMY_W, ENEMY_H } from "./objects/Enemy";
import { TitleScene } from "./scenes/TitleScene";
import { PlayScene } from "./scenes/PlayScene";
import { GameOverScene } from "./scenes/GameOverScene";
import gameDefinition from "./game.json";

export type AdapterType = "canvas" | "pixi" | "three" | "phaser";
export type ResourceMode = "programmatic" | "file";

// Sprite natural sizes (must match SpriteFactory output)
const PLATFORM_SPRITE_W = 120;
const PLATFORM_SPRITE_H = 19;
const GROUND_SPRITE_W = 800;
const GROUND_SPRITE_H = 50;

async function createAdapter(
  type: AdapterType,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<EngineAdapterInterface> {
  const config = { canvas, width, height, physics: gameDefinition.settings?.physics };

  switch (type) {
    case "pixi": {
      const adapter = new PixiAdapter();
      adapter.init(config);
      await adapter.waitForInit();
      return adapter;
    }
    case "phaser": {
      const adapter = new PhaserAdapter();
      adapter.init(config);
      await adapter.waitForScene();
      return adapter;
    }
    case "three": {
      const adapter = new ThreeAdapter();
      adapter.init(config);
      return adapter;
    }
    case "canvas":
    default: {
      const adapter = new CanvasAdapter();
      adapter.init(config);
      return adapter;
    }
  }
}

// Helper to get asset registry from any adapter (not on the interface, but all implement it)
function getAdapterRegistry(adapter: EngineAdapterInterface): Map<string, EngineAsset> {
  return (adapter as unknown as { getAssetRegistry(): Map<string, EngineAsset> }).getAssetRegistry();
}

/**
 * Convert gameplay top-left coordinates to renderer center coordinates.
 * Renderers draw sprites centered at (x, y), but gameplay stores top-left.
 * For platforms, also compute proper scale multipliers from raw dimensions.
 */
function getRenderTransform(obj: GameObject): { x: number; y: number; scaleX: number; scaleY: number } {
  const tx = obj.state.transform.x;
  const ty = obj.state.transform.y;
  const sx = obj.state.transform.scale.x;
  const sy = obj.state.transform.scale.y;

  if (obj.type === "platform") {
    // Platform: scale stores actual dimensions (width, height)
    // Convert to center position + sprite scale multiplier
    const isGround = obj.id === "ground";
    const spriteW = isGround ? GROUND_SPRITE_W : PLATFORM_SPRITE_W;
    const spriteH = isGround ? GROUND_SPRITE_H : PLATFORM_SPRITE_H;
    return {
      x: tx + sx / 2,
      y: ty + sy / 2,
      scaleX: sx / spriteW,
      scaleY: sy / spriteH,
    };
  }

  // Non-platform objects: scale is 1, offset by half sprite size
  let hw: number, hh: number;
  switch (obj.type) {
    case "player": hw = PLAYER_W / 2; hh = PLAYER_H / 2; break;
    case "coin":   hw = COIN_SIZE / 2; hh = COIN_SIZE / 2; break;
    case "enemy":  hw = ENEMY_W / 2; hh = ENEMY_H / 2; break;
    default:       hw = 16; hh = 16; break;
  }
  return { x: tx + hw, y: ty + hh, scaleX: sx, scaleY: sy };
}

export async function createPlatformerGame(
  canvas: HTMLCanvasElement,
  width = 800,
  height = 600,
  adapterType: AdapterType = "canvas",
  resourceMode: ResourceMode = "programmatic",
): Promise<Game> {
  const adapter = await createAdapter(adapterType, canvas, width, height);

  // Register assets based on resource mode
  const registry = getAdapterRegistry(adapter);
  if (resourceMode === "file") {
    try {
      const assetRegistry = new AssetRegistry();
      assetRegistry.registerCatalog(
        fileDescriptors.map((desc) => ({ id: desc.id, descriptor: desc })),
      );
      const loaded = await assetRegistry.loadAll(
        fileDescriptors.map((d) => d.id),
        adapter.assetFactory,
      );
      for (const [id, asset] of loaded) {
        registry.set(id, asset);
      }
    } catch {
      console.warn("File-based assets not found, falling back to programmatic sprites.");
      await registerProgrammaticAssets(registry);
    }
  } else {
    await registerProgrammaticAssets(registry);
  }

  const game = new Game(adapter);

  // Register scenes
  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());

  // Start the game — adapter already initialized, don't set config to skip re-init
  await game.start(gameDefinition.entryScene);

  // Init input mapping after adapter is initialized
  game.adapter.input.init(gameDefinition.inputMap);

  // Damage flash state
  let damageFlashTimer = 0;
  game.getEvents().on("damaged", () => {
    damageFlashTimer = 0.25;
  });

  // Stomp particle state (for Canvas adapter overlay only)
  let stompParticles: { x: number; y: number; life: number }[] = [];
  game.getEvents().on("enemyStomped", (data) => {
    const d = data as { enemyId: string };
    const scene = game.activeScene;
    if (!scene) return;
    const enemy = scene.getObject(d.enemyId);
    if (enemy) {
      const ex = enemy.state.transform.x + ENEMY_W / 2;
      const ey = enemy.state.transform.y + ENEMY_H / 2;
      for (let i = 0; i < 6; i++) {
        stompParticles.push({
          x: ex + (Math.random() - 0.5) * 20,
          y: ey + (Math.random() - 0.5) * 10,
          life: 0.4,
        });
      }
    }
  });

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

      // Invincibility blink: skip rendering every other 100ms
      let blinkHidden = false;
      if (obj.type === "player") {
        const damageable = obj.getTrait<Damageable>("damageable");
        if (damageable?.isInvincible) {
          blinkHidden = Math.floor(damageable.invincibilityTimer * 10) % 2 === 0;
        }
      }

      // Convert top-left gameplay coords → center coords for renderers
      const rt = getRenderTransform(obj);

      if (!spawnedIds.has(obj.id)) {
        commands.push({
          type: "SPAWN",
          id: obj.id,
          assetKey: obj.state.visual.assetKey,
          assetState: obj.state.visual.state,
          x: rt.x,
          y: rt.y,
          layer: obj.layer,
        });
        commands.push({
          type: "SCALE",
          id: obj.id,
          scaleX: rt.scaleX,
          scaleY: rt.scaleY,
        });
        spawnedIds.add(obj.id);
      } else {
        commands.push({
          type: "MOVE",
          id: obj.id,
          x: rt.x,
          y: rt.y,
        });
      }

      commands.push({
        type: "FLIP",
        id: obj.id,
        flipX: obj.state.visual.flipX,
      });

      // Apply blink visibility
      commands.push({
        type: "VISIBLE",
        id: obj.id,
        visible: !blinkHidden,
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

    // Canvas-only overlay effects (damage flash + stomp particles)
    if (adapterType === "canvas") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dt = 1 / 60;

        // Stomp particles
        stompParticles = stompParticles.filter((p) => {
          p.life -= dt;
          p.y -= 60 * dt;
          if (p.life <= 0) return false;
          ctx.save();
          ctx.globalAlpha = p.life / 0.4;
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        });

        // Damage flash overlay
        if (damageFlashTimer > 0) {
          damageFlashTimer -= dt;
          ctx.save();
          ctx.globalAlpha = Math.min(damageFlashTimer / 0.25, 1) * 0.3;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }
    }
  };

  return game;
}
