# Tauri + React Router Desktop App Boilerplate

Windows/macOS/Linux 데스크톱 앱 boilerplate. Tauri v2 + React Router v7 (SPA 모드).

## Features

- **Tauri v2** - Rust 기반 네이티브 앱 프레임워크
- **React Router v7** - SPA 모드 (file-based routing)
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
├── app/                  # React Router 프론트엔드
│   ├── routes/          # 페이지 컴포넌트
│   │   ├── layout.tsx   # 사이드바 레이아웃
│   │   ├── home.tsx     # 홈 페이지
│   │   ├── files.tsx    # 파일 관리 페이지
│   │   └── settings.tsx # 설정 페이지
│   ├── routes.ts        # 라우트 설정
│   ├── root.tsx         # 루트 레이아웃
│   ├── app.css          # Tailwind + 테마
│   └── lib/utils.ts     # 유틸리티 함수
├── src-tauri/           # Tauri 백엔드 (Rust)
│   ├── src/main.rs      # Rust 엔트리포인트
│   ├── tauri.conf.json  # Tauri 설정
│   ├── capabilities/    # 권한 설정
│   └── Cargo.toml       # Rust 의존성
├── react-router.config.ts
├── vite.config.ts
└── package.json
```

## Adding Routes

`app/routes.ts`에서 라우트 추가:

```ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("files", "routes/files.tsx"),
    route("settings", "routes/settings.tsx"),
    route("new-page", "routes/new-page.tsx"),  // 새 페이지 추가
  ]),
] satisfies RouteConfig;
```

## Build Outputs

빌드 후 `src-tauri/target/release/bundle/`에 생성:

- **Windows**: `nsis/tauri-react-router-app_0.1.0_x64-setup.exe`
- **macOS**: `dmg/tauri-react-router-app_0.1.0_aarch64.dmg`
- **Linux**: `deb/`, `appimage/`, `rpm/`

## Permissions (Capabilities)

`src-tauri/capabilities/default.json`에서 앱 권한 관리:

- **fs** - 파일시스템 읽기/쓰기
- **dialog** - 파일 열기/저장 다이얼로그
- **shell** - 외부 URL/경로 열기
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
pnpm dev  # React Router 개발 서버만 실행 (브라우저에서도 확인 가능)
```

### Tauri와 함께 개발
```bash
pnpm tauri:dev  # 네이티브 창에서 개발
```

### 릴리스 빌드
```bash
pnpm tauri:build
```

## vs tauri-react (순정 React)

| | tauri-react | tauri-react-router |
|---|---|---|
| 라우팅 | 없음 (단일 페이지) | React Router v7 |
| 페이지 구조 | App.tsx 하나 | app/routes/* |
| 복잡도 | 낮음 | 중간 |
| 용도 | 간단한 도구 | 여러 화면이 있는 앱 |
