import type { Route } from "./+types/import";
import { Upload } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Import - Context Manager" }];
}

export default function Import() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import</h1>
        <p className="text-muted-foreground">
          Import data from CSV or JSON files.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">
          Drag and drop your file here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports CSV and JSON
        </p>
        <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Choose File
        </button>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Expected Format</h2>
        <div className="mt-3 space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-medium text-foreground">CSV</h3>
            <pre className="mt-1 overflow-x-auto rounded bg-muted p-3 text-xs">
              {`symbol,name,type,quantity,average_cost
AAPL,Apple Inc.,stock,10,180.50
VOO,Vanguard S&P 500,etf,20,450.00`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium text-foreground">JSON</h3>
            <pre className="mt-1 overflow-x-auto rounded bg-muted p-3 text-xs">
              {`[
  { "symbol": "AAPL", "name": "Apple Inc.", "type": "stock" },
  { "symbol": "VOO", "name": "Vanguard S&P 500", "type": "etf" }
]`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
