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

### Per-Category Commands

**Web (React Router/TanStack):**
```bash
pnpm dev        # Development server with HMR
pnpm build      # Production build
pnpm typecheck  # TypeScript check
```

**Web SSR-Cloudflare specific:**
```bash
pnpm start      # Local Wrangler dev server
pnpm deploy     # Deploy to Cloudflare Workers
```

**TanStack Start SSR:**
```bash
pnpm dev        # vinxi dev server
pnpm build      # vinxi build
pnpm start      # Run .output/server/index.mjs
```

**Native App (Tauri):**
```bash
pnpm tauri:dev   # Tauri dev mode with hot reload
pnpm tauri:build # Build installers (exe/dmg/deb)
pnpm dev         # Frontend only (browser)
```

**CLI - Rust (ratatui-rs):**
```bash
cargo run                    # Local run
cargo build --release        # Release build
git tag v0.1.0 && git push origin v0.1.0  # Trigger npm release
```

**CLI - Go (bubbletea-go):**
```bash
go mod tidy      # Install deps
go run ./cmd     # Local run
go build -o mycli ./cmd  # Build
```

**CLI - TypeScript (ink-ts):**
```bash
pnpm dev         # Watch mode
pnpm build       # Build
```

**Bot - Python (slack-processor-python):**
```bash
uv venv && source .venv/bin/activate
uv pip install -e .
python -m src.main
```

## Architecture

### Monorepo Structure
```
web/                          # Web frontend/fullstack
├── react-router-ssr/         # SSR (Node.js, Docker)
├── react-router-spa/         # SPA (Docker/nginx)
├── react-router-ssr-cloudflare/  # SSR (Cloudflare Workers)
├── react-router-spa-cloudflare/  # SPA (Cloudflare Pages)
├── tanstack-start-ssr/       # TanStack Start SSR
└── tanstack-router-spa/      # TanStack Router SPA

cli/                          # CLI/TUI applications
├── ratatui-rs/               # Rust + Ratatui (smallest binary)
├── bubbletea-go/             # Go + Charm ecosystem
└── ink-ts/                   # TypeScript + React-style

native-app/                   # Desktop applications
├── tauri-react-router/       # Tauri v2 + React Router (multi-page)
└── tauri-react/              # Tauri v2 + plain React (single-page)

bot/                          # Bot processors
├── slack-processor-ts/       # Slack file processor (TypeScript)
├── slack-processor-ts-cloudflare/  # Cloudflare variant
└── slack-processor-python/   # Python variant
```

### Web Boilerplate Internal Structure

**SPA Pattern:**
```
app/
├── app.css       # Global styles + Tailwind + theme variables
├── root.tsx      # Root layout with error boundary
├── routes.ts     # Route configuration
├── routes/       # Page components
└── lib/utils.ts  # Utilities (cn function)
```

**SSR Pattern (adds):**
```
app/entry.server.tsx   # SSR with renderToReadableStream + isbot
workers/app.ts         # Cloudflare Worker entry (cloudflare variants)
wrangler.toml          # Cloudflare configuration
```

**Docker variants include:** `Dockerfile`, `docker-compose.yml`

### CLI npm Distribution Pattern (Rust/Go)

Both `ratatui-rs` and `bubbletea-go` use the same npm distribution structure:
```
npm/
├── package.json     # Main package (JS wrapper)
└── bin/
    ├── cli.js       # Entry point
    └── install.js   # Platform binary loader
```

GitHub Actions builds 6 platform binaries and publishes to npm on tag push.

### Technology Stack
- **Package Manager**: pnpm v10.12+
- **Monorepo**: Turbo v2.5+
- **Build**: Vite 7 (web), vinxi (TanStack Start)
- **Framework**: React Router v7, TanStack Router/Start
- **Styling**: Tailwind CSS v4 with OKLch color system
- **UI**: shadcn/ui compatible (new-york style)
- **Types**: TypeScript with strict mode
- **Desktop**: Tauri v2 (Rust backend)

### Path Aliases
All web/native boilerplates use `~/*` → `./app/*` for imports.

### shadcn/ui Integration
Configured in `components.json` (web and native-app templates):
- Components: `~/components`
- UI: `~/components/ui`
- Utils: `~/lib/utils`
- Hooks: `~/hooks`

## Boilerplate Naming Convention
```
{framework}-{rendering}              # Generic (Node.js/Docker)
{framework}-{rendering}-{platform}   # Platform-specific (cloudflare)
```

Examples:
- `react-router-ssr` - Generic SSR, deployable anywhere
- `react-router-spa-cloudflare` - SPA optimized for Cloudflare Pages

## Runtime Requirements

| Category | Runtime | Version Manager |
|----------|---------|-----------------|
| web/*, bot/*-ts | Node.js 22 | nvm (`.nvmrc`) |
| bot/*-python | Python 3.12+ | uv (`.python-version`) |
| cli/ratatui-rs | Rust | rustup |
| cli/bubbletea-go | Go | - |
| native-app/* | Node.js 22 + Rust | nvm + rustup |

See `docs/LOCAL_DEV_SETUP.md` for detailed environment setup.
