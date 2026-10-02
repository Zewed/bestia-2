import { describe, expect, it } from "vitest";
import { lireJeu, valider } from "./charger";
import { COUPLES_DE_DEPART, ESPECES, verifierCouples } from "./jeux";

describe("Couples de départ", () => {
  const couples = lireJeu(COUPLES_DE_DEPART);

  it("sont la souris, la poule et le pigeon, dans cet ordre, avec leur style", () => {
    expect(couples.map((c) => [c.espece, c.style, c.ordre])).toEqual([
      ["souris", "Se défendre", 1],
      ["poule", "Grandir", 2],
      ["pigeon", "Explorer", 3],
    ]);
  });

  it("ont chacun une phrase courte", () => {
    for (const c of couples) expect(c.phrase.length).toBeLessThan(60);
  });

  it("ne proposent que des Espèces qui existent, une seule fois chacune", () => {
    expect(() => verifierCouples(couples, lireJeu(ESPECES).map((e) => e.id))).not.toThrow();
    expect(() => verifierCouples([{ ...couples[0], espece: "licorne" }], ["souris"])).toThrow(/Espèce inconnue « licorne »/);
    expect(() => valider(COUPLES_DE_DEPART, [couples[0], couples[0]])).toThrow(/existe déjà/);
  });
});
