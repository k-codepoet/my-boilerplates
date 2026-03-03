import type { Collision, InputState } from "~/engine/types";
import { Scene } from "~/engine/Scene";
import type { GameObject } from "~/engine/GameObject";
import type { Movable } from "~/traits/Movable";
import type { Jumpable } from "~/traits/Jumpable";
import type { Damageable } from "~/traits/Damageable";
import type { Scorer } from "~/traits/Scorer";
import { createPlayer, PLAYER_W, PLAYER_H } from "../objects/Player";
import { createPlatform } from "../objects/Platform";
import { createCoin, COIN_SIZE } from "../objects/Coin";
import { createEnemy, ENEMY_W, ENEMY_H } from "../objects/Enemy";

export class PlayScene extends Scene {
  private enemyDirection = 1;
  private enemyMinX = 300;
  private enemyMaxX = 600;

  constructor() {
    super("play");
  }

  create(): void {
    const state = this.game!.getState();
    state.set("score", 0);
    state.set("health", 3);
    state.set("screen", "play");

    // Player — starts on ground
    this.addObject(createPlayer());

    // Ground platform (full width)
    this.addObject(createPlatform("ground", 0, 550, 800, 50));

    // Floating platforms
    this.addObject(createPlatform("plat-1", 150, 430, 120, 16));
    this.addObject(createPlatform("plat-2", 350, 350, 120, 16));
    this.addObject(createPlatform("plat-3", 550, 270, 120, 16));
    this.addObject(createPlatform("plat-4", 50, 270, 100, 16));
    this.addObject(createPlatform("plat-5", 650, 430, 120, 16));

    // Coins on platforms (positioned above platform surface)
    this.addObject(createCoin("coin-1", 200, 405));
    this.addObject(createCoin("coin-2", 400, 325));
    this.addObject(createCoin("coin-3", 600, 245));
    this.addObject(createCoin("coin-4", 90, 245));
    this.addObject(createCoin("coin-5", 700, 405));

    // Enemy patrolling on ground
    this.addObject(createEnemy("enemy-1", 400, 550 - ENEMY_H));
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);

    if (!input) return;

    const player = this.getObject("player");
    if (!player || !player.active) return;

    // --- Player input ---
    const movable = player.getTrait<Movable>("movable");
    const jumpable = player.getTrait<Jumpable>("jumpable");

    if (movable) {
      if (input.active.has("move_left")) {
        movable.vx = -200;
        player.state.visual.flipX = true;
      } else if (input.active.has("move_right")) {
        movable.vx = 200;
        player.state.visual.flipX = false;
      } else {
        movable.vx *= 0.7; // decelerate when no input
      }
    }

    if (jumpable && input.justPressed.has("jump")) {
      jumpable.jump();
    }

    // --- Platform collision (AABB) ---
    this.resolvePlatformCollision(player, jumpable);

    // --- Clamp player to canvas bounds ---
    if (player.state.transform.x < 0) player.state.transform.x = 0;
    if (player.state.transform.x > 800 - PLAYER_W) player.state.transform.x = 800 - PLAYER_W;

    // --- Enemy patrol ---
    const enemy = this.getObject("enemy-1");
    if (enemy?.active) {
      const enemyMovable = enemy.getTrait<Movable>("movable");
      if (enemyMovable) {
        enemyMovable.setVelocity(80 * this.enemyDirection, 0);
        if (enemy.state.transform.x >= this.enemyMaxX) {
          this.enemyDirection = -1;
          enemy.state.visual.flipX = true;
        } else if (enemy.state.transform.x <= this.enemyMinX) {
          this.enemyDirection = 1;
          enemy.state.visual.flipX = false;
        }
      }
    }

    // --- Collision checks ---
    this.checkCoinCollisions(player);
    this.checkEnemyCollision(player);

    // --- Win/Lose conditions ---
    const state = this.game!.getState();
    const score = state.get<number>("score") ?? 0;
    const health = state.get<number>("health") ?? 0;

    if (score >= 100) {
      this.changeScene("gameover", { won: true });
    } else if (health <= 0) {
      this.changeScene("gameover", { won: false });
    }
  }

  private resolvePlatformCollision(player: GameObject, jumpable: Jumpable | undefined): void {
    const px = player.state.transform.x;
    const py = player.state.transform.y;
    const playerBottom = py + PLAYER_H;
    const movable = player.getTrait<Movable>("movable");

    const platforms = this.getObjectsByTag("platform");
    let bestLandingY = Infinity;

    for (const plat of platforms) {
      const platX = plat.state.transform.x;
      const platY = plat.state.transform.y;
      const platW = plat.state.transform.scale.x;

      // Horizontal overlap check
      if (px + PLAYER_W <= platX || px >= platX + platW) continue;

      // Landing: player bottom is near or past platform top, and falling down
      if (movable && movable.vy >= 0) {
        const penetration = playerBottom - platY;
        // Allow up to 24px penetration (handles fast falls at 60fps)
        if (penetration > 0 && penetration < 24) {
          if (platY < bestLandingY) {
            bestLandingY = platY;
          }
        }
      }
    }

    if (bestLandingY < Infinity && movable) {
      player.state.transform.y = bestLandingY - PLAYER_H;
      movable.vy = 0;
      if (jumpable) jumpable.isGrounded = true;
    } else if (jumpable?.isGrounded) {
      // Check if player walked off a platform edge → start falling
      let stillOnSomething = false;
      for (const plat of platforms) {
        const platX = plat.state.transform.x;
        const platY = plat.state.transform.y;
        const platW = plat.state.transform.scale.x;

        if (px + PLAYER_W > platX && px < platX + platW) {
          // Player bottom within 2px of platform top = still standing
          if (Math.abs(playerBottom - platY) <= 2) {
            stillOnSomething = true;
            break;
          }
        }
      }
      if (!stillOnSomething) {
        jumpable.isGrounded = false;
      }
    }
  }

  private checkCoinCollisions(player: GameObject): void {
    const coins = this.getObjectsByTag("coin");
    const scorer = player.getTrait<Scorer>("scorer");
    const px = player.state.transform.x;
    const py = player.state.transform.y;

    for (const coin of coins) {
      if (!coin.active) continue;
      const cx = coin.state.transform.x;
      const cy = coin.state.transform.y;

      // AABB overlap
      if (
        px + PLAYER_W > cx && px < cx + COIN_SIZE &&
        py + PLAYER_H > cy && py < cy + COIN_SIZE
      ) {
        coin.active = false;
        coin.state.visual.visible = false;
        scorer?.addScore(20);
        this.game!.getEvents().emit("coinCollected", { coinId: coin.id });
      }
    }
  }

  private checkEnemyCollision(player: GameObject): void {
    const enemies = this.getObjectsByTag("enemy");
    const damageable = player.getTrait<Damageable>("damageable");
    const movable = player.getTrait<Movable>("movable");
    const jumpable = player.getTrait<Jumpable>("jumpable");
    const px = player.state.transform.x;
    const py = player.state.transform.y;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const ex = enemy.state.transform.x;
      const ey = enemy.state.transform.y;

      // AABB overlap
      if (
        px + PLAYER_W > ex && px < ex + ENEMY_W &&
        py + PLAYER_H > ey && py < ey + ENEMY_H
      ) {
        // Mario-style: stomp from above kills enemy
        const playerBottom = py + PLAYER_H;
        const enemyCenter = ey + ENEMY_H / 2;

        if (movable && movable.vy > 0 && playerBottom < enemyCenter) {
          // Stomp! Kill enemy + bounce player up
          enemy.active = false;
          enemy.state.visual.visible = false;
          movable.vy = -300; // bounce
          if (jumpable) jumpable.isGrounded = false;

          // Bonus score for stomp
          const scorer = player.getTrait<Scorer>("scorer");
          scorer?.addScore(10);
          this.game!.getEvents().emit("enemyStomped", { enemyId: enemy.id });
        } else if (damageable && !damageable.isInvincible) {
          // Side/bottom collision: take damage + knockback
          damageable.hit(1);

          if (movable) {
            // Knockback away from enemy
            const knockDir = px < ex ? -1 : 1;
            movable.vx = knockDir * 250;
            movable.vy = -200;
            if (jumpable) jumpable.isGrounded = false;
          }
        }
      }
    }
  }
}
