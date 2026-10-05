import type { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chargerJeu } from "@/donnees/charger";
import { lireDonnees } from "@/donnees/jeux";
import { poolDeTest, URL_TEST } from "@/test/base";
import { preparerCouronne } from "./preparer-couronne";

describe.skipIf(!URL_TEST)("préparer la Couronne en base (US-0151)", () => {
  let pool: Pool;
  let client: PoolClient;
  let mondeId: number;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });
  // Chaque essai travaille dans une transaction annulée à la fin : la base de test reste intacte.
  beforeEach(async () => {
    client = await pool.connect();
    await client.query("begin");
    for (const { jeu, entrees } of lireDonnees()) await chargerJeu(client, jeu, entrees);
    const { rows } = await client.query("insert into monde (nom) values ($1) returning id", [`Essai-${Date.now()}-${Math.random()}`]);
    mondeId = rows[0].id;
  });
  afterEach(async () => {
    await client.query("rollback");
    client.release();
  });

  it("crée les 2 070 Cases de la Couronne, et fixe la taille du Monde", async () => {
    expect(await preparerCouronne(client, mondeId)).toEqual({ ajoutees: 2070, total: 2070 });
    const { rows } = await client.query(
      `select count(*)::int as cases, bool_and(couronne) as toutes, min(anneau) as de, max(anneau) as a,
         (select json_build_object('rayon', rayon, 'anneaux', anneaux_couronne) from monde where id = $1) as taille
       from case_du_monde where monde_id = $1`,
      [mondeId],
    );
    expect(rows[0]).toEqual({ cases: 2070, toutes: true, de: 55, a: 60, taille: { rayon: 60, anneaux: 6 } });
  });

  it("ne touche jamais une Case existante : seules les manquantes sont ajoutées", async () => {
    await preparerCouronne(client, mondeId);
    await client.query("update case_du_monde set biome_id = 'toundra' where monde_id = $1 and q = 0 and r = -60", [mondeId]);
    await client.query("delete from case_du_monde where monde_id = $1 and q = 60 and r = 0", [mondeId]);
    expect(await preparerCouronne(client, mondeId)).toEqual({ ajoutees: 1, total: 2070 });
    const { rows } = await client.query("select biome_id from case_du_monde where monde_id = $1 and q = 0 and r = -60", [mondeId]);
    expect(rows[0].biome_id).toBe("toundra");
  });

  it("garde le rayon déjà fixé d'un Monde, et n'élargit sa Couronne que vers l'intérieur (US-0152)", async () => {
    await client.query("update monde set rayon = 10, anneaux_couronne = 2 where id = $1", [mondeId]);
    expect(await preparerCouronne(client, mondeId)).toEqual({ ajoutees: 6 * (5 + 6 + 7 + 8 + 9 + 10), total: 6 * (5 + 6 + 7 + 8 + 9 + 10) });
    const { rows } = await client.query("select rayon, anneaux_couronne from monde where id = $1", [mondeId]);
    expect(rows[0]).toEqual({ rayon: 10, anneaux_couronne: 6 });
  });

  it("élargit une Couronne existante sans toucher à ses Cases", async () => {
    // Une Couronne de 3 anneaux, telle que la première version la créait.
    await client.query("update monde set rayon = 60, anneaux_couronne = 3 where id = $1", [mondeId]);
    await client.query("insert into case_du_monde (monde_id, q, r, anneau, couronne, biome_id) values ($1, 0, -60, 60, true, 'toundra')", [mondeId]);
    expect(await preparerCouronne(client, mondeId)).toEqual({ ajoutees: 2069, total: 2070 });
    const { rows } = await client.query("select biome_id from case_du_monde where monde_id = $1 and q = 0 and r = -60", [mondeId]);
    expect(rows[0].biome_id).toBe("toundra");
  });

  it("refuse en base deux Cases au même endroit, et un anneau faux", async () => {
    await preparerCouronne(client, mondeId);
    await client.query("savepoint essai");
    await expect(client.query("insert into case_du_monde (monde_id, q, r, anneau, couronne, biome_id) values ($1, 60, 0, 60, true, 'prairie')", [mondeId])).rejects.toMatchObject({
      constraint: "case_unique_dans_le_monde",
    });
    await client.query("rollback to savepoint essai");
    await expect(client.query("insert into case_du_monde (monde_id, q, r, anneau, couronne, biome_id) values ($1, 1, 1, 1, false, 'prairie')", [mondeId])).rejects.toMatchObject({
      constraint: "case_anneau_exact",
    });
  });
});
