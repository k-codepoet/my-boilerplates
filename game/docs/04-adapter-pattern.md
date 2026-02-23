# 어댑터 패턴

> `msw-engine/src/adapters/` 디렉토리. 플랫폼 추상화를 통해 렌더링 엔진을 교체할 수 있는 구조.

## EngineAdapterInterface

> 파일: `msw-engine/src/engine/types.ts:394-404`

```typescript
interface EngineAdapterInterface {
  init(config: EngineAdapterConfig): void;
  destroy(): void;
  requestFrame(callback: (timestamp: number) => void): void;
  cancelFrame(): void;
  processDrawQueue(commands: DrawCommand[]): void;

  input: InputSubsystem;             // 입력
  physics: PhysicsSubsystem;         // 물리
  audio: AudioSubsystem;             // 오디오
  assetFactory: AssetFactorySubsystem; // 에셋 생성
}
```

**4개 서브시스템 인터페이스:**

```
┌─────────────────────┐     ┌──────────────────────┐
│   InputSubsystem    │     │  PhysicsSubsystem    │
│                     │     │                      │
│  init(inputMap)     │     │  init(config)        │
│  poll() → InputState│     │  addBody(id, opts)   │
│  destroy()          │     │  removeBody(id)      │
│                     │     │  step(dt)            │
│                     │     │  getCollisions()     │
│                     │     │  setGravity(x, y)    │
│                     │     │  destroy()           │
└─────────────────────┘     └──────────────────────┘

┌─────────────────────┐     ┌──────────────────────────┐
│   AudioSubsystem    │     │  AssetFactorySubsystem   │
│                     │     │                          │
│  play(soundId, opts)│     │  createTexture(desc)     │
│  playBGM(soundId)   │     │  createStateMap(desc)    │
│  stopBGM()          │     │  createAudio(desc)       │
│  stopAll()          │     │  createAtlas(desc)       │
│  setMasterVolume(v) │     │                          │
└─────────────────────┘     └──────────────────────────┘
```

## Canvas 어댑터 구현 상세

### CanvasAdapter — 통합 어댑터

> 파일: `msw-engine/src/adapters/canvas/CanvasAdapter.ts`

CanvasAdapter는 모든 서브시스템을 Canvas 2D API 기반으로 구현한다.

```typescript
class CanvasAdapter implements EngineAdapterInterface {
  readonly input: CanvasInput;
  readonly physics: CanvasPhysics;
  readonly audio: CanvasAudio;
  readonly assetFactory: CanvasAssetFactory;
  private renderer: CanvasRenderer;
  private assetRegistry: Map<string, EngineAsset>;  // 로딩된 에셋 저장소
}
```

**초기화 흐름 (`init`):**

```
canvas.width = width
canvas.height = height
ctx = canvas.getContext("2d")
  │
  ├─ input = new CanvasInput(canvas)   ← 실제 캔버스에 이벤트 리스너 등록
  ├─ physics.init({ gravity })
  ├─ renderer.setContext(ctx)
  └─ renderer.setAssetRegistry(assetRegistry)
```

### CanvasInput — 입력 폴링

> 파일: `msw-engine/src/adapters/canvas/CanvasInput.ts`

```
키보드 이벤트 (브라우저)           액션 매핑 (game.json)
━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━━━━━
keydown: "ArrowLeft"    ──┐
keydown: "KeyA"         ──┼──→  "move_left"
                          │
keydown: "ArrowRight"   ──┼──→  "move_right"
keydown: "KeyD"         ──┘
                          │
keydown: "Space"        ──┼──→  "jump"
keydown: "ArrowUp"      ──┘
```

**역방향 매핑 (`init`):**

game.json의 `inputMap`을 역방향으로 변환한다:

```
inputMap: { "jump": ["ArrowUp", "Space"] }
  → keyToActions: { "ArrowUp": ["jump"], "Space": ["jump"] }
```

**poll() 메서드의 동작:**

```
1. keysDown           → active Set<string>        (현재 눌린 액션)
2. keysJustPressed    → justPressed Set<string>    (이 프레임에 새로 눌린 액션)
3. keysJustReleased   → justReleased Set<string>   (이 프레임에 뗀 액션)
4. pointer            → pointer Vector2             (포인터 위치)
5. keysJustPressed.clear()   ← ⚠️ poll 후 즉시 초기화
6. keysJustReleased.clear()  ← ⚠️ poll 후 즉시 초기화
```

입력 시스템의 단일 폴링 아키텍처에 대한 상세 내용은 [02-engine-modules.md](02-engine-modules.md#입력-시스템) 참조.

### CanvasPhysics — AABB 충돌 감지

> 파일: `msw-engine/src/adapters/canvas/CanvasPhysics.ts`

- AABB(Axis-Aligned Bounding Box) 충돌 감지
- `dynamic` 바디만 충돌의 "a" 측으로 테스트
- `step(dt)` 시 dynamic 바디에 중력 적용
- 오버랩 벡터(`{ x, y }`)를 Collision으로 반환

### CanvasRenderer — 스프라이트 렌더링

> 파일: `msw-engine/src/adapters/canvas/CanvasRenderer.ts`

DrawCommand 큐를 처리하여 Canvas 2D에 렌더링한다.

```
processDrawQueue(commands)        render(dt)
━━━━━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━
  CLEAR → backgroundColor 설정    1. 배경 그리기
  SPAWN → sprites Map에 추가      2. 카메라 변환 적용
  MOVE  → sprite 위치 업데이트     3. 스프라이트 layer 정렬
  FLIP  → sprite flipX 설정       4. 각 스프라이트:
  STATE → 애니메이션 프레임 교체       - 애니메이션 프레임 갱신
  DESTROY → sprites Map에서 제거       - translate/rotate/scale
  CAMERA → 카메라 상태 업데이트        - drawImage (또는 placeholder)
  SFX/BGM → 오디오 핸들러 호출     5. 카메라 복원
```

### CanvasAudio — Web Audio API

> 파일: `msw-engine/src/adapters/canvas/CanvasAudio.ts`

- `AudioContext` 지연 생성 (`ensureContext`)
- SFX: fire-and-forget 패턴 (source 추적 없음)
- BGM: 단일 트랙 관리 (loop: true)
- 마스터 볼륨 GainNode

### CanvasAssetFactory — 에셋 로딩

> 파일: `msw-engine/src/adapters/canvas/CanvasAssetFactory.ts`

| 메서드 | 입력 | 출력 |
|--------|------|------|
| `createTexture` | TextureDescriptor | EngineTexture (ImageBitmap[]) |
| `createStateMap` | StateMapDescriptor | EngineStateMap (states별 EngineTexture) |
| `createAudio` | AudioDescriptor | EngineAudio (AudioBuffer) |
| `createAtlas` | AtlasDescriptor | EngineAtlas (ImageBitmap + regions) |

## 프레임당 렌더링 흐름

> PlatformerGame.ts 기준

```
game.loop.onRender = () => {
  ┌─────────────────────────────────────────────────┐
  │ 1. commands = []                                 │
  │ 2. CLEAR: 배경색 설정 (#87CEEB)                  │
  │ 3. CAMERA: 중심 좌표 + zoom 설정                  │
  │                                                  │
  │ 4. scene.getAllObjects() 순회:                     │
  │    ├─ 비활성/비가시 → DESTROY (이미 SPAWN된 경우)  │
  │    ├─ 신규 → SPAWN + SCALE                        │
  │    └─ 기존 → MOVE                                 │
  │    └─ 공통 → FLIP                                 │
  │                                                  │
  │ 5. 더 이상 없는 스프라이트 → DESTROY               │
  │ 6. adapter.processDrawQueue(commands)             │
  └─────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────┐
  │ CanvasAdapter.processDrawQueue(commands)          │
  │   renderer.processDrawQueue(commands)  ← 커맨드 적용│
  │   renderer.render(dt)                  ← 실제 그리기│
  └─────────────────────────────────────────────────┘
```

## 구현된 어댑터 목록

현재 4개의 어댑터가 구현되어 있으며, 런타임에 UI 토글로 전환할 수 있다.

### PixiAdapter — PixiJS v8

> 파일: `msw-engine/src/adapters/pixi/`

```
PixiAdapter.ts          # 어댑터 메인 (비동기 초기화)
PixiRenderer.ts         # PixiJS Application + Container + Sprite
PixiInput.ts            # CanvasInput 재사용 (같은 키보드 이벤트)
PixiPhysics.ts          # CanvasPhysics 재사용 (AABB)
PixiAudio.ts            # CanvasAudio 재사용 (Web Audio)
PixiAssetFactory.ts     # CanvasAssetFactory 재사용
```

**특징:**
- WebGL/WebGPU 자동 선택 (PixiJS v8)
- `Sprite.anchor.set(0.5)` — 중심점 기준 렌더링
- 비동기 초기화: `adapter.waitForInit()` 필요
- Container 기반 레이어 관리

### ThreeAdapter — Three.js

> 파일: `msw-engine/src/adapters/three/`

```
ThreeAdapter.ts         # 어댑터 메인
ThreeRenderer.ts        # OrthographicCamera + Sprite/Mesh + WebGLRenderer
ThreeInput.ts           # CanvasInput 재사용
ThreePhysics.ts         # CanvasPhysics 재사용
ThreeAudio.ts           # CanvasAudio 재사용
ThreeAssetFactory.ts    # CanvasAssetFactory 재사용
```

**특징:**
- OrthographicCamera로 2D 렌더링 (y-down 좌표계)
- `CanvasTexture` + `NearestFilter`로 픽셀아트 보존
- Sprite/Mesh 기반 렌더링, layer 값으로 z-position 결정

### PhaserAdapter — Phaser 3

> 파일: `msw-engine/src/adapters/phaser/`

```
PhaserAdapter.ts        # 어댑터 메인 (비동기 Scene 초기화)
PhaserRenderer.ts       # Phaser.Game + Scene + Image
PhaserInput.ts          # CanvasInput 재사용
PhaserPhysics.ts        # CanvasPhysics 재사용
PhaserAudio.ts          # CanvasAudio 재사용
PhaserAssetFactory.ts   # CanvasAssetFactory 재사용
```

**특징:**
- Phaser 3 Game 인스턴스 생성 → 내부 Scene에서 렌더링
- 비동기 초기화: `adapter.waitForScene()` 필요
- Image 오브젝트 기반, `setOrigin(0.5)` 중심점 렌더링

### 어댑터 간 공유 구조

4개 어댑터 모두 동일한 서브시스템 인터페이스를 구현하되, 렌더러만 각 엔진 고유 구현이다. 입력/물리/오디오/에셋 로딩은 Canvas 어댑터의 구현을 재사용한다:

```
                    CanvasAdapter    PixiAdapter    ThreeAdapter    PhaserAdapter
  Renderer          Canvas 2D        PixiJS v8      Three.js        Phaser 3
  Input             CanvasInput      CanvasInput    CanvasInput     CanvasInput
  Physics           CanvasPhysics    CanvasPhysics  CanvasPhysics   CanvasPhysics
  Audio             CanvasAudio      CanvasAudio    CanvasAudio     CanvasAudio
  AssetFactory      CanvasAssetF.    CanvasAssetF.  CanvasAssetF.   CanvasAssetF.
```

### 좌표계 변환

모든 어댑터는 **중심점 기준(center-origin)**으로 스프라이트를 렌더링한다. 게임플레이는 **좌상단 기준(top-left)**으로 좌표를 관리하므로, `PlatformerGame.ts`의 `getRenderTransform()`이 변환을 수행한다:

```typescript
// 비플랫폼 오브젝트: 좌상단 → 중심점
{ x: tx + spriteW / 2, y: ty + spriteH / 2 }

// 플랫폼: 좌상단 + 실제 크기 → 중심점 + 스프라이트 스케일 배율
{ x: tx + width / 2, y: ty + height / 2, scaleX: width / spriteW, scaleY: height / spriteH }
```

## 새 어댑터 추가 가이드

1. `EngineAdapterInterface`를 구현하는 새 클래스 생성
2. 렌더러 구현 (중심점 기준 스프라이트 렌더링)
3. 서브시스템은 Canvas 구현을 재사용하거나 해당 엔진 네이티브로 구현:
   - `InputSubsystem` — 입력 폴링
   - `PhysicsSubsystem` — 충돌 감지
   - `AudioSubsystem` — 사운드 재생
   - `AssetFactorySubsystem` — 에셋 로딩
4. `processDrawQueue(commands: DrawCommand[])` 구현 — DrawCommand를 해당 엔진의 렌더링 명령으로 변환
5. `getAssetRegistry(): Map<string, EngineAsset>` 메서드 구현 (프로그래매틱 에셋 등록에 사용)
6. `PlatformerGame.ts`의 `createAdapter()`에 새 어댑터 추가
