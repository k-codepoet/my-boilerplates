# 비전과 설계 철학

## "아무나 게임을 만들 수 있게"

MSW Game Engine은 **AI와 프레임워크의 결합**으로 게임 개발의 진입 장벽을 없애는 것을 목표로 한다. AI가 프레임워크의 규칙 안에서 게임 로직만 작성하면 완성된 게임이 나온다.

**핵심 비유:**

```
웹 개발:  Canvas API / DOM   →   React   →   Remix / Next.js
게임 개발: Canvas / Phaser    →   (없음)  →   MSW Gameplay Framework  ← 이것을 만든다
```

웹 개발에서 React가 UI 컴포넌트의 구조를 잡아주고, Remix가 라우팅/데이터 로딩의 규칙을 제공하듯, MSW Engine은 게임 오브젝트의 구조(GameObject + Trait)와 게임 흐름의 규칙(Scene + GameLoop)을 제공한다.

## 진화 과정

| 버전 | 구조 | 특징 |
|------|------|------|
| **v1** | 단일 HTML 파일 | 모든 코드가 하나의 파일에. AI가 전체를 한 번에 생성 |
| **v2** | 파일 분리 | scene, object, trait로 파일 분리. 수동 배선 필요 |
| **v3** | **프레임워크** | 엔진이 규칙을 강제. AI는 game.json + Scene/Object만 작성 |

v3에서 핵심은 **"프레임워크가 규칙을 강제한다"**는 것이다. AI는 `Scene`, `GameObject`, `Trait`의 조합만으로 게임을 만들 수 있고, 엔진이 게임 루프, 렌더링, 입력 처리, 충돌 감지를 모두 관리한다.

## 아키텍처 전체 구조

### 계층 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 5: React / UI                         │
│  GameCanvas.tsx  ─  HUD  ─  DebugOverlay                       │
│  (10Hz 폴링으로 게임 상태 → React 상태 동기화)                     │
├─────────────────────────────────────────────────────────────────┤
│                Layer 4: Game Loop & Scene Manager                │
│  Game.ts  ─  GameLoop.ts  ─  GameState.ts  ─  EventBus.ts      │
│  (60FPS 고정 타임스텝, 씬 전환, 전역 상태, 이벤트 라우팅)          │
├─────────────────────────────────────────────────────────────────┤
│               Layer 3: GameObject + Trait System                 │
│  GameObject.ts  ─  Trait.ts  ─  Scene.ts                        │
│  (엔티티 조합, 행위 정의, 충돌 라우팅)                             │
├─────────────────────────────────────────────────────────────────┤
│               Layer 2: Adapter Interface (추상)                  │
│  EngineAdapterInterface                                         │
│  ├─ InputSubsystem    (입력 폴링)                                │
│  ├─ PhysicsSubsystem  (물리 시뮬레이션)                           │
│  ├─ AudioSubsystem    (사운드 재생)                               │
│  └─ AssetFactorySubsystem (에셋 로딩)                            │
├─────────────────────────────────────────────────────────────────┤
│              Layer 1: Concrete Adapters (구현)                   │
│  CanvasAdapter                                                  │
│  ├─ CanvasInput      (키보드/포인터 → 액션 매핑)                  │
│  ├─ CanvasPhysics    (AABB 충돌 감지)                            │
│  ├─ CanvasRenderer   (DrawCommand → Canvas 2D)                  │
│  ├─ CanvasAudio      (Web Audio API)                            │
│  └─ CanvasAssetFactory (fetch → ImageBitmap/AudioBuffer)        │
│                                                                 │
│  [미래] PhaserAdapter, PixiAdapter, ...                          │
└─────────────────────────────────────────────────────────────────┘
```

### 각 계층의 책임

| 계층 | 책임 | 의존 방향 |
|------|------|-----------|
| **React/UI** | DOM 렌더링, 사용자 인터페이스, 상태 표시 | Game → (폴링) |
| **Game Loop** | 프레임 스케줄링, 고정 타임스텝, 씬 관리 | 아래로만 |
| **GameObject+Trait** | 게임 엔티티 정의, 행위 조합, 충돌 처리 | 아래로만 |
| **Adapter Interface** | 플랫폼 추상화 (입력, 물리, 오디오, 에셋) | 인터페이스만 |
| **Concrete Adapter** | 실제 플랫폼 구현 (Canvas 2D, Web Audio) | 없음 |

각 계층의 상세 내용은 해당 문서를 참조:

- 엔진 코어 모듈 → [02-engine-modules.md](02-engine-modules.md)
- Trait 시스템 → [03-trait-system.md](03-trait-system.md)
- 어댑터 패턴 → [04-adapter-pattern.md](04-adapter-pattern.md)
- 메모리 최적화 → [05-memory-optimization.md](05-memory-optimization.md)
- React 통합 → [06-react-integration.md](06-react-integration.md)
