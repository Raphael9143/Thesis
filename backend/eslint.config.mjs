import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      "max-len": ["error", { code: 100 }],
    },
  },
  {
    files: [
      "server.js",
      "scripts/**",
      "config/**",
      "models/**",
      "controllers/**",
      "routes/**",
      "utils/**",
      "middlewares/**",
      "realtime/**",
    ],
    languageOptions: { globals: globals.node },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
