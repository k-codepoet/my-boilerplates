/**
 * MCP Tools for querying domain items.
 * Replace with your own domain queries.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listPortfolios,
  getPortfolioWithHoldings,
  getPortfolioSummary,
  listAssets,
  getAsset,
  listTransactions,
} from "../../app/lib/queries.js";

export function registerItemTools(server: McpServer) {
  server.tool(
    "list-portfolios",
    "List all portfolios with basic info",
    {},
    async () => {
      const portfolios = listPortfolios();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(portfolios, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get-portfolio",
    "Get detailed portfolio with all holdings",
    { portfolioId: z.string().describe("Portfolio ID") },
    async ({ portfolioId }) => {
      const portfolio = getPortfolioWithHoldings(portfolioId);
      if (!portfolio) {
        return {
          content: [
            { type: "text" as const, text: `Portfolio ${portfolioId} not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(portfolio, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "portfolio-summary",
    "Get portfolio summary with allocation breakdown and total values",
    { portfolioId: z.string().describe("Portfolio ID") },
    async ({ portfolioId }) => {
      const summary = getPortfolioSummary(portfolioId);
      if (!summary) {
        return {
          content: [
            { type: "text" as const, text: `Portfolio ${portfolioId} not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "list-assets",
    "List all tracked assets",
    {},
    async () => {
      const assets = listAssets();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(assets, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get-asset",
    "Get detailed information about a specific asset",
    { assetId: z.string().describe("Asset ID") },
    async ({ assetId }) => {
      const asset = getAsset(assetId);
      if (!asset) {
        return {
          content: [
            { type: "text" as const, text: `Asset ${assetId} not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(asset, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "list-transactions",
    "List transactions, optionally filtered by portfolio",
    {
      portfolioId: z
        .string()
        .optional()
        .describe("Optional portfolio ID to filter by"),
    },
    async ({ portfolioId }) => {
      const txns = listTransactions(portfolioId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(txns, null, 2),
          },
        ],
      };
    }
  );
}
