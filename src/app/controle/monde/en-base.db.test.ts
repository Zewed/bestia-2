import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUnMonde, genererLeMonde } from "@/monde/generer";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { mondeEnBase, mondesEnBase } from "./en-base";

describe.skipIf(!URL_TEST)("Mondes en base sur la page de contrôle du Monde (US-0412)", () => {
  let pool: Pool;
  const nom = `Contrôle-${Date.now()}-${Math.random()}`;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.end();
  });

  /** Un travail dans une transaction annulée à la fin : la base de test reste comme neuve. */
  async function surUneBaseNeuve<T>(travail: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      return await travail(client);
    } finally {
      await client.query("rollback");
      client.release();
    }
  }

  it("liste les Mondes en base, le Monde du jeu d'abord, chacun avec sa graine et son nombre de Cases", async () => {
    await surUneBaseNeuve(async (client) => {
      const { mondeId } = await creerUnMonde(client, { nom, graine: 12345 });
      const mondes = await mondesEnBase(client);
      expect(mondes[0].cases).toBe(2070);
      expect(mondes.find((m) => m.id === mondeId)).toEqual({ id: mondeId, nom, graine: 12345, cases: 10_981 });
    });
  });

  it("lit un Monde généré Case par Case, tel que sa graine le donne, chacune libre et sans Foyer", async () => {
    await surUneBaseNeuve(async (client) => {
      const { mondeId } = await creerUnMonde(client, { nom, graine: 777 });
      const monde = await mondeEnBase(client, mondeId);
      expect(monde?.nom).toBe(nom);
      expect(monde?.graine).toBe(777);
      const attendues = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: 777 }).map(({ q, r, anneau, couronne, coeur, biome, variante }) => ({
        q,
        r,
        anneau,
        couronne,
        coeur,
        biome,
        variante,
        possedee: false,
        foyer: false,
      }));
      expect(monde?.cases).toEqual(attendues);
      expect(await mondeEnBase(client, -1)).toBeNull();
    });
  });

  it("dit quelles Cases du Monde du jeu sont possédées et lesquelles portent un Foyer", async () => {
    const [jeu] = await mondesEnBase(pool);
    const monde = await mondeEnBase(pool, jeu.id);
    const { rows } = await pool.query<{ possedees: number; foyers: number }>(
      `select count(*) filter (where c.chef_id is not null)::int as possedees, count(t.id)::int as foyers
       from case_du_monde c left join territoire t on t.foyer_case_id = c.id where c.monde_id = $1`,
      [jeu.id],
    );
    // D'autres fichiers de test font naître des chefs pendant ce temps : les comptes se lisent au même moment, à peu près.
    expect(monde!.cases.filter((c) => c.foyer).length).toBeLessThanOrEqual(rows[0].foyers);
    expect(monde!.cases.filter((c) => c.possedee).length).toBeLessThanOrEqual(rows[0].possedees);
    for (const c of monde!.cases.filter((c) => c.foyer)) expect(c.possedee).toBe(true);
  });
});
