import { Link } from "react-router";
import type { Route } from "./+types/items.$id";
import { getPortfolioWithHoldings } from "~/lib/queries";
import { ArrowLeft } from "lucide-react";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.portfolio?.name ?? "Not Found";
  return [{ title: `${name} - Context Manager` }];
}

export function loader({ params }: Route.LoaderArgs) {
  const portfolio = getPortfolioWithHoldings(params.id);
  if (!portfolio) {
    throw new Response("Not Found", { status: 404 });
  }
  return { portfolio };
}

export default function ItemDetail({ loaderData }: Route.ComponentProps) {
  const { portfolio } = loaderData;

  const totalCost = portfolio.holdings.reduce(
    (sum, h) => sum + h.holding.quantity * h.holding.averageCost,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/items"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {portfolio.name}
        </h1>
        {portfolio.description && (
          <p className="text-muted-foreground">{portfolio.description}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Holdings</div>
          <div className="mt-1 text-2xl font-bold">
            {portfolio.holdings.length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Cost</div>
          <div className="mt-1 text-2xl font-bold">
            {totalCost.toLocaleString()} {portfolio.currency}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Target Allocation
          </div>
          <div className="mt-1 text-sm">
            {portfolio.targetAllocation ? (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(
                  JSON.parse(portfolio.targetAllocation),
                  null,
                  2
                )}
              </pre>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Holdings</h2>
        {portfolio.holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No holdings in this portfolio.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Avg Cost
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Target %
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => (
                  <tr
                    key={h.holding.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {h.asset.symbol}
                    </td>
                    <td className="px-4 py-3">{h.asset.name}</td>
                    <td className="px-4 py-3 text-right">
                      {h.holding.quantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.holding.averageCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(
                        h.holding.quantity * h.holding.averageCost
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.holding.targetWeight != null
                        ? `${h.holding.targetWeight}%`
                        : "-"}
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
