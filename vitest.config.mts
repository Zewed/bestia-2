import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Le même raccourci que tsconfig.json : « @/… » désigne src/.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Les tests tournent côté serveur : la garde « server-only » n'a rien à y empêcher.
      "server-only": fileURLToPath(new URL("./src/test/vide.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    // Met la base de test à jour avant les tests sur base (*.db.test.ts).
    globalSetup: ["./src/test/preparer-base.ts"],
    testTimeout: 20_000,
  },
});
