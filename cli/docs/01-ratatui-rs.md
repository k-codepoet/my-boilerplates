# Rust + Ratatui 보일러플레이트 아키텍처

## 아키텍처

**직접 렌더링 루프 패턴** — 프레임워크 없이 `loop`로 직접 이벤트 폴링과 렌더링을 제어합니다.

```
main() → 터미널 설정 → run() 루프 → 터미널 복원
                            ↓
                   ┌────────┴────────┐
                   │    draw()       │
                   │  (위젯 렌더링)   │
                   ├─────────────────┤
                   │  event::poll()  │
                   │  (100ms 대기)    │
                   ├─────────────────┤
                   │  입력 처리       │
                   │  (상태 변경)     │
                   └─────────────────┘
```

**터미널 설정 (raw mode + alternate screen)**:
```rust
// 설정: raw mode 활성화 → 대체 화면 진입 → 백엔드 생성
enable_raw_mode()?;
io::stdout().execute(EnterAlternateScreen)?;
let mut terminal = Terminal::new(CrosstermBackend::new(io::stdout()))?;

// 복원: raw mode 해제 → 대체 화면 복귀
disable_raw_mode()?;
io::stdout().execute(LeaveAlternateScreen)?;
```

**이벤트 루프**: `crossterm::event::poll(Duration::from_millis(100))`로 100ms 간격 폴링. non-blocking이므로 UI가 멈추지 않습니다.

**위젯 렌더링**:
- `Block` — 테두리와 제목이 있는 컨테이너
- `Paragraph` — 텍스트 블록 (정렬, 줄바꿈 지원)
- `Borders::ALL` — 사방 테두리
- `Style` — fg/bg 색상, bold 등 스타일링
- `Span` / `Line` — 인라인 텍스트 조각 / 한 줄

**상태 관리**: 단순 `counter: i32` 변수. 복잡한 앱에서는 `struct AppState`로 확장합니다.

**입력 처리**: `KeyEventKind::Press`만 필터링하여 키 반복(repeat) 이벤트를 무시합니다.
- `q` / `Esc` → 루프 종료
- `↑` / `k` → counter 증가
- `↓` / `j` → counter 감소

## 의존성

```toml
[dependencies]
ratatui = "0.29"     # TUI 프레임워크
crossterm = "0.28"   # 크로스플랫폼 터미널 제어
color-eyre = "0.6"   # 에러 리포팅
```

## 빌드 최적화

`Cargo.toml`의 release 프로필이 바이너리 크기를 극도로 최소화합니다:

```toml
[profile.release]
opt-level = "z"       # 크기 최적화 (속도 대신 크기 우선)
lto = true            # Link-Time Optimization (전체 프로그램 최적화)
codegen-units = 1     # 단일 코드 생성 유닛 (더 나은 최적화, 느린 컴파일)
panic = "abort"       # unwinding 제거 (바이너리 크기 감소)
strip = true          # 디버그 심볼 제거
```

이 설정으로 일반적으로 **~2-4MB** 수준의 작은 바이너리를 생성합니다.

## npm 배포

[npm 크로스플랫폼 바이너리 배포 패턴](04-npm-distribution.md) 참조.

## CI/CD (release.yml)

**트리거**: `v*` 태그 push (예: `git tag v0.1.0 && git push origin v0.1.0`)

**빌드 단계 — 6개 병렬 빌드**:
```
┌─────────────────────────────────────────────────────────────┐
│  build (strategy.matrix × 6)                                │
│                                                             │
│  macos-latest:                                              │
│    ├─ x86_64-apple-darwin       → npm-darwin-x64            │
│    └─ aarch64-apple-darwin      → npm-darwin-arm64          │
│                                                             │
│  ubuntu-latest:                                             │
│    ├─ x86_64-unknown-linux-gnu  → npm-linux-x64             │
│    └─ aarch64-unknown-linux-gnu → npm-linux-arm64           │
│       (gcc-aarch64-linux-gnu 크로스 컴파일러 설치)            │
│                                                             │
│  windows-latest:                                            │
│    ├─ x86_64-pc-windows-msvc    → npm-win32-x64             │
│    └─ aarch64-pc-windows-msvc   → npm-win32-arm64           │
└──────────────────────────┬──────────────────────────────────┘
                           │ artifacts 업로드
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  publish (ubuntu-latest)                                     │
│                                                              │
│  1. 모든 artifact 다운로드                                    │
│  2. 6개 플랫폼 패키지 순차 publish                             │
│     (@mycli/cli-darwin-arm64, ...-x64, ...-linux-*, ...-win32-*)│
│  3. 메인 패키지 (@mycli/cli) 버전 업데이트 후 publish          │
└──────────────────────────────────────────────────────────────┘
```

**Rust 특이사항**: macOS/Windows는 네이티브 러너에서 빌드하고, Linux ARM64만 `ubuntu-latest`에서 크로스 컴파일합니다 (`gcc-aarch64-linux-gnu` 설치 필요).

## 명령어 요약

```bash
# 개발
cargo run                                     # 로컬 실행
cargo run --release                           # 릴리즈 모드 실행

# 빌드
cargo build --release                         # 릴리즈 빌드
cargo build --release --target aarch64-apple-darwin  # 크로스 컴파일

# 배포 (태그 push → CI 자동)
git tag v0.1.0 && git push origin v0.1.0
```
