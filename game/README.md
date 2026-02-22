# Game 보일러플레이트

> MSW Gameplay Framework 기반 게임 엔진 + 템플릿. "아무나 게임을 만들 수 있게."

MSW(Micro Scene World) Engine은 **Scene + GameObject + Trait 조합 패턴**으로 게임을 만드는 프레임워크다. AI가 프레임워크의 규칙 안에서 게임 로직만 작성하면 완성된 게임이 나온다.

---

## 보일러플레이트 목록

| 이름 | 구조 | 용도 | 한 줄 설명 |
|------|------|------|-----------|
| **msw-engine** | Vite + React | 엔진 개발/테스트 | 순수 엔진, 단독 실행 |
| **msw-react-router-spa** | React Router v7 | 웹 배포 (SPA) | Docker/nginx SPA 패턴 |

### 어떤 걸 쓸까?

- **엔진 코어 개발/테스트** → `msw-engine` (Vite dev server로 바로 실행)
- **웹에 배포할 게임** → `msw-react-router-spa` (Docker/nginx, React Router 라우팅 포함)

두 보일러플레이트의 엔진 코드는 **독립 사본**이다. `degit` 호환을 위해 monorepo 패키지 의존성을 사용하지 않는다.

---

## 핵심 아키텍처 (3줄 요약)

**Scene -> GameObject -> Trait** 조합 패턴.
어댑터로 렌더링 엔진 교체 가능 (Canvas 2D / Phaser / PixiJS).
AI는 `templates/` 안의 scenes, objects만 작성 — 엔진 코드는 건드리지 않는다.

```
templates/{genre}/
├── game.json           # 게임 정의 (메타, 에셋, 씬, 인풋맵, 규칙)
├── {Genre}Game.ts      # 게임 초기화 + 렌더 파이프라인
├── scenes/             # 화면 흐름 (씬 단위)
└── objects/            # 게임 오브젝트 (팩토리 함수)
```

---

## 현재 구현 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| Canvas 2D 어댑터 | 완료 | 렌더링, AABB 물리, Web Audio, 키보드 입력 |
| 8개 기본 Trait | 완료 | Movable, Jumpable, Damageable, Scorer, Timer, Tappable, Collidable, Animated |
| 플랫포머 템플릿 | 완료 | 3개 씬 (Title/Play/GameOver), 4종 오브젝트 |
| React Router 통합 | 완료 | SPA 배포용 (`/play` 라우트) |
| 메모리 최적화 | 완료 | TransformBuffer (Float32Array), ObjectPool, EventPool |
| Phaser 어댑터 | 미구현 | `stack.adapter: "phaser"` 선언만 존재 |
| PixiJS 어댑터 | 미구현 | 설계만 존재 |
| 멀티플레이 | 미구현 | 설계 문서만 존재 |

---

## 빠른 시작

### msw-engine (엔진 개발/테스트)

```bash
cd game/msw-engine
pnpm install
pnpm dev        # Vite dev server (HMR)
pnpm build      # tsc && vite build
pnpm typecheck  # tsc --noEmit
```

### msw-react-router-spa (웹 배포)

```bash
cd game/msw-react-router-spa
pnpm install
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build
pnpm typecheck  # react-router typegen && tsc
```

---

## 핵심 주의사항

**Scene에서 input을 직접 poll하지 말 것.** `update(dt, collisions, input)` 파라미터를 사용한다.

```typescript
// 틀린 코드 -- justPressed가 소실됨
update(dt: number) {
  const input = this.game!.adapter.input.poll();  // NEVER!
}

// 올바른 코드 -- 파라미터로 받은 input 사용
update(dt: number, collisions: Collision[], input?: InputState): void {
  if (input?.justPressed.has("jump")) { /* ... */ }
}
```

`poll()`은 호출 시 `justPressed`/`justReleased`를 즉시 초기화한다. Game.ts의 `onUpdate`에서 이미 한 번 poll하므로, 씬에서 다시 호출하면 입력이 손실된다 (commit `01ea4e1`에서 수정된 버그).

---

## 기술 스택

- **런타임**: Node.js 22 (`.nvmrc`)
- **패키지 매니저**: pnpm v10.12+ (`corepack enable`)
- **빌드**: Vite 7 (msw-engine), React Router v7 (msw-react-router-spa)
- **스타일링**: Tailwind CSS v4, shadcn/ui
- **경로 별칭**: `~/*` -> `./src/*` (msw-engine) / `~/*` -> `./app/*` (msw-react-router-spa)

---

## 상세 문서

- [아키텍처 상세](docs/index.md) — 엔진 모듈, Trait 시스템, 어댑터, 렌더 파이프라인, 메모리 최적화
- [개발 가이드](docs/contributing.md) — 새 템플릿/Trait/어댑터 추가법, 프로젝트 구조, 로드맵
- [AI 생성 프로토콜](docs/ai-guide.md) — AI가 게임을 만드는 6단계 프로토콜, Trait 조합 레시피, 코드 패턴
