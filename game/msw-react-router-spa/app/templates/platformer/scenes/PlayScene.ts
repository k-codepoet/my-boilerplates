import type { Collision } from "~/engine/types";
import { Scene } from "~/engine/Scene";
import type { GameObject } from "~/engine/GameObject";
import type { Movable } from "~/traits/Movable";
import type { Jumpable } from "~/traits/Jumpable";
import type { Damageable } from "~/traits/Damageable";
import type { Scorer } from "~/traits/Scorer";
import { createPlayer } from "../objects/Player";
import { createPlatform } from "../objects/Platform";
import { createCoin } from "../objects/Coin";
import { createEnemy } from "../objects/Enemy";

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

    // Player
    this.addObject(createPlayer());

    // Ground platform (full width)
    this.addObject(createPlatform("ground", 0, 550, 800, 50));

    // Floating platforms
    this.addObject(createPlatform("plat-1", 150, 420, 120, 20));
    this.addObject(createPlatform("plat-2", 350, 340, 120, 20));
    this.addObject(createPlatform("plat-3", 550, 260, 120, 20));
    this.addObject(createPlatform("plat-4", 50, 260, 100, 20));
    this.addObject(createPlatform("plat-5", 650, 420, 120, 20));

    // Coins on/above platforms
    this.addObject(createCoin("coin-1", 210, 390));
    this.addObject(createCoin("coin-2", 410, 310));
    this.addObject(createCoin("coin-3", 610, 230));
    this.addObject(createCoin("coin-4", 100, 230));
    this.addObject(createCoin("coin-5", 710, 390));

    // Enemy patrolling on ground
    this.addObject(createEnemy("enemy-1", 400, 526));
  }

  update(dt: number, collisions: Collision[]): void {
    super.update(dt, collisions);

    const input = this.game?.adapter.input.poll();
    if (!input) return;

    const player = this.getObject("player");
    if (!player || !player.active) return;

    // --- Player movement ---
    const movable = player.getTrait<Movable>("movable");
    const jumpable = player.getTrait<Jumpable>("jumpable");

    if (movable) {
      if (input.active.has("move_left")) {
        movable.accelerate(-300 * dt, 0);
        player.state.visual.flipX = true;
      }
      if (input.active.has("move_right")) {
        movable.accelerate(300 * dt, 0);
        player.state.visual.flipX = false;
      }
    }

    if (jumpable && input.justPressed.has("jump")) {
      jumpable.jump();
    }

    // --- Enemy patrol ---
    const enemy = this.getObject("enemy-1");
    if (enemy?.active) {
      const enemyMovable = enemy.getTrait<Movable>("movable");
      if (enemyMovable) {
        enemyMovable.setVelocity(100 * this.enemyDirection, 0);
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

  private checkCoinCollisions(player: GameObject): void {
    const coins = this.getObjectsByTag("coin");
    const scorer = player.getTrait<Scorer>("scorer");

    for (const coin of coins) {
      if (!coin.active) continue;
      const dx = player.state.transform.x - coin.state.transform.x;
      const dy = player.state.transform.y - coin.state.transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 24) {
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

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = player.state.transform.x - enemy.state.transform.x;
      const dy = player.state.transform.y - enemy.state.transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 28) {
        damageable?.hit(1);
      }
    }
  }
}
