import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api/avwx": {
        target: "https://aviationweather.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/avwx/, "/api/data"),
      },
    },
  },
  base: isGitHubPagesBuild ? "/A220Tools/" : "/",
});
