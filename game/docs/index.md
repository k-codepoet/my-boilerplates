# MSW Game Engine 문서

> MSW(Micro Scene World) Engine의 아키텍처와 개발 가이드.

## 아키텍처

| 문서 | 설명 |
|------|------|
| [01-vision.md](01-vision.md) | 비전과 설계 철학 — "아무나 게임을 만들 수 있게", 계층 구조 개요 |
| [02-engine-modules.md](02-engine-modules.md) | 엔진 코어 모듈 — Game, Scene, GameObject, GameLoop, EventBus, GameState, 입력/렌더/템플릿 |
| [03-trait-system.md](03-trait-system.md) | Trait 시스템 — 8개 Trait 상세, 조합 패턴 |
| [04-adapter-pattern.md](04-adapter-pattern.md) | 어댑터 패턴 — EngineAdapterInterface, Canvas 어댑터 구현, 새 어댑터 추가 가이드 |
| [05-memory-optimization.md](05-memory-optimization.md) | 메모리 최적화 — TransformBuffer, ObjectPool, EventPool, CommandPool |
| [06-react-integration.md](06-react-integration.md) | React 통합 — GameCanvas 패턴, 60FPS/10Hz 이중 루프, React Router SPA 변형 |

## 개발 가이드

| 문서 | 설명 |
|------|------|
| [contributing.md](contributing.md) | 개발 가이드 — 새 템플릿/Trait/어댑터 추가법, 프로젝트 구조, 로드맵 |
| [ai-guide.md](ai-guide.md) | AI 생성 프로토콜 — AI가 게임을 만드는 6단계 프로토콜, Trait 조합 레시피, 코드 패턴 |
