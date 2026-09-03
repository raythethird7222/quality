import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Keep legacy React lint exceptions narrowly scoped to the files that
  // currently violate the newer React hook/ref rules. These should be removed
  // as the components are refactored; they are intentionally not global.
  {
    files: ["src/components/layout/NotificationPanel.tsx"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["src/features/auth/components/LoginPage.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/features/dashboard/components/AccountFrameworkView.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
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
