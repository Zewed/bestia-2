import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lireJeu } from "./charger";
import { RARETES } from "./jeux";

describe("Raretés", () => {
  const raretes = lireJeu(RARETES);
  const rang = (id: string) => raretes.find((r) => r.id === id)!.rang;

  it("sont six, de la plus banale à la plus rare", () => {
    expect(raretes.map((r) => r.nom)).toEqual(["Commune", "Peu commune", "Rare", "Épique", "Légendaire", "Mythique"]);
  });

  it("se comparent entre elles par leur rang", () => {
    expect(rang("epique")).toBeGreaterThan(rang("rare"));
    expect(rang("commune")).toBeLessThan(rang("peu_commune"));
    expect(rang("mythique")).toBe(6);
  });

  it("ne laissent pas élever les mythiques, et seulement elles", () => {
    expect(raretes.filter((r) => !r.s_elevent).map((r) => r.id)).toEqual(["mythique"]);
  });

  it("ont chacune leurs couleurs : un fond et un ton pour le texte, pris dans la palette", () => {
    const pastille = readFileSync(join(__dirname, "../components/PastilleRarete.module.css"), "utf8");
    for (const { id } of raretes) {
      const teinte = id.replaceAll("_", "-");
      expect(pastille).toContain(`[data-rarete="${id}"] {\n  background: var(--rarete-${teinte});\n  color: var(--rarete-${teinte}-texte);`);
    }
  });
});
