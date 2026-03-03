import type { StateMapDescriptor } from "~/engine/types";

const BASE = "/assets/platformer";

export const playerDescriptor: StateMapDescriptor = {
  id: "player",
  type: "stateMap",
  states: {
    idle: {
      id: "player-idle",
      type: "texture",
      frames: [{ url: `${BASE}/player-idle.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } }],
      fps: 0,
    },
    walk: {
      id: "player-walk",
      type: "texture",
      frames: [
        { url: `${BASE}/player-walk-1.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } },
        { url: `${BASE}/player-walk-2.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } },
      ],
      fps: 6,
    },
    jump: {
      id: "player-jump",
      type: "texture",
      frames: [{ url: `${BASE}/player-jump.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } }],
      fps: 0,
    },
  },
  defaultState: "idle",
};

export const platformDescriptor: StateMapDescriptor = {
  id: "platform",
  type: "stateMap",
  states: {
    default: {
      id: "platform-default",
      type: "texture",
      frames: [{ url: `${BASE}/platform.png`, width: 120, height: 19, pivot: { x: 60, y: 9.5 } }],
      fps: 0,
    },
  },
  defaultState: "default",
};

export const groundDescriptor: StateMapDescriptor = {
  id: "ground",
  type: "stateMap",
  states: {
    default: {
      id: "ground-default",
      type: "texture",
      frames: [{ url: `${BASE}/ground.png`, width: 800, height: 50, pivot: { x: 400, y: 25 } }],
      fps: 0,
    },
  },
  defaultState: "default",
};

export const coinDescriptor: StateMapDescriptor = {
  id: "coin",
  type: "stateMap",
  states: {
    default: {
      id: "coin-default",
      type: "texture",
      frames: [{ url: `${BASE}/coin.png`, width: 14, height: 14, pivot: { x: 7, y: 7 } }],
      fps: 0,
    },
  },
  defaultState: "default",
};

export const enemyDescriptor: StateMapDescriptor = {
  id: "enemy",
  type: "stateMap",
  states: {
    walk: {
      id: "enemy-walk",
      type: "texture",
      frames: [{ url: `${BASE}/enemy.png`, width: 26, height: 26, pivot: { x: 13, y: 13 } }],
      fps: 0,
    },
  },
  defaultState: "walk",
};

export const fileDescriptors: StateMapDescriptor[] = [
  playerDescriptor,
  platformDescriptor,
  groundDescriptor,
  coinDescriptor,
  enemyDescriptor,
];
