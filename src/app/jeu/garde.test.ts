import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// US-0121 : aucune donnée du jeu pour un visiteur non connecté, même par un appel direct. Toute
// page, mise en page, route ou action sous /jeu doit passer par exigerCompte avant de lire quoi
// que ce soit. Ce test les parcourt toutes : une nouvelle page qui l'oublie le fait échouer.
// Seuls l'écran du nom de chef et son action passent par exigerCompteSansChef, qui ouvre au
// joueur encore sans nom.
const JEU = __dirname;

function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((nom) => {
    const chemin = join(dir, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

const aGarder = fichiers(JEU).filter((f) => {
  if (/\.test\.tsx?$/.test(f)) return false;
  if (/(^|\/)(page|layout|route)\.tsx?$/.test(f)) return true;
  return /^["']use server["']/.test(readFileSync(f, "utf8").trimStart());
});

describe("garde des pages du jeu", () => {
  it("trouve bien les pages du jeu à vérifier", () => {
    expect(aGarder.map((f) => relative(JEU, f))).toContain("page.tsx");
  });

  it.each(aGarder.map((f) => [relative(JEU, f), f]))("%s passe par exigerCompte", (_, fichier) => {
    expect(readFileSync(fichier, "utf8")).toMatch(/\bexigerCompte(SansChef)?\(/);
  });

  it("seul l'écran du nom de chef s'ouvre sans nom de chef (US-0131)", () => {
    const sansChef = aGarder.filter((f) => /\bexigerCompteSansChef\(/.test(readFileSync(f, "utf8")));
    expect(sansChef.map((f) => relative(JEU, f)).sort()).toEqual(["nom-de-chef/actions.ts", "nom-de-chef/page.tsx"]);
  });
});
