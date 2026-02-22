import { Game } from "~/engine/Game";
import { CanvasAdapter } from "~/adapters/canvas/CanvasAdapter";
import type { Damageable } from "~/traits/Damageable";
import { TitleScene } from "./scenes/TitleScene";
import { PlayScene } from "./scenes/PlayScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { PLAYER_W, PLAYER_H } from "./objects/Player";
import { COIN_SIZE } from "./objects/Coin";
import { ENEMY_W, ENEMY_H } from "./objects/Enemy";
import gameDefinition from "./game.json";

const COLORS: Record<string, string> = {
  player: "#3b82f6",    // blue
  platform: "#78716c",  // stone
  ground: "#57534e",    // darker stone for ground
  coin: "#eab308",      // yellow
  enemy: "#ef4444",     // red
};

export async function createPlatformerGame(
  canvas: HTMLCanvasElement,
  width = 800,
  height = 600,
): Promise<Game> {
  const adapter = new CanvasAdapter();
  const game = new Game(adapter);

  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());

  await game.start(gameDefinition.entryScene, canvas, width, height);
  game.adapter.input.init(gameDefinition.inputMap);

  const ctx = canvas.getContext("2d")!;

  // Damage flash state
  let damageFlashTimer = 0;
  game.getEvents().on("damaged", () => {
    damageFlashTimer = 0.25; // 250ms red flash
  });

  // Stomp particle state
  let stompParticles: { x: number; y: number; life: number }[] = [];
  game.getEvents().on("enemyStomped", (data) => {
    const d = data as { enemyId: string };
    const scene = game.activeScene;
    if (!scene) return;
    // Create particles at enemy's last position
    const enemy = scene.getObject(d.enemyId);
    if (enemy) {
      const ex = enemy.state.transform.x + ENEMY_W / 2;
      const ey = enemy.state.transform.y + ENEMY_H / 2;
      for (let i = 0; i < 6; i++) {
        stompParticles.push({ x: ex + (Math.random() - 0.5) * 20, y: ey + (Math.random() - 0.5) * 10, life: 0.4 });
      }
    }
  });

  game.getLoop().onRender = () => {
    const scene = game.activeScene;
    if (!scene) return;

    // Sky background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, width, height);

    // Sort objects by layer
    const objects = Array.from(scene.getAllObjects())
      .filter((obj) => obj.active && obj.state.visual.visible)
      .sort((a, b) => a.layer - b.layer);

    for (const obj of objects) {
      const tx = obj.state.transform.x;
      const ty = obj.state.transform.y;

      ctx.save();
      ctx.globalAlpha = obj.state.visual.opacity;

      // Blink effect for invincible player
      if (obj.type === "player") {
        const damageable = obj.getTrait<Damageable>("damageable");
        if (damageable?.isInvincible) {
          // Blink: skip rendering every other 100ms
          const blinkOn = Math.floor(damageable.invincibilityTimer * 10) % 2 === 0;
          if (blinkOn) {
            ctx.restore();
            continue;
          }
        }
      }

      if (obj.type === "platform") {
        // Platform: x,y = top-left, scale = width/height
        const pw = obj.state.transform.scale.x;
        const ph = obj.state.transform.scale.y;
        const color = obj.id === "ground" ? COLORS.ground : COLORS.platform;

        // Platform body
        ctx.fillStyle = color;
        ctx.fillRect(tx, ty, pw, ph);

        // Top highlight
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(tx, ty, pw, 3);

        // Grass on top for non-ground platforms
        if (obj.id !== "ground") {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(tx, ty - 3, pw, 3);
        }
      } else if (obj.type === "player") {
        // Player: x,y = top-left of bounding box
        ctx.fillStyle = COLORS.player;
        if (obj.state.visual.flipX) {
          ctx.translate(tx + PLAYER_W / 2, ty);
          ctx.scale(-1, 1);
          ctx.translate(-PLAYER_W / 2, 0);
        } else {
          ctx.translate(tx, ty);
        }

        // Body
        ctx.fillRect(0, 0, PLAYER_W, PLAYER_H);

        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(6, 8, 6, 6);
        ctx.fillRect(16, 8, 6, 6);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(9, 10, 3, 3);
        ctx.fillRect(19, 10, 3, 3);

        // Feet
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(2, PLAYER_H - 6, 10, 6);
        ctx.fillRect(16, PLAYER_H - 6, 10, 6);
      } else if (obj.type === "coin") {
        // Coin: x,y = top-left
        const cx = tx + COIN_SIZE / 2;
        const cy = ty + COIN_SIZE / 2;
        ctx.fillStyle = COLORS.coin;
        ctx.beginPath();
        ctx.arc(cx, cy, COIN_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === "enemy") {
        // Enemy: x,y = top-left
        ctx.fillStyle = COLORS.enemy;
        ctx.fillRect(tx, ty, ENEMY_W, ENEMY_H);

        // Angry eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(tx + 4, ty + 6, 6, 6);
        ctx.fillRect(tx + 16, ty + 6, 6, 6);
        ctx.fillStyle = "#000";
        ctx.fillRect(tx + 6, ty + 8, 3, 3);
        ctx.fillRect(tx + 18, ty + 8, 3, 3);

        // Eyebrows (angry)
        ctx.fillStyle = "#000";
        ctx.fillRect(tx + 3, ty + 4, 8, 2);
        ctx.fillRect(tx + 15, ty + 4, 8, 2);
      }

      ctx.restore();
    }

    // Stomp particles
    const dt = 1 / 60;
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
  };

  return game;
}
