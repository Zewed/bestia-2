import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { ficheDUneCase } from "./fiche";
import { creerUnMonde } from "./generer";
import { distance } from "./hex";
import { ZONE_COEUR, ZONE_COURONNE } from "./zones";

/** Le Monde généré des essais de la carte (carte.db.test.ts), créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai de la carte (US-0417)";
const GRAINE = 417;

describe.skipIf(!URL_TEST)("la fiche d'une Case (US-0428, sur base)", () => {
  let pool: Pool;
  let genereId: number;
  const lancement = `fiche-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Fiche${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  /** Un chef qui naît dans le Monde du jeu, ou dans le Monde `mondeId` : son nom, son Territoire et la Case de son Foyer. */
  const naitre = async (mondeId: number | null = null) => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique(), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const { rows } = await pool.query<{ nom: string; territoire: number; q: number; r: number }>(
      "select ch.nom, t.id as territoire, c.q, c.r from chef ch join territoire t on t.chef_id = ch.id join case_du_monde c on c.id = t.foyer_case_id where ch.compte_id = $1",
      [compte.id],
    );
    return { nom: rows[0].nom, territoireId: rows[0].territoire, foyer: { q: rows[0].q, r: rows[0].r } };
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

  it("donne le Biome d'une Case de terre par son nom, et personne pour la posséder quand elle est libre", async () => {
    const moi = await naitre(genereId);
    const foret = await uneCase("biome_id = 'foret' and chef_id is null");
    expect(await ficheDUneCase(pool, moi.territoireId, foret)).toMatchObject({ ...foret, biome: "Forêt", chef: null, aVous: false });
  });

  it("donne une eau par le nom de sa variante, comme la légende", async () => {
    const moi = await naitre(genereId);
    const lac = await uneCase("variante_id = 'lac'");
    expect(await ficheDUneCase(pool, moi.territoireId, lac)).toMatchObject({ ...lac, biome: "Lac", chef: null, aVous: false });
  });

  it("dit du Foyer du joueur qu'il est à lui", async () => {
    const moi = await naitre(genereId);
    expect(await ficheDUneCase(pool, moi.territoireId, moi.foyer)).toMatchObject({ ...moi.foyer, biome: "Prairie", chef: moi.nom, aVous: true });
  });

  it("donne le nom du chef à qui appartient la Case : le Foyer d'un autre chef", async () => {
    const [moi, voisin] = [await naitre(genereId), await naitre(genereId)];
    expect(await ficheDUneCase(pool, moi.territoireId, voisin.foyer)).toMatchObject({ ...voisin.foyer, chef: voisin.nom, aVous: false });
  });

  it("ne lit que le Monde du joueur : une Case qui n'en est pas n'a pas de fiche", async () => {
    // Aube n'a en base que sa Couronne : pas de Cœur sauvage, alors que le Monde généré en a un.
    const surAube = await naitre();
    expect(await ficheDUneCase(pool, surAube.territoireId, { q: 0, r: 0 })).toBeNull();
    expect(await ficheDUneCase(pool, surAube.territoireId, { q: 1000, r: 0 })).toBeNull();
  });

  it("ne lit rien pour un Territoire qui n'existe pas", async () => {
    expect(await ficheDUneCase(pool, -1, { q: 0, r: 0 })).toBeNull();
  });

  it("dit si la Case est de la Couronne, du Cœur sauvage, ou entre les deux (US-0429)", async () => {
    const moi = await naitre(genereId);
    expect(await ficheDUneCase(pool, moi.territoireId, moi.foyer)).toMatchObject({ zone: ZONE_COURONNE });
    expect(await ficheDUneCase(pool, moi.territoireId, { q: 0, r: 0 })).toMatchObject({ zone: ZONE_COEUR });
    expect(await ficheDUneCase(pool, moi.territoireId, await uneCase("not couronne and not coeur"))).toMatchObject({ zone: 0 });
  });

  it("donne la distance de la Case au Foyer du joueur, en Cases, par la seule formule du jeu (US-0429)", async () => {
    const moi = await naitre(genereId);
    expect(await ficheDUneCase(pool, moi.territoireId, moi.foyer)).toMatchObject({ distance: 0 });
    for (const c of [{ q: 0, r: 0 }, await uneCase("anneau = 50"), await uneCase("variante_id = 'lac'")]) {
      expect(await ficheDUneCase(pool, moi.territoireId, c)).toMatchObject({ distance: distance(c, moi.foyer) });
    }
    expect(distance({ q: 0, r: 0 }, moi.foyer)).toBeGreaterThanOrEqual(55);
  });
});
