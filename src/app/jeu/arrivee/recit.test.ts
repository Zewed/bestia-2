import { describe, expect, it } from "vitest";
import { BETES_AUX_ABORDS, deMonde, recitDArrivee } from "./recit";

describe("récit d'arrivée (US-0158)", () => {
  it("dit la prairie, la Couronne au bord du Monde, et le Foyer, en deux phrases", () => {
    expect(recitDArrivee("Aube")).toBe("Une prairie au bord du Monde, sur la Couronne d'Aube. C'est ici que naît votre Foyer.");
  });

  it("dit en une phrase de plus que quelques Bêtes rôdent dans les abords, sans dire où (US-0975)", () => {
    expect(recitDArrivee("Aube", true)).toBe(
      "Une prairie au bord du Monde, sur la Couronne d'Aube. C'est ici que naît votre Foyer. Quelques Bêtes rôdent dans les abords.",
    );
    expect(recitDArrivee("Aube", false)).not.toContain(BETES_AUX_ABORDS);
  });

  it.each([
    ["Aube", "d'Aube"],
    ["Écume", "d'Écume"],
    ["Hiver", "d'Hiver"],
    ["Zénith", "de Zénith"],
  ])("élide devant une voyelle ou un h : %s → %s", (monde, attendu) => {
    expect(deMonde(monde)).toBe(attendu);
  });
});
