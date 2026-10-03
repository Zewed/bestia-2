import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { chargerJeu, lireJeu } from "./charger";
import { biomesEnBase } from "./en-base";
import { BIOMES, VARIANTES } from "./jeux";

describe.skipIf(!URL_TEST)("Biomes lus en base", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });
  // Chaque essai charge les vrais fichiers dans une transaction annulée à la fin : la base de test reste intacte.
  beforeEach(async () => {
    client = await pool.connect();
    await client.query("begin");
    await chargerJeu(client, BIOMES, lireJeu(BIOMES));
    await chargerJeu(client, VARIANTES, lireJeu(VARIANTES));
  });
  afterEach(async () => {
    await client.query("rollback");
    client.release();
  });

  it("donne chaque Biome dans son ordre, avec son nom et son identifiant", async () => {
    const biomes = await biomesEnBase(client);
    expect(biomes.map((b) => b.id)).toEqual(["prairie", "foret", "jungle", "savane", "desert", "montagne", "toundra", "banquise", "eau"]);
    expect(biomes[1]).toEqual({ id: "foret", nom: "Forêt", variantes: [] });
  });

  it("range les quatre formes de l'eau sous l'Eau", async () => {
    const eau = (await biomesEnBase(client)).find((b) => b.id === "eau");
    expect(eau?.variantes).toEqual([
      { id: "cote", nom: "Côte" },
      { id: "lac", nom: "Lac" },
      { id: "riviere", nom: "Rivière" },
      { id: "mer", nom: "Mer" },
    ]);
  });

  it("montre ce qui est en base, même quand la base diffère des fichiers", async () => {
    await client.query("update biome set nom = 'Prairie modifiée en base' where id = 'prairie'");
    expect((await biomesEnBase(client))[0].nom).toBe("Prairie modifiée en base");
  });
});
