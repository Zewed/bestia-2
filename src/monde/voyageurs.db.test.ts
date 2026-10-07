import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { cleDuNom } from "@/chefs/nom";
import { creerCompte } from "@/comptes/compte";
import { MIGRATIONS_FOLDER } from "@/db/migrations";
import { lireJeu } from "@/donnees/charger";
import { PRENOMS } from "@/donnees/jeux";
import { VOYAGEURS_EN_ATTENTE_MAX } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { ecartAvantVoyageur } from "./voyageurs";

const HEURE = 3_600_000;
const MINUTE = 60_000;

/**
 * Le déroulement attendu, sans base : les arrivées d'un Territoire de sa naissance `ne` jusqu'à `jusqua` compris,
 * chacune à l'écart tiré pour son numéro après la précédente, et la suivante, encore à venir.
 */
function prevues(territoireId: number, ne: Date, jusqua: Date) {
  const arrivees: { numero: number; instant: number }[] = [];
  let instant = ne.getTime();
  for (let numero = 1; ; numero++) {
    instant += ecartAvantVoyageur(territoireId, numero);
    if (instant > jusqua.getTime()) return { arrivees, suivante: { numero, instant } };
    arrivees.push({ numero, instant });
  }
}

/**
 * Ce que la base doit tenir à `jusqua` : chaque arrivée traitée à son instant, la suivante programmée, et les
 * Voyageurs venus aux premières arrivées, pas plus de VOYAGEURS_EN_ATTENTE_MAX, puisqu'aucun ne repart encore.
 */
function attendu(territoireId: number, ne: Date, jusqua: Date) {
  const { arrivees, suivante } = prevues(territoireId, ne, jusqua);
  return {
    arrivees: [...arrivees.map((a) => [a.numero, a.instant, a.instant]), [suivante.numero, suivante.instant, null]],
    voyageurs: arrivees.slice(0, VOYAGEURS_EN_ATTENTE_MAX).map((a) => a.instant),
  };
}

/** L'instruction de la migration US-0331 qui programme la première arrivée des Territoires déjà nés. */
function premiereArriveeDesTerritoiresDejaNes(): string {
  const instructions = readdirSync(MIGRATIONS_FOLDER)
    .filter((f) => f.endsWith(".sql"))
    .flatMap((f) => readFileSync(join(MIGRATIONS_FOLDER, f), "utf8").split("--> statement-breakpoint"));
  return instructions.find((i) => /^INSERT INTO "evenement"/m.test(i) && i.includes('FROM "territoire"'))!;
}

describe.skipIf(!URL_TEST)("l'arrivée des Voyageurs (US-0331, sur base)", () => {
  let pool: Pool;
  const lancement = `voyageurs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
  const nomUnique = () => `Voy${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;

  /** Un Territoire tout neuf, et l'instant de sa naissance. */
  const naitre = async () => {
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const territoireId = (await chefDuCompte(pool, compte.id))!.territoireId!;
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };
  /** Les arrivées du Territoire en base : numéro, instant prévu, instant où elle a été traitée (null si à venir). */
  const arrivees = async (territoireId: number) =>
    (
      await pool.query<{ numero: number; survient_le: Date; traite_le: Date | null }>(
        `select (donnees->>'numero')::int as numero, survient_le, traite_le from evenement
         where element = 'territoire' and element_id = $1 and type = 'arrivee_voyageur' order by survient_le, id`,
        [territoireId],
      )
    ).rows.map((e) => [e.numero, e.survient_le.getTime(), e.traite_le?.getTime() ?? null]);
  const voyageurs = async (territoireId: number) =>
    (await pool.query<{ id: number; prenom: string; arrive_le: Date }>("select id, prenom, arrive_le from voyageur where territoire_id = $1 order by arrive_le, id", [territoireId])).rows;
  const etat = async (territoireId: number) => ({
    arrivees: await arrivees(territoireId),
    voyageurs: (await voyageurs(territoireId)).map((v) => v.arrive_le.getTime()),
  });
  const apres = (ne: Date, ms: number) => new Date(ne.getTime() + ms);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  describe("la première arrivée", () => {
    it("est programmée à la naissance, à l'écart tiré pour le numéro 1", async () => {
      const { territoireId, ne } = await naitre();
      expect(await arrivees(territoireId)).toEqual([[1, ne.getTime() + ecartAvantVoyageur(territoireId, 1), null]]);
      expect(await voyageurs(territoireId)).toEqual([]);
    });

    it("l'est aussi pour le chef né avant la Couronne, quand il reçoit son Foyer", async () => {
      const compte = await nouveauCompte();
      const nom = nomUnique();
      await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [compte.id, nom, cleDuNom(nom)]);
      const territoireId = (await naitreSurLaCouronne(pool, compte.id))!;
      const ne = await lireMarquePage(pool, "territoire", territoireId);
      expect(await arrivees(territoireId)).toEqual([[1, ne.getTime() + ecartAvantVoyageur(territoireId, 1), null]]);
    });

    it("est tirée par la base exactement comme par le jeu", async () => {
      const { rows } = await pool.query<{ territoire: number; numero: number; ms: string }>(
        `select t as territoire, n as numero, (extract(epoch from ecart_avant_voyageur(t, n)) * 1000)::bigint::text as ms
         from generate_series(1, 60) t cross join generate_series(1, 40) n`,
      );
      expect(rows).toHaveLength(2400);
      for (const { territoire, numero: n, ms } of rows) expect(Number(ms), `${territoire}:${n}`).toBe(ecartAvantVoyageur(territoire, n));
    });

    it("est programmée, à la migration, pour chaque Territoire déjà né, depuis la mise en ligne et non depuis sa naissance", async () => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        // Des Territoires déjà nés, sans arrivée, dans des tables temporaires qui masquent les vraies.
        await client.query("create temp table territoire (id integer, calcule_jusqu_a timestamptz) on commit drop");
        await client.query("create temp table evenement (element text, element_id integer, survient_le timestamptz, type text, donnees jsonb) on commit drop");
        await client.query(
          `insert into territoire values (1, now() - interval '40 days'), (2, now()), (3, now() + interval '3 days')`,
        );
        await client.query(premiereArriveeDesTerritoiresDejaNes());
        const miseEnLigne = (await client.query<{ maintenant: Date }>("select now() as maintenant")).rows[0].maintenant.getTime();
        const { rows } = await client.query<{ element: string; element_id: number; survient_le: Date; type: string; donnees: unknown }>(
          "select * from evenement order by element_id",
        );
        const depuis = { 1: miseEnLigne, 2: miseEnLigne, 3: miseEnLigne + 3 * 24 * HEURE } as Record<number, number>;
        expect(rows).toEqual(
          [1, 2, 3].map((id) => ({
            element: "territoire",
            element_id: id,
            // La base garde l'instant à la microseconde, le jeu à la milliseconde : l'arrivée tombe sur une milliseconde.
            survient_le: new Date(Math.floor(depuis[id]) + ecartAvantVoyageur(id, 1)),
            type: "arrivee_voyageur",
            donnees: { numero: 1 },
          })),
        );
      } finally {
        await client.query("rollback");
        client.release();
      }
    });
  });

  it("fait entrer un Voyageur à l'instant exact de son arrivée, puis programme la suivante", async () => {
    const { territoireId, ne } = await naitre();
    const premiere = ne.getTime() + ecartAvantVoyageur(territoireId, 1);
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(premiere - 1) });
    expect(await voyageurs(territoireId)).toEqual([]);

    await rattraper("territoire", territoireId, { pool, jusqua: new Date(premiere) });
    const venus = await voyageurs(territoireId);
    expect(venus.map((v) => v.arrive_le)).toEqual([new Date(premiere)]);
    expect(lireJeu(PRENOMS).map((p) => p.nom)).toContain(venus[0].prenom);
    const deuxieme = premiere + ecartAvantVoyageur(territoireId, 2);
    expect(await arrivees(territoireId)).toEqual([
      [1, premiere, premiere],
      [2, deuxieme, null],
    ]);
  });

  it("n'en fait pas attendre plus de trois : au-delà, personne ne se présente, et l'arrivée est perdue", async () => {
    const { territoireId, ne } = await naitre();
    const { arrivees: prevu } = prevues(territoireId, ne, apres(ne, 1000 * HEURE));
    // Jusqu'à la sixième arrivée comprise : les trois dernières trouvent les portes pleines.
    const sixieme = new Date(prevu[5].instant);
    await rattraper("territoire", territoireId, { pool, jusqua: sixieme });
    expect(await etat(territoireId)).toEqual(attendu(territoireId, ne, sixieme));
    const venus = await voyageurs(territoireId);
    expect(venus).toHaveLength(VOYAGEURS_EN_ATTENTE_MAX);
    // Trois prénoms différents, qu'aucun Habitant ne porte.
    const habitants = (await pool.query<{ prenom: string }>("select prenom from habitant where territoire_id = $1", [territoireId])).rows.map((h) => h.prenom);
    expect(new Set(venus.map((v) => v.prenom)).size).toBe(3);
    for (const v of venus) expect(habitants).not.toContain(v.prenom);

    // Une place se libère (accueilli ou reparti, aux stories suivantes) : personne ne vient avant la septième arrivée,
    // les arrivées perdues ne sont pas reportées ; à la septième, un Voyageur se présente de nouveau.
    await pool.query("delete from voyageur where id = $1", [venus[0].id]);
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(prevu[6].instant - 1) });
    expect(await voyageurs(territoireId)).toHaveLength(2);
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(prevu[6].instant) });
    expect((await voyageurs(territoireId)).map((v) => v.arrive_le.getTime())).toEqual([prevu[1].instant, prevu[2].instant, prevu[6].instant]);
  });

  it("tire un prénom qu'aucun Habitant ni Voyageur présent ne porte, et un prénom déjà porté quand tous le sont", async () => {
    const { territoireId, ne } = await naitre();
    const liste = lireJeu(PRENOMS).map((p) => p.nom);
    // Les Habitants portent tous les prénoms de la liste sauf un.
    await pool.query(
      "with partis as (delete from habitant where territoire_id = $1) insert into habitant (territoire_id, prenom) select $1, nom from prenom where nom <> $2",
      [territoireId, liste[7]],
    );
    const { arrivees: prevu } = prevues(territoireId, ne, apres(ne, 1000 * HEURE));
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(prevu[1].instant) });
    const [premier, second] = await voyageurs(territoireId);
    expect(premier.prenom).toBe(liste[7]);
    expect(liste).toContain(second.prenom);
  });

  describe.each([
    { nom: "une absence de 30 heures", heures: 30, page: 37 * MINUTE + 7_919, tache: [3.5, 11, 22.25], pleines: false },
    { nom: "une absence de 4 jours, portes pleines", heures: 96, page: 3 * HEURE + 7 * MINUTE + 1_237, tache: [9, 40.5, 77], pleines: true },
  ])("$nom : rien ne se perd ni ne s'invente au rattrapage", ({ heures, page, tache, pleines }) => {
    it("page fermée : au retour, un seul rattrapage donne exactement les arrivées prévues", async () => {
      const { territoireId, ne } = await naitre();
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, heures * HEURE) });
      const fin = await etat(territoireId);
      expect(fin).toEqual(attendu(territoireId, ne, apres(ne, heures * HEURE)));
      expect(fin.voyageurs.length).toBeGreaterThan(0);
      // Quatre jours voient au moins huit arrivées, de douze heures d'écart au plus : les portes se remplissent en route.
      if (pleines) expect(fin.arrivees.length - 1).toBeGreaterThan(VOYAGEURS_EN_ATTENTE_MAX);
    });

    it("page ouverte : à chaque rattrapage, les arrivées prévues jusque-là, et la même fin", async () => {
      const { territoireId, ne } = await naitre();
      for (let ms = page; ms < heures * HEURE; ms += page) {
        await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, ms) });
        expect(await etat(territoireId), `${(ms / HEURE).toFixed(2)} h`).toEqual(attendu(territoireId, ne, apres(ne, ms)));
      }
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, heures * HEURE) });
      expect(await etat(territoireId)).toEqual(attendu(territoireId, ne, apres(ne, heures * HEURE)));
    }, 120_000);

    it("tâche planifiée passée au milieu : même fin qu'à la page fermée", async () => {
      const { territoireId, ne } = await naitre();
      for (const h of tache) {
        const passage = await rattraperLesAbsents({ pool, maintenant: apres(ne, h * HEURE), parmi: { territoire: [territoireId] } });
        expect(passage, `passage à ${h} h`).toMatchObject({ rattrapes: 1, echecs: 0 });
      }
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, heures * HEURE) });
      expect(await etat(territoireId)).toEqual(attendu(territoireId, ne, apres(ne, heures * HEURE)));
    }, 60_000);
  });
});
