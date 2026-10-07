import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // L'heure du jeu se lit à une seule source : maintenant(), dans src/temps/horloge.ts.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/temps/horloge.ts", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "L'heure du jeu se lit à une seule source : maintenant() de src/temps/horloge.ts.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "L'heure du jeu se lit à une seule source : maintenant() de src/temps/horloge.ts.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Les copies de travail des agents (git worktree) : chacune se vérifie chez elle.
    ".claude/**",
  ]),
]);

export default eslintConfig;
