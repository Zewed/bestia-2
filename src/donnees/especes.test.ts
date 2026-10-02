import { describe, expect, it } from "vitest";
import { valider } from "./charger";
import { ESPECES, verifierReferences, type EntreeEspece } from "./jeux";

const souris: EntreeEspece = {
  id: "souris_essai",
  nom: "Souris d'essai",
  attaque: 0.1,
  vie: 1,
  vitesse: 2,
  charge: 0.05,
  taille: 1,
  regime: "omnivore",
  entretien: 0.01,
  biome: "prairie",
  rarete: "commune",
};

describe("fiche d'Espèce", () => {
  it("porte toutes les caractéristiques de l'animal", () => {
    expect(valider(ESPECES, [souris])).toEqual([souris]);
    expect(ESPECES.colonnes(souris)).toMatchObject({ entretien_par_heure: 0.01, biome_id: "prairie", role_id: null });
  });

  it.each([
    ["sans Biome", { biome: undefined }, /biome/],
    ["sans Rareté", { rarete: undefined }, /rarete/],
    ["sans régime", { regime: undefined }, /régime/],
    ["avec un régime inconnu", { regime: "frugivore" }, /régime/],
    ["avec une vie nulle", { vie: 0 }, /vie doit être positif/],
    ["avec une attaque négative", { attaque: -1 }, /attaque ne peut pas être négatif/],
  ])("refuse une Espèce %s", (_, changement, message) => {
    expect(() => valider(ESPECES, [{ ...souris, ...changement }])).toThrow(message);
  });

  it("ne renvoie qu'à des Biomes, Raretés et Rôles qui existent", () => {
    const connus = { biomes: ["prairie"], raretes: ["commune"], roles: ["eclaireur"] };
    expect(() => verifierReferences([souris], connus)).not.toThrow();
    expect(() => verifierReferences([{ ...souris, biome: "lune" }], connus)).toThrow(/Biome inconnu « lune »/);
    expect(() => verifierReferences([{ ...souris, role: "magicien" }], connus)).toThrow(/Rôle inconnu « magicien »/);
  });
});
