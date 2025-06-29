// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Base ESLint configuration
  eslint.configs.recommended,

  // TypeScript ESLint configuration
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylistic,

  // Global configuration
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Files to include
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },

  // Files to ignore
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".yarn/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      ".pnp.*",
      ".yarn.lock",
    ],
  },

  // Custom rules for the project
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-inferrable-types": "off",

      // General rules
      "no-console": "off", // Allow console in CLI app
      "no-process-exit": "off", // Allow process.exit in CLI app
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "template-curly-spacing": "error",
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      indent: ["error", 2, { SwitchCase: 1 }],
      "max-len": [
        "error",
        { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true },
      ],
    },
  },

  // Test files specific configuration
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  // Configuration files
  {
    files: ["*.config.{js,ts,mjs}", "jest.config.js"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
