# React Router SPA

빠른 프론트엔드 목업용 SPA boilerplate. 서버 사이드 렌더링 없이 정적 파일만 빌드합니다.

## 기술 스택

- React Router 7.10 (SPA mode)
- Tailwind CSS v4
- TypeScript
- shadcn/ui 호환 테마 시스템

## 사용법

```bash
# 1. 복제
cp -r boilerplates/web/react-router-spa apps/{프로젝트명}
cd apps/{프로젝트명}

# 2. package.json name 수정
# "@boilerplates/react-router-spa" → "@apps/{프로젝트명}"

# 3. 의존성 설치
pnpm install

# 4. 개발 서버 시작
pnpm dev
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (HMR) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm typecheck` | 타입 체크 |

## 구조

```
├── app/
│   ├── app.css       # Tailwind + 테마 변수
│   ├── root.tsx      # 루트 레이아웃
│   ├── routes.ts     # 라우트 정의
│   ├── routes/       # 페이지 컴포넌트
│   └── lib/          # 유틸리티
└── vite.config.ts    # Vite 설정
```

## SSR vs SPA

| | SSR (react-router-cloudflare) | SPA (이 boilerplate) |
|---|---|---|
| 서버 렌더링 | O | X |
| SEO | 좋음 | 제한적 |
| 초기 로딩 | 빠름 | 느림 |
| 배포 | Cloudflare Workers | 정적 호스팅 |
| 용도 | 프로덕션 | 빠른 목업 |

## shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add button
```

## 배포

빌드 결과물(`build/client`)을 정적 호스팅 서비스에 배포:

```bash
pnpm build

# Cloudflare Pages, Vercel, Netlify 등
```
