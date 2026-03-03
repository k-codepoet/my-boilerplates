import { Trait } from "~/engine/Trait";

interface DamageableConfig {
  maxHP?: number;
  invincibilityDuration?: number;
}

export class Damageable extends Trait {
  readonly name = "damageable";

  hp = 0;
  maxHP: number;
  invincibilityTimer = 0;
  isInvincible = false;

  private config: Required<DamageableConfig>;

  constructor(config: DamageableConfig = {}) {
    super();
    this.config = {
      maxHP: config.maxHP ?? 3,
      invincibilityDuration: config.invincibilityDuration ?? 1.0,
    };
    this.maxHP = this.config.maxHP;
  }

  init(): void {
    this.hp = this.maxHP;

    const state = this.gameObject?.scene?.game?.getState();
    state?.set("health", this.hp);
  }

  update(dt: number): void {
    if (this.isInvincible) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.invincibilityTimer = 0;
        this.isInvincible = false;
      }
    }
  }

  hit(damage: number): void {
    if (this.isInvincible || this.isDead()) return;

    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;

    this.isInvincible = true;
    this.invincibilityTimer = this.config.invincibilityDuration;

    const events = this.gameObject?.scene?.game?.getEvents();
    const state = this.gameObject?.scene?.game?.getState();
    state?.set("health", this.hp);

    events?.emit("damaged", {
      objectId: this.gameObject?.state.id,
      hp: this.hp,
      damage,
    });

    if (this.hp <= 0) {
      events?.emit("death", {
        objectId: this.gameObject?.state.id,
      });
    }
  }

  heal(amount: number): void {
    if (this.isDead()) return;

    this.hp = Math.min(this.hp + amount, this.maxHP);

    const state = this.gameObject?.scene?.game?.getState();
    state?.set("health", this.hp);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
