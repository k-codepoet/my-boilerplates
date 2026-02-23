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
어댑터로 렌더링 엔진 런타임 교체 가능 (**Canvas 2D / PixiJS v8 / Three.js / Phaser 3**) — `stack.adapter` 설정 한 줄로 전환.
AI는 `templates/` 안의 scenes, objects만 작성 — 엔진 코드는 건드리지 않는다.

```
templates/{genre}/
├── game.json           # 게임 정의 (메타, 에셋, 씬, 인풋맵, 규칙)
├── {Genre}Game.ts      # 게임 초기화 + 렌더 파이프라인
├── scenes/             # 화면 흐름 (씬 단위)
└── objects/            # 게임 오브젝트 (팩토리 함수)
```

**리소스 파이프라인 (2가지 모드):**
- **Programmatic**: `OffscreenCanvas`로 스프라이트를 런타임 생성 → `ImageBitmap` → 어댑터에 전달
- **File-based**: `exportSpritePNGs` 실행 → `public/assets/` PNG 저장 → 파일 경로로 로드

좌표계: 게임플레이는 **좌상단 원점**, 렌더러는 **중심 원점** — `getRenderTransform()`으로 자동 변환.

---

## 현재 구현 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| Canvas 2D 어댑터 | ✅ 완료 | 렌더링, AABB 물리, Web Audio, 키보드 입력 |
| PixiJS v8 어댑터 | ✅ 완료 | Sprite/Graphics 렌더링, 런타임 전환 |
| Three.js 어댑터 | ✅ 완료 | 2.5D 렌더링, OrthographicCamera, 런타임 전환 |
| Phaser 3 어댑터 | ✅ 완료 | Physics + Scene 래핑, 런타임 전환 |
| 어댑터 런타임 토글 | ✅ 완료 | `stack.adapter` 설정 한 줄로 4종 전환 |
| 프로그래매틱 스프라이트 | ✅ 완료 | OffscreenCanvas → ImageBitmap 파이프라인 |
| 리소스 파이프라인 | ✅ 완료 | Programmatic / File-based 모드 토글 |
| 좌표 변환 | ✅ 완료 | `getRenderTransform()` — 게임플레이↔렌더러 원점 변환 |
| 점프 물리 수정 | ✅ 완료 | 좌표계 일관성 (commit `54d1665`) |
| 게임플레이 동기화 | ✅ 완료 | Canvas/Pixi/Three/Phaser 동일 게임플레이 결과 |
| 8개 기본 Trait | ✅ 완료 | Movable, Jumpable, Damageable, Scorer, Timer, Tappable, Collidable, Animated |
| 플랫포머 템플릿 | ✅ 완료 | 3개 씬 (Title/Play/GameOver), 4종 오브젝트 |
| React Router 통합 | ✅ 완료 | SPA 배포용 (`/play` 라우트) |
| 메모리 최적화 | ✅ 완료 | TransformBuffer (Float32Array), ObjectPool, EventPool |
| 멀티플레이 | ❌ 미구현 | 설계 문서만 존재 |

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

## 다음 작업 (Next Steps)

- [ ] Pixi/Three/Phaser 어댑터 렌더링 테스트 (Canvas만 게임플레이 확인됨)
- [ ] PNG 파일 생성 (`exportSpritePNGs` 실행 → `public/assets/platformer/`)
- [ ] File-based 모드 독립 동작 확인 (Programmatic 없이 PNG만으로 실행)
- [ ] `msw-react-router-spa`에 엔진 코드 동기화 (현재 msw-engine과 독립 사본으로 분기됨)
- [ ] 추가 게임 템플릿 (클리커, 퍼즐)
- [ ] CI 파이프라인 추가 (현재 CI 미포함)
- [ ] 테스트 프레임워크 도입 (현재 typecheck만 존재)

---

## 상세 문서

- [아키텍처 상세](docs/index.md) — 엔진 모듈, Trait 시스템, 어댑터, 렌더 파이프라인, 메모리 최적화
- [개발 가이드](docs/contributing.md) — 새 템플릿/Trait/어댑터 추가법, 프로젝트 구조, 로드맵
- [AI 생성 프로토콜](docs/ai-guide.md) — AI가 게임을 만드는 6단계 프로토콜, Trait 조합 레시피, 코드 패턴
