import { resolve } from "path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@native": resolve(__dirname, "./src/native"),
      },
    },
    build: {
      externalizeDeps: { exclude: ["yaml"] },
      watch: {
        include: [
          "src/native/main/**",
          "src/native/ipc/**",
          "src/native/db/**",
          "src/native/cli/**",
          "src/native/pty/**",
          "src/native/git/**",
          "src/native/agents/**",
          "src/native/protocol/**",
          "src/native/environments/**",
        ],
      },
      rollupOptions: {
        input: resolve("src/native/main/index.ts"),
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        "@native": resolve(__dirname, "./src/native"),
      },
    },
    build: {
      watch: {
        include: ["src/native/preload/**"],
      },
      rollupOptions: {
        input: resolve("src/native/preload/index.ts"),
      },
    },
  },
  renderer: {
    root: resolve("src/web"),
    // Off Vite's default 5173: task environments forward the project's own localhost ports.
    server: { port: 5847 },
    build: {
      rollupOptions: {
        input: resolve("src/web/index.html"),
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src/web"),
        "@native": resolve(__dirname, "./src/native"),
      },
    },
    plugins: [react(), tailwindcss()],
  },
});
