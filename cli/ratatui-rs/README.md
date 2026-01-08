# Ratatui CLI Boilerplate

Rust TUI 애플리케이션 + npm 배포 구조.

## 구조

```
├── Cargo.toml              # Rust 프로젝트 설정
├── src/main.rs             # TUI 앱 코드
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
# 로컬 빌드 & 실행
cargo run

# 릴리즈 빌드
cargo build --release
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
