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

  /**
   * US-0922 : chaque fiche s'essaie dans une transaction annulée ensuite. Une Espèce d'essai écrite pour de bon se mêlerait,
   * au milieu de leurs essais, aux tirages des Bêtes sauvages (US-0928) des fichiers qui tournent en même temps, et
   * changerait l'Espèce de leurs Bêtes d'un rattrapage au suivant.
   */
  const inserer = async (champs: Record<string, unknown>) => {
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
    const client = await pool.connect();
    try {
      await client.query("begin");
      return await client.query(`insert into espece (${noms.join(", ")}) values (${noms.map((_, i) => `$${i + 1}`).join(", ")})`, Object.values(ligne));
    } finally {
      await client.query("rollback");
      client.release();
    }
  };

  it("accepte une fiche complète", async () => {
    await expect(inserer({})).resolves.toBeDefined();
  });

  it.each([
    ["sans Biome d'Habitat", { biome_id: null }],
    ["sans Rareté", { rarete_id: null }],
    ["sans régime", { regime: null }],
    ["avec un Biome qui n'existe pas", { biome_id: "lune" }],
    ["avec une Rareté qui n'existe pas", { rarete_id: "introuvable" }],
    ["avec un Rôle qui n'existe pas", { role_id: "magicien" }],
    ["avec un régime inconnu", { regime: "frugivore" }],
    ["avec une attaque négative", { attaque: -1 }],
    ["avec un Entretien négatif", { entretien_par_heure: -0.1 }],
    ["avec une taille nulle", { taille: 0 }],
  ])("refuse une Espèce %s", async (_, champs) => {
    await expect(inserer(champs)).rejects.toThrow();
  });
});
