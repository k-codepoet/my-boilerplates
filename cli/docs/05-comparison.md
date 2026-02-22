# 보일러플레이트 비교 및 선택 가이드

## 비교 매트릭스

| 항목 | ratatui-rs | bubbletea-go | ink-ts |
|---|---|---|---|
| **언어** | Rust | Go 1.23 | TypeScript |
| **프레임워크** | Ratatui 0.29 | Bubbletea v1.2.4 | Ink 5.1 |
| **TUI 라이브러리** | crossterm 0.28 | Lipgloss 1.0 | Yoga (Flexbox) |
| **아키텍처 패턴** | 직접 렌더링 루프 | Elm MVU (Model-View-Update) | React Hooks + JSX |
| **바이너리 크기** | ~2-4MB | ~5-8MB | N/A (Node.js 필요) |
| **배포 방식** | npm (바이너리 래퍼) | npm (바이너리 래퍼) | npm (순수 JS) |
| **CI 러너** | 3개 OS (macOS/Ubuntu/Windows) | ubuntu-latest 1개 | 불필요 |
| **입력 패턴** | `event::poll()` + `event::read()` | `tea.KeyMsg` (Update 함수) | `useInput()` Hook |
| **스타일링** | `Style::default().fg().bold()` | `lipgloss.NewStyle()` 체이닝 | JSX props (`color`, `bold`) |
| **런타임 요구사항** | 없음 (네이티브) | 없음 (네이티브) | Node.js 20+ |
| **의존성 수** | 3 crates | 2 modules | 5 packages |
| **에러 처리** | `color_eyre::Result<()>` | `fmt.Fprintf(os.Stderr, ...)` | React 에러 바운더리 |
| **레이아웃** | 위젯 기반 (area 계산) | 문자열 조합 | Flexbox (CSS-like) |
| **타입 안전성** | 컴파일 타임 (강) | 컴파일 타임 (중) | 빌드 타임 (strict mode) |
| **크로스 컴파일** | 타겟별 툴체인 필요 | 환경변수만 변경 | 불필요 |

## 선택 가이드

### 바이너리 크기 최소화가 중요 → **Rust (ratatui-rs)**
- `opt-level="z"` + `lto` + `strip`으로 2-4MB 바이너리
- 임베디드 환경이나 엣지 디바이스 배포에 적합
- 메모리 사용량도 가장 낮음

### 크로스 컴파일 효율이 중요 → **Go (bubbletea-go)**
- `GOOS`/`GOARCH` 환경변수만으로 모든 플랫폼 빌드
- CI에서 `ubuntu-latest` 단일 러너로 6개 타겟 빌드 (비용 절감)
- 빌드 시간: 수 초 (Rust의 수 분 대비)

### React 개발자가 빠르게 시작 → **TypeScript (ink-ts)**
- JSX, hooks, Flexbox 등 웹 React와 동일한 멘탈 모델
- `@inkjs/ui` 라이브러리로 Spinner, Select, TextInput 등 즉시 사용 가능
- `tsx watch`로 HMR 개발

### npm 글로벌 설치 경험이 필요 → **Rust 또는 Go**
- 두 보일러플레이트 모두 동일한 [npm 크로스플랫폼 배포 패턴](04-npm-distribution.md) 내장
- 사용자는 `npm install -g @mycli/cli` 한 줄로 네이티브 바이너리 설치
- TypeScript도 npm publish 가능하지만, Node.js 런타임이 필요

### 빠른 개발 속도 → **TypeScript (ink-ts)**
- 바이너리 빌드/배포 파이프라인 불필요
- `tsc`만으로 빌드 완료
- React 생태계의 풍부한 패턴과 라이브러리 활용

## 결정 플로우차트

```
네이티브 바이너리가 필요한가?
├─ YES → 바이너리 크기가 최우선인가?
│        ├─ YES → Rust (ratatui-rs)
│        └─ NO  → 빌드 효율/팀 경험?
│                 ├─ Go 경험 있음 → Go (bubbletea-go)
│                 └─ Rust 경험 있음 → Rust (ratatui-rs)
│
└─ NO  → Node.js 런타임 OK?
         ├─ YES → TypeScript (ink-ts)
         └─ NO  → Rust 또는 Go 선택
```
