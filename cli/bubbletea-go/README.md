# Bubbletea CLI Boilerplate

Go TUI 애플리케이션 (Charm 생태계) + npm 배포 구조.

## 구조

```
├── go.mod                  # Go 모듈 설정
├── cmd/main.go             # TUI 앱 코드
├── npm/                    # npm 배포용
│   ├── package.json        # 메인 패키지 (JS wrapper)
│   └── bin/
│       ├── cli.js          # 실행 진입점
│       └── install.js      # 플랫폼별 바이너리 로더
└── .github/workflows/
    └── release.yml         # 크로스 플랫폼 빌드 + npm 배포
```

## 개발

```bash
# 의존성 설치
go mod tidy

# 로컬 실행
go run ./cmd

# 빌드
go build -o mycli ./cmd
```

## npm 배포 구조

태그 푸시 시 자동 배포:

```
@mycli/cli              # 메인 패키지 (JS wrapper)
@mycli/cli-darwin-arm64 # macOS ARM64
@mycli/cli-darwin-x64   # macOS x64
@mycli/cli-linux-arm64  # Linux ARM64
@mycli/cli-linux-x64    # Linux x64
@mycli/cli-win32-arm64  # Windows ARM64
@mycli/cli-win32-x64    # Windows x64
```

## 배포 방법

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions가 6개 플랫폼 빌드 후 npm에 자동 배포.

## 사용자 설치

```bash
npm install -g @mycli/cli
mycli
```

## Charm 생태계

- [Bubbletea](https://github.com/charmbracelet/bubbletea) - TUI 프레임워크 (Elm 아키텍처)
- [Lipgloss](https://github.com/charmbracelet/lipgloss) - 스타일링
- [Bubbles](https://github.com/charmbracelet/bubbles) - 재사용 컴포넌트
