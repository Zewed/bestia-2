import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { creerUnMonde, genererLeMonde } from "./generer";

describe.skipIf(!URL_TEST)("créer un Monde généré en base (US-0401)", () => {
  let pool: Pool;
  const nom = `Essai-${Date.now()}-${Math.random()}`;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.end();
  });

  /** Un travail dans une transaction annulée à la fin : la base de test reste comme neuve, prête pour le suivant. */
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

  /** Les Cases d'un Monde en base, rangées comme genererLeMonde les rend. */
  async function lignes(client: PoolClient, mondeId: number) {
    const { rows } = await client.query(
      "select q, r, anneau, couronne, biome_id as biome, variante_id as variante, chef_id, imprenable from case_du_monde where monde_id = $1 order by q, r",
      [mondeId],
    );
    return rows;
  }

  it("enregistre le Monde, sa graine et ses 10 981 Cases, telles que la graine les donne", async () => {
    await surUneBaseNeuve(async (client) => {
      const { mondeId, cases } = await creerUnMonde(client, { nom, graine: 12345 });
      expect(cases).toBe(10_981);
      const { rows } = await client.query("select nom, graine, rayon, anneaux_couronne as anneaux from monde where id = $1", [mondeId]);
      expect(rows[0]).toEqual({ nom, graine: "12345", rayon: 60, anneaux: 6 });
      const attendues = genererLeMonde({ rayon: 60, anneaux: 6, graine: 12345 }).map((c) => ({ ...c, chef_id: null, imprenable: false }));
      expect(await lignes(client, mondeId)).toEqual(attendues);
    });
  });

  it("relancé sur une base neuve avec la même graine, rend les mêmes lignes Case par Case ; une autre graine, d'autres", async () => {
    const creer = (graine: number) => surUneBaseNeuve(async (client) => lignes(client, (await creerUnMonde(client, { nom, graine })).mondeId));
    const premieres = await creer(777);
    const secondes = await creer(777);
    expect(secondes).toHaveLength(10_981);
    for (const [i, ligne] of secondes.entries()) expect(ligne).toEqual(premieres[i]);
    const autres = await creer(778);
    expect(autres.filter((c, i) => c.biome !== premieres[i].biome).length / premieres.length).toBeGreaterThan(0.3);
  });

  it("refuse un nom déjà pris, sans toucher au Monde du jeu qui le porte", async () => {
    await surUneBaseNeuve(async (client) => {
      // Les naissances des autres fichiers de test peuvent prendre des Cases pendant ce temps : seuls les Biomes comptent ici.
      const etat = async () => {
        const { rows } = await client.query("select id, nom, graine, rayon, anneaux_couronne from monde order by id limit 1");
        const cases = await client.query("select q, r, anneau, couronne, biome_id, variante_id from case_du_monde where monde_id = $1 order by q, r", [rows[0].id]);
        const homonymes = await client.query("select count(*)::int as n from monde where nom = $1", [rows[0].nom]);
        return { jeu: rows[0], cases: cases.rows, homonymes: homonymes.rows[0].n };
      };
      const avant = await etat();
      await expect(creerUnMonde(client, { nom: avant.jeu.nom, graine: 1 })).rejects.toThrow(`Le nom « ${avant.jeu.nom} » est déjà pris par un autre Monde.`);
      expect(await etat()).toEqual(avant);
      expect(avant.homonymes).toBe(1);
    });
  });
});
