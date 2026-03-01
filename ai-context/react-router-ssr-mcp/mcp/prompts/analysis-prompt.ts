/**
 * MCP Prompts — pre-built prompt templates for common analysis.
 * Replace with your own domain prompts.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPortfolioSummary, listPortfolios } from "../../app/lib/queries.js";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "review-state",
    "Review the current state of all data and suggest improvements",
    {},
    async () => {
      const portfolios = listPortfolios();
      const summaries = portfolios
        .map((p) => getPortfolioSummary(p.id))
        .filter(Boolean);

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Review the current state of my data and provide insights.

Current Data:
${JSON.stringify(summaries, null, 2)}

Please:
1. Summarize the current state
2. Identify any issues or areas for improvement
3. Suggest actionable next steps
4. Highlight anything that needs attention`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "rebalance-portfolio",
    "Analyze a portfolio and suggest rebalancing trades",
    { portfolioId: z.string().describe("Portfolio ID to analyze") },
    async ({ portfolioId }) => {
      const summary = getPortfolioSummary(portfolioId);
      if (!summary) {
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: `Portfolio ${portfolioId} not found. Available portfolios: ${listPortfolios()
                  .map((p) => `${p.name} (${p.id})`)
                  .join(", ")}`,
              },
            },
          ],
        };
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Analyze this portfolio and suggest rebalancing trades to align with target allocation.

Portfolio: ${summary.name}
Currency: ${summary.currency}
Total Cost: ${summary.totalCost.toLocaleString()}

Target Allocation: ${JSON.stringify(summary.targetAllocation, null, 2)}

Current Holdings:
${JSON.stringify(summary.holdings, null, 2)}

Please:
1. Compare current vs target allocation
2. Identify overweight and underweight positions
3. Suggest specific trades (buy/sell amounts) to rebalance
4. Consider transaction costs
5. Prioritize changes by impact`,
            },
          },
        ],
      };
    }
  );
}
