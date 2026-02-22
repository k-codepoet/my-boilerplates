// ============================================================
// MSW Engine - Core Types
// All shared types/interfaces defined here to avoid circular deps
// ============================================================

// --- Transform & Geometry ---

export interface Vector2 {
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scale: Vector2;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Visual ---

export interface VisualState {
  assetKey: string;
  state: string;
  flipX: boolean;
  visible: boolean;
  opacity: number;
}

// --- Input ---

export interface InputState {
  active: Set<string>;
  justPressed: Set<string>;
  justReleased: Set<string>;
  pointer: Vector2;
}

// --- Physics ---

export interface Collision {
  a: string;
  b: string;
  overlap: Vector2;
}

export type PhysicsBodyType = "static" | "dynamic" | "kinematic";
export type ColliderShape = "box" | "circle";

export interface PhysicsBodyOptions {
  type: PhysicsBodyType;
  collider: ColliderShape;
  width: number;
  height: number;
  bounce?: number;
  friction?: number;
}

// --- Object State ---

export interface ObjectState {
  id: string;
  type: string;
  active: boolean;
  transform: Transform;
  visual: VisualState;
  traits: Record<string, unknown>;
  tags: string[];
}

// --- World State ---

export interface WorldTime {
  elapsed: number;
  delta: number;
  frameCount: number;
}

export interface WorldState {
  activeScene: string;
  global: Record<string, unknown>;
  objects: Record<string, ObjectState>;
  time: WorldTime;
  input: InputState;
}

// --- Render ---

export interface Drawable {
  id: string;
  layer: number;
  x: number;
  y: number;
  rotation: number;
  scale: Vector2;
  assetKey: string;
  assetState: string;
  flipX: boolean;
  visible: boolean;
  opacity: number;
}

export interface UIElement {
  id: string;
  type: "text" | "bar" | "image";
  props: Record<string, unknown>;
  position: Vector2;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderStateData {
  drawables: Drawable[];
  ui: UIElement[];
  camera: CameraState;
  background: {
    color?: string;
    image?: string;
  };
}

// --- Draw Commands ---

export type DrawCommand =
  | { type: "CLEAR"; color: string }
  | {
      type: "SPAWN";
      id: string;
      assetKey: string;
      assetState: string;
      x: number;
      y: number;
      layer: number;
    }
  | { type: "DESTROY"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "ROTATE"; id: string; rotation: number }
  | { type: "SCALE"; id: string; scaleX: number; scaleY: number }
  | { type: "STATE"; id: string; assetState: string }
  | { type: "FLIP"; id: string; flipX: boolean }
  | { type: "OPACITY"; id: string; opacity: number }
  | { type: "VISIBLE"; id: string; visible: boolean }
  | { type: "UI"; id: string; props: Record<string, unknown> }
  | { type: "CAMERA"; x: number; y: number; zoom: number }
  | { type: "SFX"; soundId: string; volume: number }
  | { type: "BGM"; soundId: string; action: "play" | "stop" };

// --- Asset Descriptors ---

export interface TextureFrame {
  url: string;
  width: number;
  height: number;
  pivot: Vector2;
}

export interface TextureDescriptor {
  id: string;
  type: "texture";
  frames: TextureFrame[];
  fps: number;
  hitbox?: Bounds;
  pivotOffset?: Vector2;
}

export interface StateMapDescriptor {
  id: string;
  type: "stateMap";
  states: Record<string, TextureDescriptor>;
  defaultState: string;
}

export interface AudioDescriptor {
  id: string;
  type: "audio";
  url: string;
  format: "mp3" | "ogg" | "wav";
  duration: number;
  loop: boolean;
  category: "sfx" | "bgm";
}

export interface AtlasRegion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pivot: Vector2;
}

export interface AtlasDescriptor {
  id: string;
  type: "atlas";
  imageUrl: string;
  regions: AtlasRegion[];
}

export type AssetDescriptor =
  | TextureDescriptor
  | StateMapDescriptor
  | AudioDescriptor
  | AtlasDescriptor;

// --- Engine Assets (opaque handles) ---

export interface EngineTexture {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly frames: ImageBitmap[];
  readonly fps: number;
}

export interface EngineStateMap {
  readonly id: string;
  readonly states: Record<string, EngineTexture>;
  readonly defaultState: string;
}

export interface EngineAudio {
  readonly id: string;
  readonly buffer: AudioBuffer;
  readonly category: "sfx" | "bgm";
}

export interface EngineAtlas {
  readonly id: string;
  readonly image: ImageBitmap;
  readonly regions: Map<string, AtlasRegion>;
}

export type EngineAsset = EngineTexture | EngineStateMap | EngineAudio | EngineAtlas;

// --- Game Definition (game.json schema) ---

export interface GameMeta {
  title: string;
  description: string;
  thumbnail: string;
  orientation: "landscape" | "portrait";
  resolution: { width: number; height: number };
}

export interface GameAssetRef {
  resourceId: string;
  states: string[];
  preload: boolean;
}

export interface ObjectDefinition {
  id: string;
  type: string;
  asset: string;
  initialState: string;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: Vector2;
  };
  traits: Record<string, Record<string, unknown>>;
  physics?: {
    type: PhysicsBodyType;
    collider: ColliderShape;
    bounce: number;
    friction: number;
  };
  tags: string[];
  children?: ObjectDefinition[];
}

export interface UIDefinition {
  id: string;
  type: "text" | "bar" | "image";
  props: Record<string, unknown>;
  position: Vector2;
}

export interface SceneTransition {
  target: string;
  data?: Record<string, unknown>;
}

export interface SceneDefinition {
  name: string;
  type: "menu" | "gameplay" | "result" | "cutscene";
  requiredAssets: string[];
  objects: Record<string, ObjectDefinition>;
  transitions: Record<string, SceneTransition>;
  camera: {
    bounds: Bounds;
    follow?: string;
  };
  ui: UIDefinition[];
}

export type RuleOperator = "eq" | "gt" | "lt" | "gte" | "lte";

export interface RuleExpression {
  field: string;
  operator: RuleOperator;
  value: number | string | boolean;
}

export interface ScoringRule {
  field: string;
  displayName: string;
}

export interface GameRules {
  winCondition: RuleExpression;
  loseCondition: RuleExpression;
  scoring: ScoringRule;
}

export interface InputMap {
  [actionName: string]: string[];
}

export interface GameDefinitionData {
  id: string;
  version: string;
  meta: GameMeta;
  assets: Record<string, GameAssetRef>;
  scenes: Record<string, SceneDefinition>;
  entryScene: string;
  settings: {
    physics: { gravity: Vector2 };
    audio: { masterVolume: number };
  };
  inputMap: InputMap;
  rules: GameRules;
  stack: {
    adapter: "canvas" | "phaser" | "pixi" | "three";
    resourcePipeline: "lite" | "full";
    physics: null | "arcade" | "matter";
  };
}

// --- Engine Adapter Interface ---

export interface InputSubsystem {
  init(inputMap: InputMap): void;
  poll(): InputState;
  destroy(): void;
}

export interface PhysicsSubsystem {
  init(config: { gravity?: Vector2 }): void;
  addBody(objectId: string, options: PhysicsBodyOptions): void;
  removeBody(objectId: string): void;
  step(dt: number): void;
  getCollisions(): Collision[];
  setGravity(x: number, y: number): void;
  destroy(): void;
}

export interface AudioSubsystem {
  play(soundId: string, options?: { volume?: number; loop?: boolean }): void;
  playBGM(soundId: string, options?: { volume?: number }): void;
  stopBGM(): void;
  stopAll(): void;
  setMasterVolume(volume: number): void;
}

export interface AssetFactorySubsystem {
  createTexture(desc: TextureDescriptor): Promise<EngineTexture>;
  createStateMap(desc: StateMapDescriptor): Promise<EngineStateMap>;
  createAudio(desc: AudioDescriptor): Promise<EngineAudio>;
  createAtlas(desc: AtlasDescriptor): Promise<EngineAtlas>;
}

export interface EngineAdapterConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  physics?: { gravity?: Vector2 };
}

export interface EngineAdapterInterface {
  init(config: EngineAdapterConfig): void;
  destroy(): void;
  requestFrame(callback: (timestamp: number) => void): void;
  cancelFrame(): void;
  processDrawQueue(commands: DrawCommand[]): void;
  input: InputSubsystem;
  physics: PhysicsSubsystem;
  audio: AudioSubsystem;
  assetFactory: AssetFactorySubsystem;
}

// --- Event Types ---

export type EventCallback = (data: unknown) => void;

// --- Game Loop Config ---

export interface GameLoopConfig {
  fixedDt: number;
  maxFrameSkip: number;
}

// --- Resource Info ---

export interface ResourceInfo {
  id: string;
  descriptor: AssetDescriptor;
}
