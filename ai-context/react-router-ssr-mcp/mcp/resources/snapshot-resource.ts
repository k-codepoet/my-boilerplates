/**
 * MCP Resources — expose data snapshots for Claude to read.
 * Replace with your own domain resources.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listPortfolios, getPortfolioSummary, listAssets } from "../../app/lib/queries.js";

export function registerResources(server: McpServer) {
  // All assets as a resource
  server.resource("all-assets", "assets://all", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(listAssets(), null, 2),
      },
    ],
  }));

  // All portfolios summary
  server.resource(
    "all-portfolios",
    "portfolios://all",
    async (uri) => {
      const portfolios = listPortfolios();
      const summaries = portfolios
        .map((p) => getPortfolioSummary(p.id))
        .filter(Boolean);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(summaries, null, 2),
          },
        ],
      };
    }
  );
}
