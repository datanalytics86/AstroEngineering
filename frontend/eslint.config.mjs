import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextVitals = require("eslint-config-next/core-web-vitals");

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  {
    // React 19 plugin flags existing localStorage/sync effects. Oleada 2 (A5)
    // can rewrite them; we don't block the Next 16 upgrade on that sweep.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
