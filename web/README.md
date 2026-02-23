# Web 보일러플레이트

> 6개의 웹 프론트엔드/풀스택 보일러플레이트. React Router v7 / TanStack 기반.

## 보일러플레이트 목록

| 이름 | 렌더링 | 배포 | 한 줄 설명 |
|------|--------|------|-----------|
| `react-router-ssr` | SSR | Docker | Node.js SSR, isbot 감지, 스트리밍 HTML |
| `react-router-spa` | SPA | Docker+Nginx | 정적 빌드, Nginx SPA 폴백, 1년 에셋 캐시 |
| `react-router-ssr-cloudflare` | SSR | CF Workers | Edge SSR, 환경 분리(preview/production) |
| `react-router-spa-cloudflare` | SPA | CF Pages | 가장 단순한 구조, 서버 코드 0 |
| `tanstack-start-ssr` | SSR | Docker | vinxi 빌드, createServerFn RPC |
| `tanstack-router-spa` | SPA | 정적 | 순수 Vite, DevTools + 테스트 환경 내장 |

## 선택 가이드

```
SEO/초기 로딩 중요?
├── YES → SSR
│   ├── Cloudflare? → react-router-ssr-cloudflare
│   ├── 서버 함수(RPC) 필요? → tanstack-start-ssr
│   └── 기본 SSR → react-router-ssr
└── NO → SPA
    ├── Cloudflare Pages? → react-router-spa-cloudflare
    ├── DevTools/테스트 환경? → tanstack-router-spa
    └── Docker 인프라? → react-router-spa
```

| 시나리오 | 추천 | 이유 |
|---------|------|------|
| 마케팅/블로그 | rr-ssr-cloudflare | SEO + 에지 렌더링 + 저비용 |
| 사내 대시보드 | rr-spa | SEO 불필요 + Docker 배포 |
| 빠른 프로토타입 | rr-spa-cloudflare | 최소 설정 + 무료 호스팅 |
| 풀스택 앱 | tanstack-start-ssr | createServerFn RPC |
| 리치 SPA | tanstack-router-spa | DevTools + vitest 사전 구성 |

## 공통 기술 스택

- **React 19** + **TypeScript** (strict mode, `verbatimModuleSyntax`)
- **Tailwind CSS v4** — OKLch 색상 시스템, CSS 파일에서 `@theme inline` 설정
- **shadcn/ui** — new-york 스타일, neutral 베이스, lucide-react 아이콘
- **Vite 7** (TanStack Router SPA만 Vite 6)
- **Node.js 22** (.nvmrc) + **pnpm 10.12+** (corepack)

## 빠른 시작

### degit으로 복제

```bash
npx degit user/my-boilerplates/web/react-router-ssr my-app
cd my-app && pnpm install && pnpm dev
```

### 명령어 요약

| 보일러플레이트 | dev | build | start/deploy |
|--------------|-----|-------|-------------|
| react-router-ssr | `pnpm dev` | `pnpm build` | `pnpm start` |
| react-router-spa | `pnpm dev` | `pnpm build` | `pnpm preview` |
| rr-ssr-cloudflare | `pnpm dev` | `pnpm build` | `pnpm deploy` |
| rr-spa-cloudflare | `pnpm dev` | `pnpm build` | `pnpm deploy` |
| tanstack-start-ssr | `pnpm dev` | `pnpm build` | `pnpm start` |
| tanstack-router-spa | `pnpm dev` | `pnpm build` | `pnpm preview` |

모든 보일러플레이트에서 `pnpm typecheck`으로 타입 검사 가능.

## Vite 플러그인 순서 (주의)

플러그인 순서가 잘못되면 빌드가 실패한다. 보일러플레이트마다 순서가 다르다:

| 보일러플레이트 | 플러그인 순서 | 비고 |
|--------------|-------------|------|
| rr-ssr / rr-spa / rr-spa-cf | `tailwindcss()` → `reactRouter()` → `tsconfigPaths()` | 표준 순서 |
| rr-ssr-cloudflare | `cloudflareDevProxy()` → `tailwindcss()` → `reactRouter()` → `tsconfigPaths()` | CF 프록시가 반드시 첫 번째 |
| tanstack-start-ssr | `tsConfigPaths()` → `tanstackStart()` → `viteReact()` | `@tailwindcss/postcss` 사용 (vite 플러그인 아님) |
| tanstack-router-spa | `TanStackRouterVite()` → `viteReact()` → `tailwindcss()` | `resolve.alias`로 `@/` 매핑 추가 |

## 경로 별칭

| 프레임워크 | 별칭 | 매핑 |
|-----------|------|------|
| React Router (4개) | `~/*` | `./app/*` |
| TanStack (2개) | `@/*` | `./src/*` |

## 다음 작업

- [ ] 테스트 프레임워크 도입 (vitest + playwright, 현재 typecheck만 존재)
- [ ] Cloudflare Workers SSR 환경 분리 검증 (preview/production 독립 동작)
- [ ] TanStack Start vinxi 빌드 안정성 확인 (vinxi 버전 업데이트 대응)
- [ ] 보일러플레이트 간 공통 컴포넌트 추출 가능성 검토

## 상세 문서

- [아키텍처 상세](docs/index.md) — 각 보일러플레이트 내부 구조, 비교 매트릭스, 배포 패턴, Cloudflare 바인딩 패턴
