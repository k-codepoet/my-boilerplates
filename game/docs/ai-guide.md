# AI-GUIDE.md — AI 게임 생성 프로토콜

> 이 문서는 AI(Claude Code 등)가 MSW 프레임워크를 사용해 게임을 생성할 때 따라야 할 프로토콜이다.
> **이 문서만 읽고 바로 게임을 만들 수 있어야 한다.**

---

## 1. AI의 역할 범위

### AI가 작성하는 것 (매 게임마다 새로 생성)

```
templates/{genre}/
├── game.json          ← 게임 정의 (메타, 에셋, 씬, 인풋맵, 규칙)
├── {Genre}Game.ts     ← 게임 초기화 + 렌더 파이프라인
├── scenes/            ← 화면 흐름 (씬 단위)
│   ├── TitleScene.ts
│   ├── PlayScene.ts
│   └── GameOverScene.ts
└── objects/           ← 게임 오브젝트 (팩토리 함수)
    ├── Player.ts
    ├── Enemy.ts
    └── ...
```

### AI가 건드리지 않는 것 (프레임워크 레이어)

```
engine/     ← Game, GameLoop, Scene, GameObject, Trait, GameState, EventBus
adapters/   ← CanvasAdapter 및 서브시스템 (Input, Physics, Audio, AssetFactory)
traits/     ← 공용 Trait 라이브러리 (Movable, Jumpable, Damageable 등)
render/     ← RenderState, DrawCommand 타입
resources/  ← AssetRegistry, GameDefinition
memory/     ← TransformBuffer, Pool
ui/         ← GameCanvas, HUD, DebugOverlay (React 컴포넌트)
```

> 새로운 Trait이 필요하면 `templates/{genre}/traits/` 안에 로컬로 생성한다. 공용 `traits/` 디렉토리는 수정하지 않는다.

---

## 2. 게임 생성 프로토콜 (Step-by-Step)

### Step 1: 요청 분석 → 장르 판단

사용자 입력(텍스트, 이미지, 레퍼런스 게임 등)을 분석하여 장르를 결정한다.

| 키워드 예시 | 장르 |
|------------|------|
| "클릭 게임", "탭 게임" | 클리커 |
| "퀴즈", "OX" | 퀴즈 |
| "퍼즐", "2048", "테트리스" | 퍼즐 |
| "보드 게임", "체스", "오목" | 보드 |
| "플랫포머", "마리오", "점프" | 플랫포머 |
| "슈팅", "총", "탄막" | 슈팅 |
| "뱀서라이크", "서바이벌" | 뱀서라이크 |
| "타워 디펜스", "TD" | 타워 디펜스 |
| "RPG", "던전" | RPG |

### Step 2: 스택 선택

장르에 따라 스택이 자동으로 결정된다. `game.json`의 `stack` 필드에 반영한다.

| 스택 | adapter | physics | resourcePipeline | 적합 장르 | 핵심 Trait |
|------|---------|---------|------------------|----------|-----------|
| **Lite** | `canvas` | `null` | `lite` | 클리커, 퀴즈 | Tappable, Timer, Scorer |
| **Standard** | `canvas` | `null` | `lite` | 퍼즐, 보드, RPG | 커스텀 Trait 위주 |
| **Physics** | `canvas` | `arcade` | `lite` | 플랫포머, 슈팅 | Movable, Jumpable, Damageable, Collidable |
| **Heavy** | `phaser`/`pixi` | `arcade` | `full` | 뱀서라이크, TD | Movable, Damageable, Scorer, Timer |

### Step 3: game.json 작성

`game.json`은 `GameDefinitionData` 타입을 따른다. 전체 스키마는 다음과 같다:

```typescript
interface GameDefinitionData {
  id: string;                          // 게임 고유 ID (예: "platformer-demo")
  version: string;                     // 버전 (예: "1.0.0")
  meta: {
    title: string;                     // 게임 제목
    description: string;               // 설명
    thumbnail: string;                 // 썸네일 경로
    orientation: "landscape" | "portrait";  // 화면 방향
    resolution: { width: number; height: number };  // 해상도
  };
  assets: Record<string, {            // 에셋 목록
    resourceId: string;                // 리소스 ID
    states: string[];                  // 가능한 상태 목록
    preload: boolean;                  // 프리로드 여부
  }>;
  scenes: Record<string, {            // 씬 정의
    name: string;
    type: "menu" | "gameplay" | "result" | "cutscene";
    requiredAssets: string[];          // 이 씬에 필요한 에셋 키
    objects: Record<string, ObjectDefinition>;  // 선언적 오브젝트 (현재는 코드에서 생성)
    transitions: Record<string, {     // 씬 전환 정의
      target: string;
      data?: Record<string, unknown>;
    }>;
    camera: {
      bounds: { x: number; y: number; width: number; height: number };
      follow?: string;                // 카메라가 따라갈 오브젝트 ID
    };
    ui: Array<{                       // UI 요소 정의
      id: string;
      type: "text" | "bar" | "image";
      props: Record<string, unknown>;
      position: { x: number; y: number };
    }>;
  }>;
  entryScene: string;                  // 시작 씬 이름
  inputMap: Record<string, string[]>;  // 액션명 → 키 배열 매핑
  settings: {
    physics: { gravity: { x: number; y: number } };
    audio: { masterVolume: number };
  };
  rules: {
    winCondition: { field: string; operator: "eq"|"gt"|"lt"|"gte"|"lte"; value: number|string|boolean };
    loseCondition: { field: string; operator: "eq"|"gt"|"lt"|"gte"|"lte"; value: number|string|boolean };
    scoring: { field: string; displayName: string };
  };
  stack: {
    adapter: "canvas" | "phaser" | "pixi";
    resourcePipeline: "lite" | "full";
    physics: null | "arcade" | "matter";
  };
}
```

#### 실제 예시: 플랫포머 game.json

```json
{
  "id": "platformer-demo",
  "version": "1.0.0",
  "meta": {
    "title": "Platformer Demo",
    "description": "A simple 2D platformer demo built with MSW Engine",
    "thumbnail": "",
    "orientation": "landscape",
    "resolution": { "width": 800, "height": 600 }
  },
  "assets": {
    "player": { "resourceId": "player", "states": ["idle", "walk", "jump"], "preload": true },
    "platform": { "resourceId": "platform", "states": ["default"], "preload": true },
    "coin": { "resourceId": "coin", "states": ["default"], "preload": true },
    "enemy": { "resourceId": "enemy", "states": ["walk"], "preload": true }
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
    },
    "play": {
      "name": "play",
      "type": "gameplay",
      "requiredAssets": ["player", "platform", "coin", "enemy"],
      "objects": {},
      "transitions": {
        "win": { "target": "gameover", "data": { "won": true } },
        "lose": { "target": "gameover", "data": { "won": false } }
      },
      "camera": { "bounds": { "x": 0, "y": 0, "width": 800, "height": 600 } },
      "ui": []
    },
    "gameover": {
      "name": "gameover",
      "type": "result",
      "requiredAssets": [],
      "objects": {},
      "transitions": { "restart": { "target": "title" } },
      "camera": { "bounds": { "x": 0, "y": 0, "width": 800, "height": 600 } },
      "ui": []
    }
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

#### 주요 필드 설명

- **`inputMap`**: 액션 이름(예: `"jump"`)을 키보드 키 코드 배열에 매핑한다. Scene의 `update()`에서 `input.active.has("jump")`이나 `input.justPressed.has("jump")`으로 참조한다.
- **`stack`**: 렌더러, 리소스 파이프라인, 물리 엔진 조합. 대부분의 게임은 `canvas` + `lite` + `null`로 충분하다.
- **`rules`**: 승리/패배 조건과 점수 표시 정의. `field`는 `GameState`에서 관리하는 키를 가리킨다.
- **`scenes.transitions`**: 각 씬의 가능한 전환 목록. 코드에서 `this.changeScene("gameover", { won: true })`로 실행한다.

### Step 4: {Genre}Game.ts 작성

`{Genre}Game.ts`는 게임의 진입점이다. `createGame` 팩토리 함수를 export한다.

#### 패턴

```typescript
import type { DrawCommand } from "~/engine/types";
import { Game } from "~/engine/Game";
import { CanvasAdapter } from "~/adapters/canvas/CanvasAdapter";
import { TitleScene } from "./scenes/TitleScene";
import { PlayScene } from "./scenes/PlayScene";
import { GameOverScene } from "./scenes/GameOverScene";
import gameDefinition from "./game.json";

export async function create{Genre}Game(
  canvas: HTMLCanvasElement,
  width = 800,
  height = 600,
): Promise<Game> {
  // 1. Adapter와 Game 인스턴스 생성
  const adapter = new CanvasAdapter();
  const game = new Game(adapter);

  // 2. Scene 등록
  game.registerScene("title", new TitleScene());
  game.registerScene("play", new PlayScene());
  game.registerScene("gameover", new GameOverScene());

  // 3. 게임 시작 (adapter 초기화 → entryScene으로 전환 → 루프 시작)
  await game.start(gameDefinition.entryScene, canvas, width, height);

  // 4. 인풋 매핑 초기화
  game.adapter.input.init(gameDefinition.inputMap);

  // 5. 렌더 파이프라인 연결 (onRender 콜백)
  const spawnedIds = new Set<string>();

  game.getLoop().onRender = () => {
    const scene = game.activeScene;
    if (!scene) return;

    const commands: DrawCommand[] = [];
    commands.push({ type: "CLEAR", color: "#87CEEB" });   // 배경색
    commands.push({ type: "CAMERA", x: width / 2, y: height / 2, zoom: 1 });

    const currentIds = new Set<string>();

    for (const obj of scene.getAllObjects()) {
      // 비활성 또는 비가시 오브젝트 제거
      if (!obj.active || !obj.state.visual.visible) {
        if (spawnedIds.has(obj.id)) {
          commands.push({ type: "DESTROY", id: obj.id });
          spawnedIds.delete(obj.id);
        }
        continue;
      }

      currentIds.add(obj.id);

      if (!spawnedIds.has(obj.id)) {
        // 새 오브젝트 → SPAWN
        commands.push({
          type: "SPAWN",
          id: obj.id,
          assetKey: obj.state.visual.assetKey,
          assetState: obj.state.visual.state,
          x: obj.state.transform.x,
          y: obj.state.transform.y,
          layer: obj.layer,
        });
        commands.push({
          type: "SCALE",
          id: obj.id,
          scaleX: obj.state.transform.scale.x,
          scaleY: obj.state.transform.scale.y,
        });
        spawnedIds.add(obj.id);
      } else {
        // 기존 오브젝트 → MOVE
        commands.push({
          type: "MOVE",
          id: obj.id,
          x: obj.state.transform.x,
          y: obj.state.transform.y,
        });
      }

      // 좌우 반전
      commands.push({
        type: "FLIP",
        id: obj.id,
        flipX: obj.state.visual.flipX,
      });
    }

    // 씬에서 사라진 오브젝트 정리
    for (const id of spawnedIds) {
      if (!currentIds.has(id)) {
        commands.push({ type: "DESTROY", id });
        spawnedIds.delete(id);
      }
    }

    // 커맨드 큐 실행
    game.adapter.processDrawQueue(commands);
  };

  return game;
}
```

#### 핵심 포인트

1. **`spawnedIds`**: 이미 렌더러에 등록된 오브젝트 추적용. 새 오브젝트는 `SPAWN`, 기존 오브젝트는 `MOVE`로 처리한다.
2. **DrawCommand 순서**: `CLEAR` → `CAMERA` → 각 오브젝트(`SPAWN`/`MOVE` + `FLIP`) → `DESTROY`(삭제된 것).
3. **`processDrawQueue`**: 누적된 커맨드를 adapter에 전달하면 실제 Canvas에 그려진다.

### Step 5: Scene 구현

모든 Scene은 `Scene` 클래스를 상속하고 `preload`, `create`, `update`, `destroy` 라이프사이클 메서드를 오버라이드한다.

#### 5-1. TitleScene (메뉴 화면)

```typescript
import type { Collision, InputState } from "~/engine/types";
import { Scene } from "~/engine/Scene";

export class TitleScene extends Scene {
  constructor() {
    super("title");
  }

  create(): void {
    // 게임 상태를 "title"로 설정 (HUD에서 화면 분기에 사용)
    this.game!.getState().set("screen", "title");
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);  // 반드시 호출 (오브젝트 업데이트 + 충돌 이벤트)

    // 키 입력으로 게임 시작
    if (input?.justPressed.has("jump")) {
      this.changeScene("play");
    }
  }
}
```

**핵심**: `create()`에서 `GameState`에 `screen` 값을 설정하여 React HUD가 올바른 UI를 표시하게 한다.

#### 5-2. PlayScene (게임플레이) — 가장 중요!

```typescript
import type { Collision, InputState } from "~/engine/types";
import { Scene } from "~/engine/Scene";
import type { GameObject } from "~/engine/GameObject";
import type { Movable } from "~/traits/Movable";
import type { Jumpable } from "~/traits/Jumpable";
import type { Damageable } from "~/traits/Damageable";
import type { Scorer } from "~/traits/Scorer";
import { createPlayer } from "../objects/Player";
import { createPlatform } from "../objects/Platform";
import { createCoin } from "../objects/Coin";
import { createEnemy } from "../objects/Enemy";

export class PlayScene extends Scene {
  private enemyDirection = 1;
  private enemyMinX = 300;
  private enemyMaxX = 600;

  constructor() {
    super("play");
  }

  create(): void {
    // 1. GameState 초기화
    const state = this.game!.getState();
    state.set("score", 0);
    state.set("health", 3);
    state.set("screen", "play");

    // 2. 오브젝트 생성 및 씬에 추가
    this.addObject(createPlayer());
    this.addObject(createPlatform("ground", 0, 550, 800, 50));
    this.addObject(createPlatform("plat-1", 150, 420, 120, 20));
    this.addObject(createCoin("coin-1", 210, 390));
    this.addObject(createEnemy("enemy-1", 400, 526));
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);  // 필수!
    if (!input) return;

    const player = this.getObject("player");
    if (!player || !player.active) return;

    // 3. 플레이어 입력 처리 (input 파라미터 사용!)
    const movable = player.getTrait<Movable>("movable");
    const jumpable = player.getTrait<Jumpable>("jumpable");

    if (movable) {
      if (input.active.has("move_left")) {
        movable.accelerate(-300 * dt, 0);
        player.state.visual.flipX = true;
      }
      if (input.active.has("move_right")) {
        movable.accelerate(300 * dt, 0);
        player.state.visual.flipX = false;
      }
    }

    if (jumpable && input.justPressed.has("jump")) {
      jumpable.jump();
    }

    // 4. 적 AI (순찰)
    const enemy = this.getObject("enemy-1");
    if (enemy?.active) {
      const enemyMovable = enemy.getTrait<Movable>("movable");
      if (enemyMovable) {
        enemyMovable.setVelocity(100 * this.enemyDirection, 0);
        if (enemy.state.transform.x >= this.enemyMaxX) {
          this.enemyDirection = -1;
          enemy.state.visual.flipX = true;
        } else if (enemy.state.transform.x <= this.enemyMinX) {
          this.enemyDirection = 1;
          enemy.state.visual.flipX = false;
        }
      }
    }

    // 5. 충돌 체크 (수동 거리 계산)
    this.checkCoinCollisions(player);
    this.checkEnemyCollision(player);

    // 6. 승리/패배 조건 → 씬 전환
    const state = this.game!.getState();
    const score = state.get<number>("score") ?? 0;
    const health = state.get<number>("health") ?? 0;

    if (score >= 100) {
      this.changeScene("gameover", { won: true });
    } else if (health <= 0) {
      this.changeScene("gameover", { won: false });
    }
  }

  private checkCoinCollisions(player: GameObject): void {
    const coins = this.getObjectsByTag("coin");
    const scorer = player.getTrait<Scorer>("scorer");

    for (const coin of coins) {
      if (!coin.active) continue;
      const dx = player.state.transform.x - coin.state.transform.x;
      const dy = player.state.transform.y - coin.state.transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 24) {
        coin.active = false;
        coin.state.visual.visible = false;
        scorer?.addScore(20);
        this.game!.getEvents().emit("coinCollected", { coinId: coin.id });
      }
    }
  }

  private checkEnemyCollision(player: GameObject): void {
    const enemies = this.getObjectsByTag("enemy");
    const damageable = player.getTrait<Damageable>("damageable");

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = player.state.transform.x - enemy.state.transform.x;
      const dy = player.state.transform.y - enemy.state.transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 28) {
        damageable?.hit(1);
      }
    }
  }
}
```

**핵심 흐름**:
1. `create()`: 게임 상태 초기화 + 오브젝트 생성
2. `update()`: 입력 → AI → 충돌 → 조건 체크 → 씬 전환
3. 충돌 체크: 거리 계산(`Math.sqrt(dx*dx + dy*dy) < threshold`)으로 수동 구현
4. 씬 전환: `this.changeScene("gameover", { won: true/false })`

#### 5-3. GameOverScene (결과 화면)

```typescript
import type { Collision, InputState } from "~/engine/types";
import { Scene } from "~/engine/Scene";

export class GameOverScene extends Scene {
  constructor() {
    super("gameover");
  }

  create(data?: Record<string, unknown>): void {
    const state = this.game!.getState();
    state.set("screen", "gameover");
    state.set("won", data?.won ?? false);  // 승리/패배 데이터 수신
  }

  update(dt: number, collisions: Collision[], input?: InputState): void {
    super.update(dt, collisions, input);

    if (input?.justPressed.has("jump")) {
      this.changeScene("title");  // 재시작
    }
  }
}
```

**핵심**: `create(data)`에서 이전 씬이 넘긴 `data`를 받아 승리/패배를 분기한다.

### Step 6: GameObject 구현

모든 게임 오브젝트는 `create{Object}` 팩토리 함수로 생성한다. `new GameObject(id, type)` 후 Trait을 추가하고 Transform/Visual을 설정한다.

#### 패턴: 플레이어 (Trait 조합의 대표 예시)

```typescript
import { GameObject } from "~/engine/GameObject";
import { Movable } from "~/traits/Movable";
import { Jumpable } from "~/traits/Jumpable";
import { Damageable } from "~/traits/Damageable";
import { Scorer } from "~/traits/Scorer";

export function createPlayer(id = "player"): GameObject {
  const player = new GameObject(id, "player");

  // Trait 추가 — 모든 행동은 Trait으로 캡슐화
  player.addTrait(new Movable({ speed: 300, friction: 0.8, maxSpeed: 400 }));
  player.addTrait(new Jumpable({ jumpForce: -450, gravity: 800, groundY: 518 }));
  player.addTrait(new Damageable({ maxHP: 3 }));
  player.addTrait(new Scorer());

  // Transform 설정 (위치, 스케일)
  player.state.transform.x = 100;
  player.state.transform.y = 400;
  player.state.transform.scale.x = 1;
  player.state.transform.scale.y = 1;

  // Visual 설정 (에셋, 상태, 가시성)
  player.state.visual.assetKey = "player";
  player.state.visual.state = "idle";
  player.state.visual.flipX = false;
  player.state.visual.visible = true;
  player.state.visual.opacity = 1;

  // 태그 및 레이어
  player.addTag("player");
  player.layer = 10;  // 높을수록 앞에 렌더

  return player;
}
```

#### 패턴: 적 (단순 Trait 조합)

```typescript
import { GameObject } from "~/engine/GameObject";
import { Movable } from "~/traits/Movable";

export function createEnemy(id: string, x: number, y: number): GameObject {
  const enemy = new GameObject(id, "enemy");
  enemy.addTrait(new Movable({ speed: 100, friction: 1.0, maxSpeed: 100 }));

  enemy.state.transform.x = x;
  enemy.state.transform.y = y;
  enemy.state.transform.scale.x = 0.75;
  enemy.state.transform.scale.y = 0.75;

  enemy.state.visual.assetKey = "enemy";
  enemy.state.visual.state = "walk";
  enemy.state.visual.visible = true;
  enemy.state.visual.opacity = 1;

  enemy.addTag("enemy");
  enemy.addTag("hazard");
  enemy.layer = 9;

  return enemy;
}
```

#### 패턴: 수집 아이템 (Trait 없는 단순 오브젝트)

```typescript
import { GameObject } from "~/engine/GameObject";

export function createCoin(id: string, x: number, y: number): GameObject {
  const coin = new GameObject(id, "coin");

  coin.state.transform.x = x;
  coin.state.transform.y = y;
  coin.state.transform.scale.x = 0.5;
  coin.state.transform.scale.y = 0.5;

  coin.state.visual.assetKey = "coin";
  coin.state.visual.state = "default";
  coin.state.visual.visible = true;
  coin.state.visual.opacity = 1;

  coin.addTag("coin");
  coin.addTag("collectible");
  coin.layer = 8;

  return coin;
}
```

#### 패턴: 정적 오브젝트 (플랫폼)

```typescript
import { GameObject } from "~/engine/GameObject";

export function createPlatform(
  id: string, x: number, y: number, width: number, height: number,
): GameObject {
  const platform = new GameObject(id, "platform");

  platform.state.transform.x = x + width / 2;   // 중심점 기준
  platform.state.transform.y = y + height / 2;
  platform.state.transform.scale.x = width / 32;  // 기본 스프라이트 크기(32px) 대비 스케일
  platform.state.transform.scale.y = height / 32;

  platform.state.visual.assetKey = "platform";
  platform.state.visual.state = "default";
  platform.state.visual.visible = true;
  platform.state.visual.opacity = 1;

  platform.addTag("platform");
  platform.addTag("solid");
  platform.layer = 5;

  return platform;
}
```

---

## 3. Trait 조합 레시피

### 사용 가능한 Trait 목록

#### Movable — 속도 기반 이동

```typescript
new Movable({ speed?: number, friction?: number, maxSpeed?: number })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `speed` | 200 | 기본 이동 속도 |
| `friction` | 0.85 | 매 프레임 속도에 곱하는 마찰 계수 (1.0 = 마찰 없음) |
| `maxSpeed` | 400 | 최대 속도 제한 |

**주요 메서드**:
- `setVelocity(vx, vy)` — 속도 직접 설정 (적 순찰 등에 사용)
- `accelerate(ax, ay)` — 가속 (플레이어 이동에 사용, dt를 곱해서 전달)

**공개 필드**: `vx`, `vy` (읽기/쓰기 가능)

#### Jumpable — 점프 + 중력

```typescript
new Jumpable({ jumpForce?: number, gravity?: number, groundY?: number })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `jumpForce` | -400 | 점프 시 y 방향 초기 속도 (음수 = 위로) |
| `gravity` | 800 | 중력 가속도 (양수 = 아래로) |
| `groundY` | 500 | 바닥 y 좌표 (이 이하로 내려가지 않음) |

**주요 메서드**:
- `jump()` — 점프 실행 (지면에 있을 때만 동작)

**공개 필드**: `isGrounded` (읽기 가능)

**의존성**: 반드시 `Movable` Trait이 먼저 추가되어 있어야 한다 (`Movable.vy`를 사용).

#### Damageable — HP 시스템

```typescript
new Damageable({ maxHP?: number, invincibilityDuration?: number })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `maxHP` | 3 | 최대 체력 |
| `invincibilityDuration` | 1.0 | 피격 후 무적 시간 (초) |

**주요 메서드**:
- `hit(damage)` — 데미지 적용 (무적 상태면 무시)
- `heal(amount)` — 회복
- `isDead()` — 사망 여부

**공개 필드**: `hp`, `maxHP`, `isInvincible`

**자동 동작**: `init()` 시 `GameState.health`를 `maxHP`로 설정. `hit()` 시 `GameState.health` 업데이트 + `"damaged"` 이벤트 발생. HP가 0 이하이면 `"death"` 이벤트 발생.

#### Scorer — 점수 시스템

```typescript
new Scorer({ stateKey?: string })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `stateKey` | `"score"` | `GameState`에서 사용할 키 이름 |

**주요 메서드**:
- `addScore(points)` — 점수 추가 (`GameState` 자동 업데이트 + `"scoreChanged"` 이벤트)
- `getScore()` — 현재 점수

#### Tappable — 클릭/탭 감지

```typescript
new Tappable({ width?: number, height?: number })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `width` | `scale.x * 32` | 탭 영역 너비 (미지정 시 스케일 기반 자동 계산) |
| `height` | `scale.y * 32` | 탭 영역 높이 |

**자동 동작**: 매 `update()`에서 `"tap"` 또는 `"pointer_down"` 입력이 오브젝트 영역 내에 있으면 `"tapped"` 이벤트를 발생시킨다.

**참고**: 이 Trait은 내부적으로 `worldState.input`을 참조하므로 Scene에서 별도로 입력을 처리할 필요 없다.

#### Timer — 타이머

```typescript
new Timer({ duration?: number, mode?: "countdown" | "countup" })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `duration` | 60 | 타이머 시간 (초) |
| `mode` | `"countdown"` | `"countdown"`: 감소, `"countup"`: 증가 |

**주요 메서드**:
- `start()` — 타이머 시작
- `pause()` — 일시 정지
- `reset()` — 초기값으로 리셋
- `isExpired()` — countdown 모드에서 시간 만료 여부
- `getTime()` — 현재 시간 (초)
- `getFormattedTime()` — `"MM:SS"` 형식 문자열

**자동 동작**: countdown 모드에서 시간이 0에 도달하면 `"timerExpired"` 이벤트 발생.

#### Animated — 프레임 애니메이션

```typescript
new Animated({ states?: string[], defaultState?: string, fps?: number })
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `states` | `["idle"]` | 가능한 애니메이션 상태 목록 |
| `defaultState` | `"idle"` | 초기 상태 |
| `fps` | 8 | 애니메이션 프레임 속도 |

**주요 메서드**:
- `setState(name)` — 애니메이션 상태 전환
- `getCurrentFrame()` — 현재 프레임 인덱스

#### Collidable — 물리 바디 등록

```typescript
new Collidable({
  bodyType?: "static" | "dynamic" | "kinematic",
  collider?: "box" | "circle",
  width?: number, height?: number,
  bounce?: number, friction?: number,
})
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `bodyType` | `"dynamic"` | 물리 바디 유형 |
| `collider` | `"box"` | 충돌체 모양 |
| `width` | 32 | 충돌체 너비 |
| `height` | 32 | 충돌체 높이 |
| `bounce` | 0 | 반발 계수 |
| `friction` | 0.1 | 마찰 계수 |

**자동 동작**: `init()` 시 adapter의 physics 서브시스템에 바디 등록, `destroy()` 시 제거.

### 장르별 Trait 조합 예시

| 오브젝트 | 장르 | Trait 조합 |
|---------|------|-----------|
| 플랫포머 플레이어 | 플랫포머 | `Movable` + `Jumpable` + `Damageable` + `Scorer` |
| 플랫포머 적 | 플랫포머 | `Movable` (순찰용) |
| 클리커 버튼 | 클리커 | `Tappable` + `Scorer` |
| 퀴즈 타이머 | 퀴즈 | `Timer` |
| 슈팅 플레이어 | 슈팅 | `Movable` + `Damageable` + `Scorer` |
| 슈팅 총알 | 슈팅 | `Movable` |
| RPG 캐릭터 | RPG | `Movable` + `Damageable` + `Animated` + `Scorer` |
| 뱀서라이크 플레이어 | 뱀서라이크 | `Movable` + `Damageable` + `Scorer` + `Timer` |

---

## 4. 코드 패턴 레퍼런스

### 패턴 A: 렌더 파이프라인 (onRender)

`{Genre}Game.ts`에서 `game.getLoop().onRender`에 할당하는 콜백이다. 매 프레임 호출된다.

```typescript
const spawnedIds = new Set<string>();

game.getLoop().onRender = () => {
  const scene = game.activeScene;
  if (!scene) return;

  const commands: DrawCommand[] = [];

  // 1단계: 화면 초기화
  commands.push({ type: "CLEAR", color: "#87CEEB" });
  commands.push({ type: "CAMERA", x: width / 2, y: height / 2, zoom: 1 });

  const currentIds = new Set<string>();

  // 2단계: 오브젝트 순회
  for (const obj of scene.getAllObjects()) {
    if (!obj.active || !obj.state.visual.visible) {
      if (spawnedIds.has(obj.id)) {
        commands.push({ type: "DESTROY", id: obj.id });
        spawnedIds.delete(obj.id);
      }
      continue;
    }

    currentIds.add(obj.id);

    if (!spawnedIds.has(obj.id)) {
      // 새 오브젝트: SPAWN + SCALE
      commands.push({ type: "SPAWN", id: obj.id, assetKey: obj.state.visual.assetKey,
        assetState: obj.state.visual.state, x: obj.state.transform.x,
        y: obj.state.transform.y, layer: obj.layer });
      commands.push({ type: "SCALE", id: obj.id,
        scaleX: obj.state.transform.scale.x, scaleY: obj.state.transform.scale.y });
      spawnedIds.add(obj.id);
    } else {
      // 기존 오브젝트: MOVE
      commands.push({ type: "MOVE", id: obj.id,
        x: obj.state.transform.x, y: obj.state.transform.y });
    }

    commands.push({ type: "FLIP", id: obj.id, flipX: obj.state.visual.flipX });
  }

  // 3단계: 삭제된 오브젝트 정리
  for (const id of spawnedIds) {
    if (!currentIds.has(id)) {
      commands.push({ type: "DESTROY", id });
      spawnedIds.delete(id);
    }
  }

  // 4단계: 커맨드 실행
  game.adapter.processDrawQueue(commands);
};
```

#### 사용 가능한 DrawCommand 타입

| 타입 | 필드 | 용도 |
|------|------|------|
| `CLEAR` | `color` | 배경색으로 화면 지우기 |
| `CAMERA` | `x, y, zoom` | 카메라 위치/줌 설정 |
| `SPAWN` | `id, assetKey, assetState, x, y, layer` | 새 스프라이트 생성 |
| `DESTROY` | `id` | 스프라이트 제거 |
| `MOVE` | `id, x, y` | 위치 변경 |
| `ROTATE` | `id, rotation` | 회전 |
| `SCALE` | `id, scaleX, scaleY` | 스케일 변경 |
| `STATE` | `id, assetState` | 애니메이션 상태 변경 |
| `FLIP` | `id, flipX` | 좌우 반전 |
| `OPACITY` | `id, opacity` | 투명도 |
| `VISIBLE` | `id, visible` | 가시성 토글 |
| `UI` | `id, props` | UI 요소 업데이트 |
| `SFX` | `soundId, volume` | 효과음 재생 |
| `BGM` | `soundId, action` | BGM 재생/정지 |

### 패턴 B: Scene.update() 입력 처리

```typescript
update(dt: number, collisions: Collision[], input?: InputState): void {
  super.update(dt, collisions, input);  // 필수 — 오브젝트 Trait 업데이트 + 충돌 이벤트
  if (!input) return;

  // input.active: 현재 누르고 있는 키 (이동 등 연속 동작)
  if (input.active.has("move_left")) { ... }
  if (input.active.has("move_right")) { ... }

  // input.justPressed: 이번 프레임에 새로 눌린 키 (점프, 공격 등 일회성 동작)
  if (input.justPressed.has("jump")) { ... }

  // input.justReleased: 이번 프레임에 뗀 키
  if (input.justReleased.has("shoot")) { ... }

  // input.pointer: 마우스/터치 좌표
  const { x, y } = input.pointer;
}
```

**InputState 구조**:
```typescript
interface InputState {
  active: Set<string>;        // 현재 누르고 있는 액션
  justPressed: Set<string>;   // 이번 프레임에 눌린 액션
  justReleased: Set<string>;  // 이번 프레임에 뗀 액션
  pointer: { x: number; y: number };  // 포인터 좌표
}
```

액션 이름은 `game.json`의 `inputMap`에 정의된 것을 사용한다 (예: `"move_left"`, `"jump"`).

### 패턴 C: 충돌 체크 (수동 거리 계산)

physics를 사용하지 않을 때(`stack.physics: null`), 수동으로 거리 기반 충돌을 체크한다.

```typescript
private checkCoinCollisions(player: GameObject): void {
  const coins = this.getObjectsByTag("coin");   // 태그로 오브젝트 일괄 조회
  const scorer = player.getTrait<Scorer>("scorer");

  for (const coin of coins) {
    if (!coin.active) continue;

    // 유클리드 거리 계산
    const dx = player.state.transform.x - coin.state.transform.x;
    const dy = player.state.transform.y - coin.state.transform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 24) {  // 충돌 임계값 (오브젝트 크기에 맞게 조정)
      coin.active = false;
      coin.state.visual.visible = false;
      scorer?.addScore(20);
      this.game!.getEvents().emit("coinCollected", { coinId: coin.id });
    }
  }
}
```

### 패턴 D: GameCanvas React 통합

게임 루프(60FPS)와 React UI 갱신(10Hz)이 분리되어 있다.

```typescript
export function GameCanvas({ width = 800, height = 600 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [uiState, setUIState] = useState<GameUIState>({
    score: 0, health: 3, maxHealth: 3, fps: 0, objectCount: 0, screen: "title", won: false,
  });

  // GameState에서 React 상태로 폴링 (10Hz)
  const updateUI = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const state = game.getState();
    setUIState({
      score: state.get<number>("score") ?? 0,
      health: state.get<number>("health") ?? 3,
      maxHealth: 3,
      fps: game.getLoop().fps,
      objectCount: game.activeScene?.getObjectCount() ?? 0,
      screen: state.get<string>("screen") ?? "title",
      won: state.get<boolean>("won") ?? false,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stopped = false;

    // 게임 인스턴스 생성
    createPlatformerGame(canvas, width, height).then((game) => {
      if (stopped) { game.stop(); return; }
      gameRef.current = game;
    });

    // UI 폴링 (게임 루프와 독립)
    const pollInterval = setInterval(updateUI, 100);

    return () => {
      stopped = true;
      clearInterval(pollInterval);
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [width, height, updateUI]);

  return (
    <div className="relative inline-block" style={{ width, height }}>
      <canvas ref={canvasRef} className="block" tabIndex={0} />
      <DebugOverlay fps={uiState.fps} objectCount={uiState.objectCount} scene={uiState.screen} />
      <HUD score={uiState.score} health={uiState.health} maxHealth={uiState.maxHealth}
           screen={uiState.screen} won={uiState.won} />
    </div>
  );
}
```

**핵심 설계 원리**:
- 게임 루프는 60FPS로 독립 실행 (`GameLoop` → `requestAnimationFrame`)
- React UI는 `setInterval(updateUI, 100)`으로 10Hz 폴링
- `GameState`가 게임과 React 사이의 브릿지 역할

---

## 5. 핵심 API 요약

### Scene 클래스 메서드

| 메서드 | 설명 |
|--------|------|
| `addObject(obj)` | 오브젝트를 씬에 추가 |
| `removeObject(id)` | 오브젝트 제거 |
| `getObject(id)` | ID로 오브젝트 조회 |
| `getObjectsByTag(tag)` | 태그로 오브젝트 일괄 조회 |
| `getObjectsByType(type)` | 타입으로 오브젝트 일괄 조회 |
| `getAllObjects()` | 모든 오브젝트 이터레이터 |
| `getObjectCount()` | 오브젝트 수 |
| `changeScene(name, data?)` | 씬 전환 |

### GameObject 클래스 메서드

| 메서드 | 설명 |
|--------|------|
| `addTrait(trait)` | Trait 추가 |
| `removeTrait(name)` | Trait 제거 |
| `getTrait<T>(name)` | Trait 조회 (제네릭) |
| `hasTrait(name)` | Trait 존재 여부 |
| `addTag(tag)` | 태그 추가 |
| `hasTag(tag)` | 태그 확인 |
| `emit(event, data?)` | 이벤트 발생 |
| `on(event, callback)` | 이벤트 리스너 등록 (unsubscribe 함수 반환) |
| `destroy()` | 오브젝트 파괴 |

**편의 프로퍼티**: `x`, `y`, `rotation`, `scaleX`, `scaleY`, `active`, `visual`, `id`, `type`, `layer`

### GameState 메서드

| 메서드 | 설명 |
|--------|------|
| `get<T>(key)` | 상태 값 조회 |
| `set(key, value)` | 상태 값 설정 (구독자에게 통지) |
| `has(key)` | 키 존재 여부 |
| `subscribe(key, callback)` | 특정 키 변경 구독 |
| `subscribeAll(callback)` | 모든 변경 구독 |

### EventBus 패턴

```typescript
// 이벤트 발생 (어디서든)
this.game!.getEvents().emit("coinCollected", { coinId: coin.id });

// 이벤트 구독 (어디서든)
this.game!.getEvents().on("coinCollected", (data) => { ... });
```

---

## 6. 절대 하면 안 되는 것 (CRITICAL RULES)

### Rule 1: Scene에서 input을 직접 poll하지 말 것

```typescript
// ❌ 잘못된 코드 — justPressed가 소실됨
update(dt: number) {
  const input = this.game!.adapter.input.poll();  // NEVER!
  if (input.justPressed.has("jump")) { ... }  // 동작하지 않음
}

// ✅ 올바른 코드 — update 파라미터로 받은 input 사용
update(dt: number, collisions: Collision[], input?: InputState): void {
  if (input?.justPressed.has("jump")) { ... }  // 정상 동작
}
```

**이유**: `GameLoop.onUpdate`에서 이미 `adapter.input.poll()`을 한 번 호출하여 Scene에 전달한다. Scene에서 다시 `poll()`하면 `justPressed`/`justReleased`가 초기화되어 입력이 소실된다.

### Rule 2: 단일 파일에 모든 로직 넣지 말 것

```
❌ 하나의 Game.ts에 Scene, GameObject, 로직 전부 작성

✅ 올바른 구조:
templates/{genre}/
├── {Genre}Game.ts       ← 초기화 + 렌더만
├── scenes/              ← 각 화면 독립
│   ├── TitleScene.ts
│   ├── PlayScene.ts
│   └── GameOverScene.ts
└── objects/             ← 각 오브젝트 독립
    ├── Player.ts
    └── ...
```

### Rule 3: 엔진 코드 직접 수정 금지

```
❌ engine/Scene.ts에 커스텀 로직 추가
❌ traits/Movable.ts 수정하여 게임 특화 로직 삽입
❌ adapters/ 코드 변경

✅ 새 Trait이 필요하면 templates/{genre}/traits/ 안에 로컬 Trait 생성:

templates/my-game/traits/Patrolling.ts ← 새로 만들기
```

### Rule 4: Trait 없이 GameObject에 직접 로직 넣지 말 것

```typescript
// ❌ 잘못된 코드 — GameObject에 직접 로직
class Player extends GameObject {
  update(dt: number) {
    this.x += this.speed * dt;  // Trait 없이 직접 구현
  }
}

// ✅ 올바른 코드 — Trait으로 캡슐화
const player = new GameObject("player", "player");
player.addTrait(new Movable({ speed: 300 }));  // 행동은 Trait에 위임
```

### Rule 5: requestAnimationFrame 직접 호출 금지

```typescript
// ❌ 잘못된 코드 — 이중 루프 발생
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);  // NEVER!
}

// ✅ GameLoop이 관리함 — game.getLoop().onRender에 연결
game.getLoop().onRender = () => {
  // 렌더 로직
};
```

### Rule 6: super.update() 호출을 빼먹지 말 것

```typescript
// ❌ 잘못된 코드 — 오브젝트의 Trait이 업데이트되지 않음
update(dt: number, collisions: Collision[], input?: InputState): void {
  // super.update 누락!
  if (input?.justPressed.has("jump")) { ... }
}

// ✅ 올바른 코드
update(dt: number, collisions: Collision[], input?: InputState): void {
  super.update(dt, collisions, input);  // 오브젝트 Trait 업데이트 + 충돌 이벤트 전파
  if (input?.justPressed.has("jump")) { ... }
}
```

---

## 7. 체크리스트

게임 생성 완료 후 반드시 확인할 항목:

### 구조
- [ ] `game.json`이 `GameDefinitionData` 스키마를 따르는가
- [ ] `{Genre}Game.ts`, `scenes/`, `objects/` 디렉토리 구조가 올바른가
- [ ] 엔진 코드(`engine/`, `adapters/`, `traits/`)를 수정하지 않았는가

### Scene
- [ ] 모든 Scene이 `Scene`을 상속하고 `create`, `update`를 구현했는가
- [ ] `PlayScene.update()`가 `super.update(dt, collisions, input)`을 호출하는가
- [ ] `PlayScene.update()`가 `input` 파라미터를 사용하는가 (직접 poll 아님)
- [ ] 승리/패배 조건이 `this.changeScene()`으로 씬을 전환하는가

### GameObject
- [ ] 모든 오브젝트가 `create{Object}` 팩토리 함수로 생성되는가
- [ ] 모든 행동이 Trait으로 캡슐화되어 있는가
- [ ] 각 오브젝트에 `assetKey`, `state`, `visible`, `opacity`가 설정되어 있는가
- [ ] 적절한 태그(`addTag`)와 레이어(`layer`)가 설정되어 있는가

### 렌더링
- [ ] `onRender`에서 `CLEAR` → `CAMERA` → 오브젝트(`SPAWN`/`MOVE`) → `DESTROY` 순서인가
- [ ] `spawnedIds`로 새 오브젝트와 기존 오브젝트를 구분하고 있는가
- [ ] 비활성 오브젝트가 `DESTROY`로 제거되는가

### 상태
- [ ] `GameState`에 `screen`, `score`, `health` 등 필수 키가 설정되는가
- [ ] React HUD가 `GameState`를 폴링하여 올바르게 표시할 수 있는가

### TypeScript
- [ ] strict mode에서 타입 에러가 없는가
- [ ] import 경로가 `~/` alias를 사용하는가
