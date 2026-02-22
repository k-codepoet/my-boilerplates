# Go + Bubbletea 보일러플레이트 아키텍처

## 아키텍처

**Elm MVU (Model-View-Update) 패턴** — Bubbletea는 Elm 아키텍처를 Go로 구현한 프레임워크입니다. 상태 관리가 프레임워크에 의해 구조화됩니다.

```
tea.NewProgram(model{})
        │
        ▼
┌───────────────────┐
│   Init() tea.Cmd  │ ← 초기화 (여기서는 nil)
└───────┬───────────┘
        ▼
┌───────────────────────────────────────┐
│              메인 루프                  │
│                                       │
│  ┌──────────┐   tea.Msg   ┌────────┐  │
│  │ Update() │ ◄────────── │ 이벤트  │  │
│  │          │             └────────┘  │
│  └────┬─────┘                         │
│       │ (tea.Model, tea.Cmd)          │
│       ▼                               │
│  ┌──────────┐                         │
│  │  View()  │ → string (화면 출력)     │
│  └──────────┘                         │
└───────────────────────────────────────┘
```

**Model**: 애플리케이션 상태를 정의하는 struct
```go
type model struct {
    counter int
}
```

**Init()**: 프로그램 시작 시 실행할 초기 Command를 반환합니다. 카운터 앱에서는 `nil` (초기 작업 없음).

**Update()**: 메시지를 받아 상태를 변경하고, 새 Model + 선택적 Command를 반환합니다.
- `tea.KeyMsg` — 키보드 입력 메시지
- `tea.Quit` — 프로그램 종료 커맨드
- `msg.String()` — "up", "down", "k", "j", "q", "esc", "ctrl+c" 등

**View()**: 현재 상태를 문자열로 렌더링합니다. Bubbletea가 diff를 계산하여 변경 부분만 업데이트합니다.

**프로그램 초기화**:
```go
p := tea.NewProgram(model{counter: 0}, tea.WithAltScreen())
```
`tea.WithAltScreen()`으로 대체 화면을 사용합니다.

**Lipgloss 스타일링**:
```go
titleStyle   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("14")).Border(lipgloss.RoundedBorder()).Padding(0, 1)
counterStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("11")).Bold(true)
helpStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
```
ANSI 256색 코드로 색상을 지정하며, Border/Padding/Bold 등 CSS-like API를 제공합니다.

## 의존성

```go
require (
    github.com/charmbracelet/bubbletea v1.2.4   // TUI 프레임워크 (Elm MVU)
    github.com/charmbracelet/lipgloss  v1.0.0   // 스타일링 라이브러리
)
```

## 빌드

```bash
# 크로스 컴파일 예시
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o mycli ./cmd
```

- `CGO_ENABLED=0` — 정적 링킹 (외부 C 라이브러리 의존성 제거)
- `-ldflags="-s -w"` — 심볼 테이블(-s)과 DWARF 디버그 정보(-w) 제거
- 결과: **~5-8MB** 수준의 단일 바이너리

## npm 배포

[npm 크로스플랫폼 바이너리 배포 패턴](04-npm-distribution.md) 참조.

## CI/CD (release.yml)

**트리거**: `v*` 태그 push

**Go의 빌드 효율**: `ubuntu-latest` 단일 러너에서 환경변수(`GOOS`, `GOARCH`)만 변경하여 6개 플랫폼 모두 빌드합니다. Rust와 달리 크로스 컴파일러 설치가 불필요합니다.

```
┌──────────────────────────────────────────────────────────┐
│  build (ubuntu-latest × 6 matrix)                        │
│                                                          │
│  모두 동일 러너에서:                                       │
│    GOOS=darwin  GOARCH=amd64  → npm-darwin-x64            │
│    GOOS=darwin  GOARCH=arm64  → npm-darwin-arm64          │
│    GOOS=linux   GOARCH=amd64  → npm-linux-x64             │
│    GOOS=linux   GOARCH=arm64  → npm-linux-arm64           │
│    GOOS=windows GOARCH=amd64  → npm-win32-x64             │
│    GOOS=windows GOARCH=arm64  → npm-win32-arm64           │
└──────────────────────┬───────────────────────────────────┘
                       │ artifacts 업로드
                       ▼
┌──────────────────────────────────────────────────────────┐
│  publish (Rust와 동일한 패턴)                              │
│  6개 플랫폼 패키지 + 메인 패키지 npm publish               │
└──────────────────────────────────────────────────────────┘
```

**CI 비용 차이**: Rust는 3개 OS 러너(macos/ubuntu/windows)를 사용하지만, Go는 `ubuntu-latest` 하나로 충분합니다. 빌드 시간과 비용 모두 Go가 유리합니다.

## 명령어 요약

```bash
# 개발
go run ./cmd                                  # 로컬 실행
go mod tidy                                   # 의존성 정리

# 빌드
go build -o mycli ./cmd                       # 로컬 빌드
CGO_ENABLED=0 go build -ldflags="-s -w" -o mycli ./cmd  # 최적화 빌드

# 크로스 컴파일
GOOS=darwin GOARCH=arm64 go build -o mycli-darwin-arm64 ./cmd

# 배포 (태그 push → CI 자동)
git tag v0.1.0 && git push origin v0.1.0
```
