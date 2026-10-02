import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";

describe.skipIf(!URL_TEST)("fiche d'Espèce en base", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = poolDeTest();
    await pool.query("insert into biome (id, nom, ordre) values ('prairie', 'Prairie', 1) on conflict do nothing");
    await pool.query("insert into rarete (id, nom, rang, s_elevent) values ('commune', 'Commune', 1, true) on conflict do nothing");
  });
  afterAll(async () => {
    await pool.end();
  });

  const inserer = (champs: Record<string, unknown>) => {
    const ligne = {
      id: `essai_${Math.random().toString(36).slice(2)}`,
      nom: "Essai",
      attaque: 1,
      vie: 1,
      vitesse: 1,
      charge: 1,
      taille: 1,
      regime: "herbivore",
      entretien_par_heure: 0.1,
      masse_g: 20,
      facteur_arme: 1,
      biome_id: "prairie",
      rarete_id: "commune",
      ...champs,
    };
    const noms = Object.keys(ligne);
    return pool.query(`insert into espece (${noms.join(", ")}) values (${noms.map((_, i) => `$${i + 1}`).join(", ")})`, Object.values(ligne));
  };

  it("accepte une fiche complète", async () => {
    await expect(inserer({})).resolves.toBeDefined();
  });

  it.each([
    ["sans Biome d'Habitat", { biome_id: null }],
    ["sans Rareté", { rarete_id: null }],
    ["sans régime", { regime: null }],
    ["avec un Biome qui n'existe pas", { biome_id: "lune" }],
    ["avec une taille nulle", { taille: 0 }],
  ])("refuse une Espèce %s", async (_, champs) => {
    await expect(inserer(champs)).rejects.toThrow();
  });
});
