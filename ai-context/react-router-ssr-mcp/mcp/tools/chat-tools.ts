/**
 * MCP Tools for chat session management (read + write).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listChatSessions,
  getChatSessionWithMessages,
  createChatSession,
  addChatMessage,
} from "../../app/lib/queries.js";

export function registerChatTools(server: McpServer) {
  server.tool(
    "list-chat-sessions",
    "List all chat sessions ordered by most recent",
    {},
    async () => {
      const sessions = listChatSessions();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(sessions, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get-chat-session",
    "Get a chat session with all its messages",
    { sessionId: z.string().describe("Chat session ID") },
    async ({ sessionId }) => {
      const session = getChatSessionWithMessages(sessionId);
      if (!session) {
        return {
          content: [
            { type: "text" as const, text: `Session ${sessionId} not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(session, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "create-chat-session",
    "Create a new chat session and return its ID",
    { title: z.string().describe("Session title") },
    async ({ title }) => {
      const id = createChatSession(title);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ id, title }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "add-chat-message",
    "Add a message to an existing chat session",
    {
      sessionId: z.string().describe("Chat session ID"),
      role: z.enum(["user", "assistant"]).describe("Message role"),
      content: z.string().describe("Message content"),
    },
    async ({ sessionId, role, content }) => {
      const session = getChatSessionWithMessages(sessionId);
      if (!session) {
        return {
          content: [
            { type: "text" as const, text: `Session ${sessionId} not found.` },
          ],
          isError: true,
        };
      }
      const messageId = addChatMessage(sessionId, role, content);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ messageId, sessionId, role }, null, 2),
          },
        ],
      };
    }
  );
}
