# React 통합

> `msw-engine/src/ui/` 디렉토리 및 `msw-react-router-spa` 변형.

## GameCanvas.tsx 패턴

> 파일: `msw-engine/src/ui/GameCanvas.tsx`

### 두 가지 루프의 분리

```
┌───────────────────────────┐     ┌───────────────────────────┐
│    Game Loop (60 FPS)     │     │    React UI (10 Hz)       │
│                           │     │                           │
│  requestAnimationFrame    │     │  setInterval(100ms)       │
│  → physics.step(dt)       │     │  → game.getState()        │
│  → scene.update()         │     │  → game.getLoop().fps     │
│  → processDrawQueue()     │     │  → setUIState({...})      │
│                           │     │  → React re-render        │
│  Canvas 직접 조작          │     │  DOM 업데이트              │
└───────────────────────────┘     └───────────────────────────┘
        60FPS                             10Hz
```

**이 분리의 이유:**

- 게임 루프는 60FPS로 실행되지만, React 리렌더링은 비용이 높다
- UI(점수, 체력, FPS)는 10Hz(초당 10회)로 충분히 부드럽다
- 게임 루프는 Canvas 2D에 직접 렌더링하므로 React의 가상 DOM과 독립적

### UI 상태 동기화

```typescript
// 10Hz로 폴링
const pollInterval = setInterval(updateUI, 100);

const updateUI = () => {
  setUIState({
    score:       state.get<number>("score") ?? 0,
    health:      state.get<number>("health") ?? 3,
    fps:         game.getLoop().fps,
    objectCount: scene?.getObjectCount() ?? 0,
    screen:      state.get<string>("screen") ?? "title",
  });
};
```

### 어댑터 / 리소스 모드 토글

GameCanvas는 두 가지 런타임 설정을 제공한다:

```
┌──────────────────────────────────────────┐
│  [Canvas 2D] [PixiJS] [Three.js] [Phaser]  ← 어댑터 선택
│  Resources: [Programmatic] [File-based]     ← 리소스 모드
│  ┌──────────────────────────────────────┐ │
│  │          Game Canvas (800x600)        │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

- 토글 변경 시 useEffect가 다시 실행되어 게임 인스턴스를 재생성한다
- 선택 값은 `localStorage`에 저장되어 새로고침 후에도 유지된다
  - `msw-engine:adapter` — 어댑터 타입 (canvas/pixi/three/phaser)
  - `msw-engine:resource` — 리소스 모드 (programmatic/file)

### 정리 (Cleanup)

```typescript
useEffect(() => {
  // ... 게임 생성
  return () => {
    stopped = true;
    clearInterval(pollInterval);
    gameRef.current?.stop();
    gameRef.current = null;
    canvas.remove();  // GPU 컨텍스트 정리 (React StrictMode 대응)
  };
}, [width, height, adapterType, resourceMode, updateUI]);
```

## React UI 동기화 흐름

```
setInterval(100ms)     ← 10Hz 폴링
│
├─ game.getState()
│   ├─ score → "score"
│   └─ health → "health"
│
├─ game.getLoop().fps → FPS
├─ scene.getObjectCount() → 오브젝트 수
│
└─ setUIState({...})
    └─ React re-render
        ├─ HUD: 점수, 체력
        └─ DebugOverlay: FPS, 오브젝트 수, 현재 씬
```

## msw-react-router-spa 변형

`msw-react-router-spa`는 엔진 코드의 **독립 사본**을 React Router v7 SPA로 래핑한 것이다. `degit` 호환을 위해 monorepo 패키지 의존성을 사용하지 않는다.

- **라우팅**: React Router v7의 `/play` 라우트에서 게임 실행
- **배포**: Docker + nginx SPA 패턴 (`try_files` fallback)
- **경로 별칭**: `~/*` → `./app/*`

엔진 내부의 GameCanvas → HUD → DebugOverlay 구조는 동일하며, React Router의 라우팅/레이아웃 레이어만 추가된다.
