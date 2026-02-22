# Tauri + React (싱글 페이지)

`tauri-react` 보일러플레이트 상세 아키텍처. Tauri v2 공통 구조는 [01-tauri-overview.md](./01-tauri-overview.md) 참조.

## 디렉토리 구조

```
tauri-react/
├── src/                          # 프론트엔드 소스
│   ├── main.tsx                  # React 진입점
│   ├── App.tsx                   # 메인 컴포넌트 (전체 UI)
│   ├── components/ui/            # shadcn/ui 컴포넌트
│   ├── lib/utils.ts              # cn() 유틸리티
│   └── app.css                   # Tailwind 진입점
├── src-tauri/                    # Rust 백엔드 (동일 구조)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/main.rs
│   ├── capabilities/
│   │   └── default.json
│   └── icons/
├── vite.config.ts                # Vite + React 설정
└── package.json
```

## 프론트엔드 아키텍처

**순수 React + Vite** (라우팅 프레임워크 없음). 단일 `App.tsx`에 모든 UI가 포함된다.

**Vite 플러그인 순서:** `tailwindcss()` → `react()`

**경로 별칭:** `~/*` → `./src/*` (vite.config.ts의 `resolve.alias`로 설정)

**진입점:** `main.tsx` → `<App />`

## App.tsx 구조

```
┌──────────────────────────────────────┐
│ Header: 제목 + 업데이트 버튼          │
├──────────────────────────────────────┤
│ Toolbar: Open + Save + 파일 경로      │
├──────────────────────────────────────┤
│                                      │
│ Content:                             │
│   파일 열림 → textarea 에디터         │
│   파일 없음 → 빈 상태 (Open File)     │
│                                      │
├──────────────────────────────────────┤
│ Footer: 버전 + 업데이트 상태           │
└──────────────────────────────────────┘
```

## 주요 기능

**파일 에디터:**
- 파일 열기: `open()` → `readTextFile()`
- 파일 저장: `writeTextFile()` (열린 파일 경로에 덮어쓰기)
- 파일 필터: `.txt`, `.md`, `.json`
- 빈 상태 UI (파일 없을 때 Open File 버튼)

**자동 업데이트:**
- 앱 시작 시 `useEffect`로 `check()` 호출
- 업데이트 가용 시 헤더에 Update 버튼 표시
- 설치: `downloadAndInstall()` → `relaunch()`
- 상태 표시: 푸터에 업데이트 진행 상태 텍스트

**상태 관리:**
- `content`: 에디터 텍스트 내용
- `filePath`: 현재 열린 파일 경로 (`null`이면 빈 상태)
- `updateAvailable`: 업데이트 가용 여부
- `updateStatus`: 업데이트 진행 상태 메시지

## 명령어

```bash
pnpm dev              # 프론트엔드 개발 서버 (브라우저, :1420)
pnpm build            # vite build → dist/
pnpm tauri:dev        # Tauri 윈도우 + 핫 리로드
pnpm tauri:build      # 플랫폼 설치 파일 생성
pnpm typecheck        # tsc --noEmit
```
