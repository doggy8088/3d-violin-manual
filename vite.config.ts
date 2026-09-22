import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // 網站透過自訂網域 https://violin.gh.miniasp.com 發佈於網域根目錄。
  base: "/",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    target: "es2020",
    assetsInlineLimit: 100_000_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
