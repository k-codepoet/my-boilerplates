import type {
  AssetFactorySubsystem,
  EngineAsset,
  ResourceInfo,
} from "~/engine/types";

export class AssetRegistry {
  private catalog = new Map<string, ResourceInfo>();
  private cache = new Map<string, EngineAsset>();
  private loading = new Map<string, Promise<EngineAsset>>();
  private _loaded = 0;
  private _total = 0;

  registerCatalog(resources: ResourceInfo[]): void {
    for (const res of resources) {
      this.catalog.set(res.id, res);
    }
  }

  async load(
    id: string,
    factory: AssetFactorySubsystem,
  ): Promise<EngineAsset> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const existing = this.loading.get(id);
    if (existing) return existing;

    const info = this.catalog.get(id);
    if (!info) {
      throw new Error(`Asset "${id}" not found in catalog`);
    }

    const promise = this.createAsset(info, factory).then((asset) => {
      this.cache.set(id, asset);
      this.loading.delete(id);
      this._loaded++;
      return asset;
    });

    this.loading.set(id, promise);
    return promise;
  }

  async loadAll(
    ids: string[],
    factory: AssetFactorySubsystem,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<Map<string, EngineAsset>> {
    this._total = ids.length;
    const startLoaded = this._loaded;

    const results = new Map<string, EngineAsset>();

    await Promise.all(
      ids.map(async (id) => {
        const asset = await this.load(id, factory);
        results.set(id, asset);
        onProgress?.(this._loaded - startLoaded, this._total);
      }),
    );

    return results;
  }

  get(id: string): EngineAsset | null {
    return this.cache.get(id) ?? null;
  }

  unload(id: string): void {
    if (this.cache.has(id)) {
      this.cache.delete(id);
      this._loaded = Math.max(0, this._loaded - 1);
    }
  }

  unloadAll(): void {
    this.cache.clear();
    this._loaded = 0;
    this._total = 0;
  }

  getProgress(): { loaded: number; total: number } {
    return { loaded: this._loaded, total: this._total };
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  private async createAsset(
    info: ResourceInfo,
    factory: AssetFactorySubsystem,
  ): Promise<EngineAsset> {
    const desc = info.descriptor;
    switch (desc.type) {
      case "texture":
        return factory.createTexture(desc);
      case "stateMap":
        return factory.createStateMap(desc);
      case "audio":
        return factory.createAudio(desc);
      case "atlas":
        return factory.createAtlas(desc);
    }
  }
}
