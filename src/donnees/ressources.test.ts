import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { lireJeu, valider } from "./charger";
import { RESSOURCES } from "./jeux";

describe("Ressources (US-0201)", () => {
  const ressources = lireJeu(RESSOURCES);

  it("sont la Viande, les Végétaux, le Bois et la Pierre, dans cet ordre", () => {
    expect(ressources.map((r) => [r.id, r.nom, r.ordre])).toEqual([
      ["viande", "Viande", 1],
      ["vegetaux", "Végétaux", 2],
      ["bois", "Bois", 3],
      ["pierre", "Pierre", 4],
    ]);
  });

  it("rangent la Viande et les Végétaux en Nourriture, le Bois et la Pierre en Matériaux", () => {
    expect(Object.fromEntries(ressources.map((r) => [r.id, r.famille]))).toEqual({
      viande: "nourriture",
      vegetaux: "nourriture",
      bois: "materiaux",
      pierre: "materiaux",
    });
  });

  it("refusent une famille inconnue, en disant laquelle", () => {
    expect(() => valider(RESSOURCES, [{ id: "or", nom: "Or", famille: "tresor", au_depart: 0, ordre: 1 }])).toThrow(
      "entrée n° 1 (famille) : famille : nourriture ou materiaux",
    );
  });

  it("donnent chacune un peu au départ, pour ne pas partir de rien (US-0202)", () => {
    for (const r of ressources) expect(r.au_depart).toBeGreaterThan(0);
  });

  it("refusent une quantité de départ négative", () => {
    expect(() => valider(RESSOURCES, [{ id: "bois", nom: "Bois", famille: "materiaux", au_depart: -5, ordre: 1 }])).toThrow(
      "entrée n° 1 (au_depart) : au_depart ne peut pas être négatif",
    );
  });
  it("ont chacune leur icône, carrée, rangée sous le nom de leur identifiant (US-0204)", async () => {
    for (const r of ressources) {
      const { width, height, format, hasAlpha } = await sharp(join(process.cwd(), "public/illustrations/ressources", `${r.id}.webp`)).metadata();
      expect({ id: r.id, width, height, format, hasAlpha }).toEqual({ id: r.id, width: 128, height: 128, format: "webp", hasAlpha: true });
    }
  });
});
