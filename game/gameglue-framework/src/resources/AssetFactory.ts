import type {
  EngineAsset,
  EngineAtlas,
  EngineAudio,
  EngineStateMap,
  EngineTexture,
} from "~/engine/types";

export type { AssetFactorySubsystem } from "~/engine/types";

// --- Type Guards for Loaded Assets ---

export function isEngineTexture(asset: EngineAsset): asset is EngineTexture {
  return "frames" in asset && "fps" in asset;
}

export function isEngineStateMap(asset: EngineAsset): asset is EngineStateMap {
  return "states" in asset && "defaultState" in asset;
}

export function isEngineAudio(asset: EngineAsset): asset is EngineAudio {
  return "buffer" in asset && "category" in asset;
}

export function isEngineAtlas(asset: EngineAsset): asset is EngineAtlas {
  return "image" in asset && "regions" in asset;
}
