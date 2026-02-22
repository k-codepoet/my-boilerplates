# CLI/TUI 보일러플레이트

> 3개의 CLI/TUI 애플리케이션 보일러플레이트. Rust / Go / TypeScript로 동일한 카운터 TUI를 구현합니다.

## 보일러플레이트 목록

| 이름 | 언어 | TUI 라이브러리 | 아키텍처 패턴 | 배포 | 한 줄 설명 |
|------|------|---------------|-------------|------|-----------|
| [ratatui-rs](./ratatui-rs/) | Rust | Ratatui + Crossterm | 직접 렌더링 루프 | npm (바이너리) | 최소 바이너리(~2-4MB), 최고 성능 |
| [bubbletea-go](./bubbletea-go/) | Go | Bubbletea + Lipgloss | Elm MVU | npm (바이너리) | 밸런스, 크로스컴파일 최강 |
| [ink-ts](./ink-ts/) | TypeScript | Ink + React | React Hooks + JSX | npm (Node.js) | React 개발자 친화적 |

## 선택 가이드

- **바이너리 크기 최소** → `ratatui-rs` — opt-level="z" + LTO + strip으로 2-4MB
- **크로스 컴파일 효율** → `bubbletea-go` — GOOS/GOARCH 환경변수만으로 6개 플랫폼 빌드, CI 러너 1개
- **React 개발자** → `ink-ts` — JSX, hooks, Flexbox 등 웹 React와 동일한 멘탈 모델
- **npm 글로벌 설치** → Rust 또는 Go — `npm install -g @mycli/cli`로 네이티브 바이너리 설치
- **빠른 프로토타이핑** → `ink-ts` — 바이너리 빌드 파이프라인 불필요, `tsc`만으로 완료

```
네이티브 바이너리 필요?
├─ YES → 크기 최우선? → Rust / 아니면 → Go
└─ NO  → Node.js OK? → TypeScript
```

## npm 크로스플랫폼 배포 패턴

Rust/Go 공통으로 내장된 핵심 패턴입니다:

- **메인 패키지** (`@mycli/cli`) + **6개 플랫폼 옵셔널 디펜던시** (`darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, `win32-arm64`, `win32-x64`)
- npm이 현재 OS/CPU에 맞는 바이너리만 자동 설치, `npx` 호환
- `bin/cli.js` (실행 래퍼) + `bin/install.js` (플랫폼 감지) 구조

## 빠른 시작

### ratatui-rs (Rust)

```bash
cargo run              # 로컬 실행
cargo build --release  # 릴리즈 빌드 (~2-4MB)
# 배포: git tag v0.1.0 && git push origin v0.1.0 → CI 자동
```

### bubbletea-go (Go)

```bash
go mod tidy            # 의존성 설치
go run ./cmd           # 로컬 실행
go build -o mycli ./cmd  # 빌드 (~5-8MB)
# 배포: git tag v0.1.0 && git push origin v0.1.0 → CI 자동
```

### ink-ts (TypeScript)

```bash
pnpm dev               # tsx watch (HMR)
pnpm build             # tsc → dist/
pnpm typecheck         # tsc --noEmit
# 배포: npm publish (prepublishOnly가 자동 빌드)
```

## 비교 요약

| 항목 | ratatui-rs | bubbletea-go | ink-ts |
|------|-----------|-------------|--------|
| 바이너리 크기 | ~2-4MB | ~5-8MB | N/A (Node.js) |
| 런타임 | 없음 | 없음 | Node.js 20+ |
| CI 러너 | 3개 OS | 1개 (ubuntu) | 불필요 |
| 크로스 컴파일 | 타겟별 툴체인 | 환경변수만 | 불필요 |
| 의존성 수 | 3 crates | 2 modules | 5 packages |
| 타입 안전성 | 컴파일 타임 (강) | 컴파일 타임 (중) | 빌드 타임 (strict) |

## 상세 문서

- [아키텍처 상세](docs/index.md) — 각 보일러플레이트 내부 구조, CI/CD 파이프라인, npm 배포 패턴 상세
