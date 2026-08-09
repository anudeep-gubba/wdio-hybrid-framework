const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

// Flat config (ESLint 9+). Syntactic (non-type-aware) TS linting only — `npm run typecheck`
// already runs `tsc --noEmit` as its own CI step, so type-aware lint rules would just duplicate
// that far more slowly rather than catch anything new.
module.exports = tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "apps/**",
      "allure-results/**",
      "allure-report/**",
      "logs/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "*.apk",
      "*.ipa",
    ],
  },
  {
    // TypeScript-eslint's rules (including `no-require-imports`) only make sense for .ts files —
    // scoped here rather than applied globally, or they'd also flag scripts/*.js and this very
    // config file, both plain CommonJS Node scripts that are supposed to use require().
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha, // describe/it/beforeEach/etc. — ambient (@types/mocha), never imported
      },
    },
    rules: {
      // Page objects/services intentionally accept an unused `_context`-style param in a few
      // places (e.g. wdio.shared.conf.ts's afterTest signature) — allow an explicit `_` prefix
      // to opt out rather than disabling the rule outright.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // scripts/*.js and this config file itself — plain CommonJS Node scripts, not part of
    // tsconfig's `include`, so they get only core ESLint rules plus Node/CommonJS globals.
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  // Must be last — turns off any core/typescript-eslint rules that conflict with Prettier's
  // formatting so the two tools never fight over the same line.
  eslintConfigPrettier,
);
