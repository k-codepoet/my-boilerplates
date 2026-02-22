# 비교 및 선택 가이드

> 각 보일러플레이트의 상세 구조는 [01-react-router.md](01-react-router.md), [02-tanstack.md](02-tanstack.md) 참조.

---

## 기본 구성 비교

| 항목 | react-router-ssr | react-router-spa | rr-ssr-cloudflare | rr-spa-cloudflare | tanstack-start-ssr | tanstack-router-spa |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **빌드 도구** | Vite 7 | Vite 7 | Vite 7 | Vite 7 | vinxi (Vite 7) | Vite 6 |
| **렌더링** | SSR | SPA | SSR | SPA | SSR | SPA |
| **서버 런타임** | Node.js | Nginx | CF Workers | CF Pages | Node.js | 없음 |
| **배포 방식** | Docker | Docker | wrangler deploy | wrangler pages | Docker | 자유 |
| **경로 별칭** | `~/*` → `./app/*` | `~/*` → `./app/*` | `~/*` → `./app/*` | `~/*` → `./app/*` | `@/*` → `./src/*` | `@/*` → `./src/*` |
| **라우팅 설정** | `app/routes.ts` | `app/routes.ts` | `app/routes.ts` | `app/routes.ts` | 파일 기반 자동 | 파일 기반 자동 |
| **앱 엔트리** | `app/root.tsx` | `app/root.tsx` | `app/root.tsx` | `app/root.tsx` | `src/routes/__root.tsx` | `src/main.tsx` |

---

## 빌드 출력 경로

| 보일러플레이트 | 서버 빌드 | 클라이언트 빌드 |
|--------------|----------|---------------|
| react-router-ssr | `build/server/index.js` | `build/client/` |
| react-router-spa | — | `build/client/` |
| rr-ssr-cloudflare | `build/server/` | `build/client/` |
| rr-spa-cloudflare | — | `build/client/` |
| tanstack-start-ssr | `.output/server/index.mjs` | `.output/public/` |
| tanstack-router-spa | — | `dist/` |

---

## 주요 의존성 차이

| 보일러플레이트 | 프레임워크 패키지 | 서버 패키지 | CSS 빌드 |
|--------------|-----------------|-----------|---------|
| RR SSR | `react-router`, `@react-router/dev` | `@react-router/node`, `@react-router/serve` | `@tailwindcss/vite` |
| RR SPA | `react-router`, `@react-router/dev` | `@react-router/node` | `@tailwindcss/vite` |
| RR SSR CF | `react-router`, `@react-router/dev` | `@react-router/cloudflare`, `wrangler` | `@tailwindcss/vite` |
| RR SPA CF | `react-router`, `@react-router/dev` | `wrangler` | `@tailwindcss/vite` |
| TS Start | `@tanstack/react-router`, `@tanstack/react-start` | `vinxi` | `@tailwindcss/postcss` |
| TS Router | `@tanstack/react-router`, `@tanstack/router-plugin` | — | `@tailwindcss/vite` |

---

## 의사결정 트리

```
시작
  │
  ├── SEO/초기 로딩 속도가 중요한가?
  │     │
  │     ├── YES → SSR 필요
  │     │     │
  │     │     ├── Cloudflare 인프라 사용?
  │     │     │     ├── YES → react-router-ssr-cloudflare
  │     │     │     └── NO ─┐
  │     │     │              │
  │     │     ├── TanStack 생태계 선호?
  │     │     │     ├── YES → tanstack-start-ssr
  │     │     │     └── NO → react-router-ssr
  │     │     │
  │     │     └── 서버 함수(RPC) 필요?
  │     │           ├── YES → tanstack-start-ssr (createServerFn)
  │     │           └── NO → react-router-ssr
  │     │
  │     └── NO → SPA로 충분
  │           │
  │           ├── Cloudflare Pages 배포?
  │           │     ├── YES → react-router-spa-cloudflare
  │           │     └── NO ─┐
  │           │              │
  │           ├── DevTools/테스트 환경 사전 구성?
  │           │     ├── YES → tanstack-router-spa
  │           │     └── NO → react-router-spa
  │           │
  │           └── 가장 단순한 구조 원할 때
  │                 → react-router-spa-cloudflare (서버 코드 0)
  │
  └── 핵심 질문 요약:
        • SEO → SSR
        • Cloudflare → cloudflare 변형
        • TanStack → TanStack 변형
        • 최소 복잡도 → react-router-spa 또는 spa-cloudflare
```

---

## 추천 시나리오

| 시나리오 | 추천 보일러플레이트 | 이유 |
|---------|-------------------|------|
| 마케팅/블로그 사이트 | react-router-ssr-cloudflare | SEO + 에지 렌더링 + 저비용 |
| 사내 대시보드 | react-router-spa | SEO 불필요 + Docker 배포 |
| 빠른 프로토타입 | react-router-spa-cloudflare | 최소 설정 + 무료 호스팅 |
| 풀스택 앱 (서버 로직 포함) | tanstack-start-ssr | createServerFn RPC |
| 리치 SPA (DevTools 필요) | tanstack-router-spa | DevTools + 테스트 사전 구성 |
| 기존 Docker 인프라 + SSR | react-router-ssr | 가장 표준적인 SSR 설정 |

---

## 명령어 요약

### react-router-ssr

```bash
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build → build/server/ + build/client/
pnpm start      # react-router-serve ./build/server/index.js
pnpm typecheck  # react-router typegen && tsc
```

### react-router-spa

```bash
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build → build/client/
pnpm preview    # vite preview (로컬 미리보기)
pnpm typecheck  # react-router typegen && tsc
```

### react-router-ssr-cloudflare

```bash
pnpm dev        # react-router dev (cloudflareDevProxy 포함)
pnpm build      # react-router build
pnpm start      # wrangler dev (로컬 Workers 런타임)
pnpm deploy     # pnpm build && wrangler deploy
pnpm typecheck  # react-router typegen && tsc
```

### react-router-spa-cloudflare

```bash
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build → build/client/
pnpm preview    # vite preview
pnpm deploy     # pnpm build && wrangler pages deploy ./build/client
pnpm typecheck  # react-router typegen && tsc
```

### tanstack-start-ssr

```bash
pnpm dev        # vinxi dev (포트 3000)
pnpm build      # vinxi build → .output/
pnpm start      # node .output/server/index.mjs
pnpm typecheck  # tsc
```

### tanstack-router-spa

```bash
pnpm dev        # vite --port 3000
pnpm build      # vite build && tsc
pnpm preview    # vite preview
pnpm typecheck  # tsc
```
