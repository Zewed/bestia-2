import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { MONDE_DU_JEU } from "./bascule";
import { emplacementsDeNaissance } from "./foyers";
import { creerUnMonde, genererLeMonde } from "./generer";
import { preparerCouronne } from "./preparer-couronne";

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
      "select q, r, anneau, couronne, coeur, eloignement, biome_id as biome, variante_id as variante, chef_id, imprenable from case_du_monde where monde_id = $1 order by q, r",
      [mondeId],
    );
    return rows;
  }

  it("enregistre le Monde, sa graine, la taille de son Cœur sauvage et ses 10 981 Cases, telles que la graine les donne (US-0403)", async () => {
    await surUneBaseNeuve(async (client) => {
      const { mondeId, cases, emplacements } = await creerUnMonde(client, { nom, graine: 12345 });
      expect(cases).toBe(10_981);
      const { rows } = await client.query("select nom, graine, rayon, anneaux_couronne as anneaux, rayon_coeur as coeur from monde where id = $1", [mondeId]);
      expect(rows[0]).toEqual({ nom, graine: "12345", rayon: 60, anneaux: 6, coeur: 8 });
      const attendues = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: 12345 }).map((c) => ({ ...c, chef_id: null, imprenable: false }));
      const enBase = await lignes(client, mondeId);
      expect(enBase).toEqual(attendues);
      expect(enBase.filter((c) => c.coeur)).toHaveLength(169);
      // US-0405 : chaque Case porte en base sa distance au Cœur sauvage, 0 pour les siennes.
      expect(enBase.filter((c) => c.eloignement === 0)).toEqual(enBase.filter((c) => c.coeur));
      expect(Math.max(...enBase.map((c) => c.eloignement))).toBe(53);
      // US-0413 : la place des naissances, comptée sur les Cases enregistrées.
      expect(emplacements).toBe(emplacementsDeNaissance(enBase).length);
      expect(emplacements).toBeGreaterThanOrEqual(90);
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

  // Les naissances des autres fichiers de test peuvent prendre des Cases pendant ce temps : seuls les Biomes comptent ici.
  const etatDuJeu = async (client: PoolClient) => {
    const { rows } = await client.query(`select id, nom, graine, rayon, anneaux_couronne, ouvert_le, ferme_le from monde where id = ${MONDE_DU_JEU}`);
    const cases = await client.query("select q, r, anneau, couronne, biome_id, variante_id from case_du_monde where monde_id = $1 order by q, r", [rows[0].id]);
    const homonymes = await client.query("select count(*)::int as n from monde where nom = $1", [rows[0].nom]);
    return { jeu: rows[0], cases: cases.rows, homonymes: homonymes.rows[0].n };
  };

  it("refuse de régénérer le Monde du jeu, qui a des joueurs, sans y toucher (US-0416)", async () => {
    await surUneBaseNeuve(async (client) => {
      const avant = await etatDuJeu(client);
      await expect(creerUnMonde(client, { nom: avant.jeu.nom, graine: 1 })).rejects.toThrow(
        `Des joueurs vivent ou ont vécu sur le Monde « ${avant.jeu.nom} » : il ne sera jamais régénéré. Générez-en un nouveau, sous un autre nom.`,
      );
      expect(await etatDuJeu(client)).toEqual(avant);
      expect(avant.homonymes).toBe(1);
    });
  });

  it("refuse aussi un nom déjà pris par un Monde où personne n'a vécu, sans y toucher", async () => {
    await surUneBaseNeuve(async (client) => {
      await client.query("insert into monde (nom) values ($1)", [nom]);
      await expect(creerUnMonde(client, { nom, graine: 1 })).rejects.toThrow(`Le nom « ${nom} » est déjà pris par un autre Monde.`);
      expect((await client.query("select count(*)::int as n from case_du_monde where monde_id = (select id from monde where nom = $1)", [nom])).rows[0].n).toBe(0);
    });
  });

  it("ne laisse pas la préparation d'une Couronne toucher à un Monde généré en entier (US-0416)", async () => {
    await surUneBaseNeuve(async (client) => {
      const { mondeId } = await creerUnMonde(client, { nom, graine: 4161 });
      const avant = { cases: await lignes(client, mondeId), monde: (await client.query("select * from monde where id = $1", [mondeId])).rows };
      await client.query("savepoint preparation");
      await expect(preparerCouronne(client, mondeId)).rejects.toThrow(`Le Monde « ${nom} » est généré en entier : sa Couronne est née avec lui.`);
      await client.query("rollback to savepoint preparation");
      expect({ cases: await lignes(client, mondeId), monde: (await client.query("select * from monde where id = $1", [mondeId])).rows }).toEqual(avant);
    });
  });

  it("génère un nouveau Monde à côté du Monde du jeu, qui le reste, intact (US-0416)", async () => {
    await surUneBaseNeuve(async (client) => {
      const avant = await etatDuJeu(client);
      const { mondeId } = await creerUnMonde(client, { nom, graine: 4160 });
      expect(await etatDuJeu(client)).toEqual(avant);
      expect((await client.query("select ouvert_le, ferme_le from monde where id = $1", [mondeId])).rows[0]).toEqual({ ouvert_le: null, ferme_le: null });
    });
  });
});

describe.skipIf(!URL_TEST)("un Monde ouvert ne se régénère jamais, la base y veille (US-0416)", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.end();
  });

  /** Chaque essai dans une transaction annulée à la fin, avec un Monde neuf qui n'a que sa Couronne. */
  async function avecUnMondeNeuf(travail: (client: PoolClient, mondeId: number) => Promise<void>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query<{ id: number }>("insert into monde (nom) values ($1) returning id", [`Essai-${Date.now()}-${Math.random()}`]);
      await preparerCouronne(client, rows[0].id);
      await travail(client, rows[0].id);
    } finally {
      await client.query("rollback");
      client.release();
    }
  }

  /** Changer le Biome d'une Case hors prairie (qu'aucune naissance ne vise) du Monde, puis l'effacer : rend les deux refus, ou null. */
  async function regenerer(client: PoolClient, mondeId: number) {
    const tenter = async (requete: string) => {
      await client.query("savepoint tentative");
      try {
        await client.query(requete, [mondeId]);
        await client.query("release savepoint tentative");
        return null;
      } catch (refus) {
        await client.query("rollback to savepoint tentative");
        return (refus as Error).message;
      }
    };
    const uneCase = "(select min(id) from case_du_monde where monde_id = $1 and biome_id not in ('prairie', 'toundra') and chef_id is null)";
    return {
      biome: await tenter(`update case_du_monde set biome_id = 'toundra' where id = ${uneCase}`),
      effacee: await tenter(`delete from case_du_monde where id = ${uneCase}`),
    };
  }
  const REFUS = "Un Monde où des joueurs vivent ou ont vécu ne se régénère jamais : ses Cases ne changent pas.";

  it("refuse de changer ou d'effacer une Case du Monde du jeu, ou d'un Monde qui compte un chef ou a été ouvert", async () => {
    await avecUnMondeNeuf(async (client, mondeId) => {
      expect(await regenerer(client, (await client.query(`select ${MONDE_DU_JEU} as id`)).rows[0].id)).toEqual({ biome: REFUS, effacee: REFUS });
      const [compte] = (await client.query("insert into compte (email, empreinte_mot_de_passe) values ($1, 'scrypt$1$1$1$AA==$AA==') returning id", [`regenerer-${Date.now()}@essai.test`])).rows;
      await client.query("savepoint chef");
      await client.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, 'Ourse', 'ourse')", [compte.id, mondeId]);
      expect(await regenerer(client, mondeId)).toEqual({ biome: REFUS, effacee: REFUS });
      await client.query("rollback to savepoint chef");
      await client.query("update monde set ouvert_le = now(), ferme_le = now() where id = $1", [mondeId]);
      expect(await regenerer(client, mondeId)).toEqual({ biome: REFUS, effacee: REFUS });
    });
  });

  it("laisse changer un Monde où personne n'a vécu, et prendre ou rendre des Cases sur le Monde du jeu", async () => {
    await avecUnMondeNeuf(async (client, mondeId) => {
      expect(await regenerer(client, mondeId)).toEqual({ biome: null, effacee: null });
      const { rowCount } = await client.query(
        `update case_du_monde set imprenable = not imprenable where id = (select min(id) from case_du_monde where monde_id = ${MONDE_DU_JEU} and biome_id = 'foret')`,
      );
      expect(rowCount).toBe(1);
    });
  });

  it("refuse en base de vider les Cases de tous les Mondes", async () => {
    // Sans le tenter : vider la table la verrouillerait pour tous les autres essais.
    const { rows } = await pool.query("select tgname from pg_trigger where tgrelid = 'case_du_monde'::regclass and not tgisinternal order by tgname");
    expect(rows.map((t) => t.tgname)).toContain("cases_jamais_videes");
  });
});
