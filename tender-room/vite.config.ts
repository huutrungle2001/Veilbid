import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import vinext from "vinext";

export default defineConfig(({ mode }) => ({
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  plugins:
    mode === "sites" ? [vinext(), cloudflare()] : [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
  },
}));
