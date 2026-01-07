# Craftify Boilerplates

Craftify에서 사용하는 프로덕션 레디 프로젝트 템플릿 모음입니다.

## 빠른 시작

```bash
# degit으로 boilerplate 가져오기
npx degit k-codepoet/craftify-boilerplates/web/react-router-ssr my-app       # Node.js SSR
npx degit k-codepoet/craftify-boilerplates/web/react-router-spa my-app       # Node.js SPA
npx degit k-codepoet/craftify-boilerplates/web/react-router-ssr-cloudflare my-app  # Cloudflare SSR
npx degit k-codepoet/craftify-boilerplates/web/react-router-spa-cloudflare my-app  # Cloudflare SPA

cd my-app
pnpm install
pnpm dev
```

## 개발 명령어

### 루트 레벨 (Turbo)
```bash
pnpm install    # 의존성 설치
pnpm dev        # 모든 패키지 개발 서버 시작
pnpm build      # 모든 패키지 빌드
pnpm lint       # 모든 패키지 린트
pnpm clean      # 빌드 결과물 정리
```

### 개별 Boilerplate
```bash
pnpm dev        # 개발 서버 (HMR)
pnpm build      # 프로덕션 빌드
pnpm typecheck  # TypeScript 타입 체크
```

## 구조

```
web/                              # 웹 프론트엔드/풀스택
├── react-router-ssr/             # SSR (Node.js, Docker)
├── react-router-spa/             # SPA (Node.js/nginx, Docker)
├── react-router-ssr-cloudflare/  # SSR (Cloudflare Workers)
├── react-router-spa-cloudflare/  # SPA (Cloudflare Pages)
└── ...

api/                              # 백엔드 API (예정)
lib/                              # 라이브러리/패키지 (예정)
```

## Boilerplate 목록

### Web - 범용 (Docker/Self-hosted)

| 이름 | 렌더링 | 배포 | 상태 |
|------|--------|------|------|
| `react-router-ssr` | SSR | Docker, k8s, 클라우드 | ✅ |
| `react-router-spa` | SPA | Docker (nginx), 정적 호스팅 | ✅ |

- **Dockerfile, docker-compose.yml 포함**
- 셀프호스팅, Docker, k8s, 클라우드 등 자유롭게 배포

### Web - Cloudflare

| 이름 | 렌더링 | 배포 | 상태 |
|------|--------|------|------|
| `react-router-ssr-cloudflare` | SSR | Cloudflare Workers | ✅ |
| `react-router-spa-cloudflare` | SPA | Cloudflare Pages | ✅ |

- **wrangler 설정 포함**
- `pnpm deploy`로 바로 배포

### 예정

| 이름 | 프레임워크 | 상태 |
|------|-----------|------|
| `tanstack-start-ssr` | TanStack Start | 📋 예정 |
| `tanstack-router-spa` | TanStack Router | 📋 예정 |
| `nextjs-ssr` | Next.js | 📋 예정 |
| `hono` | Hono API | 📋 예정 |

## 네이밍 규칙

```
{framework}-{rendering}              # 범용 (Node.js)
{framework}-{rendering}-{platform}   # 플랫폼 특화
```

예시:
- `react-router-ssr` - React Router SSR, 범용
- `react-router-spa-cloudflare` - React Router SPA, Cloudflare Pages

## 공통 기술 스택

- **패키지 매니저**: pnpm v10.12+
- **모노레포**: Turbo v2.5+
- **빌드 도구**: Vite 7
- **프레임워크**: React Router v7
- **스타일링**: Tailwind CSS v4 (OKLch 컬러 시스템)
- **타입**: TypeScript 5 (strict mode)
- **UI 컴포넌트**: shadcn/ui 호환 (new-york 스타일)
- **아이콘**: lucide-react
- **폰트**: Inter (Google Fonts)

### 프로젝트 내부 구조
```
app/
├── app.css           # 글로벌 스타일 + Tailwind + 테마 변수
├── root.tsx          # 루트 레이아웃 (에러 바운더리 포함)
├── routes.ts         # React Router v7 라우트 설정
├── routes/           # 페이지 컴포넌트
├── components/       # UI 컴포넌트 (shadcn/ui)
├── lib/utils.ts      # 유틸리티 (cn 함수)
└── hooks/            # 커스텀 훅
```

### Path Alias
모든 boilerplate는 `~/*` → `./app/*` 경로 별칭 사용.

## Craftify 연동

이 boilerplate들은 `/craftify:poc` 명령어와 연동됩니다:

```bash
# Craftify가 자동으로 적절한 boilerplate를 선택
/craftify:poc
```

## 라이선스

MIT
