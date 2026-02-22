# 공통 기술 스택

## 개요

6개의 웹 보일러플레이트는 **프레임워크**(React Router / TanStack)와 **렌더링 방식**(SSR / SPA), **배포 플랫폼**(Docker / Cloudflare)의 조합으로 구성된다.

### 포지셔닝 매트릭스

```
                   React Router v7              TanStack
                ┌──────────────────────┬───────────────────────┐
  SSR + Docker  │ react-router-ssr     │ tanstack-start-ssr    │
                │ (Node.js runner)     │ (vinxi → Node.js)     │
                ├──────────────────────┼───────────────────────┤
  SPA + Docker  │ react-router-spa     │ tanstack-router-spa   │
                │ (Nginx)              │ (순수 Vite)           │
                ├──────────────────────┼───────────────────────┘
  SSR + CF      │ react-router-ssr-    │
                │ cloudflare (Workers) │    (해당 없음)
                ├──────────────────────┤
  SPA + CF      │ react-router-spa-    │
                │ cloudflare (Pages)   │    (해당 없음)
                └──────────────────────┘
```

### 아키텍처 흐름 개요

```
[사용자 요청]
    │
    ├─ SSR 보일러플레이트 ─────────────────────────────────┐
    │   요청 → 서버(Node.js/Workers) → renderToReadableStream  │
    │        → HTML 스트리밍 → 클라이언트 하이드레이션         │
    │                                                          │
    ├─ SPA 보일러플레이트 ─────────────────────────────────┐
    │   요청 → 정적 서버(Nginx/Pages) → index.html            │
    │        → JS 번들 로드 → 클라이언트 렌더링               │
    │                                                          │
    └──────────────────────────────────────────────────────┘
```

---

## 핵심 의존성

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19 | UI 라이브러리 |
| TypeScript | 5.x | 타입 시스템 (strict mode) |
| Vite | 7.x (RR), 6.x (TS SPA) | 빌드 도구 |
| Tailwind CSS | v4.x | 유틸리티 CSS |
| Node.js | 22 | 런타임 (.nvmrc) |
| pnpm | 10.12+ | 패키지 매니저 (corepack) |

---

## Tailwind CSS v4 + OKLch 색상 시스템

모든 보일러플레이트는 Tailwind v4를 사용하며, CSS 파일에서 직접 테마를 설정한다.

```css
/* 공통 패턴: app.css 또는 styles/app.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... OKLch 기반 색상 변수들 ... */
}
```

- **`@custom-variant dark`**: `.dark` 클래스 기반 다크모드
- **`@theme inline`**: shadcn/ui 호환 CSS 변수를 Tailwind 토큰에 매핑
- **OKLch**: 지각적으로 균일한 색상 공간, CSS 변수로 라이트/다크 테마 전환

---

## shadcn/ui 구성

```
components.json
├── style: "new-york"
├── tailwind.baseColor: "neutral"
├── aliases:
│   ├── components: "~/components/ui"  (또는 @/components/ui)
│   ├── utils: "~/lib/utils"           (또는 @/lib/utils)
│   └── hooks: "~/hooks"               (또는 @/hooks)
└── UI 라이브러리: lucide-react (아이콘)
```

**`cn()` 유틸리티** (`lib/utils.ts`):
```typescript
import { clsx, type ClassValue } from "clsx";
import { tailwindMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return tailwindMerge(clsx(inputs));
}
```

---

## Inter 폰트

React Router 보일러플레이트는 Google Fonts에서 Inter를 외부 로드:
```tsx
// app/root.tsx - links() 함수
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:..." },
];
```

TanStack 보일러플레이트는 CSS `@theme`에서 폰트 패밀리를 선언.

---

## 경로 별칭 (Path Aliases)

| 보일러플레이트 | 별칭 | 매핑 | 설정 파일 |
|--------------|------|------|----------|
| React Router 4개 | `~/*` | `./app/*` | tsconfig.json `paths` |
| TanStack Start SSR | `@/*` | `./src/*` | tsconfig.json `paths` |
| TanStack Router SPA | `@/*` | `./src/*` | tsconfig.json `paths` + vite `resolve.alias` |

---

## Vite 플러그인 순서 (CRITICAL)

플러그인 순서가 잘못되면 빌드 실패 또는 런타임 오류가 발생한다. 각 보일러플레이트의 정확한 순서:

```
┌─────────────────────────────────────────────────────────────────┐
│ react-router-ssr / react-router-spa / react-router-spa-cf       │
│                                                                  │
│   tailwindcss() → reactRouter() → tsconfigPaths()               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ react-router-ssr-cloudflare                                      │
│                                                                  │
│   cloudflareDevProxy() → tailwindcss() → reactRouter()          │
│                        → tsconfigPaths()                         │
│                                                                  │
│   ⚠ cloudflareDevProxy가 반드시 첫 번째!                        │
│     (로컬 개발에서 Workers 환경 시뮬레이션)                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ tanstack-start-ssr                                               │
│                                                                  │
│   tsConfigPaths() → tanstackStart({ customViteReactPlugin: true })│
│                   → viteReact()                                   │
│                                                                  │
│   ⚠ @tailwindcss/vite 사용 안 함! @tailwindcss/postcss 사용     │
│   ⚠ tsConfigPaths가 첫 번째 (다른 RR과 반대)                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ tanstack-router-spa                                              │
│                                                                  │
│   TanStackRouterVite({ autoCodeSplitting: true })                │
│   → viteReact() → tailwindcss()                                  │
│                                                                  │
│   ⚠ 별도 resolve.alias로 @/ 매핑 추가                           │
└─────────────────────────────────────────────────────────────────┘
```

### 왜 순서가 중요한가?

1. **CSS 플러그인**: Tailwind는 프레임워크 플러그인보다 먼저 CSS를 변환해야 함
2. **프레임워크 플러그인**: 라우팅, SSR, 코드 스플리팅 등 핵심 변환 수행
3. **경로 별칭**: 마지막에 실행되어 import 경로를 해석
4. **Cloudflare 프록시**: 가장 먼저 실행되어 요청을 Workers 환경으로 래핑

---

## 배포 패턴

### Docker SSR (react-router-ssr, tanstack-start-ssr)

```
┌─────────────────────────────────────────────┐
│ Stage 1: builder (node:22-alpine)           │
│   corepack enable → pnpm install → pnpm build│
├─────────────────────────────────────────────┤
│ Stage 2: runner (node:22-alpine)            │
│                                              │
│   react-router-ssr:                          │
│     pnpm install --prod → build/ 복사       │
│     CMD: react-router-serve ./build/server   │
│     PORT: 3000                               │
│                                              │
│   tanstack-start-ssr:                        │
│     .output/ 복사만 (의존성 번들링됨)        │
│     CMD: node .output/server/index.mjs       │
│     PORT: 3000                               │
└─────────────────────────────────────────────┘
```

**차이점**: TanStack Start는 `.output/`에 모든 것이 번들링되어 있어 프로덕션 의존성 설치가 불필요.

### Docker SPA (react-router-spa)

```
┌─────────────────────────────────────────────┐
│ Stage 1: builder (node:22-alpine)           │
│   corepack enable → pnpm install → pnpm build│
├─────────────────────────────────────────────┤
│ Stage 2: runner (nginx:alpine)              │
│   build/client → /usr/share/nginx/html      │
│   nginx.conf → SPA 폴백 + 에셋 캐싱        │
│   PORT: 80                                   │
└─────────────────────────────────────────────┘
```

### Cloudflare Workers (react-router-ssr-cloudflare)

```
┌─────────────────────────────────────────────┐
│ pnpm build → wrangler deploy                 │
│                                              │
│ 환경 분리:                                   │
│   main 브랜치 → env.production (my-app)      │
│   PR         → env.preview (my-app-preview)  │
│                                              │
│ wrangler.toml:                               │
│   main = "workers/app.ts"                    │
│   [assets] directory = "./build/client"      │
│            binding = "ASSETS"                │
└─────────────────────────────────────────────┘
```

### Cloudflare Pages (react-router-spa-cloudflare)

```
┌─────────────────────────────────────────────┐
│ pnpm build → wrangler pages deploy ./build/client│
│                                              │
│ Cloudflare Pages가 자동 처리:                │
│   ✓ SPA 라우팅 폴백                         │
│   ✓ 글로벌 CDN 캐싱                         │
│   ✓ PR별 프리뷰 URL                         │
│   ✓ 커스텀 도메인                            │
└─────────────────────────────────────────────┘
```

### 배포 비교

| 방식 | 인프라 관리 | 콜드 스타트 | 확장성 | 비용 모델 |
|------|-----------|-----------|--------|----------|
| Docker SSR | 직접 (K8s 등) | 없음 (항상 실행) | 수동 스케일링 | 서버 기반 |
| Docker SPA | 직접 (CDN 권장) | 없음 | CDN으로 | 서버 기반 |
| CF Workers | 자동 | ~0ms (에지) | 자동 | 요청 기반 |
| CF Pages | 자동 | 없음 (정적) | 자동 | 무료/사용량 |
