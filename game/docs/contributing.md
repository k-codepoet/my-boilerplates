# CONTRIBUTING.md — MSW Game Engine 개발 가이드

MSW(Micro Scene World) Game Engine 보일러플레이트에 기여하기 위한 실전 가이드.

---

## 1. 빠른 시작

### 환경 요구사항

- **Node.js 22** (`.nvmrc` 포함)
- **pnpm v10.12+** (`corepack enable`으로 설치)

### msw-engine (단독 실행)

엔진 코어 개발 및 테스트용. 순수 Vite + React 환경.

```bash
cd game/msw-engine
pnpm install
pnpm dev        # Vite dev server (HMR)
pnpm build      # tsc && vite build
pnpm typecheck  # tsc --noEmit
```

빌드 결과: `dist/`

### msw-react-router-spa (React Router 통합)

웹 배포용. React Router v7 + Docker/nginx SPA 패턴.

```bash
cd game/msw-react-router-spa
pnpm install
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build
pnpm typecheck  # react-router typegen && tsc
```

빌드 결과: `build/client/`, `build/server/`

---

## 2. 프로젝트 구조

### 두 보일러플레이트의 관계

| | msw-engine | msw-react-router-spa |
|---|---|---|
| 용도 | 엔진 개발/테스트 | 웹 배포 (SPA) |
| 프레임워크 | Vite + React | React Router v7 |
| 배포 | 없음 (로컬 개발용) | Docker/nginx |
| 엔진 코드 위치 | `src/` | `app/` |

**핵심**: 엔진 코드는 **완전 복사**된다. monorepo 패키지 의존성이 아니다.

왜? `degit`으로 각 보일러플레이트를 독립적으로 복사해야 하므로, 외부 패키지 참조가 불가능하다. 따라서 `msw-react-router-spa/app/engine/`은 `msw-engine/src/engine/`의 사본이다.

### 경로 별칭 (Path Alias)

| 보일러플레이트 | 별칭 | 대상 |
|---|---|---|
| msw-engine | `~/*` | `./src/*` |
| msw-react-router-spa | `~/*` | `./app/*` |

`tsconfig.json`의 `paths`와 `vite-tsconfig-paths` 플러그인으로 해석된다.

### 디렉토리 맵 (msw-engine 기준)

```
src/
├── engine/                 # 엔진 코어
│   ├── Game.ts             # 게임 인스턴스 (어댑터, 씬 관리, 게임 루프)
│   ├── GameLoop.ts         # 고정 시간 스텝 루프 (1/60s, max 5 skip)
│   ├── Scene.ts            # 씬 기반 클래스 (preload → create → update → destroy)
│   ├── GameObject.ts       # 게임 오브젝트 (Transform + Visual + Trait 조합)
│   ├── Trait.ts            # Trait 기반 클래스 (attach → init → update → destroy)
│   ├── GameState.ts        # 전역 상태 (key-value 저장소)
│   ├── GameRule.ts         # 규칙 평가 (승리/패배 조건)
│   ├── EventBus.ts         # 이벤트 시스템
│   └── types.ts            # 모든 타입/인터페이스 정의
│
├── adapters/               # 어댑터 추상화 (4종 구현)
│   ├── EngineAdapter.ts    # 어댑터 기반 (미사용, interface가 types.ts에 정의됨)
│   ├── index.ts            # 배럴 export
│   ├── canvas/             # Canvas 2D 어댑터 (기본, 의존성 없음)
│   │   ├── CanvasAdapter.ts      # 어댑터 메인
│   │   ├── CanvasInput.ts        # 키보드 입력 서브시스템
│   │   ├── CanvasPhysics.ts      # AABB 물리 서브시스템
│   │   ├── CanvasAudio.ts        # Web Audio API 서브시스템
│   │   ├── CanvasAssetFactory.ts # 에셋 로딩 팩토리
│   │   └── CanvasRenderer.ts     # Canvas 2D 렌더러
│   ├── pixi/               # PixiJS v8 어댑터 (WebGL/WebGPU)
│   │   ├── PixiAdapter.ts        # 어댑터 메인 (비동기 초기화)
│   │   └── PixiRenderer.ts       # PixiJS 렌더러
│   ├── three/              # Three.js 어댑터 (OrthographicCamera 2D)
│   │   ├── ThreeAdapter.ts       # 어댑터 메인
│   │   └── ThreeRenderer.ts      # Three.js 렌더러
│   └── phaser/             # Phaser 3 어댑터 (게임 프레임워크 래핑)
│       ├── PhaserAdapter.ts      # 어댑터 메인 (비동기 Scene 초기화)
│       └── PhaserRenderer.ts     # Phaser 렌더러
│
├── traits/                 # 재사용 가능한 행동 컴포넌트
│   ├── Movable.ts          # 속도/가속/마찰 기반 이동
│   ├── Jumpable.ts         # 점프 + 중력 (Movable 의존)
│   ├── Damageable.ts       # HP 관리 + 무적 타이머
│   ├── Scorer.ts           # 점수 관리 (GameState 연동)
│   ├── Timer.ts            # 카운트다운/업 타이머
│   ├── Tappable.ts         # 포인터 탭 감지 (히트 영역)
│   ├── Collidable.ts       # 물리 바디 등록/업데이트
│   ├── Animated.ts         # 스프라이트 애니메이션 상태 관리
│   └── index.ts            # 배럴 export
│
├── render/                 # 렌더링 파이프라인
│   ├── DrawCommand.ts      # DrawCommand 유틸리티
│   ├── RenderState.ts      # 렌더 상태 관리
│   ├── Projector.ts        # 카메라 → 화면 좌표 변환
│   └── DirtyTracker.ts     # 변경 감지
│
├── memory/                 # 메모리 최적화
│   ├── TransformBuffer.ts  # Float32Array 기반 Transform 저장
│   ├── ObjectPool.ts       # 오브젝트 풀링
│   └── EventPool.ts        # 이벤트 풀링
│
├── resources/              # 에셋 관리
│   ├── AssetDescriptor.ts  # 에셋 디스크립터 유틸
│   ├── AssetFactory.ts     # 에셋 생성 추상화
│   ├── AssetRegistry.ts    # 에셋 레지스트리
│   └── GameDefinition.ts   # game.json 로더/파서
│
├── templates/              # 게임 템플릿
│   └── platformer/         # 플랫포머 데모
│       ├── PlatformerGame.ts   # 게임 팩토리 함수 (어댑터 선택 + 리소스 파이프라인)
│       ├── game.json           # 게임 정의 데이터
│       ├── scenes/             # 씬 구현
│       │   ├── TitleScene.ts
│       │   ├── PlayScene.ts
│       │   └── GameOverScene.ts
│       ├── objects/            # 오브젝트 팩토리
│       │   ├── Player.ts
│       │   ├── Platform.ts
│       │   ├── Coin.ts
│       │   └── Enemy.ts
│       └── sprites/            # 스프라이트 리소스 파이프라인
│           ├── SpriteFactory.ts           # 프로그래매틱 스프라이트 (OffscreenCanvas → ImageBitmap)
│           ├── registerProgrammaticAssets.ts # 프로그래매틱 에셋을 어댑터에 등록
│           ├── assetDescriptors.ts        # 파일 기반 에셋 디스크립터
│           └── exportSpritePNGs.ts        # PNG 내보내기 유틸리티 (개발용)
│
└── ui/                     # React UI 레이어
    ├── GameCanvas.tsx       # 게임 캔버스 + UI 통합 컴포넌트
    ├── HUD.tsx              # 점수/체력 등 HUD
    └── DebugOverlay.tsx     # FPS/오브젝트 수 디버그 정보
```

---

## 3. 새 게임 템플릿 만들기

플랫포머 템플릿을 참조 구현으로 사용한다. 다음 단계를 따른다.

### 3.1. 디렉토리 생성

```
src/templates/{genre}/
├── {Genre}Game.ts
├── game.json
├── scenes/
│   ├── TitleScene.ts
│   ├── PlayScene.ts
│   └── GameOverScene.ts
└── objects/
    ├── {Object1}.ts
    └── {Object2}.ts
```

### 3.2. game.json 작성

게임의 메타데이터, 에셋, 씬, 입력 매핑, 규칙을 선언한다.

```json
{
  "id": "my-game",
  "version": "1.0.0",
  "meta": {
    "title": "My Game",
    "description": "설명",
    "thumbnail": "",
    "orientation": "landscape",
    "resolution": { "width": 800, "height": 600 }
  },
  "assets": {
    "player": { "resourceId": "player", "states": ["idle", "walk"], "preload": true }
  },
  "scenes": {
    "title": {
      "name": "title",
      "type": "menu",
      "requiredAssets": [],
      "objects": {},
      "transitions": { "start": { "target": "play" } },
      "camera": { "bounds": { "x": 0, "y": 0, "width": 800, "height": 600 } },
      "ui": []
    }
  },
  "entryScene": "title",
  "inputMap": {
    "move_left": ["ArrowLeft", "KeyA"],
    "move_right": ["ArrowRight", "KeyD"],
    "jump": ["ArrowUp", "Space"]
  },
  "settings": {
    "physics": { "gravity": { "x": 0, "y": 800 } },
    "audio": { "masterVolume": 1.0 }
  },
  "rules": {
    "winCondition": { "field": "score", "operator": "gte", "value": 100 },
    "loseCondition": { "field": "health", "operator": "lte", "value": 0 },
    "scoring": { "field": "score", "displayName": "Score" }
  },
  "stack": {
    "adapter": "canvas",
    "resourcePipeline": "lite",
    "physics": null
  }
}
```

### 3.3. 게임 팩토리 함수 작성

`createPlatformerGame` 패턴을 따른다:

```typescript
// templates/{genre}/{Genre}Game.ts
import type { DrawCommand } from "~/engine/types";
import { Game } from "~/engine/Game";
import { CanvasAdapter } from "~/adapters/canvas/CanvasAdapter";
import { TitleScene } from "./scenes/TitleScene";
import { PlayScene } from "./scenes/PlayScene";
import { GameOverScene } from "./scenes/GameOverScene";
import gameDefinition from "./game.json";

export async function createMyGame(
  canvas: HTMLCanvasElement,
  width = 800,
  height = 600,
): Promise<Game> {
  const adapter = new CanvasAdapter();
  const game = new Game(adapter);

  // 1. 씬 등록
  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());

  // 2. 게임 시작 (어댑터 초기화 + 엔트리 씬 전환 + 루프 시작)
  await game.start(gameDefinition.entryScene, canvas, width, height);

  // 3. 입력 매핑 초기화
  game.adapter.input.init(gameDefinition.inputMap);

  // 4. 렌더 파이프라인 설정
  const spawnedIds = new Set<string>();

  game.getLoop().onRender = () => {
    const scene = game.activeScene;
    if (!scene) return;

    const commands: DrawCommand[] = [];
    commands.push({ type: "CLEAR", color: "#87CEEB" });
    commands.push({ type: "CAMERA", x: width / 2, y: height / 2, zoom: 1 });

    // ... 오브젝트를 DrawCommand로 변환 (PlatformerGame.ts 참조)

    game.adapter.processDrawQueue(commands);
  };

  return game;
}
```

### 3.4. 씬 구현

각 씬은 `Scene` 클래스를 상속하고 라이프사이클 메서드를 오버라이드한다.

**라이프사이클**: `preload()` → `create(data?)` → `update(dt, collisions, input)` → `destroy()`

```typescript
// TitleScene — 메뉴 화면
export class TitleScene extends Scene {
  constructor() {
    super("title");
  }

  create(): void {
    this.game!.getState().set("screen", "title");
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);  // 반드시 super 호출
    if (input?.justPressed.has("jump")) {
      this.changeScene("play");
    }
  }
}
```

```typescript
// PlayScene — 핵심 게임플레이
export class PlayScene extends Scene {
  constructor() {
    super("play");
  }

  create(): void {
    // 게임 상태 초기화
    const state = this.game!.getState();
    state.set("score", 0);
    state.set("health", 3);

    // 오브젝트 배치
    this.addObject(createPlayer());
    this.addObject(createPlatform("ground", 0, 550, 800, 50));
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);  // Trait.update() 실행됨
    if (!input) return;

    // input 파라미터로 입력 처리 (절대 직접 poll하지 말 것!)
    const player = this.getObject("player");
    const movable = player?.getTrait<Movable>("movable");
    if (movable && input.active.has("move_left")) {
      movable.accelerate(-300 * dt, 0);
    }
  }
}
```

```typescript
// GameOverScene — 결과 화면
export class GameOverScene extends Scene {
  constructor() {
    super("gameover");
  }

  create(data?: Record<string, unknown>): void {
    this.game!.getState().set("won", data?.won ?? false);
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);
    if (input?.justPressed.has("jump")) {
      this.changeScene("title");
    }
  }
}
```

### 3.5. 오브젝트 팩토리 구현

오브젝트는 `create{ObjectName}` 팩토리 함수 패턴으로 만든다. Trait 조합으로 행동을 부여한다.

```typescript
// objects/Player.ts
import { GameObject } from "~/engine/GameObject";
import { Movable } from "~/traits/Movable";
import { Jumpable } from "~/traits/Jumpable";
import { Damageable } from "~/traits/Damageable";
import { Scorer } from "~/traits/Scorer";

export function createPlayer(id = "player"): GameObject {
  const player = new GameObject(id, "player");

  // Trait 조합으로 행동 부여
  player.addTrait(new Movable({ speed: 300, friction: 0.8, maxSpeed: 400 }));
  player.addTrait(new Jumpable({ jumpForce: -450, gravity: 800, groundY: 518 }));
  player.addTrait(new Damageable({ maxHP: 3 }));
  player.addTrait(new Scorer());

  // 초기 위치/비주얼 설정
  player.state.transform.x = 100;
  player.state.transform.y = 400;
  player.state.visual.assetKey = "player";
  player.state.visual.state = "idle";
  player.state.visual.visible = true;

  // 태그 (충돌 감지, 그룹 조회에 사용)
  player.addTag("player");
  player.layer = 10;  // 렌더 레이어

  return player;
}
```

---

## 4. 새 Trait 추가하기

Trait은 `GameObject`에 부착되는 재사용 가능한 행동 컴포넌트다.

### 4.1. 파일 생성

`traits/{TraitName}.ts`에 생성한다.

### 4.2. 구현 패턴

```typescript
import { Trait } from "~/engine/Trait";

interface MyTraitConfig {
  someValue?: number;
}

export class MyTrait extends Trait {
  readonly name = "myTrait";  // 고유 이름 (getTrait에서 사용)

  private config: Required<MyTraitConfig>;

  constructor(config: MyTraitConfig = {}) {
    super();
    this.config = {
      someValue: config.someValue ?? 100,
    };
  }

  // gameObject에 부착된 후 호출 (this.gameObject 접근 가능)
  init(): void {
    // 초기 설정
  }

  // 매 프레임 호출 (dt = 1/60초)
  update(dt: number): void {
    const go = this.gameObject;
    if (!go) return;
    // 로직 구현
  }

  // gameObject에서 분리될 때 호출
  destroy(): void {
    // 정리
  }
}
```

### 4.3. index.ts에 등록

```typescript
// traits/index.ts
export { MyTrait } from "./MyTrait";
```

### 4.4. 기존 Trait 참조

| Trait | 용도 | 주요 메서드 |
|-------|------|------------|
| `Movable` | 속도/가속/마찰 이동 | `setVelocity()`, `accelerate()` |
| `Jumpable` | 점프 + 중력 | `jump()` (Movable 의존) |
| `Damageable` | HP 관리 + 무적 | `hit()`, `heal()`, `isDead()` |
| `Scorer` | 점수 관리 | `addScore()`, `getScore()` |
| `Timer` | 카운트다운/업 | `start()`, `pause()`, `reset()`, `getFormattedTime()` |
| `Tappable` | 포인터 탭 감지 | 자동 감지 → `tapped` 이벤트 발행 |
| `Collidable` | 물리 바디 연동 | 자동 등록/업데이트/제거 |
| `Animated` | 스프라이트 상태 관리 | `setState()`, `getCurrentFrame()` |

---

## 5. 새 어댑터 추가하기

어댑터는 엔진과 렌더링/물리 백엔드를 연결하는 추상화 레이어다. 현재 4개 어댑터가 구현되어 있다: Canvas 2D, PixiJS v8, Three.js, Phaser 3. 상세 내용은 [04-adapter-pattern.md](04-adapter-pattern.md) 참조.

### 5.1. 디렉토리 생성

```
adapters/{engine}/
├── {Engine}Adapter.ts       # EngineAdapterInterface 구현
├── {Engine}Input.ts         # InputSubsystem 구현
├── {Engine}Physics.ts       # PhysicsSubsystem 구현
├── {Engine}Audio.ts         # AudioSubsystem 구현
├── {Engine}AssetFactory.ts  # AssetFactorySubsystem 구현
└── {Engine}Renderer.ts      # 렌더러 (선택)
```

### 5.2. EngineAdapterInterface 구현

```typescript
import type {
  DrawCommand,
  EngineAdapterConfig,
  EngineAdapterInterface,
} from "~/engine/types";

export class MyAdapter implements EngineAdapterInterface {
  readonly input: MyInput;
  readonly physics: MyPhysics;
  readonly audio: MyAudio;
  readonly assetFactory: MyAssetFactory;

  init(config: EngineAdapterConfig): void {
    // canvas, width, height로 초기화
  }

  destroy(): void {
    // 모든 리소스 해제
  }

  requestFrame(callback: (timestamp: number) => void): void {
    // requestAnimationFrame 또는 해당 엔진의 프레임 요청
  }

  cancelFrame(): void {
    // 프레임 요청 취소
  }

  processDrawQueue(commands: DrawCommand[]): void {
    // DrawCommand 배열을 해석하여 렌더링 수행
    // CLEAR, SPAWN, DESTROY, MOVE, ROTATE, SCALE, STATE,
    // FLIP, OPACITY, VISIBLE, UI, CAMERA, SFX, BGM 처리
  }
}
```

### 5.3. 4개 서브시스템

**InputSubsystem**:
- `init(inputMap)`: 액션 이름 → 키 매핑 설정
- `poll()`: `InputState` 반환 (active, justPressed, justReleased, pointer)
- `destroy()`: 이벤트 리스너 정리

**PhysicsSubsystem**:
- `init(config)`: 중력 설정
- `addBody(objectId, options)`: 물리 바디 추가
- `removeBody(objectId)`: 물리 바디 제거
- `step(dt)`: 물리 시뮬레이션 진행
- `getCollisions()`: 현재 프레임 충돌 목록 반환

**AudioSubsystem**:
- `play(soundId, options?)`: 효과음 재생
- `playBGM(soundId, options?)`: 배경음 재생
- `stopBGM()`: 배경음 정지
- `stopAll()`: 모든 소리 정지

**AssetFactorySubsystem**:
- `createTexture(desc)`: 텍스처 생성
- `createStateMap(desc)`: 상태 맵 생성
- `createAudio(desc)`: 오디오 에셋 생성
- `createAtlas(desc)`: 아틀라스 생성

---

## 6. 절대 주의사항 (Known Gotchas)

### 입력 더블폴링 버그 (commit `01ea4e1`에서 수정됨)

이 버그는 수정되었지만, 같은 실수를 반복하지 않도록 반드시 이해해야 한다.

**문제**: `Scene.update()`에서 `adapter.input.poll()`을 직접 호출하면 `justPressed`가 소실된다.

**원인**: `poll()`이 호출될 때마다 `justPressed`와 `justReleased` 세트가 초기화된다. `Game.ts`의 `onUpdate` 콜백에서 이미 한 번 `poll()`하므로, 씬에서 다시 호출하면 빈 세트를 받게 된다.

**올바른 방법**: `Scene.update(dt, collisions, input)`의 세 번째 파라미터 `input`을 사용한다.

```typescript
// Game.ts에서의 흐름:
this.loop.onUpdate = (dt) => {
  const input = this.adapter.input.poll();  // ← 여기서 한 번만 poll
  this.adapter.physics.step(dt);
  const collisions = this.adapter.physics.getCollisions();
  this._activeScene?.update(dt, collisions, input);  // ← input을 파라미터로 전달
};
```

```typescript
// 틀린 예 (절대 하지 말 것)
update(dt: number, collisions: Collision[], input?: InputState): void {
  const myInput = this.game!.adapter.input.poll();  // justPressed가 이미 비어있음!
}

// 올바른 예
update(dt: number, collisions: Collision[], input?: InputState): void {
  if (input?.justPressed.has("jump")) { ... }  // 파라미터 사용
}
```

### 엔진 코드 양쪽 동기화

`msw-engine`의 엔진 코드를 수정하면, `msw-react-router-spa`에도 동일한 변경을 반영해야 한다. 두 보일러플레이트의 엔진 코드는 독립 사본이므로 자동 동기화되지 않는다.

동기화 대상 디렉토리:

| msw-engine | msw-react-router-spa |
|---|---|
| `src/engine/` | `app/engine/` |
| `src/adapters/` | `app/adapters/` |
| `src/traits/` | `app/traits/` |
| `src/render/` | `app/render/` |
| `src/memory/` | `app/memory/` |
| `src/resources/` | `app/resources/` |
| `src/templates/` | `app/templates/` |

### 게임 루프와 React 렌더의 분리

- 게임 루프: 60FPS 고정 시간 스텝 (`GameLoop.ts`)
- React UI 폴링: 100ms 간격 (10Hz) (`GameCanvas.tsx`의 `setInterval(updateUI, 100)`)
- 게임 상태 → UI 반영은 `GameState`를 통해 간접적으로 전달된다
- Canvas 렌더링과 React DOM 렌더링은 완전히 독립적이다

### super.update() 호출 필수

`Scene.update()`를 오버라이드할 때 반드시 `super.update(dt, collisions, input)`를 호출해야 한다. `super.update()`가 모든 오브젝트의 `Trait.update()`를 실행하고, 충돌 이벤트를 EventBus에 전파한다.

---

## 7. 현재 구현 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| Canvas 2D 어댑터 | 완료 | 렌더링, AABB 물리, Web Audio, 키보드 입력 |
| PixiJS v8 어댑터 | 완료 | WebGL/WebGPU 렌더링, 서브시스템은 Canvas 재사용 |
| Three.js 어댑터 | 완료 | OrthographicCamera 기반 2D 렌더링 |
| Phaser 3 어댑터 | 완료 | Phaser Game 인스턴스 래핑, 비동기 Scene 초기화 |
| 8개 기본 Trait | 완료 | Movable, Jumpable, Damageable, Scorer, Timer, Tappable, Collidable, Animated |
| 플랫포머 템플릿 | 완료 | 3개 씬, 4종 오브젝트, AABB 충돌, 스톰프, 넉백 |
| 프로그래매틱 스프라이트 | 완료 | SpriteFactory (OffscreenCanvas → ImageBitmap), 런타임 생성 |
| Resource Pipeline 토글 | 완료 | "programmatic" / "file" 런타임 전환, localStorage 지속 |
| React Router 통합 | 완료 | SPA 배포용 (`/play` 라우트) |
| 메모리 최적화 | 완료 | TransformBuffer (Float32Array), ObjectPool, EventPool |
| 렌더 파이프라인 | 완료 | DrawCommand, 좌상단→중심점 좌표 변환, 무적 깜빡임/데미지 플래시/스톰프 파티클 |
| game.json 스키마 | 완료 | 타입 정의 존재 (`GameDefinitionData`) |
| 어댑터 런타임 전환 | 완료 | UI 토글로 4개 어댑터 간 전환, localStorage 지속 |
| 파일 기반 에셋 | 부분 | 디스크립터/폴백 구현됨, 실제 PNG 파일은 미생성 (exportSpritePNGs 유틸리티 존재) |
| 추가 템플릿 | 미구현 | 클리커, 퍼즐 등 |
| 멀티플레이 | 미구현 | 설계 문서만 존재 |
| CI/CD | 미포함 | CLAUDE.md: "안정화 후 추가" |

---

## 8. 로드맵

### Phase 1: 엔진 안정화 — 완료 ✓

- ~~기존 코드 버그 수정 및 안정화~~ (더블폴링, 좌표 변환, 점프 물리 수정)
- 추가 게임 템플릿 (클리커, 퍼즐 등) — 미시작
- CI 파이프라인 추가 (degit 시뮬레이션 빌드 검증) — 미시작
- 테스트 프레임워크 도입 — 미시작

### Phase 2: 어댑터 확장 — 완료 ✓

- ~~PixiJS v8 어댑터 (WebGL/WebGPU 렌더링)~~ — 완료
- ~~Three.js 어댑터 (OrthographicCamera 2D)~~ — 완료
- ~~Phaser 3 어댑터 (게임 프레임워크 래핑)~~ — 완료
- ~~Resource Pipeline (programmatic + file 듀얼 모드)~~ — 완료
- 파일 기반 PNG 에셋 생성 (exportSpritePNGs 실행) — 미완료

### Phase 3: 고도화 (다음)

- 추가 게임 템플릿 (클리커, 퍼즐)
- CI 파이프라인 추가
- 테스트 프레임워크 도입
- 멀티플레이 (SyncAdapter 설계, 턴제 → 실시간)

---

## 9. CI/CD 현황

현재 game 보일러플레이트는 CI 파이프라인에 포함되어 있지 않다.

> "Game boilerplates: Not yet in CI pipelines -- add when stabilized" — CLAUDE.md

CI 추가 시 다른 보일러플레이트와 동일한 패턴을 따른다:
1. `degit` 시뮬레이션 (temp 디렉토리에 복사)
2. `pnpm install`
3. `pnpm build` + `pnpm typecheck`

Node.js 22, pnpm via corepack 환경에서 실행한다.
