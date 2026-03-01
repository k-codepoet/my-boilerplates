import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerItemTools } from "./tools/item-tools.js";
import { registerAnalysisTools } from "./tools/analysis-tools.js";
import { registerChatTools } from "./tools/chat-tools.js";
import { registerResources } from "./resources/snapshot-resource.js";
import { registerPrompts } from "./prompts/analysis-prompt.js";

const server = new McpServer({
  name: "context-manager",
  version: "0.1.0",
});

// Register all capabilities
registerItemTools(server);
registerAnalysisTools(server);
registerChatTools(server);
registerResources(server);
registerPrompts(server);

// Connect via stdio (Claude Code CLI spawns this process)
const transport = new StdioServerTransport();
await server.connect(transport);
