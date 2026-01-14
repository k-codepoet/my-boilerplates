import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Tauri expects a fixed port during development
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // Vite options for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    warmup: {
      clientFiles: ["./app/root.tsx"],
    },
  },
});
