import type {
  GameDefinitionData,
  SceneDefinition,
} from "~/engine/types";

// --- Parser ---

export function parseGameDefinition(json: unknown): GameDefinitionData {
  if (!json || typeof json !== "object") {
    throw new Error("GameDefinition: input must be a non-null object");
  }

  const obj = json as Record<string, unknown>;

  assertString(obj, "id");
  assertString(obj, "version");

  if (!obj.meta || typeof obj.meta !== "object") {
    throw new Error("GameDefinition: missing or invalid 'meta'");
  }
  const meta = obj.meta as Record<string, unknown>;
  assertString(meta, "title");
  const parsedMeta = {
    title: meta.title as string,
    description: (meta.description as string) ?? "",
    thumbnail: (meta.thumbnail as string) ?? "",
    orientation: validateEnum(
      meta.orientation,
      ["landscape", "portrait"],
      "landscape",
    ) as "landscape" | "portrait",
    resolution: parseResolution(meta.resolution),
  };

  if (!obj.assets || typeof obj.assets !== "object") {
    throw new Error("GameDefinition: missing or invalid 'assets'");
  }

  if (!obj.scenes || typeof obj.scenes !== "object") {
    throw new Error("GameDefinition: missing or invalid 'scenes'");
  }

  assertString(obj, "entryScene");

  const settings = parseSettings(obj.settings);

  if (!obj.inputMap || typeof obj.inputMap !== "object") {
    throw new Error("GameDefinition: missing or invalid 'inputMap'");
  }

  if (!obj.rules || typeof obj.rules !== "object") {
    throw new Error("GameDefinition: missing or invalid 'rules'");
  }

  if (!obj.stack || typeof obj.stack !== "object") {
    throw new Error("GameDefinition: missing or invalid 'stack'");
  }
  const stack = obj.stack as Record<string, unknown>;
  const parsedStack = {
    adapter: validateEnum(
      stack.adapter,
      ["canvas", "phaser", "pixi"],
      "canvas",
    ) as "canvas" | "phaser" | "pixi",
    resourcePipeline: validateEnum(
      stack.resourcePipeline,
      ["lite", "full"],
      "lite",
    ) as "lite" | "full",
    physics: stack.physics === null
      ? null
      : (validateEnum(
          stack.physics,
          ["arcade", "matter"],
          null,
        ) as null | "arcade" | "matter"),
  };

  return {
    id: obj.id as string,
    version: obj.version as string,
    meta: parsedMeta,
    assets: obj.assets as GameDefinitionData["assets"],
    scenes: obj.scenes as GameDefinitionData["scenes"],
    entryScene: obj.entryScene as string,
    settings,
    inputMap: obj.inputMap as GameDefinitionData["inputMap"],
    rules: obj.rules as GameDefinitionData["rules"],
    stack: parsedStack,
  };
}

// --- Utilities ---

export function extractSceneAssets(sceneDef: SceneDefinition): string[] {
  const assets = new Set<string>(sceneDef.requiredAssets);

  for (const obj of Object.values(sceneDef.objects)) {
    if (obj.asset) {
      assets.add(obj.asset);
    }
  }

  return [...assets];
}

export function createDefaultDefinition(): GameDefinitionData {
  return {
    id: "default",
    version: "1.0.0",
    meta: {
      title: "Untitled Game",
      description: "",
      thumbnail: "",
      orientation: "landscape",
      resolution: { width: 800, height: 600 },
    },
    assets: {},
    scenes: {
      main: {
        name: "main",
        type: "gameplay",
        requiredAssets: [],
        objects: {},
        transitions: {},
        camera: {
          bounds: { x: 0, y: 0, width: 800, height: 600 },
        },
        ui: [],
      },
    },
    entryScene: "main",
    settings: {
      physics: { gravity: { x: 0, y: 0 } },
      audio: { masterVolume: 1 },
    },
    inputMap: {
      up: ["ArrowUp", "KeyW"],
      down: ["ArrowDown", "KeyS"],
      left: ["ArrowLeft", "KeyA"],
      right: ["ArrowRight", "KeyD"],
      action: ["Space"],
    },
    rules: {
      winCondition: { field: "score", operator: "gte", value: 100 },
      loseCondition: { field: "lives", operator: "lte", value: 0 },
      scoring: { field: "score", displayName: "Score" },
    },
    stack: {
      adapter: "canvas",
      resourcePipeline: "lite",
      physics: null,
    },
  };
}

export function getPreloadAssets(definition: GameDefinitionData): string[] {
  const ids: string[] = [];
  for (const [key, ref] of Object.entries(definition.assets)) {
    if (ref.preload) {
      ids.push(key);
    }
  }
  return ids;
}

// --- Internal Helpers ---

function assertString(obj: Record<string, unknown>, key: string): void {
  if (typeof obj[key] !== "string" || (obj[key] as string).length === 0) {
    throw new Error(`GameDefinition: missing or invalid '${key}' (expected non-empty string)`);
  }
}

function validateEnum<T>(
  value: unknown,
  allowed: T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function parseResolution(
  value: unknown,
): { width: number; height: number } {
  if (value && typeof value === "object") {
    const res = value as Record<string, unknown>;
    const w = typeof res.width === "number" ? res.width : 800;
    const h = typeof res.height === "number" ? res.height : 600;
    return { width: w, height: h };
  }
  return { width: 800, height: 600 };
}

function parseSettings(
  value: unknown,
): GameDefinitionData["settings"] {
  const defaults: GameDefinitionData["settings"] = {
    physics: { gravity: { x: 0, y: 0 } },
    audio: { masterVolume: 1 },
  };

  if (!value || typeof value !== "object") return defaults;

  const s = value as Record<string, unknown>;

  if (s.physics && typeof s.physics === "object") {
    const p = s.physics as Record<string, unknown>;
    if (p.gravity && typeof p.gravity === "object") {
      const g = p.gravity as Record<string, unknown>;
      defaults.physics.gravity = {
        x: typeof g.x === "number" ? g.x : 0,
        y: typeof g.y === "number" ? g.y : 0,
      };
    }
  }

  if (s.audio && typeof s.audio === "object") {
    const a = s.audio as Record<string, unknown>;
    if (typeof a.masterVolume === "number") {
      defaults.audio.masterVolume = a.masterVolume;
    }
  }

  return defaults;
}
