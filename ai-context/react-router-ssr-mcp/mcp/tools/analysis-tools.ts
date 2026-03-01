/**
 * MCP Tools for domain analysis.
 * Replace with your own analysis logic.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPortfolioSummary, listPortfolios } from "../../app/lib/queries.js";

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    "rebalance-analysis",
    "Compare current allocation vs target and suggest trades",
    { portfolioId: z.string().describe("Portfolio ID to analyze") },
    async ({ portfolioId }) => {
      const summary = getPortfolioSummary(portfolioId);
      if (!summary) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Portfolio ${portfolioId} not found.`,
            },
          ],
          isError: true,
        };
      }

      // Calculate current allocation by asset type
      const currentAllocation: Record<string, number> = {};
      for (const h of summary.holdings) {
        const type = h.type;
        currentAllocation[type] =
          (currentAllocation[type] || 0) + h.totalCost;
      }

      // Convert to percentages
      const totalValue = summary.totalCost;
      const currentPct: Record<string, number> = {};
      for (const [type, value] of Object.entries(currentAllocation)) {
        currentPct[type] = totalValue > 0 ? (value / totalValue) * 100 : 0;
      }

      const analysis = {
        portfolioName: summary.name,
        totalValue: summary.totalCost,
        currency: summary.currency,
        targetAllocation: summary.targetAllocation,
        currentAllocation: currentPct,
        holdings: summary.holdings,
        deviations: {} as Record<string, number>,
      };

      // Calculate deviations
      if (summary.targetAllocation) {
        for (const [type, target] of Object.entries(
          summary.targetAllocation as Record<string, number>
        )) {
          const current = currentPct[type] || 0;
          analysis.deviations[type] = current - target;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "overview",
    "Get a high-level overview of all data for context",
    {},
    async () => {
      const portfolios = listPortfolios();
      const summaries = portfolios
        .map((p) => getPortfolioSummary(p.id))
        .filter(Boolean);

      const overview = {
        portfolioCount: portfolios.length,
        totalAssets: summaries.reduce(
          (sum, s) => sum + (s?.holdingCount ?? 0),
          0
        ),
        portfolios: summaries.map((s) => ({
          name: s?.name,
          totalCost: s?.totalCost,
          holdingCount: s?.holdingCount,
          currency: s?.currency,
        })),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(overview, null, 2),
          },
        ],
      };
    }
  );
}
