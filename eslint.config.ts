import { defineConfig, globalIgnores, type ConfigObject } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "public/**"]),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      // Type-aware rules. Superset of `recommended`, and the only way to get
      // no-floating-promises / no-misused-promises, which matter in a codebase
      // built on sagas and async worker messaging.
      tseslint.configs.recommendedTypeChecked,

      // The plugin's own flat config registers the plugin and its recommended
      // rules. The cast works around an upstream typing mismatch: the plugin
      // nests a `configs.flat` namespace inside `configs`, which ESLint 10's
      // `Plugin` type does not allow. The rules themselves run correctly.
      reactHooks.configs.flat.recommended as ConfigObject,
    ],
    languageOptions: {
      parserOptions: {
        // Walks up from each file to find src/tsconfig.json. No
        // tsconfigRootDir needed, since no project paths are passed.
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
    },
    rules: {
      // This codebase leans on `any` in its redux action/reducer plumbing and
      // in a few places where upstream types are wrong. Surfacing every one as
      // an error would bury real findings.
      "@typescript-eslint/no-explicit-any": "off",

      // `require()` is deliberate here: webpack resolves the translation JSON
      // and mock save that way.
      "@typescript-eslint/no-require-imports": "off",

      // `{}` appears in type positions that are intentionally open (props
      // intersections, generic defaults).
      "@typescript-eslint/no-empty-object-type": "off",

      // The no-unsafe-* family flags every value that flows out of an `any`.
      // Since `no-explicit-any` is deliberately off above, leaving these on
      // would contradict that and bury the type-aware rules worth reading
      // (~150 findings, all restating "this codebase uses any").
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",

      // Props are declared with method shorthand (`onClick(): void`), which
      // TypeScript types as a method carrying an implicit `this`, so merely
      // destructuring one trips this rule. No real unbound `this` exists here.
      // Declaring props as `onClick: () => void` would make it safe to re-enable.
      "@typescript-eslint/unbound-method": "off",

      // Unused args are common in reducer and saga signatures; allow the
      // conventional underscore prefix to opt out.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Test files run under jest.
  {
    files: ["src/**/*.spec.{ts,tsx}"],
    languageOptions: {
      globals: globals.jest,
    },
  },

  // Build tooling and Claude Code hooks are CommonJS running in node. These
  // sit outside src/tsconfig.json, so type-aware rules must be off or the
  // parser errors that the file is not part of any project.
  {
    files: ["*.js", ".claude/**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
