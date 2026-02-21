# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Craftify Boilerplates - a monorepo of production-ready starter templates for web applications, CLI/TUI tools, desktop apps, and bots. Designed for use with `degit` for quick project initialization and integrates with the Craftify CLI framework (`/craftify:poc`).

## Common Commands

### Root Level (Turbo orchestrated)
```bash
pnpm build      # Build all packages
pnpm dev        # Start dev servers for all packages (persistent)
pnpm lint       # Lint all packages
pnpm clean      # Clean build artifacts
```

### Per-Boilerplate Commands

**Web (React Router):**
```bash
pnpm dev        # react-router dev (HMR)
pnpm build      # react-router build
pnpm typecheck  # react-router typegen && tsc
```

**Web SSR-Cloudflare:**
```bash
pnpm start      # wrangler dev (local Workers runtime)
pnpm deploy     # build + wrangler deploy
```

**TanStack Start/Router (uses vinxi, not Vite directly):**
```bash
pnpm dev        # vinxi dev
pnpm build      # vinxi build
pnpm start      # node .output/server/index.mjs
```

**Native App (Tauri v2):**
```bash
pnpm dev         # Frontend only (Vite in browser)
pnpm tauri:dev   # Full Tauri app with hot reload
pnpm tauri:build # Build platform installers (exe/dmg/deb)
```

**CLI - Rust (ratatui-rs):**
```bash
cargo run                    # Local run
cargo build --release        # Release build (opt-level=z, lto, strip)
git tag v0.1.0 && git push origin v0.1.0  # Trigger npm release pipeline
```

**CLI - Go (bubbletea-go):**
```bash
go mod tidy      # Install deps
go run ./cmd     # Local run
go build -o mycli ./cmd  # Build
```

**CLI - TypeScript (ink-ts):**
```bash
pnpm dev         # tsx watch src/cli.tsx
pnpm build       # tsc
```

**Bot - TypeScript (slack-processor-ts):**
```bash
pnpm dev         # tsx watch src/index.ts
pnpm build       # tsc
pnpm start       # node dist/index.js
```

**Bot - Cloudflare (slack-processor-ts-cloudflare):**
```bash
pnpm dev             # wrangler dev
pnpm deploy          # wrangler deploy
pnpm db:init         # D1 local schema setup
pnpm db:init:remote  # D1 remote schema setup
```

**Bot - Python (slack-processor-python):**
```bash
uv venv && source .venv/bin/activate
uv pip install -e .
python -m src.main
# Linting: ruff check src/  |  Type checking: mypy src/
```

## Architecture

### Monorepo Structure
```
web/                          # Web frontend/fullstack
├── react-router-ssr/         # SSR (Node.js, Docker)
├── react-router-spa/         # SPA (Docker/nginx)
├── react-router-ssr-cloudflare/  # SSR (Cloudflare Workers)
├── react-router-spa-cloudflare/  # SPA (Cloudflare Pages)
├── tanstack-start-ssr/       # TanStack Start SSR (vinxi)
└── tanstack-router-spa/      # TanStack Router SPA (vinxi)

cli/                          # CLI/TUI applications
├── ratatui-rs/               # Rust + Ratatui (smallest binary)
├── bubbletea-go/             # Go + Charm ecosystem
└── ink-ts/                   # TypeScript + Ink (React for terminal)

native-app/                   # Desktop applications (Tauri v2)
├── tauri-react-router/       # Multi-page (React Router)
└── tauri-react/              # Single-page (plain React)

bot/                          # Bot/processor applications
├── slack-processor-ts/       # Slack bolt, Docker (Node.js)
├── slack-processor-ts-cloudflare/  # Hono + D1, Cloudflare Workers
└── slack-processor-python/   # slack-bolt, Docker (Python/uv)

lib/                          # Shared packages (placeholder, empty)
```

### Key Architectural Patterns

**Web SPA pattern:** `app/root.tsx` → `app/routes.ts` → `app/routes/` pages. Vite plugin order matters: `tailwindcss()` → framework plugin → `tsconfigPaths()`.

**Web SSR adds:** `app/entry.server.tsx` (renderToReadableStream + isbot detection). Cloudflare variants add `workers/app.ts` entry + `wrangler.toml`.

**Docker variants:** Multi-stage builds (builder → runner) on `node:22-alpine`. SPA uses nginx with `try_files $uri $uri/ /index.html` fallback and 1-year immutable cache on `/assets/`.

**CLI npm distribution (Rust/Go):** Both use identical `npm/` structure with `bin/cli.js` (entry) + `bin/install.js` (platform binary loader). 6 platform optional deps: `{darwin,linux,win32}-{arm64,x64}`. GitHub Actions builds all platforms on tag push and publishes to npm.

**Bot Cloudflare variant:** Uses Hono (not Slack Bolt) as web framework with D1 database binding. Secrets managed via `wrangler secret put`.

**Tauri apps:** `src/` (React frontend) + `src-tauri/` (Rust backend). Configured with plugins: fs, dialog, shell, updater, process. Updater pubkey needs setup for production.

### Technology Stack
- **Package Manager**: pnpm v10.12+ (enforced via corepack)
- **Monorepo**: Turbo v2.5+
- **Build**: Vite 7 (web/native), vinxi (TanStack Start/Router)
- **Framework**: React Router v7, TanStack Router/Start
- **Styling**: Tailwind CSS v4 with OKLch color system
- **UI**: shadcn/ui (new-york style), lucide-react icons, Inter font
- **Types**: TypeScript strict mode, `verbatimModuleSyntax: true`
- **Desktop**: Tauri v2 (Rust backend)
- **Python tooling**: uv (package manager), ruff (linter), mypy (strict)

### Path Aliases & shadcn/ui
All web and native-app boilerplates use `~/*` → `./app/*`. Components.json configured with: components at `~/components/ui`, utils at `~/lib/utils`, hooks at `~/hooks`. Base color: neutral.

## CI/CD

### Validation Pipeline (GitHub Actions + GitLab CI)
Both pipelines follow the same pattern: **degit simulation** - copies each boilerplate to a temp directory, installs deps, runs build + typecheck. This validates each template works standalone.

- **Node.js boilerplates**: Node 22, pnpm via corepack
- **Rust**: Stable toolchain, cross-compilation for Linux ARM64
- **Go**: 1.23 with module caching
- **Python**: 3.12 with uv, ruff lint (non-blocking), mypy (non-blocking)
- **Docker builds**: Verified for react-router-spa, react-router-ssr, tanstack-start-ssr, slack-processor-python

### Cloudflare Deployment Workflows
- SSR Workers: Environment split - `preview` for PRs, `production` for main
- SPA Pages: PR preview with auto-comment containing preview URL
- Both use `cloudflare/wrangler-action@v3`

### Required Secrets
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (Cloudflare deployments)
- `NPM_TOKEN` (CLI binary publishing)
- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` (bot projects, via wrangler secret or env)

## Boilerplate Naming Convention
```
{framework}-{rendering}              # Generic (Node.js/Docker)
{framework}-{rendering}-{platform}   # Platform-specific (cloudflare)
```

## Runtime Requirements

| Category | Runtime | Version File |
|----------|---------|-------------|
| web/*, bot/*-ts, native-app/* | Node.js 22 | `.nvmrc` |
| bot/*-python | Python 3.11+ | `.python-version` |
| cli/ratatui-rs, native-app/* | Rust (stable) | rustup |
| cli/bubbletea-go | Go 1.23 | go.mod |

## Build Outputs

| Boilerplate Type | Output Path |
|-----------------|-------------|
| React Router web | `build/client/`, `build/server/` |
| TanStack Start | `.output/server/index.mjs` |
| Rust CLI | `target/release/` |
| Go CLI | binary in project root |
| TypeScript (tsc) | `dist/` |

## Testing

No testing framework is configured in any boilerplate. Only `typecheck` (tsc --noEmit) is available for static analysis. Add vitest/playwright/etc. as needed per project.
