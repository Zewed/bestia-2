import { gzipSync } from "node:zlib";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { CARTE_UTILISABLE_SECONDES } from "@/reglages";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { carteDuJoueur } from "./carte";
import { creerUnMonde, genererLeMonde } from "./generer";
import { ZONE_COEUR, ZONE_COURONNE } from "./zones";

/** Le Monde généré des essais de ce fichier, créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai de la carte (US-0417)";
const GRAINE = 417;

describe.skipIf(!URL_TEST)("la carte du Monde du joueur (US-0417, sur base)", () => {
  let pool: Pool;
  let genereId: number;
  const lancement = `carte-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Carte${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  /** Un chef qui naît dans le Monde du jeu, ou dans le Monde `mondeId` ; son Territoire et la Case de son Foyer. */
  const naitre = async (mondeId: number | null = null) => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique(), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const { rows } = await pool.query<{ territoire: number; q: number; r: number }>(
      "select t.id as territoire, c.q, c.r from chef ch join territoire t on t.chef_id = ch.id join case_du_monde c on c.id = t.foyer_case_id where ch.compte_id = $1",
      [compte.id],
    );
    if (mondeId === null) expect((await chefDuCompte(pool, compte.id))?.territoireId).toBe(rows[0].territoire);
    return { territoireId: rows[0].territoire, foyer: { q: rows[0].q, r: rows[0].r } };
  };
  /** Les Cases d'une carte, chacune « q,r », dans l'ordre. */
  const places = (cases: { q: number[]; r: number[] }) => cases.q.map((q, i) => `${q},${cases.r[i]}`);

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

  it("lit en une fois le Monde du Foyer du joueur : son nom, son Foyer et toutes ses Cases, chacune une fois", async () => {
    const { territoireId, foyer } = await naitre(genereId);
    const carte = await carteDuJoueur(pool, territoireId);
    expect(carte?.monde).toBe(MONDE_GENERE);
    expect(carte?.foyer).toEqual(foyer);
    // Toutes les Cases du Monde généré, sans brouillard pour l'instant : les 10 981, rangées par q puis r.
    const attendues = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: GRAINE }).map((c) => `${c.q},${c.r}`);
    expect(places(carte!.cases)).toEqual(attendues);
    expect(places(carte!.cases)).toContain(`${foyer.q},${foyer.r}`);
  });

  it("donne à chaque Case sa teinte : son Biome, ou pour l'eau sa variante (US-0418)", async () => {
    const { territoireId } = await naitre(genereId);
    const carte = (await carteDuJoueur(pool, territoireId))!;
    // Chaque teinte une fois : les huit Biomes de terre et les quatre eaux de ce Monde.
    expect([...carte.teintes].sort()).toEqual(["banquise", "cote", "desert", "foret", "jungle", "lac", "mer", "montagne", "prairie", "riviere", "savane", "toundra"]);
    const attendues = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: GRAINE }).map((c) => (c.biome === "eau" ? c.variante : c.biome));
    expect(carte.cases.teinte.map((t) => carte.teintes[t])).toEqual(attendues);
  });

  it("donne à chaque Case sa zone : la Couronne, le Cœur sauvage, ou ni l'une ni l'autre (US-0433)", async () => {
    const { territoireId } = await naitre(genereId);
    const carte = (await carteDuJoueur(pool, territoireId))!;
    const attendues = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: GRAINE }).map((c) => (c.couronne ? ZONE_COURONNE : c.coeur ? ZONE_COEUR : 0));
    expect(carte.cases.zone).toEqual(attendues);
    // Les 6 anneaux du bord, et les Cases à moins de 8 du milieu.
    expect(carte.cases.zone.filter((z) => z === ZONE_COURONNE)).toHaveLength(6 * (55 + 60) * 3);
    expect(carte.cases.zone.filter((z) => z === ZONE_COEUR)).toHaveLength(1 + 3 * 7 * 8);
  });

  it("voyage léger, même pour les 10 981 Cases d'un Monde généré (US-0434)", async () => {
    const { territoireId } = await naitre(genereId);
    const envoyee = JSON.stringify(await carteDuJoueur(pool, territoireId));
    // En colonnes, quatre petits nombres par Case : moins de 12 octets chacune.
    expect(envoyee.length).toBeLessThan(12 * 10_981);
    // Compressée comme le serveur l'envoie, elle passe à 1,6 Mb/s (le profil « Slow 4G » de Chrome, une connexion
    // mobile ordinaire) en moins d'un vingtième du temps dans lequel la carte doit être utilisable.
    expect((gzipSync(envoyee).length * 8) / 1.6e6).toBeLessThan(CARTE_UTILISABLE_SECONDES / 20);
  });

  it("donne les Foyers des autres chefs de son Monde, sans le sien (US-0419)", async () => {
    const moi = await naitre(genereId);
    const voisin = await naitre(genereId);
    const carte = (await carteDuJoueur(pool, moi.territoireId))!;
    expect(carte.foyers).toContainEqual(voisin.foyer);
    expect(carte.foyers).not.toContainEqual(moi.foyer);
    // Tous les autres Foyers de ce Monde, et eux seuls, rangés par q puis r.
    const { rows } = await pool.query<{ q: number; r: number }>(
      `select c.q, c.r from territoire t join case_du_monde c on c.id = t.foyer_case_id where c.monde_id = $1 and t.id <> $2 order by c.q, c.r`,
      [genereId, moi.territoireId],
    );
    expect(carte.foyers).toEqual(rows);
  });

  it("sur Aube, qui n'a en base que sa Couronne, montre la Couronne seule", async () => {
    const { territoireId, foyer } = await naitre();
    const carte = await carteDuJoueur(pool, territoireId);
    const { rows } = await pool.query<{ nom: string; places: string[] }>(
      `select m.nom, array_agg(c.q || ',' || c.r order by c.q, c.r) as places
       from case_du_monde c join monde m on m.id = c.monde_id where m.id = (select min(id) from monde) group by m.nom`,
    );
    expect(carte?.monde).toBe(rows[0].nom);
    expect(carte?.foyer).toEqual(foyer);
    expect(places(carte!.cases)).toEqual(rows[0].places);
    expect(carte!.cases.q).toHaveLength(2070);
    // US-0418 : sa Couronne a ses Biomes et ses lacs.
    expect([...carte!.teintes].sort()).toEqual(["desert", "foret", "lac", "montagne", "prairie", "savane"]);
    expect(carte!.cases.teinte).toHaveLength(2070);
    // US-0433 : toutes de la Couronne.
    expect(new Set(carte!.cases.zone)).toEqual(new Set([ZONE_COURONNE]));
  });

  it("ne lit rien pour un Territoire qui n'existe pas", async () => {
    expect(await carteDuJoueur(pool, -1)).toBeNull();
  });
});
