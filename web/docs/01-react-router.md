# React Router 보일러플레이트 (4개)

> 공통 기술 스택, Vite 플러그인 순서, 배포 패턴은 [00-common-stack.md](00-common-stack.md) 참조.

---

## react-router-ssr (Docker)

**패키지**: `@boilerplates/react-router-ssr`

### 아키텍처

```
web/react-router-ssr/
├── app/
│   ├── root.tsx              ← Layout + ErrorBoundary + Outlet
│   ├── entry.server.tsx      ← SSR: renderToReadableStream + isbot
│   ├── routes.ts             ← 라우트 설정 (index → routes/home.tsx)
│   ├── routes/home.tsx       ← 페이지 컴포넌트
│   ├── app.css               ← Tailwind + shadcn/ui 테마
│   ├── components/ui/        ← shadcn/ui 컴포넌트
│   └── lib/utils.ts          ← cn() 유틸리티
├── vite.config.ts            ← 빌드 설정
├── react-router.config.ts    ← (기본값, ssr: true)
├── Dockerfile                ← multi-stage (builder → runner)
└── package.json
```

### 요청 처리 흐름

```
요청 → react-router-serve
         │
         ├── app/entry.server.tsx
         │   ├── renderToReadableStream(<ServerRouter />)
         │   ├── isbot(userAgent) → 봇이면 allReady 대기
         │   └── Response(body, { headers, status })
         │
         └── 클라이언트: 하이드레이션 → SPA 전환
```

### Vite 플러그인 순서

```typescript
// vite.config.ts
plugins: [tailwindcss(), reactRouter(), tsconfigPaths()]
```

### entry.server.tsx 핵심 로직

```typescript
// 봇 감지: 봇에게는 완전히 렌더링된 HTML 제공
if (isbot(userAgent ?? "")) {
  await body.allReady;  // 전체 렌더링 완료 대기
}
// 일반 사용자: 스트리밍으로 빠른 TTFB
```

### Docker 배포

```dockerfile
# builder: node:22-alpine → pnpm install → pnpm build
# runner:  node:22-alpine → pnpm install --prod → build/ 복사
#          CMD ["pnpm", "start"]  (= react-router-serve ./build/server/index.js)
```

**빌드 출력**: `build/server/index.js` + `build/client/`

---

## react-router-spa (Docker + Nginx)

**패키지**: `@boilerplates/react-router-spa`

### SSR과의 핵심 차이

| 항목 | SSR | SPA |
|------|-----|-----|
| `react-router.config.ts` | `ssr: true` (기본) | **`ssr: false`** |
| `entry.server.tsx` | 있음 | **없음** |
| 서버 런타임 | Node.js (react-router-serve) | **Nginx (정적)** |
| 빌드 출력 | `build/server/` + `build/client/` | **`build/client/` 만** |
| `start` 스크립트 | `react-router-serve` | **없음** (`preview`만) |

### react-router.config.ts

```typescript
// SPA 모드 설정 — SSR 보일러플레이트에는 이 파일 불필요
import type { Config } from "@react-router/dev/config";
export default { ssr: false } satisfies Config;
```

### Nginx 설정 (`nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA 폴백: 모든 경로 → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 에셋: 1년 불변 캐시
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker 배포

```dockerfile
# builder: node:22-alpine → pnpm build
# runner:  nginx:alpine → build/client → /usr/share/nginx/html
#          nginx.conf 복사 → 포트 80
```

---

## react-router-ssr-cloudflare (Workers)

**패키지**: `@boilerplates/react-router-ssr-cloudflare`

### 아키텍처

```
web/react-router-ssr-cloudflare/
├── workers/
│   └── app.ts                ← Workers 엔트리 (ExportedHandler<Env>)
├── app/
│   ├── root.tsx              ← (SSR과 동일)
│   ├── entry.server.tsx      ← (SSR과 동일: renderToReadableStream)
│   ├── routes.ts
│   └── routes/home.tsx
├── vite.config.ts            ← cloudflareDevProxy() 추가
├── wrangler.toml             ← Workers 설정 + 환경 분리
└── package.json              ← @react-router/cloudflare, wrangler
```

### workers/app.ts — Workers 엔트리 포인트

```typescript
import { createRequestHandler } from "react-router";
import * as serverBuild from "../build/server";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const handler = createRequestHandler(serverBuild, "production");
    return handler(request, {
      cloudflare: { env, ctx },  // Cloudflare 바인딩 전달
    });
  },
} satisfies ExportedHandler<Env>;
```

### Vite 플러그인 순서 (SSR과 다름!)

```typescript
// vite.config.ts — cloudflareDevProxy가 맨 앞
plugins: [
  cloudflareDevProxy({
    getLoadContext: ({ context }) => ({ cloudflare: context }),
  }),
  tailwindcss(),
  reactRouter(),
  tsconfigPaths(),
]
```

### wrangler.toml

```toml
name = "my-app"
main = "workers/app.ts"           # Workers 엔트리
compatibility_date = "2024-11-18"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./build/client"      # 정적 에셋 서빙
binding = "ASSETS"                # Workers에서 접근 가능

[env.production]
name = "my-app"                   # main 브랜치 배포

[env.preview]
name = "my-app-preview"           # PR 프리뷰 배포
```

### Cloudflare 바인딩 접근 패턴

```
요청 → Workers fetch(request, env, ctx)
         │
         ├── env.ASSETS         ← 정적 파일 바인딩
         ├── env.DB             ← D1 데이터베이스 (추가 시)
         ├── env.KV             ← KV 스토어 (추가 시)
         │
         └── loadContext.cloudflare.env  ← 라우트 loader에서 접근
```

### 주요 의존성 차이

| Docker SSR | Cloudflare SSR |
|-----------|----------------|
| `@react-router/node` | **`@react-router/cloudflare`** |
| `@react-router/serve` | **`wrangler`** |
| — | **`@cloudflare/workers-types`** |

---

## react-router-spa-cloudflare (Pages)

**패키지**: `@boilerplates/react-router-spa-cloudflare`

### 가장 단순한 구조

```
web/react-router-spa-cloudflare/
├── app/
│   ├── root.tsx              ← (SPA와 동일)
│   ├── routes.ts
│   └── routes/home.tsx
├── react-router.config.ts    ← ssr: false
├── vite.config.ts            ← (Docker SPA와 동일)
└── package.json              ← wrangler 추가
```

- **서버 코드 없음**: `entry.server.tsx` 없음, `workers/` 없음
- **`wrangler.toml` 없음**: `wrangler pages deploy` 명령으로 직접 배포
- Docker SPA의 Nginx 역할을 Cloudflare Pages가 대신함

### Vite 플러그인 순서 (Docker SPA와 동일)

```typescript
plugins: [tailwindcss(), reactRouter(), tsconfigPaths()]
```

### 배포

```bash
pnpm run build && wrangler pages deploy ./build/client
```

Cloudflare Pages가 자동으로:
- SPA 라우팅 폴백 (index.html)
- 정적 에셋 CDN 캐싱
- 프리뷰 URL (PR별 자동 생성)
