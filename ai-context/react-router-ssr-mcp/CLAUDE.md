# CLAUDE.md

## Project Overview

AI Context Management App — Web UI for data CRUD, Claude Code CLI for chat/analysis via MCP.

**Architecture:** Web app manages domain data (SQLite). MCP server reads same DB and exposes tools/resources/prompts to Claude Code CLI. No chat UI in web app.

## Tech Stack

- React Router v7 SSR, Vite 7, Node.js 22
- Tailwind CSS v4, shadcn/ui (new-york), lucide-react
- SQLite + Drizzle ORM (better-sqlite3, WAL mode)
- MCP: @modelcontextprotocol/sdk (stdio transport)
- Deploy: Docker multi-stage (node:22-alpine)

## Commands

```bash
pnpm dev              # Web app dev server
pnpm build            # Production build
pnpm typecheck        # TypeScript check
pnpm mcp:dev          # Run MCP server (stdio)
pnpm db:push          # Apply schema to DB
pnpm db:studio        # Drizzle Studio (DB browser)
npx tsx app/db/seed.ts  # Seed example data
```

## MCP Server

The `.mcp.json` at project root auto-configures Claude Code CLI.

**Tools:** list-portfolios, get-portfolio, portfolio-summary, list-assets, get-asset, list-transactions, rebalance-analysis, overview

**Prompts:** review-state, rebalance-portfolio

**Resources:** assets://all, portfolios://all

## Database

SQLite at `./data/app.db` (dev) or `/data/app.db` (Docker).

- Schema: `app/db/schema.ts`
- Connection: `app/db/index.ts` (WAL mode, foreign keys on)
- Shared queries: `app/lib/queries.ts` (used by both routes and MCP)

## Customization Guide

This is a boilerplate. To adapt for your domain:

1. **Schema** (`app/db/schema.ts`) — Replace example tables with your entities
2. **Queries** (`app/lib/queries.ts`) — Replace with your domain queries
3. **Routes** (`app/routes/`) — Update UI for your entities
4. **MCP Tools** (`mcp/tools/`) — Replace with your domain tools
5. **MCP Prompts** (`mcp/prompts/`) — Replace with your analysis prompts

## Path Alias

`~/*` → `./app/*`

## Vite Plugin Order

`tailwindcss()` → `reactRouter()` → `tsconfigPaths()`
