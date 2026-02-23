import { GameObject } from "~/engine/GameObject";
import { Movable } from "~/traits/Movable";

export const ENEMY_W = 26;
export const ENEMY_H = 26;

export function createEnemy(id: string, x: number, y: number): GameObject {
  const enemy = new GameObject(id, "enemy");

  enemy.addTrait(new Movable({ speed: 100, friction: 1.0, maxSpeed: 100 }));

  enemy.state.transform.x = x;
  enemy.state.transform.y = y;
  enemy.state.transform.scale.x = 1;
  enemy.state.transform.scale.y = 1;

  enemy.state.visual.assetKey = "enemy";
  enemy.state.visual.state = "walk";
  enemy.state.visual.visible = true;
  enemy.state.visual.opacity = 1;

  enemy.addTag("enemy");
  enemy.addTag("hazard");
  enemy.layer = 9;

  return enemy;
}
