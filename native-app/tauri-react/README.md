# Tauri + React Desktop App Boilerplate

Windows/macOS/Linux 데스크톱 앱 boilerplate. Tauri v2 + React + Tailwind CSS.

## Features

- **Tauri v2** - Rust 기반 네이티브 앱 프레임워크
- **React 19** + TypeScript
- **Tailwind CSS v4** + shadcn/ui 호환 테마
- **자동 업데이트** - tauri-plugin-updater
- **파일시스템 접근** - 읽기/쓰기/다이얼로그
- **NSIS 인스톨러** - Windows용 설치 프로그램

## Prerequisites

- Node.js 22+
- pnpm
- Rust (https://rustup.rs)
- Windows: Microsoft Visual Studio C++ Build Tools
- macOS: Xcode Command Line Tools
- Linux: webkit2gtk, libssl-dev 등

## Quick Start

```bash
# 의존성 설치
pnpm install

# 개발 모드 (hot reload)
pnpm tauri:dev

# 빌드 (인스톨러 생성)
pnpm tauri:build
```

## Project Structure

```
├── src/                  # React 프론트엔드
│   ├── App.tsx          # 메인 앱 컴포넌트
│   ├── main.tsx         # 엔트리포인트
│   ├── app.css          # Tailwind + 테마
│   └── lib/utils.ts     # 유틸리티 함수
├── src-tauri/           # Tauri 백엔드 (Rust)
│   ├── src/main.rs      # Rust 엔트리포인트
│   ├── tauri.conf.json  # Tauri 설정
│   ├── capabilities/    # 권한 설정
│   └── Cargo.toml       # Rust 의존성
└── package.json
```

## Build Outputs

빌드 후 `src-tauri/target/release/bundle/`에 생성:

- **Windows**: `nsis/tauri-react-app_0.1.0_x64-setup.exe`
- **macOS**: `dmg/tauri-react-app_0.1.0_aarch64.dmg`
- **Linux**: `deb/`, `appimage/`, `rpm/`

## Auto Update Setup

1. 업데이트 서버 준비 (GitHub Releases 또는 자체 서버)

2. 키 생성:
```bash
pnpm tauri signer generate -w ~/.tauri/myapp.key
```

3. `tauri.conf.json` 수정:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY",
      "endpoints": ["https://your-server.com/releases/{{target}}/{{arch}}/{{current_version}}"]
    }
  }
}
```

4. 빌드 시 서명:
```bash
TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/myapp.key) pnpm tauri:build
```

## Permissions (Capabilities)

`src-tauri/capabilities/default.json`에서 앱 권한 관리:

- **fs** - 파일시스템 읽기/쓰기
- **dialog** - 파일 열기/저장 다이얼로그
- **shell** - 외부 URL 열기
- **updater** - 자동 업데이트
- **process** - 앱 재시작

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add input
```

## Development Tips

### 프론트엔드만 개발
```bash
pnpm dev  # Vite 개발 서버만 실행
```

### Rust 코드 변경 시
```bash
pnpm tauri:dev  # 자동 재컴파일
```

### 릴리스 빌드
```bash
pnpm tauri:build --release
```
