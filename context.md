# context.md — 작업 현황 대시보드

> 전체 카테고리별 구현 상태와 다음 작업을 한눈에 파악하는 문서.
> 각 카테고리의 상세는 해당 README.md를 참조.

## 전체 상태 요약

| 카테고리 | 보일러플레이트 | 상태 | 다음 우선순위 | 상세 |
|----------|--------------|------|-------------|------|
| **web/** | 6종 | ✅ 안정 | CI 강화, 테스트 도입 | [web/README.md](web/README.md#다음-작업) |
| **cli/** | 3종 | ✅ 안정 | CI 파이프라인 검증, 테스트 도입 | [cli/README.md](cli/README.md#다음-작업) |
| **native-app/** | 2종 | ✅ 안정 | 자동 업데이트 검증, CI 추가 | [native-app/README.md](native-app/README.md#다음-작업) |
| **bot/** | 3종 | ✅ 안정 | 프로세서 확장, 테스트 도입 | [bot/README.md](bot/README.md#다음-작업) |
| **game/** | 2종 | 🔧 활발히 개발중 | 어댑터 렌더링 테스트, PNG 생성 | [game/README.md](game/README.md#다음-작업-next-steps) |

## 카테고리별 현황

### web/ — 웹 프론트엔드/풀스택 (6종)

**완료:** 6개 보일러플레이트 구현 (React Router SSR/SPA x Docker/Cloudflare, TanStack Start SSR, TanStack Router SPA). degit 호환, CI 검증 (GitHub Actions + GitLab CI), Cloudflare 배포 파이프라인.

**다음:** [web/README.md](web/README.md#다음-작업)

### cli/ — CLI/TUI (3종)

**완료:** 3개 보일러플레이트 구현 (Rust Ratatui, Go Bubbletea, TypeScript Ink). npm 크로스플랫폼 배포 패턴 (6 platform optional deps), CI 빌드 파이프라인.

**다음:** [cli/README.md](cli/README.md#다음-작업)

### native-app/ — 데스크톱 앱 (2종)

**완료:** Tauri v2 기반 2개 보일러플레이트 (React Router 멀티페이지, React 싱글페이지). 플러그인 시스템 (fs, dialog, shell, updater, process), capabilities 권한 관리.

**다음:** [native-app/README.md](native-app/README.md#다음-작업)

### bot/ — Bot/Processor (3종)

**완료:** Slack Bot 3종 (TS Socket Mode, TS Cloudflare Workers, Python Socket Mode). 프로세서 레지스트리/가드 패턴, D1 데이터 영속 (Cloudflare).

**다음:** [bot/README.md](bot/README.md#다음-작업)

### game/ — 게임 엔진 (2종) 🔧

**완료:** MSW Engine 코어, 4개 어댑터 (Canvas/PixiJS/Three.js/Phaser), 프로그래매틱 스프라이트, 리소스 파이프라인 듀얼 모드, 좌표 변환, 플랫포머 템플릿, React Router SPA 변형.

**진행중/다음:** 어댑터 렌더링 테스트 → PNG 생성 → File-based 모드 검증 → SPA 동기화 → 추가 템플릿.
상세: [game/README.md](game/README.md#다음-작업-next-steps)

---

## 공통 미완료 항목

- [ ] 테스트 프레임워크 도입 (전 카테고리, 현재 typecheck만 존재)
- [ ] game CI 파이프라인 추가 (다른 카테고리는 CI 존재)
- [ ] `lib/` 공유 패키지 구체화 (현재 placeholder)
