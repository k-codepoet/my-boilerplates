import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    warmup: {
      clientFiles: ["./app/root.tsx"],
    },
  },
});
