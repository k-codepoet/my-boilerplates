# TanStack 보일러플레이트 (2개)

> 공통 기술 스택, Vite 플러그인 순서, 배포 패턴은 [00-common-stack.md](00-common-stack.md) 참조.

---

## tanstack-start-ssr (vinxi + Docker)

**패키지**: `@boilerplates/tanstack-start-ssr`

### 아키텍처

```
web/tanstack-start-ssr/
├── src/
│   ├── router.tsx            ← createRouter() + routeTree 연결
│   ├── routeTree.gen.ts      ← 자동 생성 (파일 기반 라우팅)
│   ├── routes/
│   │   ├── __root.tsx        ← RootDocument (html/head/body)
│   │   └── index.tsx         ← 홈 페이지 + createServerFn() 예시
│   ├── components/ui/        ← shadcn/ui 컴포넌트
│   ├── styles/app.css        ← Tailwind + shadcn/ui 테마
│   └── lib/utils.ts
├── vite.config.ts            ← vinxi 기반 (tanstackStart 플러그인)
├── Dockerfile
└── package.json
```

### vinxi 빌드 시스템

React Router가 자체 Vite 플러그인을 사용하는 것과 달리, TanStack Start는 **vinxi**를 빌드 시스템으로 사용:

```json
// package.json
{
  "scripts": {
    "dev": "vinxi dev",       // vinxi 개발 서버
    "build": "vinxi build",   // vinxi 빌드
    "start": "node .output/server/index.mjs"
  }
}
```

### Vite 플러그인 순서 (React Router와 완전히 다름!)

```typescript
// vite.config.ts
plugins: [
  tsConfigPaths(),                                    // 1) 경로 별칭
  tanstackStart({ customViteReactPlugin: true }),     // 2) TanStack Start
  viteReact(),                                        // 3) React
]
```

> **주의**: `@tailwindcss/vite` 대신 `@tailwindcss/postcss`를 PostCSS 파이프라인으로 사용.
> CSS에서 `@import "tailwindcss" source("../")` 형태로 소스 경로를 명시.

### createServerFn() RPC 패턴

```typescript
// src/routes/index.tsx
import { createServerFn } from '@tanstack/react-start'

// 서버 함수 정의 — 빌드 시 자동으로 RPC 엔드포인트 생성
const getCount = createServerFn({ method: 'GET' })
  .handler(() => readCount())

const updateCount = createServerFn({ method: 'POST' })
  .validator((d: number) => d)
  .handler(async ({ data }) => { /* 서버에서 실행 */ })

// 라우트에서 loader로 사용
export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getCount(),
})
```

### 파일 기반 라우팅

```
src/routes/
├── __root.tsx        → 루트 레이아웃 (html, head, body)
├── index.tsx         → /
├── about.tsx         → /about
└── posts/
    ├── index.tsx     → /posts
    └── $postId.tsx   → /posts/:postId
```

`routeTree.gen.ts`가 자동 생성되어 라우트 트리를 타입 안전하게 관리.

### router.tsx

```typescript
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  })
}
```

### Docker 배포

```dockerfile
# builder: node:22-alpine → pnpm install → pnpm build (vinxi build)
# runner:  node:22-alpine → .output/ 복사만 (의존성 번들링됨)
#          CMD ["node", ".output/server/index.mjs"]
```

**빌드 출력**: `.output/server/index.mjs` (자체 포함 서버 번들)

> React Router SSR은 `pnpm install --prod`가 필요하지만,
> TanStack Start는 `.output/`에 모든 의존성이 번들링되어 추가 설치 불필요.

---

## tanstack-router-spa (Vite)

**패키지**: `@boilerplates/tanstack-router-spa`

### 아키텍처

```
web/tanstack-router-spa/
├── src/
│   ├── main.tsx              ← 엔트리 (createRouter + RouterProvider)
│   ├── routeTree.gen.ts      ← 자동 생성
│   ├── routes/
│   │   ├── __root.tsx        ← Header + Outlet + DevTools
│   │   └── index.tsx         ← 홈 페이지
│   ├── components/
│   │   ├── ui/               ← shadcn/ui 컴포넌트
│   │   └── Header.tsx        ← 공통 헤더
│   ├── styles.css            ← Tailwind + shadcn/ui 테마
│   └── lib/utils.ts
├── vite.config.ts            ← vitest/config 기반
└── package.json
```

### 순수 Vite (vinxi 아님)

```json
{
  "scripts": {
    "dev": "vite --port 3000",    // 순수 Vite 개발 서버
    "build": "vite build && tsc",  // Vite 빌드 + 타입 체크
    "preview": "vite preview"
  }
}
```

### Vite 플러그인 순서

```typescript
// vite.config.ts (vitest/config에서 import)
plugins: [
  TanStackRouterVite({ autoCodeSplitting: true }),  // 1) 자동 코드 스플리팅
  viteReact(),                                       // 2) React
  tailwindcss(),                                     // 3) Tailwind
]
```

### createRouter() 수동 설정

```typescript
// src/main.tsx
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',            // 호버 시 프리로드
  scrollRestoration: true,             // 스크롤 위치 복원
  defaultStructuralSharing: true,      // 구조적 공유 최적화
  defaultPreloadStaleTime: 0,          // 즉시 리프레시
})
```

### DevTools 내장

```typescript
// src/routes/__root.tsx
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

// 라우터 + 일반 DevTools를 하나의 패널로 통합
<TanstackDevtools config={{ position: 'bottom-left' }}
  plugins={[{
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />,
  }]}
/>
```

### 테스트 환경 사전 구성

이 보일러플레이트만 vitest + jsdom + @testing-library가 사전 구성되어 있다:
```typescript
// vite.config.ts
test: {
  globals: true,
  environment: 'jsdom',
}
```
