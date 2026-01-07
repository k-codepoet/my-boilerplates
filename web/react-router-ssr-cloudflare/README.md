# React Router SSR + Cloudflare Workers

Cloudflare Workers에서 서버 사이드 렌더링을 지원하는 풀스택 boilerplate.

## 기술 스택

- React Router 7 (SSR)
- Cloudflare Workers
- Tailwind CSS v4
- TypeScript
- shadcn/ui 호환 테마 시스템

## 사용법

```bash
# 1. 복제
cp -r boilerplates/web/react-router-ssr-cloudflare apps/{프로젝트명}
cd apps/{프로젝트명}

# 2. package.json name 수정
# "@boilerplates/react-router-ssr-cloudflare" → "@apps/{프로젝트명}"

# 3. wrangler.toml name 수정
# name = "my-app" → name = "{프로젝트명}"

# 4. 의존성 설치
pnpm install

# 5. 개발 서버 시작
pnpm dev
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (HMR) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | Wrangler 로컬 서버 |
| `pnpm deploy` | Cloudflare 배포 |
| `pnpm typecheck` | 타입 체크 |

## 구조

```
├── app/
│   ├── app.css           # Tailwind + 테마 변수
│   ├── entry.server.tsx  # SSR 엔트리
│   ├── root.tsx          # 루트 레이아웃
│   ├── routes.ts         # 라우트 정의
│   ├── routes/           # 페이지 컴포넌트
│   └── lib/              # 유틸리티
├── workers/
│   └── app.ts            # Cloudflare Worker 엔트리
├── wrangler.toml         # Cloudflare 설정
└── vite.config.ts        # Vite 설정
```

## shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add button
```

## 배포

```bash
# Cloudflare 계정 로그인 (최초 1회)
npx wrangler login

# 배포
pnpm deploy
```

커스텀 도메인은 Cloudflare Dashboard에서 설정:
Workers & Pages > {프로젝트} > Settings > Domains & Routes
