# Tauri v2 공통 아키텍처

Tauri v2 기반 데스크톱 앱 보일러플레이트 2종의 공통 아키텍처.

## 개요

| 보일러플레이트 | 설명 | 프론트엔드 | 라우팅 |
|---|---|---|---|
| `tauri-react-router` | 멀티 페이지 데스크톱 앱 | React Router v7 (SPA 모드) | 사이드바 + 페이지 전환 |
| `tauri-react` | 싱글 페이지 데스크톱 앱 | 순수 React + Vite | 없음 (단일 컴포넌트) |

**공통 기술 스택:**
- **백엔드**: Tauri v2 (Rust)
- **프론트엔드**: React 19, TypeScript (strict mode)
- **스타일링**: Tailwind CSS v4, shadcn/ui (neutral 베이스), Inter 폰트
- **아이콘**: lucide-react
- **빌드**: Vite 7
- **플러그인**: fs, dialog, shell, updater, process (5종 동일)

## Tauri v2 기본 구조

```
┌─────────────────────────────────────────────┐
│              Tauri 윈도우 (WebView)            │
│  ┌───────────────────────────────────────┐  │
│  │         프론트엔드 (React/Vite)         │  │
│  │                                       │  │
│  │  React 컴포넌트                        │  │
│  │    ↓ @tauri-apps/plugin-* 호출        │  │
│  │    ↓                                  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │           IPC 브릿지             │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                    ↕ IPC                     │
│  ┌───────────────────────────────────────┐  │
│  │         백엔드 (Rust/Tauri)            │  │
│  │                                       │  │
│  │  tauri::Builder                       │  │
│  │    .plugin(tauri_plugin_fs)           │  │
│  │    .plugin(tauri_plugin_dialog)       │  │
│  │    .plugin(tauri_plugin_shell)        │  │
│  │    .plugin(tauri_plugin_updater)      │  │
│  │    .plugin(tauri_plugin_process)      │  │
│  └───────────────────────────────────────┘  │
│                    ↕                        │
│  ┌───────────────────────────────────────┐  │
│  │         OS API (파일, 프로세스 등)       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

프론트엔드에서 `@tauri-apps/plugin-*` 패키지를 호출하면, IPC를 통해 Rust 백엔드의 해당 플러그인이 OS 네이티브 API를 실행한다. 브라우저에서는 접근할 수 없는 파일 시스템, 시스템 다이얼로그, 프로세스 제어 등을 안전하게 사용할 수 있다.

## 플러그인 시스템

Rust 백엔드(`src-tauri/src/main.rs`)에서 플러그인을 등록한다:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())          // 파일 시스템
        .plugin(tauri_plugin_dialog::init())      // 시스템 다이얼로그
        .plugin(tauri_plugin_shell::init())       // 외부 프로그램/URL 열기
        .plugin(tauri_plugin_updater::Builder::new().build())  // 자동 업데이트
        .plugin(tauri_plugin_process::init())     // 프로세스 제어 (재시작/종료)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**플러그인별 역할:**

| 플러그인 | Rust 크레이트 | JS 패키지 | 용도 |
|---|---|---|---|
| fs | `tauri-plugin-fs` | `@tauri-apps/plugin-fs` | 파일 읽기/쓰기/삭제/복사 |
| dialog | `tauri-plugin-dialog` | `@tauri-apps/plugin-dialog` | 파일 열기/저장 다이얼로그, 확인/알림 |
| shell | `tauri-plugin-shell` | `@tauri-apps/plugin-shell` | URL/경로를 시스템 기본 앱으로 열기 |
| updater | `tauri-plugin-updater` | `@tauri-apps/plugin-updater` | 앱 자동 업데이트 확인/다운로드/설치 |
| process | `tauri-plugin-process` | `@tauri-apps/plugin-process` | 앱 재시작/종료 |

Rust(`Cargo.toml`)와 JavaScript(`package.json`) 양쪽에 의존성을 추가해야 한다. Rust 쪽은 `tauri-plugin-*`, JS 쪽은 `@tauri-apps/plugin-*`.

## Capabilities (권한 시스템)

Tauri v2는 보안을 위해 **capabilities** 기반 권한 시스템을 사용한다. 프론트엔드에서 호출 가능한 API를 명시적으로 선언해야 한다.

**파일 위치:** `src-tauri/capabilities/default.json`

```
src-tauri/capabilities/
└── default.json          # 메인 윈도우 권한 정의
```

**권한 구조:**

```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read",
    "fs:allow-write",
    "dialog:allow-open",
    "dialog:allow-save",
    "shell:allow-open",
    "updater:allow-check",
    "updater:allow-download-and-install",
    "process:allow-restart",
    "process:allow-exit"
  ]
}
```

**핵심 권한 목록 (두 보일러플레이트 공통):**

| 카테고리 | 권한 | 설명 |
|---|---|---|
| core | `core:default` | Tauri 기본 API |
| fs | `fs:allow-read`, `fs:allow-write` | 파일 읽기/쓰기 |
| fs | `fs:allow-home-read`, `fs:allow-home-write` | 홈 디렉토리 접근 |
| fs | `fs:allow-desktop-*`, `fs:allow-document-*`, `fs:allow-download-*` | 표준 폴더 접근 |
| fs | `fs:allow-applocaldata-*` | 앱 로컬 데이터 접근 |
| fs | `fs:allow-exists`, `fs:allow-mkdir`, `fs:allow-remove`, `fs:allow-rename`, `fs:allow-copy-file` | 파일 조작 |
| dialog | `dialog:allow-open`, `dialog:allow-save` | 파일 다이얼로그 |
| dialog | `dialog:allow-message`, `dialog:allow-ask`, `dialog:allow-confirm` | 알림/확인 다이얼로그 |
| shell | `shell:allow-open` | 외부 URL/경로 열기 |
| updater | `updater:allow-check`, `updater:allow-download-and-install` | 업데이트 확인/설치 |
| process | `process:allow-restart`, `process:allow-exit` | 앱 재시작/종료 |

> 선언되지 않은 API를 프론트엔드에서 호출하면 런타임에 차단된다. 새 기능 추가 시 capabilities에 권한을 먼저 추가해야 한다.

## 빌드 최적화

Rust 릴리스 빌드 설정 (`Cargo.toml`):

```toml
[profile.release]
panic = "abort"        # 패닉 시 스택 해제 생략 → 바이너리 축소
codegen-units = 1      # 단일 코드 생성 단위 → 최적화 극대화
lto = true             # Link Time Optimization → 크로스 모듈 최적화
opt-level = "s"        # 크기 최적화 (속도 대신 바이너리 크기)
strip = true           # 디버그 심볼 제거
```

이 설정으로 릴리스 바이너리 크기를 최소화한다. Electron 대비 10배 이상 작은 설치 파일을 생성할 수 있다.

## 개발 워크플로우

### 명령어

```bash
# 프론트엔드만 개발 (브라우저에서 확인)
pnpm dev              # localhost:1420

# Tauri 윈도우에서 개발 (네이티브 API 사용 가능)
pnpm tauri:dev        # Tauri 윈도우 + 핫 리로드

# 플랫폼별 설치 파일 빌드
pnpm tauri:build      # .exe / .dmg / .deb 생성
```

### 개발 서버 설정

Tauri는 **고정 포트**를 요구한다. 두 보일러플레이트 모두 포트 1420을 사용:

```ts
// vite.config.ts
server: {
  port: 1420,
  strictPort: true,     // 포트 충돌 시 실패 (다른 포트로 전환하지 않음)
  host: host || false,  // TAURI_DEV_HOST 환경변수로 호스트 설정
  hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
  watch: {
    ignored: ["**/src-tauri/**"],   // Rust 소스 변경은 Vite가 무시
  },
}
```

`tauri.conf.json`의 `build.devUrl`이 `http://localhost:1420`을 가리키므로, 포트가 일치해야 한다.

### 개발 흐름

```
pnpm tauri:dev 실행
    │
    ├──→ beforeDevCommand: "pnpm dev" 실행
    │        └──→ Vite 개발 서버 (localhost:1420)
    │
    └──→ Tauri 윈도우 열림
             └──→ WebView가 localhost:1420 로드
                    └──→ HMR으로 실시간 반영
```

1. `pnpm dev` → 브라우저에서 UI 개발 (Tauri API는 작동하지 않음)
2. `pnpm tauri:dev` → Tauri 윈도우에서 실행 (네이티브 API 완전 작동)
3. 프론트엔드 코드 수정 → HMR로 즉시 반영
4. Rust 코드 수정 → Tauri가 자동 재컴파일 후 재시작

## 배포 & 업데이트

### 빌드 & 설치 파일

```bash
pnpm tauri:build
```

`tauri.conf.json`의 `bundle.targets: "all"` 설정으로 현재 플랫폼의 모든 형식을 생성:

| 플랫폼 | 설치 파일 |
|---|---|
| Windows | `.exe` (NSIS), `.msi` |
| macOS | `.dmg`, `.app` |
| Linux | `.deb`, `.AppImage` |

빌드 과정:
```
pnpm tauri:build
    │
    ├──→ beforeBuildCommand: "pnpm build" 실행
    │        └──→ 프론트엔드 빌드 (build/client/ 또는 dist/)
    │
    └──→ Cargo release 빌드 (최적화 프로필 적용)
             └──→ 설치 파일 생성 (src-tauri/target/release/bundle/)
```

### 자동 업데이트

두 보일러플레이트 모두 updater 플러그인이 설정되어 있다.

**tauri.conf.json 설정:**

```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://your-update-server.com/releases/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

**업데이트 흐름:**

```
앱 시작
  ↓
check() → 업데이트 서버에 현재 버전 전송
  ↓
응답: 새 버전 정보 (또는 "최신")
  ↓
사용자에게 알림 (UI 버튼)
  ↓
downloadAndInstall() → 다운로드 + 설치
  ↓
relaunch() → 앱 재시작
```

**프로덕션 설정 필요 사항:**
1. `pubkey`를 실제 공개키로 교체 (`tauri signer generate` 명령으로 생성)
2. `endpoints`를 실제 업데이트 서버 URL로 교체
3. 업데이트 서버에서 JSON 응답 형식을 맞춰야 함

### 코드 서명

프로덕션 배포 시 코드 서명이 필요하다:

| 플랫폼 | 요구 사항 |
|---|---|
| Windows | EV 코드 서명 인증서 |
| macOS | Apple Developer 계정 + 공증(Notarization) |
| Linux | 불필요 (선택적) |

서명 없이 배포하면 OS의 보안 경고가 표시된다.

## Tauri CLI 명령어

```bash
pnpm tauri info       # Tauri 환경 정보 출력
pnpm tauri icon       # 아이콘 생성 (소스 이미지 → 모든 크기)
pnpm tauri signer generate  # 업데이터용 공개키/비밀키 생성
```
