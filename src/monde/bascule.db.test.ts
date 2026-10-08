import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { calculerEmpreinte } from "@/comptes/empreinte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { basculerLeMonde, MONDE_DU_JEU } from "./bascule";
import { choisirCaseDeNaissance } from "./foyers";
import { creerUnMonde } from "./generer";
import { distance, type Coordonnees } from "./hex";
import { preparerCouronne, preparerLaCouronneDuJeu } from "./preparer-couronne";
import { PRODUCTION_DU_TERRITOIRE } from "./production";

/** Le Monde généré des essais de ce fichier, créé une fois pour toutes dans la base de test : un Monde ne s'efface pas. */
const MONDE_GENERE = "Essai des naissances (US-0414)";

/** Deux Foyers ne sont jamais à moins de 4 Cases l'un de l'autre (ECART_ENTRE_FOYERS). */
function bienEspaces(cases: Coordonnees[]) {
  for (const [i, a] of cases.entries()) for (const b of cases.slice(i + 1)) expect(distance(a, b)).toBeGreaterThanOrEqual(4);
}

/**
 * Un pool dont chaque connexion est `client` lui-même, et chaque transaction un point de reprise de la sienne : les
 * naissances s'y font pour de bon, sur le Monde du jeu tel que cette transaction le voit, puis s'effacent avec elle.
 */
function poolDansLaTransaction(client: PoolClient): Pool {
  const connexion = {
    query: (texte: string, valeurs?: unknown[]) =>
      texte === "begin"
        ? client.query("savepoint naissance")
        : texte === "commit"
          ? client.query("release savepoint naissance")
          : texte === "rollback"
            ? client.query("rollback to savepoint naissance")
            : client.query(texte, valeurs),
    release: () => {},
  };
  return { connect: async () => connexion, query: (texte: string, valeurs?: unknown[]) => client.query(texte, valeurs) } as unknown as Pool;
}

describe.skipIf(!URL_TEST)("le Monde du jeu (US-0414)", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.end();
  });

  it("est le Monde ouvert : Aube, le plus ancien, ouvert depuis sa naissance, et lui seul", async () => {
    const { rows } = await pool.query(`select id, nom, ouvert_le = ne_le as "depuisSaNaissance" from monde where id = ${MONDE_DU_JEU}`);
    const { rows: ouverts } = await pool.query("select count(*)::int as n from monde where ouvert_le is not null and ferme_le is null");
    expect(rows).toEqual([{ id: (await pool.query("select min(id) as id from monde")).rows[0].id, nom: "Aube", depuisSaNaissance: true }]);
    expect(ouverts[0].n).toBe(1);
  });

  it("refuse en base un second Monde ouvert", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await expect(client.query("insert into monde (nom, ouvert_le) values ($1, now())", [`Essai-${Date.now()}-${Math.random()}`])).rejects.toMatchObject({
        constraint: "monde_un_seul_ouvert",
      });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});

describe.skipIf(!URL_TEST)("naître sur le Monde généré, et y basculer les chefs déjà nés (US-0414)", () => {
  let pool: Pool;
  let genereId: number;
  const lancement = `bascule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let empreinte: string;

  /** Des comptes neufs, avec une seule empreinte de mot de passe pour tous. */
  const nouveauxComptes = async (base: Pool | PoolClient, nombre: number) =>
    (
      await base.query<{ id: number }>(
        "insert into compte (email, empreinte_mot_de_passe) select $1 || '-' || gen_random_uuid() || '@essai.test', $2 from generate_series(1, $3) returning id",
        [lancement, empreinte, nombre],
      )
    ).rows.map((c) => c.id);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    empreinte = await calculerEmpreinte("une phrase de passe");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(4153)");
      const { rows } = await client.query<{ id: number }>("select id from monde where nom = $1", [MONDE_GENERE]);
      genereId = rows[0]?.id ?? (await creerUnMonde(client, { nom: MONDE_GENERE, graine: 414 })).mondeId;
      // Les chefs d'un essai interrompu, s'il en reste : le Monde généré des essais reste vide entre deux essais.
      await client.query("delete from compte where id in (select compte_id from chef where monde_id = $1)", [genereId]);
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

  /**
   * Un travail dans une transaction annulée à la fin, où le Monde du jeu est un Monde d'essai qui n'a que sa
   * Couronne, comme Aube : la base de test reste comme neuve, et les naissances des autres fichiers ne voient rien.
   */
  async function dansUnJeuDEssai<T>(travail: (client: PoolClient, essai: { id: number; nom: string; pool: Pool }) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(`update monde set ferme_le = now() where id = ${MONDE_DU_JEU}`);
      const nom = `Essai-${Date.now()}-${Math.random()}`;
      const { rows } = await client.query<{ id: number }>("insert into monde (nom, ouvert_le) values ($1, now()) returning id", [nom]);
      await preparerCouronne(client, rows[0].id);
      return await travail(client, { id: rows[0].id, nom, pool: poolDansLaTransaction(client) });
    } finally {
      await client.query("rollback");
      client.release();
    }
  }

  /** Les Foyers des chefs de ces comptes : leur Case, son Monde et ce qu'elle est. */
  const foyers = async (base: Pool | PoolClient, comptes: number[]) =>
    (
      await base.query(
        `select ch.compte_id as compte, t.id as territoire, c.monde_id as monde, c.q, c.r, c.couronne, c.coeur, c.biome_id as biome,
           c.chef_id = ch.id as possedee, c.imprenable, (select count(*)::int from case_du_monde where chef_id = ch.id) as cases
         from chef ch join territoire t on t.chef_id = ch.id join case_du_monde c on c.id = t.foyer_case_id
         where ch.compte_id = any($1) order by ch.cree_le, ch.id`,
        [comptes],
      )
    ).rows;

  it("donne à des joueurs qui naissent au même instant des Cases différentes de la Couronne du Monde généré, en prairie, bien espacées", async () => {
    const comptes = await nouveauxComptes(pool, 10);
    try {
      await Promise.all(Array.from({ length: 10 }, () => pool.query("select pg_sleep(0.2)")));
      const noms = ["Abeille", "Bison", "Castor", "Daim", "Écureuil", "Faon", "Gerboise", "Hérisson", "Ibis", "Jaguar"];
      const resultats = await Promise.all(comptes.map((compte, i) => enregistrerNomDeChef(pool, compte, noms[i], Math.random, genereId)));
      expect(resultats.every((r) => r.statut === "enregistre")).toBe(true);
      const cases = await foyers(pool, comptes);
      expect(cases).toHaveLength(10);
      for (const c of cases) expect(c).toMatchObject({ monde: genereId, couronne: true, coeur: false, biome: "prairie", possedee: true, imprenable: true, cases: 1 });
      expect(new Set(cases.map((c) => `${c.q},${c.r}`)).size).toBe(10);
      bienEspaces(cases);
    } finally {
      await pool.query("delete from compte where id = any($1)", [comptes]);
    }
  }, 60_000);

  /** Tout ce qu'un Territoire possède et a vécu, hors de sa Case de Foyer. */
  const territoires = async (client: PoolClient, comptes: number[]) => {
    const { rows: ids } = await client.query<{ id: number }>(
      "select t.id from territoire t join chef ch on ch.id = t.chef_id where ch.compte_id = any($1) order by t.id",
      [comptes],
    );
    const parTerritoire = async (requete: string) => (await client.query(requete, [ids.map((t) => t.id)])).rows;
    return {
      chefs: (await client.query("select id, compte_id, nom, cle_nom, cree_le from chef where compte_id = any($1) order by id", [comptes])).rows,
      territoires: await parTerritoire("select id, chef_id, ne_le, calcule_jusqu_a, recit_lu_le, vu_le, famine_imminente_depuis from territoire where id = any($1) order by id"),
      stocks: await parTerritoire("select * from stock where territoire_id = any($1) order by territoire_id, ressource_id"),
      habitants: await parTerritoire("select * from habitant where territoire_id = any($1) order by id"),
      voyageurs: await parTerritoire("select * from voyageur where territoire_id = any($1) order by id"),
      recits: await parTerritoire("select * from recit where territoire_id = any($1) order by id"),
      evenements: await parTerritoire("select * from evenement where element = 'territoire' and element_id = any($1) order by id"),
      production: await Promise.all(ids.map(async (t) => (await client.query(`${PRODUCTION_DU_TERRITOIRE} order by pb.ressource_id`, [t.id])).rows)),
    };
  };

  /** Des chefs nés dans le jeu d'essai, chacun avec ses Stocks, ses Habitants, un Voyageur aux portes et un Récit. */
  async function chefsNes(client: PoolClient, essai: { pool: Pool }, noms: string[]) {
    const comptes = await nouveauxComptes(client, noms.length);
    for (const [i, nom] of noms.entries()) expect(await enregistrerNomDeChef(essai.pool, comptes[i], nom)).toEqual({ statut: "enregistre", nom });
    const { rows } = await client.query<{ id: number }>("select t.id from territoire t join chef ch on ch.id = t.chef_id where ch.compte_id = any($1)", [comptes]);
    const ids = rows.map((t) => t.id);
    await client.query("update stock set quantite = 12.345678 + territoire_id % 7, produit_depuis_visite = 1.5, reste = 42 where territoire_id = any($1)", [ids]);
    await client.query("update territoire set recit_lu_le = now(), vu_le = now() where id = any($1)", [ids]);
    await client.query("insert into voyageur (territoire_id, prenom, arrive_le) select id, 'Aude', now() from unnest($1::int[]) as id", [ids]);
    await client.query("insert into recit (territoire_id, titre, texte, survenu_le) select id, 'Une nuit calme', 'Rien ne bouge.', now() from unnest($1::int[]) as id", [ids]);
    return comptes;
  }

  it("donne aux chefs déjà nés un Foyer sur la Couronne du Monde généré, en prairie, bien espacés ; ferme l'ancien Monde et ouvre le nouveau", async () => {
    await dansUnJeuDEssai(async (client, essai) => {
      const comptes = await chefsNes(client, essai, ["Ourse", "Lynx", "Castor", "Héron"]);
      const avant = await foyers(client, comptes);
      expect(avant.every((c) => c.monde === essai.id && c.biome === "prairie")).toBe(true);
      const bascule = await basculerLeMonde(client, MONDE_GENERE);
      const apres = await foyers(client, comptes);
      expect(apres).toHaveLength(4);
      for (const c of apres) expect(c).toMatchObject({ monde: genereId, couronne: true, coeur: false, biome: "prairie", possedee: true, imprenable: true, cases: 1 });
      bienEspaces(apres);
      expect(bascule).toEqual({
        depuis: essai.nom,
        vers: MONDE_GENERE,
        foyers: ["Ourse", "Lynx", "Castor", "Héron"].map((chef, i) => ({ chef, avant: { q: avant[i].q, r: avant[i].r }, apres: { q: apres[i].q, r: apres[i].r } })),
        sansFoyer: 0,
        restantes: expect.any(Number),
      });
      expect(bascule.restantes).toBeGreaterThanOrEqual(90);
      // Les Cases de l'ancien Monde redeviennent libres, et prenables ; les chefs vivent désormais sur le nouveau.
      const { rows: anciennes } = await client.query("select count(*)::int as n from case_du_monde where monde_id = $1 and (chef_id is not null or imprenable)", [essai.id]);
      expect(anciennes[0].n).toBe(0);
      const { rows: chefs } = await client.query("select distinct monde_id from chef where compte_id = any($1)", [comptes]);
      expect(chefs).toEqual([{ monde_id: genereId }]);
      const ouverture = async (id: number) => (await client.query("select ouvert_le is not null as ouvert, ferme_le is not null as ferme from monde where id = $1", [id])).rows[0];
      expect(await ouverture(essai.id)).toEqual({ ouvert: true, ferme: true });
      expect(await ouverture(genereId)).toEqual({ ouvert: true, ferme: false });
      expect((await client.query(`select ${MONDE_DU_JEU} as id`)).rows[0].id).toBe(genereId);
    });
  }, 60_000);

  it("leur laisse intacts leur Territoire, leurs Stocks, Habitants, Voyageurs, Récits et marque-page, et leur production continue", async () => {
    await dansUnJeuDEssai(async (client, essai) => {
      const comptes = await chefsNes(client, essai, ["Ourse", "Lynx", "Castor"]);
      const avant = await territoires(client, comptes);
      expect(avant.stocks.length).toBeGreaterThan(0);
      expect(avant.habitants).toHaveLength(9);
      expect(avant.production.every((p) => p.length > 0)).toBe(true);
      await basculerLeMonde(client, String(genereId));
      expect(await territoires(client, comptes)).toEqual(avant);
      for (const compte of comptes) expect(await chefDuCompte(client as unknown as Pool, compte)).toMatchObject({ territoireId: expect.any(Number), recitLu: true });
    });
  }, 60_000);

  it("fait naître ensuite les nouveaux joueurs sur le Monde généré, près du dernier arrivé, et y donne son Foyer à un chef qui n'en avait pas", async () => {
    await dansUnJeuDEssai(async (client, essai) => {
      const comptes = await chefsNes(client, essai, ["Ourse", "Lynx"]);
      // Un chef d'avant les Foyers (US-0160) : son nom, sans Case ni Territoire.
      const [ancien, nouveau] = await nouveauxComptes(client, 2);
      await client.query(`insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, ${MONDE_DU_JEU}, 'Ancien', 'ancien')`, [ancien]);
      const bascule = await basculerLeMonde(client, MONDE_GENERE);
      expect(bascule.sansFoyer).toBe(1);
      // Les 5 emplacements où peut naître le nouveau, selon la règle elle-même : les plus proches du dernier arrivé (US-0153).
      const { rows: libres } = await client.query("select q, r, biome_id as biome, coeur from case_du_monde where monde_id = $1 and couronne and chef_id is null", [genereId]);
      const nes = await foyers(client, comptes);
      const possibles = new Set([0, 1, 2, 3, 4].map((i) => choisirCaseDeNaissance(libres, nes, nes[1], () => i / 5)).map((c) => `${c?.q},${c?.r}`));
      expect(await enregistrerNomDeChef(essai.pool, nouveau, "Nouveau")).toEqual({ statut: "enregistre", nom: "Nouveau" });
      expect(await naitreSurLaCouronne(essai.pool, ancien)).toEqual(expect.any(Number));
      const cases = await foyers(client, [...comptes, ancien, nouveau]);
      expect(cases).toHaveLength(4);
      for (const c of cases) expect(c).toMatchObject({ monde: genereId, couronne: true, biome: "prairie", possedee: true, cases: 1 });
      bienEspaces(cases);
      expect(possibles.has(`${cases[3].q},${cases[3].r}`)).toBe(true);
      const { rows } = await client.query("select count(*)::int as n from chef where monde_id = $1", [essai.id]);
      expect(rows[0].n).toBe(0);
    });
  }, 60_000);

  it("refuse, sans rien changer, un Monde déjà ouvert, un Monde qui compte des chefs, un Monde qui n'a que sa Couronne, et un Monde sans la place de tous les chefs", async () => {
    await dansUnJeuDEssai(async (client, essai) => {
      const comptes = await chefsNes(client, essai, ["Ourse", "Lynx"]);
      const etat = async () => ({
        foyers: await foyers(client, comptes),
        mondes: (await client.query("select id, ouvert_le, ferme_le from monde where id = any($1) order by id", [[essai.id, genereId]])).rows,
      });
      const avant = await etat();
      const refus = async (vers: string, message: string) => {
        await client.query("savepoint refus");
        await expect(basculerLeMonde(client, vers)).rejects.toThrow(message);
        await client.query("rollback to savepoint refus");
        expect(await etat()).toEqual(avant);
      };
      await refus(essai.nom, `Le Monde « ${essai.nom} » a déjà été ouvert : une bascule n'ouvre qu'un Monde neuf.`);
      await refus("Aube", "Le Monde « Aube » a déjà été ouvert : une bascule n'ouvre qu'un Monde neuf.");
      await refus("Personne", "Aucun Monde ne s'appelle « Personne » ni ne porte ce numéro.");
      const { rows: couronne } = await client.query<{ id: number; nom: string }>("insert into monde (nom) values ($1) returning id, nom", [`Couronne-${Date.now()}`]);
      await preparerCouronne(client, couronne[0].id);
      await refus(couronne[0].nom, `Le Monde « ${couronne[0].nom} » n'est pas généré en entier : générez-en un avec npm run monde:generer.`);
      // Plus qu'une prairie sur la Couronne du Monde généré : un seul Foyer y tient, pour deux chefs.
      await client.query("savepoint etroit");
      await client.query(
        `update case_du_monde set biome_id = 'toundra' where monde_id = $1 and couronne and biome_id = 'prairie'
           and id <> (select min(id) from case_du_monde where monde_id = $1 and couronne and biome_id = 'prairie')`,
        [genereId],
      );
      await refus(MONDE_GENERE, `Le Monde « ${MONDE_GENERE} » n'a pas la place des 2 chefs d'« ${essai.nom} » : rien n'a changé.`);
      await client.query("rollback to savepoint etroit");
      const [intrus] = await nouveauxComptes(client, 1);
      await client.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, 'Intrus', 'intrus')", [intrus, genereId]);
      await refus(MONDE_GENERE, `Le Monde « ${MONDE_GENERE} » compte déjà des chefs.`);
    });
  }, 60_000);

  it("prépare encore la Couronne d'un Monde du jeu qui n'a qu'elle, comme Aube, mais rien sur un Monde généré, né avec toutes ses Cases", async () => {
    await dansUnJeuDEssai(async (client, essai) => {
      expect(await preparerLaCouronneDuJeu(client)).toEqual({ monde: essai.nom, preparee: { ajoutees: 0, total: 2070 } });
      await basculerLeMonde(client, MONDE_GENERE);
      const cases = async () => (await client.query("select count(*)::int as n, max(id) as dernier from case_du_monde where monde_id = $1", [genereId])).rows[0];
      const avant = await cases();
      expect(await preparerLaCouronneDuJeu(client)).toEqual({ monde: MONDE_GENERE, preparee: null });
      expect(await cases()).toEqual(avant);
    });
  }, 60_000);
});
