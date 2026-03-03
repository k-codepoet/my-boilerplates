import type {
  AssetFactorySubsystem,
  AtlasDescriptor,
  AtlasRegion,
  AudioDescriptor,
  EngineAtlas,
  EngineAudio,
  EngineStateMap,
  EngineTexture,
  StateMapDescriptor,
  TextureDescriptor,
} from "~/engine/types";
import type { CanvasAudio } from "./CanvasAudio";

export class CanvasAssetFactory implements AssetFactorySubsystem {
  private readonly audio: CanvasAudio;

  constructor(audio: CanvasAudio) {
    this.audio = audio;
  }

  async createTexture(desc: TextureDescriptor): Promise<EngineTexture> {
    const frames: ImageBitmap[] = [];
    let width = 0;
    let height = 0;

    for (const frame of desc.frames) {
      const response = await fetch(frame.url);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      frames.push(bitmap);
      width = frame.width || bitmap.width;
      height = frame.height || bitmap.height;
    }

    return {
      id: desc.id,
      width,
      height,
      frames,
      fps: desc.fps,
    };
  }

  async createStateMap(desc: StateMapDescriptor): Promise<EngineStateMap> {
    const states: Record<string, EngineTexture> = {};

    for (const [stateName, textureDesc] of Object.entries(desc.states)) {
      states[stateName] = await this.createTexture(textureDesc);
    }

    return {
      id: desc.id,
      states,
      defaultState: desc.defaultState,
    };
  }

  async createAudio(desc: AudioDescriptor): Promise<EngineAudio> {
    const ctx = this.audio.getContext();
    const response = await fetch(desc.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    // Register buffer with audio subsystem for playback
    this.audio.setBuffer(desc.id, buffer);

    return {
      id: desc.id,
      buffer,
      category: desc.category,
    };
  }

  async createAtlas(desc: AtlasDescriptor): Promise<EngineAtlas> {
    const response = await fetch(desc.imageUrl);
    const blob = await response.blob();
    const image = await createImageBitmap(blob);

    const regions = new Map<string, AtlasRegion>();
    for (const region of desc.regions) {
      regions.set(region.name, region);
    }

    return {
      id: desc.id,
      image,
      regions,
    };
  }
}
