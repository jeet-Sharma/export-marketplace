import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Codebase-wide restriction: `any` defeats the point of TypeScript, so we
  // ban it outright rather than relying on whatever eslint-config-next's
  // default happens to be. Use `unknown` + narrowing, or a proper type,
  // instead.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
