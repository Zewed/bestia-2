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

  it("reconnaît une entrée à plusieurs colonnes, comme la production d'un Biome en une Ressource (US-0209)", async () => {
    type Paire = { a: string; b: string; valeur: number };
    const paires: Jeu<Paire> = {
      nom: "Paires",
      fichier: "paires.yaml",
      table: "essai_paire",
      cle: ["a", "b"],
      schema: z.object({ a: z.string(), b: z.string(), valeur: z.number() }),
      colonnes: (e) => ({ a: e.a, b: e.b, valeur: e.valeur }),
    };
    await pool.query("create table if not exists essai_paire (a text, b text, valeur integer not null, primary key (a, b))");
    await pool.query("delete from essai_paire");
    const client = await pool.connect();
    try {
      const v1 = [
        { a: "prairie", b: "bois", valeur: 4 },
        { a: "prairie", b: "pierre", valeur: 4 },
        { a: "foret", b: "bois", valeur: 14 },
      ];
      expect(await chargerJeu(client, paires, v1)).toEqual({ ajoutes: 3, modifies: 0, inchanges: 0 });
      expect(await chargerJeu(client, paires, [{ ...v1[0], valeur: 5 }, v1[1], v1[2]])).toEqual({ ajoutes: 0, modifies: 1, inchanges: 2 });
    } finally {
      client.release();
    }
    expect((await pool.query("select a, b, valeur from essai_paire order by a, b")).rows).toEqual([
      { a: "foret", b: "bois", valeur: 14 },
      { a: "prairie", b: "bois", valeur: 5 },
      { a: "prairie", b: "pierre", valeur: 4 },
    ]);
  });
});
