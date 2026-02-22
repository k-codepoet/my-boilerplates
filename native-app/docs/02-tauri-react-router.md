# Tauri + React Router (멀티 페이지)

`tauri-react-router` 보일러플레이트 상세 아키텍처. Tauri v2 공통 구조는 [01-tauri-overview.md](./01-tauri-overview.md) 참조.

## 디렉토리 구조

```
tauri-react-router/
├── app/                          # 프론트엔드 소스
│   ├── root.tsx                  # HTML 셸 + ErrorBoundary
│   ├── routes.ts                 # 라우트 정의
│   ├── routes/
│   │   ├── layout.tsx            # 사이드바 레이아웃
│   │   ├── home.tsx              # 홈 페이지
│   │   ├── files.tsx             # 파일 에디터
│   │   └── settings.tsx          # 설정 페이지
│   ├── components/ui/            # shadcn/ui 컴포넌트
│   ├── lib/utils.ts              # cn() 유틸리티
│   └── app.css                   # Tailwind 진입점
├── src-tauri/                    # Rust 백엔드
│   ├── Cargo.toml                # Rust 의존성
│   ├── tauri.conf.json           # Tauri 설정
│   ├── src/main.rs               # 플러그인 등록
│   ├── capabilities/
│   │   └── default.json          # 권한 정의
│   └── icons/                    # 앱 아이콘
├── react-router.config.ts        # ssr: false (SPA 모드)
├── vite.config.ts                # Vite + Tauri 설정
└── package.json
```

## 프론트엔드 아키텍처

**React Router v7 SPA 모드**를 사용한다. `react-router.config.ts`에서 `ssr: false`로 설정:

```ts
export default {
  ssr: false,
} satisfies Config;
```

**라우팅 구조:**

```
routes.ts
└── layout("routes/layout.tsx")    # 사이드바 + Outlet
    ├── index("routes/home.tsx")   # / → 홈
    ├── route("files", ...)        # /files → 파일 에디터
    └── route("settings", ...)     # /settings → 설정
```

레이아웃 패턴: `layout.tsx`가 사이드바를 렌더링하고, `<Outlet />`에 자식 라우트가 표시된다.

**Vite 플러그인 순서:** `tailwindcss()` → `reactRouter()` → `tsconfigPaths()`

**경로 별칭:** `~/*` → `./app/*`

## 페이지별 기능

**layout.tsx - 사이드바 레이아웃:**
- `NavLink`으로 active 상태 스타일링 (`bg-accent` 토글)
- 네비게이션: Home, Files, Settings
- 업데이트 가용 시 사이드바 하단에 "Update Available" 버튼
- 하단에 버전 표시 (v0.1.0)

**home.tsx - 홈 대시보드:**
- 앱 제목/설명
- Files, Settings 카드 링크

**files.tsx - 파일 에디터:**
- 파일 열기 (`open` 다이얼로그 → `readTextFile`)
- 파일 저장 (`writeTextFile` → 기존 경로)
- 다른 이름으로 저장 (`save` 다이얼로그 → `writeTextFile`)
- 파일 닫기
- 미저장 변경 표시 (빨간 `*` 별표)
- 파일 필터: `.txt`, `.md`, `.json`, `.ts`, `.tsx`, `.js`

**settings.tsx - 설정:**
- 업데이트 수동 확인 (`check()`)
- 앱 데이터/설정 경로 표시 (`appDataDir()`, `appConfigDir()`)
- 경로를 시스템 파일 관리자에서 열기 (`shell.open()`)
- 외부 링크 (Tauri Docs, React Router Docs)

## Tauri API 사용 패턴

```
┌──────────────────────────────────────────────────────┐
│                    files.tsx                          │
│                                                      │
│  openFile():                                         │
│    open({ filters }) ──→ dialog 다이얼로그 열기       │
│    readTextFile(path) ──→ fs 파일 내용 읽기           │
│                                                      │
│  saveFile():                                         │
│    writeTextFile(path, content) ──→ fs 파일 저장      │
│                                                      │
│  saveFileAs():                                       │
│    save({ filters }) ──→ dialog 저장 다이얼로그       │
│    writeTextFile(path, content) ──→ fs 파일 저장      │
├──────────────────────────────────────────────────────┤
│                   layout.tsx                          │
│                                                      │
│  checkForUpdates():                                  │
│    check() ──→ updater 업데이트 확인                  │
│                                                      │
│  installUpdate():                                    │
│    check() → downloadAndInstall() ──→ updater 설치   │
│    relaunch() ──→ process 앱 재시작                   │
├──────────────────────────────────────────────────────┤
│                  settings.tsx                         │
│                                                      │
│  loadPaths():                                        │
│    appDataDir(), appConfigDir() ──→ core 경로 조회    │
│                                                      │
│  openPath(path):                                     │
│    open(path) ──→ shell 파일 관리자 열기              │
└──────────────────────────────────────────────────────┘
```

## 명령어

```bash
pnpm dev              # 프론트엔드 개발 서버 (브라우저, :1420)
pnpm build            # react-router build → build/client/
pnpm tauri:dev        # Tauri 윈도우 + 핫 리로드
pnpm tauri:build      # 플랫폼 설치 파일 생성
pnpm typecheck        # react-router typegen && tsc
```
