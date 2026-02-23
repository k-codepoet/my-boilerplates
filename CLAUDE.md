# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Craftify Boilerplates - a monorepo of production-ready starter templates for web applications, CLI/TUI tools, desktop apps, game engines, and bots. Designed for use with `degit` for quick project initialization and integrates with the Craftify CLI framework (`/craftify:poc`).

## Monorepo Structure

```
web/                              # 웹 프론트엔드/풀스택 (6종)
├── react-router-ssr/             # SSR, Docker
├── react-router-spa/             # SPA, Docker+Nginx
├── react-router-ssr-cloudflare/  # SSR, Workers
├── react-router-spa-cloudflare/  # SPA, Pages
├── tanstack-start-ssr/           # SSR, vinxi+Docker
└── tanstack-router-spa/          # SPA, Vite
→ 상세: web/README.md · web/docs/index.md

cli/                              # CLI/TUI (3종)
├── ratatui-rs/                   # Rust + Ratatui
├── bubbletea-go/                 # Go + Bubbletea
└── ink-ts/                       # TypeScript + Ink
→ 상세: cli/README.md · cli/docs/index.md

native-app/                       # 데스크톱 앱 (2종)
├── tauri-react-router/           # Tauri v2, 멀티 페이지
└── tauri-react/                  # Tauri v2, 싱글 페이지
→ 상세: native-app/README.md · native-app/docs/index.md

bot/                              # Bot/Processor (3종)
├── slack-processor-ts/           # Slack Bolt, Docker
├── slack-processor-ts-cloudflare/ # Hono+D1, Workers
└── slack-processor-python/       # slack-bolt, Docker
→ 상세: bot/README.md · bot/docs/index.md

game/                             # 게임 엔진 (2종)
├── msw-engine/                   # MSW 엔진 코어, Vite
└── msw-react-router-spa/         # MSW + React Router SPA
→ 상세: game/README.md · game/docs/

lib/                              # 공유 패키지 (placeholder)
```

## Common Commands

```bash
# Root (Turbo)
pnpm build | dev | lint | clean

# Web (React Router)
pnpm dev | build | typecheck

# Web (Cloudflare)
pnpm start | deploy

# TanStack Start
pnpm dev | build | start    # vinxi 기반

# TanStack Router SPA
pnpm dev | build             # Vite 기반

# Native App (Tauri v2)
pnpm dev | tauri:dev | tauri:build

# CLI - Rust
cargo run | cargo build --release

# CLI - Go
go run ./cmd | go build -o mycli ./cmd

# CLI - TypeScript
pnpm dev | build

# Bot - TypeScript
pnpm dev | build | start

# Bot - Cloudflare
pnpm dev | deploy | db:init | db:init:remote

# Bot - Python
uv venv && source .venv/bin/activate && uv pip install -e . && python -m src.main

# Game
pnpm dev | build | typecheck
```

## Technology Stack

| 영역 | 기술 |
|------|------|
| Package Manager | pnpm v10.12+ (corepack) |
| Monorepo | Turbo v2.5+ |
| Build | Vite 7, vinxi (TanStack Start only) |
| Framework | React Router v7, TanStack Router/Start |
| Styling | Tailwind CSS v4, OKLch, shadcn/ui (new-york), lucide-react, Inter |
| Types | TypeScript strict, `verbatimModuleSyntax: true` |
| Desktop | Tauri v2 (Rust) |
| Python | uv, ruff, mypy (strict) |

## Key Patterns (Quick Reference)

**Path Aliases:** `~/*` → `./app/*` (web/native/game). TanStack uses `@/*` → `./src/*`. msw-engine uses `~/*` → `./src/*`.

**Vite Plugin Order:** `tailwindcss()` → framework plugin → `tsconfigPaths()`. Cloudflare SSR prepends `cloudflareDevProxy()`. TanStack order differs — see `web/README.md`.

**Docker:** Multi-stage (builder → runner) on `node:22-alpine`. SPA uses nginx with `try_files` fallback.

**CLI npm Distribution:** `npm/bin/cli.js` + `install.js` → 6 platform optional deps. Tag push triggers CI build + npm publish.

**MSW Game Engine:** Scene → GameObject → Trait composition. 4 adapters (Canvas/PixiJS/Three.js/Phaser) with runtime toggle. Programmatic sprites via OffscreenCanvas → ImageBitmap. Coordinate conversion: gameplay uses top-left, renderers use center-origin — `getRenderTransform()` bridges. **Scene must never re-poll input** — use `update(dt, collisions, input)` parameter.

**Naming Convention:** `{framework}-{rendering}[-{platform}]`

**작업 현황:** [context.md](context.md) — 전체 카테고리별 상태/다음 작업 대시보드. 각 카테고리 README의 "다음 작업" 섹션으로 연결.

## Runtime Requirements

| Category | Runtime | Version |
|----------|---------|---------|
| web/*, bot/*-ts, native-app/*, game/* | Node.js | 22 (.nvmrc) |
| bot/*-python | Python | 3.11+ (.python-version) |
| cli/ratatui-rs, native-app/* | Rust | stable (rustup) |
| cli/bubbletea-go | Go | 1.23 (go.mod) |

## Build Outputs

| Type | Output |
|------|--------|
| React Router | `build/client/`, `build/server/` |
| TanStack Start | `.output/server/index.mjs` |
| Vite SPA (MSW Engine, TanStack Router) | `dist/` |
| Rust CLI | `target/release/` |
| Go CLI | binary in project root |
| TypeScript (tsc) | `dist/` |

## CI/CD

**Validation:** degit simulation — copies each boilerplate to temp, installs, builds, typechecks. GitHub Actions + GitLab CI.

**Cloudflare:** `cloudflare/wrangler-action@v3`. SSR Workers: `preview`/`production` 환경 분리. SPA Pages: PR preview + auto-comment.

**Required Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NPM_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`

**Game:** Not yet in CI — add when stabilized.

## Testing

No testing framework configured. Only `typecheck` (tsc --noEmit) available. Add vitest/playwright as needed.

## Deep Dive (Progressive Disclosure)

각 카테고리의 상세 아키텍처, 선택 가이드, 구현 패턴:

| 카테고리 | 요약 (README) | 상세 문서 (docs/) |
|----------|-------------|-----------------|
| **web/** | [web/README.md](web/README.md) | [index.md](web/docs/index.md) → 4개 문서 (공통스택, React Router, TanStack, 비교) |
| **cli/** | [cli/README.md](cli/README.md) | [index.md](cli/docs/index.md) → 5개 문서 (Rust, Go, TS, npm배포, 비교) |
| **native-app/** | [native-app/README.md](native-app/README.md) | [index.md](native-app/docs/index.md) → 4개 문서 (Tauri개요, React Router, React, 비교) |
| **bot/** | [bot/README.md](bot/README.md) | [index.md](bot/docs/index.md) → 5개 문서 (공통패턴, TS, CF, Python, 비교) |
| **game/** | [game/README.md](game/README.md) | [index.md](game/docs/index.md) → 6개 아키텍처 + [contributing.md](game/docs/contributing.md) · [ai-guide.md](game/docs/ai-guide.md) |
