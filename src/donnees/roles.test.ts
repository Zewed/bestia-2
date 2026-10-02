import { describe, expect, it } from "vitest";
import { lireJeu } from "./charger";
import { ROLES } from "./jeux";

describe("Rôles", () => {
  const roles = lireJeu(ROLES);

  it("sont Porteur, Éclaireur, Nourricier et Bâtisseur", () => {
    expect(roles.map((r) => r.nom)).toEqual(["Porteur", "Éclaireur", "Nourricier", "Bâtisseur"]);
  });

  it("disent chacun, en une phrase, ce qu'ils permettent", () => {
    for (const r of roles) expect(r.phrase.length).toBeGreaterThan(10);
  });
});
