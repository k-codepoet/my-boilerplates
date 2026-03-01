# react-router-ssr-mcp

AI Context Management boilerplate — Web UI for CRUD + MCP server for Claude Code CLI integration.

## Architecture

```
┌──────────────────────┐     ┌────────────────────┐
│  Web App (SSR)       │     │  Claude Code CLI    │
│  Data CRUD UI        │     │  Chat / Analysis    │
│  port 3000           │     │                    │
│  SQLite (Drizzle)   ◄├─────┤  MCP Server        │
└──────────────────────┘  DB │  (stdio transport) │
                             └────────────────────┘
```

- **Web App**: React Router v7 SSR — manage domain data
- **MCP Server**: Read same SQLite DB — expose tools/resources/prompts to Claude Code
- **No chat UI** — all conversations happen in Claude Code CLI

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
mcp/tools/              ← Your MCP tools
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
