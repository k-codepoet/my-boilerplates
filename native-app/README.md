# 데스크톱 앱 보일러플레이트

> Tauri v2 기반 데스크톱 애플리케이션 2종. React 프론트엔드 + Rust 백엔드.
> Electron 대비 10배 이상 작은 설치 파일, 네이티브 성능.

## 보일러플레이트 목록

| 이름 | 라우팅 | 복잡도 | 한 줄 설명 |
|------|--------|--------|-----------|
| `tauri-react-router` | React Router v7 | 중간 | 멀티 페이지, 사이드바, 파일 에디터, 설정 화면 |
| `tauri-react` | 없음 | 낮음 | 싱글 페이지, 단순 파일 에디터 |

## 선택 가이드

- **여러 화면/설정 필요** → `tauri-react-router` (사이드바 네비게이션, 라우트 추가로 확장)
- **단순 도구/유틸리티** → `tauri-react` (단일 화면, 최소 구조)
- **아직 모르겠다** → `tauri-react-router` (나중에 화면 추가 가능)

## 공통 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Tauri v2 (Rust) |
| 프론트엔드 | React 19, TypeScript strict |
| 스타일링 | Tailwind CSS v4, shadcn/ui, Inter 폰트 |
| 빌드 | Vite 7 |

## 공통 Tauri 플러그인

| 플러그인 | 용도 |
|----------|------|
| `fs` | 파일 읽기/쓰기/삭제/복사 |
| `dialog` | 파일 열기/저장 다이얼로그, 확인/알림 |
| `shell` | URL/경로를 시스템 기본 앱으로 열기 |
| `updater` | 앱 자동 업데이트 확인/다운로드/설치 |
| `process` | 앱 재시작/종료 |

## 빠른 시작

```bash
# 1. 보일러플레이트 복제
npx degit user/my-boilerplates/native-app/tauri-react-router my-app
cd my-app && pnpm install

# 2. 개발
pnpm dev              # 프론트엔드만 (브라우저, :1420)
pnpm tauri:dev        # Tauri 윈도우 + 핫 리로드 (네이티브 API 사용 가능)

# 3. 빌드
pnpm tauri:build      # 플랫폼별 설치 파일 생성 (.exe/.dmg/.deb)
```

## 비교

| 항목 | tauri-react-router | tauri-react |
|------|-------------------|-------------|
| 레이아웃 | 사이드바 + Outlet | 헤더 + 툴바 + 콘텐츠 |
| 프론트엔드 빌드 | `react-router build` | `vite build` |
| 빌드 출력 | `build/client/` | `dist/` |
| 경로 별칭 | `~/*` → `./app/*` | `~/*` → `./src/*` |
| 파일 저장 | Save + Save As | Save만 |
| 설정 페이지 | 있음 | 없음 |
| 확장성 | 라우트 추가로 쉽게 확장 | 컴포넌트 분리 필요 |

## 명령어 요약

```bash
pnpm dev              # 프론트엔드 개발 서버 (브라우저, :1420)
pnpm tauri:dev        # Tauri 윈도우 + 핫 리로드
pnpm tauri:build      # 플랫폼 설치 파일 생성
pnpm typecheck        # 타입 체크
```

## 다음 작업

- [ ] 자동 업데이트 (updater 플러그인) end-to-end 검증
- [ ] CI 파이프라인 추가 (macOS/Windows/Linux 크로스 빌드)
- [ ] 코드 서명 설정 가이드 (macOS notarization, Windows code signing)
- [ ] 테스트 프레임워크 도입 (vitest + Tauri e2e)

## 상세 문서

- [아키텍처 상세](docs/index.md) — Tauri 플러그인, capabilities 권한 시스템, 자동 업데이트, 빌드 최적화, 코드 서명
