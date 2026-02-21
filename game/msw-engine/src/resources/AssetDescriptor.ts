import type {
  AssetDescriptor,
  AtlasDescriptor,
  AtlasRegion,
  AudioDescriptor,
  Bounds,
  StateMapDescriptor,
  TextureDescriptor,
  Vector2,
} from "~/engine/types";

// --- Factory Functions ---

export function createTextureDescriptor(
  id: string,
  url: string,
  width: number,
  height: number,
  options?: { fps?: number; pivot?: Vector2; hitbox?: Bounds },
): TextureDescriptor {
  const pivot = options?.pivot ?? { x: width / 2, y: height / 2 };
  return {
    id,
    type: "texture",
    frames: [{ url, width, height, pivot }],
    fps: options?.fps ?? 1,
    hitbox: options?.hitbox,
    pivotOffset: options?.pivot,
  };
}

export function createStateMapDescriptor(
  id: string,
  states: Record<string, TextureDescriptor>,
  defaultState: string,
): StateMapDescriptor {
  return { id, type: "stateMap", states, defaultState };
}

export function createAudioDescriptor(
  id: string,
  url: string,
  category: "sfx" | "bgm",
  options?: {
    format?: "mp3" | "ogg" | "wav";
    duration?: number;
    loop?: boolean;
  },
): AudioDescriptor {
  return {
    id,
    type: "audio",
    url,
    format: options?.format ?? "mp3",
    duration: options?.duration ?? 0,
    loop: options?.loop ?? (category === "bgm"),
    category,
  };
}

export function createAtlasDescriptor(
  id: string,
  imageUrl: string,
  regions: AtlasRegion[],
): AtlasDescriptor {
  return { id, type: "atlas", imageUrl, regions };
}

// --- Type Guards ---

export function isTextureDescriptor(
  desc: AssetDescriptor,
): desc is TextureDescriptor {
  return desc.type === "texture";
}

export function isStateMapDescriptor(
  desc: AssetDescriptor,
): desc is StateMapDescriptor {
  return desc.type === "stateMap";
}

export function isAudioDescriptor(
  desc: AssetDescriptor,
): desc is AudioDescriptor {
  return desc.type === "audio";
}

export function isAtlasDescriptor(
  desc: AssetDescriptor,
): desc is AtlasDescriptor {
  return desc.type === "atlas";
}
