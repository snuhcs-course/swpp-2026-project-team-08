// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/_layout.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["**/data/**", "**/features/*/hooks/**", "**/features/*/rules"],
        message: "Route files should use a feature Screen or an app-wide Provider API.",
      }] }],
    },
  },
  {
    files: ["src/features/**/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["**/data/**", "**/features/**"],
        message: "Feature Screens and Views should access data through feature Hooks.",
      }] }],
    },
  },
  {
    files: ["src/features/**/*View.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["**/data/**", "**/providers/**", "**/hooks/**", "**/rules", "**/features/**"],
        message: "Views receive values and callbacks from their Screen.",
      }] }],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/**/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["**/features/**"],
        message: "Features should not import another feature's internal files.",
      }] }],
    },
  },
  {
    files: ["src/providers/**/*.{ts,tsx}", "src/data/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["**/features/**"],
        message: "Shared layers must not depend on feature internals.",
      }] }],
    },
  }
]);
