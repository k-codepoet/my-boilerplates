export {
  createTextureDescriptor,
  createStateMapDescriptor,
  createAudioDescriptor,
  createAtlasDescriptor,
  isTextureDescriptor,
  isStateMapDescriptor,
  isAudioDescriptor,
  isAtlasDescriptor,
} from "./AssetDescriptor";

export {
  isEngineTexture,
  isEngineStateMap,
  isEngineAudio,
  isEngineAtlas,
} from "./AssetFactory";
export type { AssetFactorySubsystem } from "./AssetFactory";

export { AssetRegistry } from "./AssetRegistry";

export {
  parseGameDefinition,
  extractSceneAssets,
  createDefaultDefinition,
  getPreloadAssets,
} from "./GameDefinition";
