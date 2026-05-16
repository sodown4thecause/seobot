import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "node_modules/**",
      ".worktrees/**",
      ".codex-worktrees/**",
      ".local-sync-backup/**",
      ".agent/**",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".cursor/**",
      ".github/**",
      ".opencode/**",
      ".vscode/**",
      "mcps/**",
      "claude-seo/**",
      "documents/**",
      "kitty/**",
      "wezterm/**",
      "~/**",
      "scripts/**",
      "tests/**",
      "e2e/**",
      "drizzle/**",
      "supabase/**",
      "remotion-ad/**",
      "tmp/**",
      "tmp-librarian/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/no-array-constructor": "warn",
      "@typescript-eslint/no-this-alias": "warn",
    },
  },
]);

export default eslintConfig;
