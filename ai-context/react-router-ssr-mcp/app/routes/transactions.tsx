import type { Route } from "./+types/transactions";
import { listTransactions } from "~/lib/queries";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Transactions - Context Manager" }];
}

export function loader() {
  const rows = listTransactions();
  return { transactions: rows };
}

export default function Transactions({ loaderData }: Route.ComponentProps) {
  const { transactions } = loaderData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Transaction history across all portfolios.
        </p>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Fee</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => {
                const tx = row.transaction;
                const total = tx.quantity * tx.price;
                return (
                  <tr
                    key={tx.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.executedAt instanceof Date
                        ? tx.executedAt.toLocaleDateString()
                        : new Date(tx.executedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === "buy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : tx.type === "sell"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{row.asset.symbol}</td>
                    <td className="px-4 py-3 text-right">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {tx.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {(tx.fee ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {total.toLocaleString()} {tx.currency}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
