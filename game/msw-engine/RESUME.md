# MSW Engine Boilerplate - 작업 재개 가이드

## 작업 목표

`game/msw-engine/` 디렉토리에 MSW Gameplay Framework 보일러플레이트를 구현한다.
v3 아키텍처 문서(`/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/`)를 기반으로 하며,
Scene → GameObject → Trait 컴포지션, 엔진 어댑터 패턴, 4-layer 상태 흐름을 구현한다.

최종 결과물: Canvas 어댑터 기반 플레이 가능한 플랫포머 데모 게임.

## 전체 구현 계획 (6 Tasks)

| # | Task | Phase | 상태 |
|---|------|-------|------|
| 1 | M1 엔진 코어 (EventBus, GameState, Trait, GameObject, Scene, GameLoop, GameRule, Game) + 메모리 관리 (ObjectPool, TransformBuffer, EventPool) | Phase 1 | **미완성** — 파일 미생성 (핵심 블로커) |
| 2 | M1 캔버스 어댑터 (CanvasInput, CanvasPhysics, CanvasAudio, CanvasAssetFactory, CanvasRenderer, CanvasAdapter) | Phase 1 | **완성** |
| 3 | M2 렌더 파이프라인 (DrawCommand, RenderState, Projector, DirtyTracker) | Phase 2 | **완성** |
| 4 | M3 리소스 파이프라인 (AssetDescriptor, AssetFactory, AssetRegistry, GameDefinition) | Phase 3 | **완성** |
| 5 | M4 트레이트 라이브러리 (Movable, Jumpable, Damageable, Scorer, Timer, Tappable, Collidable, Animated) | Phase 4 | **완성** — 단, Task #1의 Trait/GameObject 미존재로 import 불가 상태 |
| 6 | M4 플랫포머 템플릿 + React UI (GameCanvas, DebugOverlay, HUD, TitleScene, PlayScene, GameOverScene, Player, Platform, Coin, Enemy, game.json) | Phase 4 | **미시작** |

## 파일별 진행 상태

### Phase 0: 스캐폴딩 - 완성
```
[OK] .nvmrc, package.json, tsconfig.json, vite.config.ts, components.json, index.html
[OK] src/main.tsx, src/app.css, src/lib/utils.ts
[OK] pnpm-workspace.yaml에 "game/*" 추가됨
[OK] pnpm install 완료
```

### Phase 0+: 기반 타입 - 완성
```
[OK] src/engine/types.ts  — 모든 공유 타입/인터페이스 정의 (350줄+)
     포함: Vector2, Transform, InputState, Collision, ObjectState, WorldState,
     DrawCommand (14종), AssetDescriptor (4종), EngineAsset, GameDefinitionData,
     EngineAdapterInterface, 모든 서브시스템 인터페이스
```

### Task #1: 엔진 코어 — 미완성 (핵심 블로커)
```
[OK] src/engine/types.ts (위에서 완성)
[ ] src/engine/EventBus.ts
[ ] src/engine/GameState.ts
[ ] src/engine/Trait.ts          ← Task #5(트레이트들)이 import하는 대상
[ ] src/engine/GameObject.ts     ← Task #5(트레이트들)이 import하는 대상
[ ] src/engine/Scene.ts
[ ] src/engine/GameLoop.ts
[ ] src/engine/GameRule.ts
[ ] src/engine/Game.ts
[ ] src/engine/index.ts
[ ] src/memory/ObjectPool.ts
[ ] src/memory/TransformBuffer.ts
[ ] src/memory/EventPool.ts
```

### Task #2: 캔버스 어댑터 — 완성
```
[OK] src/adapters/EngineAdapter.ts       — EngineAdapterInterface 재수출
[OK] src/adapters/canvas/CanvasInput.ts  — 키보드/포인터 입력, 액션 매핑, justPressed/justReleased
[OK] src/adapters/canvas/CanvasPhysics.ts — AABB 충돌 감지, 중력, updateBodyPosition
[OK] src/adapters/canvas/CanvasAudio.ts  — Web Audio API, lazy AudioContext, BGM 루프
[OK] src/adapters/canvas/CanvasAssetFactory.ts — ImageBitmap/decodeAudioData 로딩
[OK] src/adapters/canvas/CanvasRenderer.ts — 스프라이트 레지스트리, 카메라 변환, 레이어 정렬
[OK] src/adapters/canvas/CanvasAdapter.ts — 모든 서브시스템 합성, rAF 관리
[OK] src/adapters/index.ts              — CanvasAdapter + 타입 재수출
```

### Task #3: 렌더 파이프라인 — 완성
```
[OK] src/render/DrawCommand.ts   — 14개 팩토리 함수 + CommandPool (제로 할당)
[OK] src/render/RenderState.ts   — fromWorldState() + clone()
[OK] src/render/Projector.ts     — WorldState → RenderStateData 변환
[OK] src/render/DirtyTracker.ts  — diff() → 최소 DrawCommand[], 엡실론 비교
[OK] src/render/index.ts
```

### Task #4: 리소스 파이프라인 — 완성
```
[OK] src/resources/AssetDescriptor.ts  — 4개 팩토리 함수 + 4개 타입 가드
[OK] src/resources/AssetFactory.ts     — AssetFactorySubsystem 재수출 + 4개 EngineAsset 타입 가드
[OK] src/resources/AssetRegistry.ts    — 카탈로그/캐시/로딩중복방지/진행률
[OK] src/resources/GameDefinition.ts   — parseGameDefinition + extractSceneAssets + createDefaultDefinition
[OK] src/resources/index.ts
```

### Task #5: 트레이트 라이브러리 — 완성 (파일 완성, Task #1 의존)
```
[OK] src/traits/Movable.ts    — 속도/마찰/최대속도, accelerate/setVelocity
[OK] src/traits/Jumpable.ts   — 중력/바닥감지, jump() (Movable 필요)
[OK] src/traits/Damageable.ts — HP/무적/hit/heal, "damaged"/"death" 이벤트
[OK] src/traits/Scorer.ts     — GameState 통한 점수, "scoreChanged" 이벤트
[OK] src/traits/Timer.ts      — 카운트다운/카운트업, getFormattedTime(MM:SS)
[OK] src/traits/Tappable.ts   — 포인터 히트테스트, "tapped" 이벤트
[OK] src/traits/Collidable.ts — 물리 바디 등록/제거, 트랜스폼 동기화
[OK] src/traits/Animated.ts   — 프레임 애니메이션, setState/getCurrentFrame
[OK] src/traits/index.ts
```
주의: 모든 트레이트가 `~/engine/Trait`에서 Trait 베이스 클래스를 import함.
Task #1 완성 후 호환성 확인 필요. 트레이트들은 `gameObject.state.transform`, `gameObject.state.visual`,
`gameObject.scene.game.getState()`, `gameObject.scene.game.getEvents()`, `gameObject.getTrait(name)` 접근 패턴 사용.

### Task #6: 플랫포머 템플릿 + React UI — 미시작
```
[ ] src/templates/platformer/game.json
[ ] src/templates/platformer/PlatformerGame.ts
[ ] src/templates/platformer/scenes/TitleScene.ts
[ ] src/templates/platformer/scenes/PlayScene.ts
[ ] src/templates/platformer/scenes/GameOverScene.ts
[ ] src/templates/platformer/objects/Player.ts
[ ] src/templates/platformer/objects/Platform.ts
[ ] src/templates/platformer/objects/Coin.ts
[ ] src/templates/platformer/objects/Enemy.ts
[ ] src/ui/GameCanvas.tsx
[ ] src/ui/DebugOverlay.tsx
[ ] src/ui/HUD.tsx
```

## 재개 시 할 일

### 1단계: Task #1 완성 (최우선, 핵심 블로커)
엔진 코어는 모든 것의 기반. 다음 파일들을 구현해야 함:
- `src/memory/` 3개: ObjectPool, TransformBuffer, EventPool
- `src/engine/` 9개: EventBus, GameState, Trait, GameObject, Scene, GameLoop, GameRule, Game, index.ts

**핵심 설계:**
- `ObjectPool<T>`: acquire/release, 프리웜 64개
- `TransformBuffer`: Float32Array, stride=5 (x,y,rotation,scaleX,scaleY)
- `EventPool`: 타입별 풀 Map, 최대 32개/타입
- `EventBus`: on/off/emit/once, Map<string, Set<EventCallback>>
- `GameState`: get/set/subscribe/snapshot/restore
- `Trait`: abstract, name/gameObject, update(dt)/attach/detach/init/destroy
- `GameObject`: traits Map, children, TransformBuffer 기반 transform, visual, tags
- `Scene`: preload/create/update/destroy, objects Map, changeScene
- `GameLoop`: 고정 타임스텝 (fixedDt=1/60, maxFrameSkip=5)
- `GameRule`: evaluateRule(RuleExpression, GameState) → boolean
- `Game`: 루트 오케스트레이터 (adapter, scenes, state, events, loop)

### 2단계: typecheck 실행
```bash
cd game/msw-engine && pnpm typecheck
```
Task #1 완성 후 전체 프로젝트 타입 검사. Task #5(트레이트) 호환성 문제가 있을 수 있음.

### 3단계: Task #6 구현
- 플랫포머 템플릿 (game.json + 3 scenes + 4 objects)
- React UI (GameCanvas, DebugOverlay, HUD)
- main.tsx에서 연결

### 4단계: 통합 검증
```bash
pnpm typecheck  # 타입 에러 0
pnpm build      # dist/ 생성
pnpm dev        # 플레이 가능한 플랫포머
```

## 아키텍처 참조 문서
- `/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/04-v3-gameplay-framework.md`
- `/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/05-v3-engine-adapters.md`
- `/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/06-v3-resource-pipeline.md`
- `/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/07-v3-game-state-architecture.md`
- `/home/choigawoon/k-codepoet/my-poc-idea/docs/architecture/v3/08-v3-game-templates.md`

## 검증 기준
1. `pnpm install` 성공
2. `pnpm typecheck` 에러 0개
3. `pnpm build` — dist/ 생성
4. `pnpm dev` — 플레이 가능한 플랫포머 표시
5. 이동/점프/코인수집/체력/게임오버/재시작 동작
6. 씬 전환: title → play → gameover → title
7. DebugOverlay에 FPS + 오브젝트 수 표시 (dev 모드)
