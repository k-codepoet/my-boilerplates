import { Link } from "react-router";
import type { Route } from "./+types/items";
import { listPortfolios, listAssets } from "~/lib/queries";
import { Plus } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Items - Context Manager" }];
}

export function loader() {
  const portfolios = listPortfolios();
  const assets = listAssets();
  return { portfolios, assets };
}

export default function Items({ loaderData }: Route.ComponentProps) {
  const { portfolios, assets } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">
            Manage your domain entities.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Portfolios */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Portfolios</h2>
        {portfolios.length === 0 ? (
          <p className="text-sm text-muted-foreground">No portfolios yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p) => (
              <Link
                key={p.id}
                to={`/items/${p.id}`}
                className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.currency}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Assets */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Assets</h2>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Sector</th>
                  <th className="px-4 py-3 text-left font-medium">Exchange</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {a.symbol}
                    </td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.sector ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.exchange ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
