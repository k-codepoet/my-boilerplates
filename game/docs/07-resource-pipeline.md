# 리소스 파이프라인 — 스프라이트와 에셋 시스템

> MSW 엔진의 스프라이트 생성 및 에셋 관리 파이프라인.
> 두 가지 모드(프로그래매틱 / 파일 기반)를 런타임에 토글할 수 있다.

---

## 1. 두 레이어 아키텍처

리소스 파이프라인은 **두 가지 모드**가 공존한다.

```
┌─────────────────────────────────────────────────────────┐
│                   ResourceMode                          │
├──────────────────────┬──────────────────────────────────┤
│  "programmatic"      │  "file"                          │
│  (기본값, 항상 동작)   │  (개발 실험용, PNG 필요)          │
├──────────────────────┼──────────────────────────────────┤
│  SpriteFactory.ts    │  assetDescriptors.ts             │
│  OffscreenCanvas     │  /assets/platformer/*.png        │
│       ↓              │          ↓                       │
│  createImageBitmap() │  adapter.assetFactory            │
│       ↓              │          ↓                       │
│  ImageBitmap         │  ImageBitmap                     │
├──────────────────────┴──────────────────────────────────┤
│           adapter.getAssetRegistry()                    │
│         Map<string, EngineAsset>                        │
│         (4개 어댑터 모두 공통 인터페이스)                  │
└─────────────────────────────────────────────────────────┘
```

**프로그래매틱 모드**: `OffscreenCanvas`에 JavaScript로 픽셀 아트를 직접 그려 `ImageBitmap`을 생성한다. PNG 파일이 없어도 항상 동작하며, 기본 모드다.

**파일 기반 모드**: `/assets/platformer/*.png` 파일을 HTTP로 불러와 `adapter.assetFactory`를 통해 `ImageBitmap`을 생성한다. 로딩 실패 시 자동으로 프로그래매틱 모드로 폴백한다.

---

## 2. SpriteFactory.ts — 프로그래매틱 스프라이트

위치: `src/templates/platformer/sprites/SpriteFactory.ts`

모든 함수는 `OffscreenCanvas`에 픽셀 아트를 그리고 `createImageBitmap(canvas)`를 반환하는 `async` 함수다.

### 내부 헬퍼

```typescript
async function drawToBitmap(
  w: number,
  h: number,
  draw: (ctx: OffscreenCanvasRenderingContext2D) => void,
): Promise<ImageBitmap>
```

모든 `draw*` 함수는 이 헬퍼를 통해 `OffscreenCanvas → ImageBitmap` 변환을 수행한다.

### 스프라이트 목록

| 함수 | 크기 | 설명 |
|------|------|------|
| `drawPlayerIdle()` | 28×36 | 파란 몸통 + 눈, 발 아래 대칭 |
| `drawPlayerWalk1()` | 28×36 | 왼발 위/오른발 아래 (걷기 프레임 1) |
| `drawPlayerWalk2()` | 28×36 | 오른발 위/왼발 아래 (걷기 프레임 2) |
| `drawPlayerJump()` | 28×36 | 발을 모아 올린 점프 자세 |
| `drawPlatform()` | 120×19 | 위 3px 잔디(#22c55e) + 아래 16px 돌(#78716c) |
| `drawGround()` | 800×50 | 어두운 돌(#57534e) + 상단 하이라이트 |
| `drawCoin()` | 14×14 | 노란 원(#eab308) + 흰 광택 |
| `drawEnemy()` | 26×26 | 빨간 몸통(#ef4444) + 분노 눈썹 |

### 플레이어 공통 베이스

`drawPlayerBase(ctx)` 내부 함수가 몸통/눈/동공을 그린다. 각 `drawPlayer*` 함수는 베이스 위에 발 위치만 다르게 그려 애니메이션 프레임을 만든다.

```
┌──────────────────┐
│  Player 28×36    │
│  ┌────┐ ┌────┐   │  ← 눈 (6×6, 흰색)
│  │ ●  │ │ ●  │   │  ← 동공 (3×3, 어두운색)
│  └────┘ └────┘   │
│                  │
│  [발1]   [발2]   │  ← 프레임별 위치 변동
└──────────────────┘
```

---

## 3. registerProgrammaticAssets.ts — 어댑터 레지스트리 등록

위치: `src/templates/platformer/sprites/registerProgrammaticAssets.ts`

`SpriteFactory`에서 생성한 `ImageBitmap`을 `EngineStateMap` 형태로 변환하여 어댑터의 에셋 레지스트리에 등록한다.

```typescript
export async function registerProgrammaticAssets(
  registry: Map<string, EngineAsset>,
): Promise<void>
```

### 등록 방식

```
SpriteFactory (ImageBitmap 생성)
         ↓
  EngineStateMap 조립
  {
    id: string,
    states: { [stateName]: EngineAssetState },
    defaultState: string,
  }
         ↓
  registry.set(assetKey, stateMap)
         ↓
  어댑터 내부 Map<string, EngineAsset>
```

### 등록된 에셋 키와 상태

| 에셋 키 | 상태 | 프레임 수 | FPS |
|---------|------|-----------|-----|
| `"player"` | `idle` | 1 | 0 (정지) |
| `"player"` | `walk` | 2 | 6 |
| `"player"` | `jump` | 1 | 0 (정지) |
| `"platform"` | `default` | 1 | 0 |
| `"ground"` | `default` | 1 | 0 |
| `"coin"` | `default` | 1 | 0 |
| `"enemy"` | `walk` | 1 | 0 |

**플레이어 walk 상태**는 `Walk1` + `Walk2` 두 프레임을 6 FPS로 교체하여 걷기 애니메이션을 구현한다.

### 병렬 로딩

```typescript
// 플레이어 4개 프레임 병렬 생성
const [playerIdle, playerWalk1, playerWalk2, playerJump] = await Promise.all([...]);

// 나머지 오브젝트 4개 병렬 생성
const [platformBitmap, groundBitmap, coinBitmap, enemyBitmap] = await Promise.all([...]);
```

`Promise.all`로 병렬 처리하여 초기화 시간을 최소화한다.

### 레지스트리 접근 방법

`adapter.getAssetRegistry()`는 `EngineAdapterInterface`에 정의되지 않은 메서드로, 내부 타입 캐스팅을 통해 접근한다.

```typescript
// PlatformerGame.ts
function getAdapterRegistry(adapter: EngineAdapterInterface): Map<string, EngineAsset> {
  return (adapter as unknown as { getAssetRegistry(): Map<string, EngineAsset> }).getAssetRegistry();
}
```

4개 어댑터(Canvas/PixiJS/Three.js/Phaser) 모두 `getAssetRegistry()`를 구현하므로 동일하게 동작한다.

---

## 4. assetDescriptors.ts — 파일 기반 에셋 디스크립터

위치: `src/templates/platformer/sprites/assetDescriptors.ts`

파일 기반 모드에서 사용하는 `StateMapDescriptor[]`를 정의한다. 각 디스크립터는 PNG 파일 URL과 크기, 피벗 정보를 포함한다.

```typescript
const BASE = "/assets/platformer";

export const playerDescriptor: StateMapDescriptor = {
  id: "player",
  type: "stateMap",
  states: {
    idle: {
      frames: [{ url: `${BASE}/player-idle.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } }],
      fps: 0,
    },
    walk: {
      frames: [
        { url: `${BASE}/player-walk-1.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } },
        { url: `${BASE}/player-walk-2.png`, width: 28, height: 36, pivot: { x: 14, y: 18 } },
      ],
      fps: 6,
    },
    // ...
  },
};
```

### PNG 파일 목록

| 파일 경로 | 크기 |
|-----------|------|
| `/assets/platformer/player-idle.png` | 28×36 |
| `/assets/platformer/player-walk-1.png` | 28×36 |
| `/assets/platformer/player-walk-2.png` | 28×36 |
| `/assets/platformer/player-jump.png` | 28×36 |
| `/assets/platformer/platform.png` | 120×19 |
| `/assets/platformer/ground.png` | 800×50 |
| `/assets/platformer/coin.png` | 14×14 |
| `/assets/platformer/enemy.png` | 26×26 |

**pivot**은 스프라이트 중심점이다. 렌더러는 중심점 기준으로 스프라이트를 그리므로 좌상단 기준 게임플레이 좌표와 정확히 매핑된다.

### 배럴 export

```typescript
export const fileDescriptors: StateMapDescriptor[] = [
  playerDescriptor,
  platformDescriptor,
  groundDescriptor,
  coinDescriptor,
  enemyDescriptor,
];
```

`PlatformerGame.ts`는 `fileDescriptors`를 가져와 `AssetRegistry`에 일괄 등록한다.

---

## 5. exportSpritePNGs.ts — PNG 내보내기 유틸리티

위치: `src/templates/platformer/sprites/exportSpritePNGs.ts`

개발 전용 유틸리티. `SpriteFactory`에서 생성한 `ImageBitmap`을 PNG 파일로 변환하여 브라우저 다운로드를 트리거한다.

```typescript
export async function exportAllSprites(): Promise<void>
```

### 동작 흐름

```
SpriteFactory.draw*()
       ↓
  ImageBitmap
       ↓
  OffscreenCanvas.convertToBlob({ type: "image/png" })
       ↓
  URL.createObjectURL(blob)
       ↓
  <a href="..." download="player-idle.png">.click()
       ↓
  PNG 파일 다운로드 (8개)
```

### 사용 방법

브라우저 콘솔 또는 개발 전용 UI 버튼에서 실행한다.

```typescript
import { exportAllSprites } from "./sprites/exportSpritePNGs";
await exportAllSprites();
```

다운로드된 파일을 `public/assets/platformer/`에 배치하면 파일 기반 모드에서 사용할 수 있다.

### 내보내기 파일 순서

```
player-idle.png
player-walk-1.png
player-walk-2.png
player-jump.png
platform.png
ground.png
coin.png
enemy.png
```

---

## 6. 런타임 토글 — UI와 localStorage

### GameCanvas.tsx에서의 토글 구현

```typescript
const STORAGE_KEY_ADAPTER  = "msw-engine:adapter";
const STORAGE_KEY_RESOURCE = "msw-engine:resource";
```

두 개의 버튼 그룹이 렌더된다:

1. **어댑터 선택**: Canvas 2D / PixiJS / Three.js / Phaser 3
2. **리소스 모드 선택**: Programmatic / File-based

```
┌─────────────────────────────────────────────────────┐
│  [Canvas 2D] [PixiJS] [Three.js] [Phaser 3]         │
│  Resources: [Programmatic] [File-based]             │
├─────────────────────────────────────────────────────┤
│                                                     │
│              게임 Canvas 영역                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### localStorage 지속성

버튼 클릭 시:

```typescript
onClick={() => {
  localStorage.setItem(STORAGE_KEY_RESOURCE, opt.value);
  setResourceMode(opt.value);
}}
```

페이지 새로고침 후에도 마지막 선택이 유지된다.

```typescript
const [resourceMode, setResourceMode] = useState<ResourceMode>(
  () => (localStorage.getItem(STORAGE_KEY_RESOURCE) as ResourceMode) || "programmatic",
);
```

기본값은 `"programmatic"`. `localStorage`에 값이 없으면 프로그래매틱 모드로 시작한다.

### useEffect 의존성

`adapterType`과 `resourceMode` 변경 시 게임이 재시작된다.

```typescript
useEffect(() => {
  // 기존 게임 정리 + 새 게임 생성
  createPlatformerGame(canvas, width, height, adapterType, resourceMode).then(...);

  return () => {
    // cleanup
  };
}, [width, height, adapterType, resourceMode, updateUI]);
```

---

## 7. 파일 기반 폴백 — try-catch 전략

`PlatformerGame.ts`의 리소스 등록 로직:

```typescript
if (resourceMode === "file") {
  try {
    const assetRegistry = new AssetRegistry();
    assetRegistry.registerCatalog(
      fileDescriptors.map((desc) => ({ id: desc.id, descriptor: desc })),
    );
    const loaded = await assetRegistry.loadAll(
      fileDescriptors.map((d) => d.id),
      adapter.assetFactory,
    );
    for (const [id, asset] of loaded) {
      registry.set(id, asset);
    }
  } catch {
    console.warn("File-based assets not found, falling back to programmatic sprites.");
    await registerProgrammaticAssets(registry);  // 폴백
  }
} else {
  await registerProgrammaticAssets(registry);
}
```

### 폴백 동작

| 상황 | 동작 |
|------|------|
| `resourceMode === "programmatic"` | `registerProgrammaticAssets()` 직접 호출 |
| `resourceMode === "file"` + PNG 존재 | `AssetRegistry.loadAll()` 성공 → 파일 에셋 사용 |
| `resourceMode === "file"` + PNG 없음 | catch 블록 → `console.warn()` + `registerProgrammaticAssets()` 호출 |

PNG가 없어도 게임이 정상 실행된다. 사용자는 콘솔에서 `console.warn` 메시지로 폴백 여부를 확인할 수 있다.

---

## 8. 현재 구현 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 프로그래매틱 모드 | **완료** | 항상 동작, 4개 어댑터 모두 지원 |
| 파일 기반 모드 | **부분** | 디스크립터/폴백 구현됨, PNG 미생성 |
| exportSpritePNGs | **완료** | 유틸리티 구현됨, 아직 실행 안 됨 |
| localStorage 토글 | **완료** | 어댑터 + 리소스 모드 모두 지속 |
| 4개 어댑터 지원 | **완료** | Canvas/PixiJS/Three.js/Phaser 동일 인터페이스 |

### 파일 기반 모드 활성화 방법

1. 브라우저 콘솔에서 `exportAllSprites()` 실행
2. 다운로드된 8개 PNG 파일을 `public/assets/platformer/`에 배치
3. UI에서 "File-based" 버튼 클릭

---

## 9. 새 스프라이트 추가 가이드

### 9.1. SpriteFactory에 draw 함수 추가

```typescript
// SpriteFactory.ts
export async function drawMySprite(): Promise<ImageBitmap> {
  return drawToBitmap(32, 32, (ctx) => {
    // OffscreenCanvasRenderingContext2D로 픽셀 아트 그리기
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 32, 32);
  });
}
```

### 9.2. registerProgrammaticAssets에 등록

```typescript
// registerProgrammaticAssets.ts
import { drawMySprite } from "./SpriteFactory";

const myBitmap = await drawMySprite();
registry.set("mySprite", {
  id: "mySprite",
  states: {
    default: {
      id: "mySprite-default",
      width: 32,
      height: 32,
      frames: [myBitmap],
      fps: 0,
    },
  },
  defaultState: "default",
} satisfies EngineStateMap);
```

### 9.3. assetDescriptors에 파일 디스크립터 추가

```typescript
// assetDescriptors.ts
export const mySpriteDescriptor: StateMapDescriptor = {
  id: "mySprite",
  type: "stateMap",
  states: {
    default: {
      id: "mySprite-default",
      type: "texture",
      frames: [{ url: `${BASE}/my-sprite.png`, width: 32, height: 32, pivot: { x: 16, y: 16 } }],
      fps: 0,
    },
  },
  defaultState: "default",
};

// fileDescriptors 배열에도 추가
export const fileDescriptors = [..., mySpriteDescriptor];
```

### 9.4. exportSpritePNGs에 포함

```typescript
// exportSpritePNGs.ts
{ name: "my-sprite", draw: drawMySprite },
```

### 9.5. 오브젝트에서 참조

```typescript
// objects/MyObject.ts
myObject.state.visual.assetKey = "mySprite";
myObject.state.visual.state = "default";
```
