import { GameObject } from "~/engine/GameObject";
import { Movable } from "~/traits/Movable";
import { Jumpable } from "~/traits/Jumpable";
import { Damageable } from "~/traits/Damageable";
import { Scorer } from "~/traits/Scorer";

export const PLAYER_W = 28;
export const PLAYER_H = 36;

export function createPlayer(id = "player"): GameObject {
  const player = new GameObject(id, "player");

  player.addTrait(new Movable({ speed: 200, friction: 0.82, maxSpeed: 280 }));
  player.addTrait(new Jumpable({ jumpForce: -580, gravity: 800, groundY: 550 - PLAYER_H }));
  player.addTrait(new Damageable({ maxHP: 3 }));
  player.addTrait(new Scorer());

  player.state.transform.x = 100;
  player.state.transform.y = 550 - PLAYER_H;
  player.state.transform.scale.x = 1;
  player.state.transform.scale.y = 1;

  player.state.visual.assetKey = "player";
  player.state.visual.state = "idle";
  player.state.visual.flipX = false;
  player.state.visual.visible = true;
  player.state.visual.opacity = 1;

  player.addTag("player");
  player.layer = 10;

  return player;
}
