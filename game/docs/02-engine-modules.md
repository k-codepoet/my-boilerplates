# 엔진 코어 모듈

> `msw-engine/src/engine/` 디렉토리의 핵심 모듈들.

## Game.ts — 중앙 오케스트레이터

> 파일: `msw-engine/src/engine/Game.ts`

Game 클래스는 엔진의 진입점이자 모든 서브시스템을 연결하는 오케스트레이터다.

```typescript
class Game {
  readonly adapter: EngineAdapterInterface;  // 어댑터 (입력/물리/오디오/렌더)
  private _state: GameState;                 // 전역 상태
  private _events: EventBus;                 // 전역 이벤트
  private scenes: Map<string, Scene>;        // 등록된 씬들
  private _activeScene: Scene | null;        // 현재 활성 씬
  readonly loop: GameLoop;                   // 게임 루프
}
```

**주요 메서드:**

| 메서드 | 역할 |
|--------|------|
| `registerScene(name, scene)` | 씬 등록 + `scene.game = this` 연결 |
| `start(sceneName, canvas?, width?, height?)` | 어댑터 초기화 → 루프 콜백 연결 → 씬 전환 → 루프 시작 |
| `changeScene(name, data?)` | 현재 씬 destroy → 새 씬 preload → create |
| `stop()` | 루프 정지 → 씬 destroy → 어댑터 destroy |
| `worldState` (getter) | 현재 프레임의 전체 월드 스냅샷 반환 |

**start()의 핵심 — 루프 콜백 배선:**

```typescript
// Game.ts:69-75 — onUpdate 콜백
this.loop.onUpdate = (dt) => {
  const input = this.adapter.input.poll();   // ⚠️ 프레임당 1회만 poll
  this._lastInput = input;
  this.adapter.physics.step(dt);
  const collisions = this.adapter.physics.getCollisions();
  this._activeScene?.update(dt, collisions, input);
};
```

## GameLoop.ts — 고정 타임스텝 루프

> 파일: `msw-engine/src/engine/GameLoop.ts`

```
┌──────────────────────────────────────────────────────────────────┐
│  requestAnimationFrame(timestamp)                                │
│  │                                                               │
│  ├─ rawDelta = (timestamp - lastTimestamp) / 1000                │
│  ├─ delta = min(rawDelta, 0.25)  ← 250ms 캡 (죽음의 나선 방지)   │
│  ├─ accumulator += delta                                         │
│  │                                                               │
│  ├─ while (accumulator >= fixedDt && steps < maxFrameSkip):      │
│  │     onUpdate(fixedDt)           ← 고정 1/60초 간격            │
│  │     accumulator -= fixedDt                                    │
│  │     frameCount++                                              │
│  │     steps++                                                   │
│  │                                                               │
│  ├─ onRender()                     ← 매 프레임 1회 렌더링         │
│  ├─ FPS 계산 (1초마다)                                            │
│  └─ requestNextFrame()                                           │
└──────────────────────────────────────────────────────────────────┘
```

**핵심 설계 결정:**

- **고정 타임스텝**: `fixedDt = 1/60` (약 16.67ms). 물리 시뮬레이션의 결정성 보장
- **누적기 패턴 (Accumulator)**: 프레임 시간이 불균일해도 물리 업데이트는 항상 동일한 dt로 실행
- **최대 프레임 스킵**: `maxFrameSkip = 5`. 탭 전환 후 복귀 시 한꺼번에 수백 프레임 실행 방지
- **250ms 캡**: `Math.min(rawDelta, 0.25)`. 극단적 지연 시 "죽음의 나선(spiral of death)" 방지

## Scene.ts — GameObject 컨테이너

> 파일: `msw-engine/src/engine/Scene.ts`

Scene은 GameObject들의 컨테이너이자 라이프사이클 관리자다.

**라이프사이클:**

```
preload()  →  create(data?)  →  update(dt, collisions, input)  →  destroy()
   │              │                       │                           │
   │              │                       │                           │
 에셋 로딩     오브젝트 생성         매 프레임 실행              오브젝트 정리
 (async)      초기 상태 설정        충돌 이벤트 라우팅          이벤트버스 clear
```

**충돌 이벤트 라우팅 (Scene.ts:26-37):**

```typescript
update(dt: number, collisions: Collision[], _input?: InputState): void {
  // 1. 모든 활성 오브젝트 업데이트
  for (const obj of this.objects.values()) {
    if (obj.active) obj.update(dt);
  }
  // 2. 충돌을 이벤트로 변환하여 라우팅
  for (const collision of collisions) {
    this.eventBus.emit("collision", collision);
    this.eventBus.emit(`collision:${collision.a}`, collision);  // 개별 오브젝트에 라우팅
    this.eventBus.emit(`collision:${collision.b}`, collision);
  }
}
```

**씬 간 전환:**

```typescript
changeScene(name: string, data?: Record<string, unknown>): void {
  void this.game?.changeScene(name, data);
}
```

## GameObject.ts — Trait 조합 기반 엔티티

> 파일: `msw-engine/src/engine/GameObject.ts`

GameObject는 게임 내 모든 엔티티의 기본 클래스다. **상속 대신 조합(Composition over Inheritance)** 패턴을 사용한다.

```typescript
class GameObject {
  readonly state: ObjectState;           // id, type, active, transform, visual, traits, tags
  scene: Scene | null;                   // 소속 씬
  private _traits: Map<string, Trait>;   // 행위 조합
  children: GameObject[];                // 자식 오브젝트
  layer: number;                         // 렌더링 레이어 (정렬 기준)
  private transformIndex: number;        // TransformBuffer 인덱스 (메모리 최적화)
}
```

**ObjectState 구조:**

```typescript
interface ObjectState {
  id: string;                              // 고유 식별자
  type: string;                            // 오브젝트 유형 ("player", "enemy", ...)
  active: boolean;                         // 활성화 여부
  transform: Transform;                   // { x, y, rotation, scale: { x, y } }
  visual: VisualState;                     // { assetKey, state, flipX, visible, opacity }
  traits: Record<string, unknown>;         // Trait별 상태 데이터
  tags: string[];                          // 태그 (검색/필터용)
}
```

**TransformBuffer 연동 (메모리 최적화):**

GameObject 생성 시 `Transform`의 `x`, `y`, `rotation`, `scale.x`, `scale.y`는 JavaScript 객체가 아니라 공유 `Float32Array`에 직접 읽기/쓰기하는 Proxy로 구현된다. 상세 내용은 [05-memory-optimization.md](05-memory-optimization.md) 참조.

**이벤트 시스템 (로컬 + 씬):**

```typescript
// 로컬 이벤트 (해당 오브젝트에만)
obj.on("hit", (data) => { ... });
obj.emit("hit", { damage: 10 });

// 씬 이벤트버스로도 전파 (네임스페이스 형태)
// → scene.eventBus에 "player:hit" 이벤트 발행
```

## Trait.ts — 행위 추상 기반 클래스

> 파일: `msw-engine/src/engine/Trait.ts`

```typescript
abstract class Trait {
  abstract readonly name: string;            // 고유 이름 (Map 키로 사용)
  gameObject: GameObject | null = null;      // 소속 GameObject (attach 시 설정)

  abstract update(dt: number): void;         // 매 프레임 호출

  attach(gameObject: GameObject): void {     // GameObject에 부착
    this.gameObject = gameObject;
    this.init();
  }

  detach(): void {                           // GameObject에서 분리
    this.destroy();
    this.gameObject = null;
  }

  init(): void { }      // 초기화 (오버라이드 가능)
  destroy(): void { }   // 정리 (오버라이드 가능)
}
```

**라이프사이클:**

```
addTrait(trait)  →  attach(gameObject)  →  init()  →  update(dt) ...  →  detach()  →  destroy()
```

구체적인 Trait 구현들은 [03-trait-system.md](03-trait-system.md) 참조.

## GameState.ts — 중앙 상태 관리

> 파일: `msw-engine/src/engine/GameState.ts`

게임 전역 상태를 관리하는 옵저버블 Map. `score`, `health`, `screen` 같은 게임 레벨 데이터를 저장한다.

```typescript
class GameState {
  get<T>(key: string): T | undefined;                        // 값 조회
  set(key: string, value: unknown): void;                    // 값 설정 + 구독자 알림
  subscribe(key: string, callback): () => void;              // 특정 키 구독
  subscribeAll(callback: (key, value) => void): () => void;  // 모든 변경 구독
  snapshot(): Record<string, unknown>;                       // 전체 스냅샷
  restore(data: Record<string, unknown>): void;              // 스냅샷 복원
}
```

**사용 예시:**

```typescript
// PlayScene에서 초기화
state.set("score", 0);
state.set("health", 3);

// Damageable trait에서 업데이트
state.set("health", this.hp);

// React UI에서 폴링 (GameCanvas.tsx)
const score = state.get<number>("score") ?? 0;
```

## EventBus.ts — 이벤트 시스템

> 파일: `msw-engine/src/engine/EventBus.ts`

**두 가지 EventBus:**

| 위치 | 인스턴스 | 용도 |
|------|----------|------|
| `Game._events` | 글로벌 | 게임 전체 이벤트 (`coinCollected`, `damaged`, `death`, `scoreChanged`) |
| `Scene.eventBus` | 씬 로컬 | 충돌 이벤트 (`collision`, `collision:{objectId}`) |

```typescript
class EventBus {
  on(event, callback): () => void;    // 구독 (unsubscribe 함수 반환)
  off(event, callback): void;         // 구독 해제
  emit(event, data?): void;           // 이벤트 발행
  once(event, callback): () => void;  // 1회성 구독
  clear(): void;                      // 전체 정리
}
```

## GameRule.ts — 승리/패배 조건 평가

> 파일: `msw-engine/src/engine/GameRule.ts`

game.json의 `rules` 정의를 기반으로 승리/패배 조건을 평가하는 유틸리티 함수다.

```typescript
evaluateRule(rule: RuleExpression, state: GameState): boolean
checkWin(rules: GameRules, state: GameState): boolean
checkLose(rules: GameRules, state: GameState): boolean
```

**RuleExpression 구조:**

```typescript
interface RuleExpression {
  field: string;                                     // GameState 키
  operator: "eq" | "gt" | "lt" | "gte" | "lte";     // 비교 연산자
  value: number | string | boolean;                  // 비교 값
}
```

## 입력 시스템

### 단일 폴링 아키텍처

> **CRITICAL: 프레임당 반드시 1회만 poll() 호출**

```
⚠️ 절대 규칙: input.poll()은 Game.ts의 onUpdate 콜백에서 딱 1회만 호출한다.
Scene이나 Trait에서 직접 poll()하면 안 된다.
```

**이유:**

`poll()`은 호출 시 `keysJustPressed`와 `keysJustReleased`를 **즉시 초기화**한다 (CanvasInput.ts:84-85). 따라서 두 번 poll하면 두 번째 호출에서는 `justPressed`가 빈 Set이 되어 입력이 손실된다.

```
┌─ Game.ts:70 ─────────────────────────────────────────────┐
│ const input = this.adapter.input.poll();   // ← 유일한 poll│
│ this._lastInput = input;                                  │
│ ...                                                       │
│ this._activeScene?.update(dt, collisions, input);         │
│                                          ↑ input 전달     │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─ PlayScene.update() ─────────────────────────────────────┐
│ // input을 파라미터로 받아서 사용                           │
│ if (input.justPressed.has("jump")) {                      │
│   jumpable.jump();       // ← poll 없이 전달받은 input 사용│
│ }                                                         │
└──────────────────────────────────────────────────────────┘
```

### 더블 폴링 버그 히스토리

> 커밋: `01ea4e1` — "fix(game): fix double-poll input bug, improve platformer gameplay"

과거에 Scene.update()에서도 별도로 `poll()`을 호출하여 `justPressed` 이벤트가 소실되는 버그가 있었다. 수정 후 input은 Game에서 한 번만 poll하고, Scene으로는 파라미터로 전달하는 구조로 변경되었다.

### InputState 구조

```typescript
interface InputState {
  active: Set<string>;         // 현재 눌려있는 액션 (예: "move_left")
  justPressed: Set<string>;    // 이 프레임에 새로 눌린 액션 (예: "jump")
  justReleased: Set<string>;   // 이 프레임에 뗀 액션
  pointer: Vector2;            // 포인터 위치 { x, y }
}
```

### game.json inputMap 액션 매핑

```json
{
  "inputMap": {
    "move_left":  ["ArrowLeft", "KeyA"],
    "move_right": ["ArrowRight", "KeyD"],
    "jump":       ["ArrowUp", "KeyW", "Space"]
  }
}
```

키 코드(`KeyboardEvent.code`)를 게임 액션 이름으로 매핑한다. 하나의 액션에 여러 키를 바인딩할 수 있다.

## 렌더 파이프라인

### DrawCommand 패턴

> 파일: `msw-engine/src/render/DrawCommand.ts`, `msw-engine/src/engine/types.ts:135-157`

렌더링은 **명령형 커맨드 큐** 패턴으로 동작한다. 게임 로직이 직접 Canvas를 조작하지 않고, DrawCommand 배열을 생성하면 어댑터가 이를 처리한다.

**커맨드 타입:**

| 커맨드 | 용도 | 파라미터 |
|--------|------|----------|
| `CLEAR` | 화면 초기화 | color |
| `SPAWN` | 스프라이트 생성 | id, assetKey, assetState, x, y, layer |
| `DESTROY` | 스프라이트 제거 | id |
| `MOVE` | 위치 이동 | id, x, y |
| `ROTATE` | 회전 | id, rotation |
| `SCALE` | 크기 변경 | id, scaleX, scaleY |
| `STATE` | 애니메이션 상태 전환 | id, assetState |
| `FLIP` | 좌우 반전 | id, flipX |
| `OPACITY` | 투명도 | id, opacity |
| `VISIBLE` | 표시/숨김 | id, visible |
| `CAMERA` | 카메라 이동/줌 | x, y, zoom |
| `UI` | UI 요소 업데이트 | id, props |
| `SFX` | 효과음 재생 | soundId, volume |
| `BGM` | 배경음악 재생/정지 | soundId, action |

**팩토리 함수 (DrawCommand.ts):**

```typescript
clearCmd(color)
spawnCmd(id, assetKey, assetState, x, y, layer)
moveCmd(id, x, y)
flipCmd(id, flipX)
// ... 등
```

**CommandPool — 제로 할당:**

```typescript
class CommandPool {
  reset(): void;                  // 프레임 시작 시 리셋 (length = 0)
  push(cmd: DrawCommand): void;   // 기존 배열 슬롯 재사용
  toArray(): DrawCommand[];        // slice(0, length) 반환
}
```

## 게임 정의 (game.json)

### 전체 스키마

> 타입: `msw-engine/src/engine/types.ts:334-352` (`GameDefinitionData`)

```typescript
interface GameDefinitionData {
  id: string;                    // 게임 고유 ID
  version: string;               // 버전
  meta: GameMeta;                // 메타 정보
  assets: Record<string, GameAssetRef>;    // 에셋 참조
  scenes: Record<string, SceneDefinition>; // 씬 정의
  entryScene: string;            // 시작 씬
  settings: {
    physics: { gravity: Vector2 };
    audio: { masterVolume: number };
  };
  inputMap: InputMap;            // 입력 매핑
  rules: GameRules;              // 승리/패배/점수 규칙
  stack: {
    adapter: "canvas" | "phaser" | "pixi";
    resourcePipeline: "lite" | "full";
    physics: null | "arcade" | "matter";
  };
}
```

### 각 섹션 설명

**meta — 게임 메타 정보:**

```typescript
interface GameMeta {
  title: string;                              // 게임 제목
  description: string;                        // 설명
  thumbnail: string;                          // 썸네일 URL
  orientation: "landscape" | "portrait";      // 화면 방향
  resolution: { width: number; height: number }; // 해상도
}
```

**assets — 에셋 참조:**

```typescript
interface GameAssetRef {
  resourceId: string;     // 리소스 ID
  states: string[];       // 사용하는 상태 목록 (예: ["idle", "walk", "jump"])
  preload: boolean;       // 미리 로딩 여부
}
```

**scenes — 씬 정의:**

```typescript
interface SceneDefinition {
  name: string;
  type: "menu" | "gameplay" | "result" | "cutscene";
  requiredAssets: string[];                        // 필요한 에셋 목록
  objects: Record<string, ObjectDefinition>;       // 오브젝트 정의
  transitions: Record<string, SceneTransition>;    // 전환 규칙
  camera: { bounds: Bounds; follow?: string; };    // 카메라 설정
  ui: UIDefinition[];                              // UI 요소
}
```

**rules — 승리/패배 조건:**

```typescript
interface GameRules {
  winCondition: RuleExpression;   // { field: "score", operator: "gte", value: 100 }
  loseCondition: RuleExpression;  // { field: "health", operator: "lte", value: 0 }
  scoring: ScoringRule;           // { field: "score", displayName: "Score" }
}
```

**stack — 기술 스택 선택:**

```typescript
stack: {
  adapter: "canvas" | "phaser" | "pixi";           // 렌더링 어댑터
  resourcePipeline: "lite" | "full";                // 리소스 파이프라인 (lite: 색상 사각형)
  physics: null | "arcade" | "matter";              // 물리 엔진 (null: 내장 AABB)
}
```

### 플랫포머 game.json 예시

```json
{
  "id": "platformer-demo",
  "version": "1.0.0",
  "meta": {
    "title": "Platformer Demo",
    "description": "A simple 2D platformer demo built with MSW Engine",
    "orientation": "landscape",
    "resolution": { "width": 800, "height": 600 }
  },
  "entryScene": "title",
  "inputMap": {
    "move_left": ["ArrowLeft", "KeyA"],
    "move_right": ["ArrowRight", "KeyD"],
    "jump": ["ArrowUp", "KeyW", "Space"]
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

## 템플릿 시스템

### 스택 타입

| 스택 | adapter | resourcePipeline | physics | 용도 |
|------|---------|------------------|---------|------|
| **Lite** | canvas | lite | null | 색상 사각형, 프로토타이핑 |
| **Standard** | canvas | full | null | 스프라이트, 내장 AABB |
| **Physics** | canvas | full | arcade | 스프라이트 + 아케이드 물리 |
| **Heavy** | phaser/pixi | full | matter | 고급 렌더링 + Matter.js 물리 |

4개 어댑터(Canvas, PixiJS, Three.js, Phaser)가 모두 구현되어 런타임 전환이 가능하다. Resource Pipeline도 programmatic/file 듀얼 모드를 지원한다.

### 플랫포머 템플릿 구현 상세

> 파일: `msw-engine/src/templates/platformer/`

```
templates/platformer/
├── PlatformerGame.ts          # 게임 초기화 + 렌더 파이프라인 배선
├── game.json                  # 게임 정의
├── scenes/
│   ├── TitleScene.ts          # 타이틀 메뉴
│   ├── PlayScene.ts           # 게임 플레이
│   └── GameOverScene.ts       # 결과 화면
└── objects/
    ├── Player.ts              # 플레이어 (Movable+Jumpable+Damageable+Scorer)
    ├── Platform.ts            # 플랫폼 (정적 오브젝트)
    ├── Coin.ts                # 코인 (수집 아이템)
    └── Enemy.ts               # 적 (순찰)
```

**PlatformerGame.ts — 초기화 흐름:**

```typescript
export async function createPlatformerGame(
  canvas, width, height,
  adapterType: "canvas" | "pixi" | "three" | "phaser" = "canvas",
  resourceMode: "programmatic" | "file" = "programmatic",
): Promise<Game> {
  // 1. 어댑터 생성 (런타임 선택)
  const adapter = await createAdapter(adapterType, canvas, width, height);

  // 2. 리소스 파이프라인 (programmatic: OffscreenCanvas → ImageBitmap, file: PNG 로딩)
  const registry = getAdapterRegistry(adapter);
  if (resourceMode === "file") {
    // 파일 기반 로딩 시도, 실패하면 프로그래매틱 폴백
    try { await loadFileAssets(registry, adapter); }
    catch { await registerProgrammaticAssets(registry); }
  } else {
    await registerProgrammaticAssets(registry);
  }

  const game = new Game(adapter);

  // 3. 씬 등록 + 시작
  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());
  await game.start(gameDefinition.entryScene);
  game.adapter.input.init(gameDefinition.inputMap);

  // 4. 렌더 파이프라인 (좌표 변환 + 이펙트)
  game.getLoop().onRender = () => {
    // getRenderTransform()으로 좌상단→중심점 변환
    // 무적 깜빡임, 데미지 플래시, 스톰프 파티클 포함
  };

  return game;
}
```

**PlayScene — 게임 플레이:**

```
create()
  ├─ 전역 상태 초기화: score=0, health=3, screen="play"
  ├─ 플레이어 생성 (100, 400)
  ├─ 바닥 플랫폼 (0, 550, 800x50)
  ├─ 플로팅 플랫폼 5개
  ├─ 코인 5개
  └─ 적 1개 (400, 526)

update(dt, collisions, input)
  ├─ super.update() — 모든 오브젝트 Trait 업데이트 + 충돌 이벤트
  ├─ 플레이어 이동: input.active → Movable.accelerate()
  ├─ 점프: input.justPressed("jump") → Jumpable.jump()
  ├─ 적 순찰: min/max X 범위 왕복
  ├─ 코인 충돌: 거리 < 24px → 비활성화 + Scorer.addScore(20)
  ├─ 적 충돌: 거리 < 28px → Damageable.hit(1)
  └─ 승리/패배: score >= 100 → gameover(won), health <= 0 → gameover(lost)
```

## 데이터 흐름 다이어그램

### 전체 프레임 처리 흐름

```
requestAnimationFrame(timestamp)
│
├─ 첫 프레임? → lastTimestamp 설정 → 다음 프레임 요청 → 종료
│
├─ rawDelta = (timestamp - lastTimestamp) / 1000
├─ delta = min(rawDelta, 0.25)            ← 죽음의 나선 방지
├─ accumulator += delta
│
├─ while (accumulator >= 1/60 && steps < 5):
│   │
│   ├─ [입력]  input = adapter.input.poll()       ← 프레임당 1회
│   │           → active, justPressed, justReleased, pointer
│   │
│   ├─ [물리]  adapter.physics.step(dt)
│   │           → dynamic 바디에 중력 적용
│   │           → AABB 충돌 감지
│   │
│   ├─ [충돌]  collisions = adapter.physics.getCollisions()
│   │
│   ├─ [씬]   activeScene.update(dt, collisions, input)
│   │   │
│   │   ├─ 모든 활성 GameObject.update(dt)
│   │   │   └─ 각 Trait.update(dt)
│   │   │       ├─ Movable: 마찰 → 속도 제한 → 위치 갱신
│   │   │       ├─ Jumpable: 중력 적용 → 착지 감지
│   │   │       ├─ Damageable: 무적 시간 감소
│   │   │       ├─ Animated: 프레임 타이머 갱신
│   │   │       └─ ...
│   │   │
│   │   ├─ 충돌 이벤트 라우팅
│   │   │   → eventBus.emit("collision:player", ...)
│   │   │
│   │   └─ 게임 로직 (PlayScene)
│   │       ├─ 플레이어 이동/점프 (input 기반)
│   │       ├─ 적 순찰
│   │       ├─ 코인 수집 (거리 기반)
│   │       └─ 승리/패배 판정
│   │
│   ├─ accumulator -= 1/60
│   └─ frameCount++
│
├─ [렌더]  onRender()
│   │
│   ├─ DrawCommand 배열 생성
│   │   ├─ CLEAR: 배경색
│   │   ├─ CAMERA: 카메라 위치
│   │   ├─ SPAWN/MOVE/FLIP/DESTROY: 오브젝트별
│   │   └─ SFX/BGM: 사운드 (있을 경우)
│   │
│   └─ adapter.processDrawQueue(commands)
│       ├─ renderer.processDrawQueue(commands)  ← 스프라이트 상태 업데이트
│       └─ renderer.render(dt)                  ← Canvas 2D 그리기
│           ├─ 배경 채우기
│           ├─ 카메라 변환
│           ├─ 스프라이트 layer 정렬
│           ├─ 각 스프라이트: translate → rotate → scale → drawImage
│           └─ 카메라 복원
│
├─ FPS 계산 (1초마다)
└─ requestNextFrame()
```

## 부록: 디렉토리 구조 전체

```
msw-engine/src/
├── engine/                    # 핵심 엔진
│   ├── Game.ts                # 중앙 오케스트레이터
│   ├── GameLoop.ts            # 고정 타임스텝 루프
│   ├── Scene.ts               # 씬 (오브젝트 컨테이너)
│   ├── GameObject.ts          # 게임 오브젝트 (Trait 조합)
│   ├── Trait.ts               # 행위 추상 클래스
│   ├── GameState.ts           # 전역 상태 (옵저버블)
│   ├── EventBus.ts            # 이벤트 시스템
│   ├── GameRule.ts            # 승리/패배 조건 평가
│   └── types.ts               # 모든 공유 타입/인터페이스
│
├── traits/                    # 재사용 가능한 행위
│   ├── Movable.ts             # 이동 (속도/마찰/가속)
│   ├── Jumpable.ts            # 점프 + 중력
│   ├── Animated.ts            # 스프라이트 애니메이션
│   ├── Collidable.ts          # 물리 바디 연동
│   ├── Damageable.ts          # HP/피격/무적/사망
│   ├── Scorer.ts              # 점수 관리
│   ├── Tappable.ts            # 포인터 탭 감지
│   ├── Timer.ts               # 카운트다운/업 타이머
│   └── index.ts               # 배럴 export
│
├── adapters/                  # 어댑터 구현 (4종)
│   ├── canvas/                # Canvas 2D (기본)
│   │   ├── CanvasAdapter.ts   # 통합 어댑터
│   │   ├── CanvasInput.ts     # 키보드/포인터 입력
│   │   ├── CanvasPhysics.ts   # AABB 충돌 감지
│   │   ├── CanvasRenderer.ts  # Canvas 2D 렌더링
│   │   ├── CanvasAudio.ts     # Web Audio API
│   │   └── CanvasAssetFactory.ts # 에셋 로딩
│   ├── pixi/                  # PixiJS v8 (WebGL/WebGPU)
│   │   ├── PixiAdapter.ts     # 비동기 초기화
│   │   └── PixiRenderer.ts    # PixiJS 렌더러
│   ├── three/                 # Three.js (OrthographicCamera 2D)
│   │   ├── ThreeAdapter.ts
│   │   └── ThreeRenderer.ts
│   └── phaser/                # Phaser 3 (게임 프레임워크 래핑)
│       ├── PhaserAdapter.ts   # 비동기 Scene 초기화
│       └── PhaserRenderer.ts
│
├── render/                    # 렌더링 유틸
│   └── DrawCommand.ts         # DrawCommand 팩토리 + CommandPool
│
├── memory/                    # 메모리 최적화
│   ├── TransformBuffer.ts     # Float32Array 풀링
│   ├── ObjectPool.ts          # 범용 오브젝트 풀
│   └── EventPool.ts           # 이벤트 오브젝트 풀
│
├── ui/                        # React UI
│   ├── GameCanvas.tsx         # 메인 게임 컴포넌트
│   ├── HUD.tsx                # 점수/체력 표시
│   └── DebugOverlay.tsx       # FPS/디버그 정보
│
└── templates/                 # 게임 템플릿
    └── platformer/
        ├── PlatformerGame.ts  # 게임 초기화 + 어댑터 선택 + 리소스 파이프라인
        ├── game.json          # 게임 정의
        ├── scenes/
        │   ├── TitleScene.ts
        │   ├── PlayScene.ts
        │   └── GameOverScene.ts
        ├── objects/
        │   ├── Player.ts
        │   ├── Platform.ts
        │   ├── Coin.ts
        │   └── Enemy.ts
        └── sprites/           # 스프라이트 리소스 파이프라인
            ├── SpriteFactory.ts
            ├── registerProgrammaticAssets.ts
            ├── assetDescriptors.ts
            └── exportSpritePNGs.ts
```
