# Craftify Boilerplates

Craftify에서 사용하는 프로젝트 템플릿 모음입니다.

## 사용법

```bash
# degit으로 특정 boilerplate 가져오기
npx degit k-codepoet/craftify-boilerplates/web/react-router-cloudflare my-app
npx degit k-codepoet/craftify-boilerplates/web/react-router-spa my-app
```

## 구조

```
web/                    # 웹 프론트엔드/풀스택
├── react-router-cloudflare/   # React Router v7 + SSR + Cloudflare Workers
├── react-router-spa/          # React Router v7 + SPA + Static
├── react-router-vercel/       # (예정) React Router v7 + Vercel
├── tanstack-start-cloudflare/ # (예정) TanStack Start + Cloudflare
└── nextjs-vercel/             # (예정) Next.js + Vercel

api/                    # 백엔드 API
├── hono-cloudflare/           # (예정) Hono + Cloudflare Workers
└── ...

lib/                    # 라이브러리/패키지
└── typescript-package/        # (예정) TypeScript 패키지 템플릿
```

## Boilerplate 목록

### Web

| 이름 | 프레임워크 | 렌더링 | 배포 대상 | 상태 |
|------|-----------|--------|----------|------|
| `react-router-cloudflare` | React Router v7 | SSR | Cloudflare Workers | ✅ |
| `react-router-spa` | React Router v7 | SPA | Cloudflare Pages (Static) | ✅ |
| `react-router-vercel` | React Router v7 | SSR | Vercel | 📋 예정 |
| `tanstack-start-cloudflare` | TanStack Start | SSR | Cloudflare Workers | 📋 예정 |
| `tanstack-router-spa` | TanStack Router | SPA | Static | 📋 예정 |
| `nextjs-vercel` | Next.js | SSR/SSG | Vercel | 📋 예정 |
| `nextjs-cloudflare` | Next.js | SSR | Cloudflare | 📋 예정 |

### API

| 이름 | 프레임워크 | 배포 대상 | 상태 |
|------|-----------|----------|------|
| `hono-cloudflare` | Hono | Cloudflare Workers | 📋 예정 |

## 네이밍 규칙

```
{framework}-{deploy}       # SSR이 기본인 경우
{framework}-spa-{deploy}   # SPA인 경우
{framework}-{deploy}       # SSR/SPA 구분이 없는 경우
```

## 공통 기술 스택

- **패키지 매니저**: pnpm
- **빌드 도구**: Vite / Turbopack
- **스타일링**: Tailwind CSS v4
- **타입**: TypeScript 5
- **UI 컴포넌트**: shadcn/ui 호환

## Craftify 연동

이 boilerplate들은 `/craftify:poc` 명령어와 연동됩니다:

```bash
# Craftify가 자동으로 적절한 boilerplate를 선택
/craftify:poc
```

## 라이선스

MIT
