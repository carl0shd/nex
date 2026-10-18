import { defineConfig } from "vite-plus";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src/web"),
      "@native": path.resolve(import.meta.dirname, "src/native"),
    },
  },
  fmt: {
    ignorePatterns: [
      ".claude/**",
      "helpers/**",
      "out/**",
      "build/**",
      "src/web/assets/licenses.json",
      "CHANGELOG.md",
      ".changeset/README.md",
    ],
  },
  lint: {
    plugins: ["react", "typescript", "oxc"],
    jsPlugins: ["./lint-rules/nex.mjs"],
    ignorePatterns: ["out/**", "dist/**", "helpers/**"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "warn",
      "react/only-export-components": ["warn", { allowConstantExport: true }],
    },
    overrides: [
      {
        files: ["**/*.{ts,tsx}"],
        rules: { "nex/max-comment-lines": "error", "nex/no-prop-comments": "error" },
      },
      {
        files: ["src/web/components/ui/**/*.tsx"],
        rules: { "react/only-export-components": "off" },
      },
    ],
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
