import { describe, expect, it } from "vitest";
import { filledExampleLines, findSecrets, isForbiddenFile } from "./secrets";

// Les faux secrets sont assemblés morceau par morceau, pour que ce fichier ne
// déclenche pas lui-même le scan.
const join = (...parts: string[]) => parts.join("");

describe("scan de secrets", () => {
  it.each([
    ["adresse Postgres avec mot de passe", join("postgres", "://bestia:motdepasse@ep-exemple.neon.tech/neondb")],
    ["mot de passe Neon", join("npg", "_AbCdEf123456")],
    ["jeton JWT", join("eyJ", "hbGciOiJIUzI1NiJ9.", "eyJ", "zdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop")],
    ["clé privée", join("-----BEGIN ", "RSA PRIVATE KEY-----")],
    ["jeton GitHub", join("ghp", "_", "a".repeat(36))],
    ["clé AWS", join("AKIA", "ABCDEFGHIJKLMNOP")],
    ["clé d'API", join("sk", "-", "b".repeat(24))],
  ])("repère : %s", (rule, secret) => {
    expect(findSecrets(`ligne sans rien\nconst valeur = "${secret}";`)).toEqual([{ line: 2, rule }]);
  });

  it("laisse passer une adresse locale de test", () => {
    expect(findSecrets(join("postgres", "://postgres:essai@localhost:5432/bestia"))).toEqual([]);
    expect(findSecrets(join("postgres", "://postgres:essai@127.0.0.1:55432/postgres"))).toEqual([]);
  });

  it("laisse passer une adresse sans mot de passe", () => {
    expect(findSecrets("postgres://localhost/bestia")).toEqual([]);
  });
});

describe("fichiers interdits", () => {
  it.each([".env", ".env.local", ".env.development.local", "apps/jeu/.env.production", ".vercel/project.json"])(
    "refuse %s",
    (path) => expect(isForbiddenFile(path)).toBe(true),
  );

  it.each([".env.example", "src/env.ts", "docs/env.md"])("accepte %s", (path) => expect(isForbiddenFile(path)).toBe(false));
});

describe(".env.example", () => {
  it("n'accepte que des variables vides", () => {
    expect(filledExampleLines("# Adresse de la base\nDATABASE_URL=\nDATABASE_URL_UNPOOLED=\n")).toEqual([]);
    expect(filledExampleLines("DATABASE_URL=\nAUTRE=valeur\n")).toEqual([2]);
  });
});
