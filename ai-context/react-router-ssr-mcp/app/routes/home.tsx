import type { Route } from "./+types/home";
import { listPortfolios, listAssets } from "~/lib/queries";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Context Manager" },
    { name: "description", content: "AI context management dashboard" },
  ];
}

export function loader() {
  const portfolios = listPortfolios();
  const assets = listAssets();
  return { portfolios, assets };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { portfolios, assets } = loaderData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage context data. Chat via Claude Code CLI.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Portfolios
          </div>
          <div className="mt-2 text-3xl font-bold">{portfolios.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Assets
          </div>
          <div className="mt-2 text-3xl font-bold">{assets.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            MCP Status
          </div>
          <div className="mt-2 text-lg font-semibold text-green-600">
            Ready
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Run <code className="rounded bg-muted px-1">claude</code> in
            project root
          </p>
        </div>
      </div>

      {/* Quick guide */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick Start</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
            <span>
              Add your data via the <strong>Items</strong> page or{" "}
              <strong>Import</strong> CSV/JSON.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>
            <span>
              Open Claude Code CLI in the project directory. The MCP server
              auto-connects via <code className="rounded bg-muted px-1">.mcp.json</code>.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>
            <span>
              Ask Claude: &ldquo;Show my portfolio&rdquo;, &ldquo;Suggest
              rebalancing&rdquo;, etc.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
