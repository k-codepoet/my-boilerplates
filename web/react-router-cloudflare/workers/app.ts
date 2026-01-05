import { createRequestHandler } from "react-router";

// @ts-expect-error - Server build is generated at build time
import * as serverBuild from "../build/server";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const handler = createRequestHandler(serverBuild, "production");

    return handler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
