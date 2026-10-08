import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { apparitions, betesSauvagesDesCases, betesSauvagesDUneCase } from "./betes-sauvages";
import { creerUnMonde } from "./generer";
import type { Coordonnees } from "./hex";

const JOUR = 86_400_000;
const DEBUT = new Date("2026-10-08T09:17:23.456Z");
const apres = (ms: number) => new Date(DEBUT.getTime() + ms);

type CaseEnBase = Coordonnees & { id: number; graine: number };

/** Le Monde généré des essais de la carte (carte.db.test.ts), créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai de la carte (US-0417)";

describe.skipIf(!URL_TEST)("les Bêtes sauvages d'une Case en base (US-0925)", () => {
  let pool: Pool;
  let genereId: number;
  const lancement = `betes-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Betes${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  /**
   * Un chef qui naît dans le Monde généré des essais, pour ne pas prendre de place au Monde du jeu : la Case de son Foyer,
   * et une Case libre de ce Monde.
   */
  const naitre = async (): Promise<{ foyer: CaseEnBase; libre: CaseEnBase }> => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique(), Math.random, genereId)).toMatchObject({ statut: "enregistre" });
    const { rows } = await pool.query<CaseEnBase & { foyer: boolean }>(
      `select c.id, c.q, c.r, m.graine::float8 as graine, c.id = t.foyer_case_id as foyer
       from chef ch join territoire t on t.chef_id = ch.id join case_du_monde f on f.id = t.foyer_case_id join monde m on m.id = f.monde_id
       join lateral (select * from case_du_monde c where c.monde_id = f.monde_id and (c.id = f.id or c.chef_id is null) order by c.id = f.id desc, c.id limit 2) c on true
       where ch.compte_id = $1`,
      [compte.id],
    );
    const [foyer, libre] = [rows.find((c) => c.foyer)!, rows.find((c) => !c.foyer)!];
    return { foyer, libre };
  };

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(4153)");
      const { rows } = await client.query<{ id: number }>("select id from monde where nom = $1", [MONDE_GENERE]);
      genereId = rows[0]?.id ?? (await creerUnMonde(client, { nom: MONDE_GENERE, graine: 417 })).mondeId;
      await client.query("commit");
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }, 60_000);
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("en fait apparaître sur une Case libre, celles que donnent la graine du Monde, la Case et le temps du jeu", async () => {
    const { libre } = await naitre();
    const betes = await betesSauvagesDUneCase(pool, libre.id, DEBUT, apres(30 * JOUR));
    expect(betes.length).toBeGreaterThan(5);
    expect(betes).toEqual(apparitions(libre.graine, libre, DEBUT, apres(30 * JOUR)));
  });

  it("n'en fait jamais apparaître sur une Case qui appartient à un Territoire", async () => {
    const { foyer } = await naitre();
    expect(apparitions(foyer.graine, foyer, DEBUT, apres(30 * JOUR)).length).toBeGreaterThan(5);
    expect(await betesSauvagesDUneCase(pool, foyer.id, DEBUT, apres(30 * JOUR))).toEqual([]);
  });

  it("calcule plusieurs Cases à la fois, chacune comme seule ; une Case inconnue n'en a pas", async () => {
    const { foyer, libre } = await naitre();
    const ensemble = await betesSauvagesDesCases(pool, [libre.id, foyer.id, -1], DEBUT, apres(7 * JOUR));
    expect([...ensemble.keys()]).toEqual([libre.id, foyer.id, -1]);
    expect(ensemble.get(libre.id)).toEqual(await betesSauvagesDUneCase(pool, libre.id, DEBUT, apres(7 * JOUR)));
    expect(ensemble.get(foyer.id)).toEqual([]);
    expect(ensemble.get(-1)).toEqual([]);
  });
});
