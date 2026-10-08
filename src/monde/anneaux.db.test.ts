import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ANNEAUX_DU_MONDE } from "@/reglages";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { anneauDUneCase, type FormeDuMonde } from "./anneaux";
import { creerUnMonde, genererLeMonde } from "./generer";

/** Le Monde généré des essais de la carte (carte.db.test.ts), créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai de la carte (US-0417)";
const GRAINE = 417;

type CaseEnBase = { q: number; r: number; couronne: boolean; coeur: boolean };

describe.skipIf(!URL_TEST)("les Anneaux d'un Monde en base (US-0923)", () => {
  let pool: Pool;

  /** La forme d'un Monde, telle que sa fiche la garde, et ses Cases. */
  const lireLeMonde = async (condition: string, valeur: string | number) => {
    const { rows } = await pool.query<FormeDuMonde & { id: number }>(
      `select id, rayon, anneaux_couronne as "anneauxCouronne", rayon_coeur as "rayonCoeur" from monde where ${condition} = $1`,
      [valeur],
    );
    const { rows: cases } = await pool.query<CaseEnBase>("select q, r, couronne, coeur from case_du_monde where monde_id = $1 order by q, r", [rows[0].id]);
    return { forme: rows[0], cases };
  };

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(4153)");
      const { rows } = await client.query<{ id: number }>("select id from monde where nom = $1", [MONDE_GENERE]);
      if (!rows[0]) await creerUnMonde(client, { nom: MONDE_GENERE, graine: GRAINE });
      await client.query("commit");
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }, 60_000);
  afterAll(async () => {
    await pool.end();
  });

  it("place la Couronne d'un Monde généré dans l'Anneau 1, son Cœur sauvage dans le dernier, le reste entre les deux", async () => {
    const { forme, cases } = await lireLeMonde("nom", MONDE_GENERE);
    const parAnneau = new Map<number, number>();
    for (const c of cases) {
      const a = anneauDUneCase(c, forme);
      expect(a === 1, `${c.q},${c.r}`).toBe(c.couronne);
      expect(a === ANNEAUX_DU_MONDE, `${c.q},${c.r}`).toBe(c.coeur);
      parAnneau.set(a, (parAnneau.get(a) ?? 0) + 1);
    }
    // Chaque Anneau a ses Cases ; les bandes intérieures, plus courtes, en comptent moins.
    expect([...parAnneau.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: ANNEAUX_DU_MONDE }, (_, i) => i + 1));
    for (let a = 2; a < ANNEAUX_DU_MONDE; a++) expect(parAnneau.get(a)).toBeGreaterThan(parAnneau.get(a + 1)!);
  });

  it("donne les mêmes Anneaux pour la même graine : le Monde en base et le même Monde regénéré", async () => {
    const { forme, cases } = await lireLeMonde("nom", MONDE_GENERE);
    const regenere = genererLeMonde({ rayon: forme.rayon, anneaux: forme.anneauxCouronne, rayonCoeur: forme.rayonCoeur, graine: GRAINE });
    expect(cases.map((c) => anneauDUneCase(c, forme))).toEqual(regenere.map((c) => anneauDUneCase(c, forme)));
  });

  it("met dans l'Anneau 1 toutes les Cases du Monde du jeu, qui n'a en base que sa Couronne", async () => {
    const { forme, cases } = await lireLeMonde("id", (await pool.query<{ id: number }>("select id from monde order by id limit 1")).rows[0].id);
    expect(cases.length).toBeGreaterThan(0);
    expect(new Set(cases.map((c) => anneauDUneCase(c, forme)))).toEqual(new Set([1]));
  });
});
