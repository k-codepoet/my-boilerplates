# react-router-ssr-mcp

AI Context Management boilerplate — Web UI for CRUD & chat + MCP server for Claude Code CLI integration.

## Architecture

```
┌───────────────────────────┐     ┌────────────────────┐
│  Web App (SSR)            │     │  Claude Code CLI    │
│  Data CRUD + Chat UI      │     │  Chat / Analysis    │
│  port 3000                │     │                    │
│  SQLite (Drizzle, WAL)   ◄├─────┤► MCP Server        │
└───────────────────────────┘  DB │  (stdio, R/W)      │
                                  └────────────────────┘
```

- **Web App**: React Router v7 SSR — manage domain data + chat sessions
- **MCP Server**: Read/write same SQLite DB — expose tools/resources/prompts to Claude Code
- **Shared DB**: 웹에서 입력한 데이터를 MCP로 조회, MCP로 기록한 데이터를 웹에서 확인

## Quick Start

```bash
# Install
pnpm install

# Initialize database
pnpm db:push
npx tsx app/db/seed.ts  # Optional: seed example data

# Development
pnpm dev        # Web app at http://localhost:5173

# Claude Code CLI (in separate terminal, same directory)
claude          # .mcp.json auto-loads MCP server
```

## Stack

| Layer | Tech |
|-------|------|
| Framework | React Router v7 SSR |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Database | SQLite + Drizzle ORM |
| MCP | @modelcontextprotocol/sdk (stdio) |
| Build | Vite 7, pnpm |
| Deploy | Docker multi-stage (node:22-alpine) |

## Customization

Files marked with arrows are the ones to replace for your domain:

```
app/db/schema.ts        ← Your entities
app/lib/queries.ts      ← Your queries (shared: routes + MCP)
app/routes/             ← Your UI pages
app/routes/chat*.tsx    ← Chat UI (reuse or replace)
mcp/tools/              ← Your MCP tools
mcp/tools/chat-tools.ts ← Chat tools (reuse or replace)
mcp/prompts/            ← Your analysis prompts
CLAUDE.md               ← Your project instructions
```

## Docker

```bash
docker build -t my-context-app .
docker run -p 3000:3000 -v ./data:/data my-context-app
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm typecheck` | TypeScript check |
| `pnpm mcp:dev` | MCP server (stdio) |
| `pnpm db:push` | Apply schema |
| `pnpm db:studio` | DB browser |

## Known Issues

- [ ] Vite dev server remote access via Tailscale DNS (`host: true` + `allowedHosts: true` configured but still blocked) — investigate CORS/host validation for non-localhost access
