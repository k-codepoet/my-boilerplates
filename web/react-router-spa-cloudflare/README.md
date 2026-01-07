# React Router SPA + Cloudflare Pages

Cloudflare Pages에 배포하는 SPA boilerplate. 정적 파일 호스팅용.

## 기술 스택

- React Router 7 (SPA mode)
- Cloudflare Pages
- Tailwind CSS v4
- TypeScript
- shadcn/ui 호환 테마 시스템

## 사용법

```bash
# 1. 복제
cp -r boilerplates/web/react-router-spa-cloudflare apps/{프로젝트명}
cd apps/{프로젝트명}

# 2. package.json name 수정
# "@boilerplates/react-router-spa-cloudflare" → "@apps/{프로젝트명}"

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
| `pnpm deploy` | Cloudflare Pages 배포 |
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

프로젝트 이름은 첫 배포 시 입력하거나 Cloudflare Dashboard에서 설정.
