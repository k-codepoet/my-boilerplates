import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import mdx from "fumadocs-mdx/vite";
import * as MdxConfig from "./source.config";

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || "dev"),
  },
  plugins: [
    mdx(MdxConfig),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths({
      projects: ["./tsconfig.json", "./packages/core/tsconfig.json"],
    }),
  ],
  server: {
    warmup: {
      clientFiles: ["./app/root.tsx"],
    },
    fs: {
      allow: ["../.."],
    },
  },
});
