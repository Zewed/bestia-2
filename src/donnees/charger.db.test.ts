import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { poolDeTest, URL_TEST } from "@/test/base";
import { chargerJeu, type Jeu } from "./charger";

type Essai = { id: string; nom: string; rang: number };
const jeu: Jeu<Essai> = {
  nom: "Essais",
  fichier: "essais.yaml",
  table: "essai_donnee",
  cle: "id",
  schema: z.object({ id: z.string(), nom: z.string(), rang: z.number() }),
  colonnes: (e) => ({ id: e.id, nom: e.nom, rang: e.rang }),
};

describe.skipIf(!URL_TEST)("chargement des données de référence (sur base)", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = poolDeTest();
    // Une table d'essai, propre à la base de test.
    await pool.query("create table if not exists essai_donnee (id text primary key, nom text not null, rang integer not null)");
    await pool.query("delete from essai_donnee");
  });
  afterAll(async () => {
    await pool.end();
  });

  async function charger(entrees: Essai[]) {
    const client = await pool.connect();
    try {
      return await chargerJeu(client, jeu, entrees);
    } finally {
      client.release();
    }
  }

  const v1: Essai[] = [
    { id: "a", nom: "Alpha", rang: 1 },
    { id: "b", nom: "Bêta", rang: 2 },
    { id: "c", nom: "Gamma", rang: 3 },
  ];

  it("remplit une base vide", async () => {
    expect(await charger(v1)).toEqual({ ajoutes: 3, modifies: 0, inchanges: 0 });
  });

  it("relancé à l'identique, ne change rien", async () => {
    expect(await charger(v1)).toEqual({ ajoutes: 0, modifies: 0, inchanges: 3 });
  });

  it("met à jour une valeur modifiée, sans créer de doublon", async () => {
    const v2 = v1.map((e) => (e.id === "b" ? { ...e, nom: "Bêta corrigé" } : e));
    expect(await charger(v2)).toEqual({ ajoutes: 0, modifies: 1, inchanges: 2 });
    const { rows } = await pool.query("select id, nom from essai_donnee order by id");
    expect(rows).toEqual([
      { id: "a", nom: "Alpha" },
      { id: "b", nom: "Bêta corrigé" },
      { id: "c", nom: "Gamma" },
    ]);
  });
});
