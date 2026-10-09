import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { decouvrir } from "@/monde/brouillard";
import { creerUnMonde } from "@/monde/generer";
import { distance } from "@/monde/hex";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { CASE_D_UN_TERRITOIRE } from "./choix-de-destination";
import { destinationDUneCase } from "./destination";

/** Le Monde généré des essais de la carte (src/monde/carte.db.test.ts), créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai de la carte (US-0417)";
const GRAINE = 417;

describe.skipIf(!URL_TEST)("la destination d'une Expédition (US-0907, sur base)", () => {
  let pool: Pool;
  let genereId: number;
  const lancement = `destination-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Dest${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  /** Un chef qui naît dans le Monde généré, ou dans le Monde du jeu (`mondeId` null) : son Territoire et la Case de son Foyer. */
  const naitre = async (mondeId: number | null = genereId) => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique(), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const { rows } = await pool.query<{ territoire: number; q: number; r: number }>(
      "select t.id as territoire, c.q, c.r from chef ch join territoire t on t.chef_id = ch.id join case_du_monde c on c.id = t.foyer_case_id where ch.compte_id = $1",
      [compte.id],
    );
    return { territoireId: rows[0].territoire, foyer: { q: rows[0].q, r: rows[0].r } };
  };
  /** La première Case du Monde généré, par q puis r, qui répond à `condition` (sur la Case c). */
  const uneCase = async (condition: string) => {
    const { rows } = await pool.query<{ q: number; r: number }>(`select q, r from case_du_monde c where monde_id = $1 and ${condition} order by q, r limit 1`, [genereId]);
    return rows[0];
  };

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(4153)");
      const { rows } = await client.query<{ id: number }>("select id from monde where nom = $1", [MONDE_GENERE]);
      genereId = rows[0]?.id ?? (await creerUnMonde(client, { nom: MONDE_GENERE, graine: GRAINE })).mondeId;
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

  it("choisit une Case libre que le joueur a découverte : son Biome et sa distance au Foyer, en Cases", async () => {
    const moi = await naitre();
    const foret = await uneCase("biome_id = 'foret' and chef_id is null");
    await decouvrir(pool, moi.territoireId, [foret]);
    expect(await destinationDUneCase(pool, moi.territoireId, foret)).toEqual({
      fiche: expect.objectContaining({ ...foret, biome: "Forêt", chef: null, distance: distance(foret, moi.foyer) }),
    });
  });

  it("choisit une Case encore sous le brouillard, sans rien dire d'elle que sa place et sa distance", async () => {
    const moi = await naitre();
    const loin = { q: 0, r: 0 };
    expect(await destinationDUneCase(pool, moi.territoireId, loin)).toEqual({ fiche: { ...loin, inconnue: true, distance: distance(loin, moi.foyer) } });
  });

  it("refuse le Foyer du joueur, qui appartient à son Territoire", async () => {
    const moi = await naitre();
    expect(await destinationDUneCase(pool, moi.territoireId, moi.foyer)).toEqual({ refus: CASE_D_UN_TERRITOIRE });
  });

  it("refuse une Case du Territoire d'un autre joueur, sous le brouillard comme découverte", async () => {
    const [moi, voisin] = [await naitre(), await naitre()];
    expect(await destinationDUneCase(pool, moi.territoireId, voisin.foyer)).toEqual({ refus: CASE_D_UN_TERRITOIRE });
    await decouvrir(pool, moi.territoireId, [voisin.foyer]);
    expect(await destinationDUneCase(pool, moi.territoireId, voisin.foyer)).toEqual({ refus: CASE_D_UN_TERRITOIRE });
  });

  it("ne lit que le Monde du joueur : une Case qui n'en est pas n'est pas une destination", async () => {
    // Aube n'a en base que sa Couronne : pas de Cœur sauvage, alors que le Monde généré en a un.
    const surAube = await naitre(null);
    expect(await destinationDUneCase(pool, surAube.territoireId, { q: 0, r: 0 })).toBeNull();
    expect(await destinationDUneCase(pool, surAube.territoireId, { q: 1000, r: 0 })).toBeNull();
  });

  it("ne lit rien pour un Territoire qui n'existe pas", async () => {
    expect(await destinationDUneCase(pool, -1, { q: 0, r: 0 })).toBeNull();
  });
});
