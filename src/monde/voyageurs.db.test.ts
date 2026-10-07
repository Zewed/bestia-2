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
import { ENTRETIEN_HABITANT_PAR_HEURE, PLACES_DU_FOYER, VOYAGEUR_ATTEND_HEURES, VOYAGEURS_EN_ATTENTE_MAX } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { programmerEvenement } from "@/temps/avancer";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { entretienDesHabitants, habitantsDuTerritoire, nombreDHabitants } from "./habitants";
import { recitsDuTerritoire } from "./recits";
import { stocksDuTerritoire } from "./stocks";
import {
  accueillirLeVoyageur,
  DEPART_VOYAGEUR,
  departDuVoyageur,
  ecartAvantVoyageur,
  nombreDeVoyageurs,
  recitDeDepart,
  refuserLeVoyageur,
  voyageursAuxPortes,
} from "./voyageurs";

const HEURE = 3_600_000;
const MINUTE = 60_000;
/** US-0337 : l'attente d'un Voyageur aux portes avant qu'il reparte, en millisecondes de jeu. */
const ATTENTE = VOYAGEUR_ATTEND_HEURES * HEURE;

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
 * Ce que la base doit tenir à `jusqua` : chaque arrivée traitée à son instant, la suivante programmée ; un
 * Voyageur venu à chaque arrivée qui trouve moins de VOYAGEURS_EN_ATTENTE_MAX Voyageurs aux portes, son départ
 * programmé dès son arrivée ATTENTE plus tard, et traité à son instant (US-0337) ; ceux qui attendent encore aux
 * portes, et ceux repartis, avec l'instant de leur arrivée et celui de leur départ. `sansDepart` : les arrivées de
 * Voyageurs déjà aux portes, venus sans passer par le temps, qui ne repartent pas.
 */
function attendu(territoireId: number, ne: Date, jusqua: Date, sansDepart: number[] = []) {
  const { arrivees, suivante } = prevues(territoireId, ne, jusqua);
  const [portes, venus, repartis]: number[][] = [[], [], []];
  // Ceux dont l'attente s'achève à `instant` repartent, dans l'ordre de leurs départs, avant une arrivée du même instant.
  const partir = (instant: number) => {
    while (portes.length > 0 && portes[0] + ATTENTE <= instant) repartis.push(portes.shift()!);
  };
  for (const a of arrivees) {
    partir(a.instant);
    if (sansDepart.length + portes.length < VOYAGEURS_EN_ATTENTE_MAX) {
      portes.push(a.instant);
      venus.push(a.instant);
    }
  }
  partir(jusqua.getTime());
  return {
    arrivees: [...arrivees.map((a) => [a.numero, a.instant, a.instant]), [suivante.numero, suivante.instant, null]],
    voyageurs: [...sansDepart, ...portes].sort((a, b) => a - b),
    departs: venus.map((v) => [v + ATTENTE, v + ATTENTE <= jusqua.getTime() ? v + ATTENTE : null]),
    repartis: repartis.map((v) => [v, v + ATTENTE]),
  };
}

/**
 * US-0337 : les départs `repartis` (arrivée, départ) rangés par avancée du temps, chaque avancée finissant à l'une
 * des `fins`, dans l'ordre : ceux qu'une même avancée applique, de sa fin exclue à la sienne comprise, ensemble.
 */
function parAvancee(repartis: number[][], fins: number[]): number[][][] {
  return fins
    .map((fin, i) => repartis.filter(([, depart]) => depart > (i === 0 ? -Infinity : fins[i - 1]) && depart <= fin))
    .filter((groupe) => groupe.length > 0);
}

/** L'instruction de la migration US-0331 qui programme la première arrivée des Territoires déjà nés. */
function premiereArriveeDesTerritoiresDejaNes(): string {
  const instructions = readdirSync(MIGRATIONS_FOLDER)
    .filter((f) => f.endsWith(".sql"))
    .flatMap((f) => readFileSync(join(MIGRATIONS_FOLDER, f), "utf8").split("--> statement-breakpoint"));
  return instructions.find((i) => /^INSERT INTO "evenement"/m.test(i) && i.includes('FROM "territoire"'))!;
}

/** L'instruction de la migration US-0337 qui programme le départ des Voyageurs déjà aux portes. */
function departDesVoyageursDejaAuxPortes(): string {
  const instructions = readdirSync(MIGRATIONS_FOLDER)
    .filter((f) => f.endsWith(".sql"))
    .flatMap((f) => readFileSync(join(MIGRATIONS_FOLDER, f), "utf8").split("--> statement-breakpoint"));
  return instructions.find((i) => /^INSERT INTO "evenement"/m.test(i) && i.includes('FROM "voyageur"'))!;
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
  /** Les Voyageurs qui attendent aux portes du Territoire, du premier arrivé au dernier. */
  const voyageurs = async (territoireId: number) =>
    (
      await pool.query<{ id: number; prenom: string; arrive_le: Date }>(
        "select id, prenom, arrive_le from voyageur where territoire_id = $1 and sort is null order by arrive_le, id",
        [territoireId],
      )
    ).rows;
  /** US-0337 : les départs programmés du Territoire : instant prévu, instant où il a été traité (null si à venir). */
  const departs = async (territoireId: number) =>
    (
      await pool.query<{ survient_le: Date; traite_le: Date | null }>(
        `select survient_le, traite_le from evenement where element = 'territoire' and element_id = $1 and type = 'depart_voyageur' order by survient_le, id`,
        [territoireId],
      )
    ).rows.map((e) => [e.survient_le.getTime(), e.traite_le?.getTime() ?? null]);
  /** US-0337 : les Voyageurs repartis d'eux-mêmes, dans l'ordre de leurs départs : prénom, instant d'arrivée et de départ. */
  const repartis = async (territoireId: number) =>
    (
      await pool.query<{ prenom: string; arrive_le: Date; sort_le: Date }>(
        "select prenom, arrive_le, sort_le from voyageur where territoire_id = $1 and sort = 'reparti' order by sort_le, id",
        [territoireId],
      )
    ).rows;
  const etat = async (territoireId: number) => ({
    arrivees: await arrivees(territoireId),
    voyageurs: (await voyageurs(territoireId)).map((v) => v.arrive_le.getTime()),
    departs: await departs(territoireId),
    repartis: (await repartis(territoireId)).map((v) => [v.arrive_le.getTime(), v.sort_le.getTime()]),
  });
  /** US-0337 : les Récits du Territoire, du plus ancien au plus récent : titre, texte, et l'heure du jeu où il est survenu. */
  const recits = async (territoireId: number) => (await recitsDuTerritoire(pool, territoireId)).reverse().map((r) => [r.titre, r.texte, r.survenuLe.getTime()]);
  /** US-0337 : le Récit attendu de chaque groupe de départs (arrivée, départ), avec les prénoms lus en base, daté du dernier. */
  const recitsDeDepart = async (territoireId: number, groupes: number[][][]) => {
    const prenoms = new Map((await repartis(territoireId)).map((v) => [v.arrive_le.getTime(), v.prenom]));
    return groupes.map((groupe) => {
      const { titre, texte, survenuLe } = recitDeDepart(
        groupe.map(([arrive]) => prenoms.get(arrive)!),
        new Date(groupe.at(-1)![1]),
      );
      return [titre, texte, survenuLe.getTime()];
    });
  };
  const apres = (ne: Date, ms: number) => new Date(ne.getTime() + ms);
  /** Fait se présenter un Voyageur au Territoire, à l'instant donné, sans passer par le temps : il ne repart pas. */
  const presenter = async (territoireId: number, prenom: string, arriveLe: Date) =>
    (await pool.query<{ id: number }>("insert into voyageur (territoire_id, prenom, arrive_le) values ($1, $2, $3) returning id", [territoireId, prenom, arriveLe])).rows[0].id;
  /** US-0337 : fait se présenter un Voyageur comme le temps le fait venir, son départ programmé au bout de son attente. */
  const presenterQuiRepart = async (territoireId: number, prenom: string, arriveLe: Date) => {
    const id = await presenter(territoireId, prenom, arriveLe);
    await programmerEvenement(pool, "territoire", territoireId, departDuVoyageur(arriveLe), DEPART_VOYAGEUR, { voyageur: id });
    return id;
  };
  /** Le sort d'un Voyageur, et son heure. */
  const sort = async (voyageurId: number) =>
    (await pool.query<{ sort: string | null; sort_le: Date | null }>("select sort, sort_le from voyageur where id = $1", [voyageurId])).rows.map((v) => [v.sort, v.sort_le])[0];

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
    // US-0337 : les Voyageurs venus du temps repartent au bout de leur attente, plus longue que trois écarts : deux
    // Voyageurs qui ne repartent pas attendent déjà, sous des prénoms qu'aucun Habitant ne porte. La première arrivée
    // en fait entrer un troisième ; la deuxième, moins d'une attente après, trouve les portes pleines.
    const habitants = (await pool.query<{ prenom: string }>("select prenom from habitant where territoire_id = $1", [territoireId])).rows.map((h) => h.prenom);
    const [un, deux] = lireJeu(PRENOMS)
      .map((p) => p.nom)
      .filter((nom) => !habitants.includes(nom));
    const deja = apres(ne, 1).getTime();
    const premier = await presenter(territoireId, un, new Date(deja));
    await presenter(territoireId, deux, new Date(deja));
    const deuxieme = new Date(prevu[1].instant);
    await rattraper("territoire", territoireId, { pool, jusqua: deuxieme });
    expect(await etat(territoireId)).toEqual(attendu(territoireId, ne, deuxieme, [deja, deja]));
    const venus = await voyageurs(territoireId);
    expect(venus.map((v) => v.arrive_le.getTime())).toEqual([deja, deja, prevu[0].instant]);
    expect(venus).toHaveLength(VOYAGEURS_EN_ATTENTE_MAX);
    // Trois prénoms différents, qu'aucun Habitant ne porte.
    expect(new Set(venus.map((v) => v.prenom)).size).toBe(3);
    for (const v of venus) expect(habitants).not.toContain(v.prenom);

    // Une place se libère : personne ne vient avant la troisième arrivée, la deuxième, perdue, n'est pas reportée ; à la
    // troisième, un Voyageur se présente de nouveau. Celui de la première est encore là, sauf s'il est reparti entre-temps.
    expect(await refuserLeVoyageur(pool, territoireId, premier, apres(deuxieme, 1))).toBe(true);
    const restent = (instant: number) => [deja, ...(prevu[0].instant + ATTENTE > instant ? [prevu[0].instant] : [])];
    const troisieme = prevu[2].instant;
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(troisieme - 1) });
    expect((await voyageurs(territoireId)).map((v) => v.arrive_le.getTime())).toEqual(restent(troisieme - 1));
    await rattraper("territoire", territoireId, { pool, jusqua: new Date(troisieme) });
    expect((await voyageurs(territoireId)).map((v) => v.arrive_le.getTime())).toEqual([...restent(troisieme), troisieme]);
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
    { nom: "une absence de 30 heures", heures: 30, page: 37 * MINUTE + 7_919, tache: [3.5, 11, 22.25] },
    { nom: "une absence de 4 jours", heures: 96, page: 3 * HEURE + 7 * MINUTE + 1_237, tache: [9, 40.5, 77] },
  ])("$nom : rien ne se perd ni ne s'invente au rattrapage", ({ heures, page, tache }) => {
    // US-0337 : chaque Voyageur repart au bout de son attente, au bon moment, et les départs d'une même avancée du
    // temps se disent dans un seul Récit, daté du dernier.
    it("page fermée : au retour, un seul rattrapage donne exactement les arrivées et les départs prévus, en un seul Récit", async () => {
      const { territoireId, ne } = await naitre();
      const fin = apres(ne, heures * HEURE);
      await rattraper("territoire", territoireId, { pool, jusqua: fin });
      const prevu = attendu(territoireId, ne, fin);
      expect(await etat(territoireId)).toEqual(prevu);
      expect(prevu.voyageurs.length + prevu.repartis.length).toBeGreaterThan(0);
      // Trente heures voient au moins un départ ; quatre jours, au moins six, d'au plus douze heures d'écart.
      expect(prevu.repartis.length).toBeGreaterThanOrEqual(heures > 48 ? 6 : 1);
      expect(await recits(territoireId)).toEqual(await recitsDeDepart(territoireId, [prevu.repartis]));
    });

    it("page ouverte : à chaque rattrapage, les arrivées et les départs prévus jusque-là, chaque départ dans son Récit, et la même fin", async () => {
      const { territoireId, ne } = await naitre();
      const fins: number[] = [];
      for (let ms = page; ms < heures * HEURE; ms += page) {
        await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, ms) });
        expect(await etat(territoireId), `${(ms / HEURE).toFixed(2)} h`).toEqual(attendu(territoireId, ne, apres(ne, ms)));
        fins.push(apres(ne, ms).getTime());
      }
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, heures * HEURE) });
      const prevu = attendu(territoireId, ne, apres(ne, heures * HEURE));
      expect(await etat(territoireId)).toEqual(prevu);
      // Deux départs sont toujours à plus d'un rattrapage l'un de l'autre : un Récit chacun.
      const groupes = parAvancee(prevu.repartis, [...fins, apres(ne, heures * HEURE).getTime()]);
      expect(groupes.map((g) => g.length)).toEqual(prevu.repartis.map(() => 1));
      expect(await recits(territoireId)).toEqual(await recitsDeDepart(territoireId, groupes));
    }, 120_000);

    it("tâche planifiée passée au milieu : même fin qu'à la page fermée, un Récit par passage pour ses départs", async () => {
      const { territoireId, ne } = await naitre();
      for (const h of tache) {
        const passage = await rattraperLesAbsents({ pool, maintenant: apres(ne, h * HEURE), parmi: { territoire: [territoireId] } });
        expect(passage, `passage à ${h} h`).toMatchObject({ rattrapes: 1, echecs: 0 });
      }
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, heures * HEURE) });
      const prevu = attendu(territoireId, ne, apres(ne, heures * HEURE));
      expect(await etat(territoireId)).toEqual(prevu);
      const groupes = parAvancee(prevu.repartis, [...tache, heures].map((h) => apres(ne, h * HEURE).getTime()));
      expect(await recits(territoireId)).toEqual(await recitsDeDepart(territoireId, groupes));
    }, 60_000);
  });

  describe("le départ d'un Voyageur ignoré (US-0337)", () => {
    it("est programmé dès son arrivée, au bout de son attente ; il repart seul à cet instant exact, pas avant, et un Récit le dit", async () => {
      const { territoireId, ne } = await naitre();
      const [premiere] = prevues(territoireId, ne, apres(ne, 1000 * HEURE)).arrivees;
      await rattraper("territoire", territoireId, { pool, jusqua: new Date(premiere.instant) });
      const [venu] = await voyageursAuxPortes(pool, territoireId);
      const depart = departDuVoyageur(venu.arriveLe);
      expect(depart.getTime()).toBe(premiere.instant + ATTENTE);
      const { rows } = await pool.query("select survient_le, donnees, traite_le from evenement where element = 'territoire' and element_id = $1 and type = 'depart_voyageur'", [
        territoireId,
      ]);
      expect(rows).toEqual([{ survient_le: depart, donnees: { voyageur: venu.id }, traite_le: null }]);

      await rattraper("territoire", territoireId, { pool, jusqua: new Date(depart.getTime() - 1) });
      expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).toContain(venu.id);
      expect(await sort(venu.id)).toEqual([null, null]);
      expect(await recits(territoireId)).toEqual([]);

      await rattraper("territoire", territoireId, { pool, jusqua: depart });
      expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).not.toContain(venu.id);
      expect(await sort(venu.id)).toEqual(["reparti", depart]);
      expect(await recits(territoireId)).toEqual([[`${venu.prenom} a repris la route`, `${venu.prenom} a attendu aux portes sans qu'on l'accueille.`, depart.getTime()]]);
    });

    it("dit en un seul Récit, daté du dernier, les départs d'une absence d'un bloc, et en un Récit chacun ceux d'une page ouverte", async () => {
      const [absent, present] = [await naitre(), await naitre()];
      for (const { territoireId, ne } of [absent, present]) {
        for (const [prenom, h] of [["Ines", 1], ["Joran", 2], ["Ilda", 3]] as const) await presenterQuiRepart(territoireId, prenom, apres(ne, h * HEURE));
      }
      // Ils repartent à 13 h, 14 h et 15 h : l'absent revient à 16 h ; l'autre a la page ouverte, rattrapée entre deux.
      await rattraper("territoire", absent.territoireId, { pool, jusqua: apres(absent.ne, 16 * HEURE) });
      for (const h of [13.5, 14.5, 16]) await rattraper("territoire", present.territoireId, { pool, jusqua: apres(present.ne, h * HEURE) });

      expect(await recits(absent.territoireId)).toEqual([
        ["3 Voyageurs ont repris la route", "Ines, Joran et Ilda ont attendu aux portes sans qu'on les accueille.", apres(absent.ne, 15 * HEURE).getTime()],
      ]);
      expect(await recits(present.territoireId)).toEqual(
        [["Ines", 13], ["Joran", 14], ["Ilda", 15]].map(([prenom, h]) => [`${prenom} a repris la route`, `${prenom} a attendu aux portes sans qu'on l'accueille.`, apres(present.ne, Number(h) * HEURE).getTime()]),
      );
      for (const { territoireId } of [absent, present]) expect((await repartis(territoireId)).map((v) => v.prenom)).toEqual(["Ines", "Joran", "Ilda"]);
    });

    it("laisse en paix un Voyageur accueilli ou refusé avant la fin de son attente : son sort reste le sien, et aucun Récit de départ", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenterQuiRepart(territoireId, "Ines", apres(ne, HEURE));
      const joran = await presenterQuiRepart(territoireId, "Joran", apres(ne, 2 * HEURE));
      expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 3 * HEURE))).toBe("accueilli");
      expect(await refuserLeVoyageur(pool, territoireId, joran, apres(ne, 4 * HEURE))).toBe(true);

      // Jusqu'à 15 h : leurs départs, à 13 h et 14 h, et pas encore celui d'un Voyageur venu du temps, au plus tôt à 16 h.
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, 15 * HEURE) });
      expect([await sort(ines), await sort(joran)]).toEqual([
        ["accueilli", apres(ne, 3 * HEURE)],
        ["refuse", apres(ne, 4 * HEURE)],
      ]);
      expect((await recits(territoireId)).map(([titre]) => titre)).toEqual(["Ines a rejoint le Territoire"]);
      // Leurs départs ont bien eu lieu, à leur instant, sans rien changer.
      expect(await departs(territoireId)).toContainEqual([apres(ne, 13 * HEURE).getTime(), apres(ne, 13 * HEURE).getTime()]);
      expect(await departs(territoireId)).toContainEqual([apres(ne, 14 * HEURE).getTime(), apres(ne, 14 * HEURE).getTime()]);
    });

    it("ne touche jamais au Voyageur d'un autre Territoire, quel que soit l'identifiant du départ", async () => {
      const [joueur, voisin] = [await naitre(), await naitre()];
      const brune = await presenter(voisin.territoireId, "Brune", apres(voisin.ne, HEURE));
      await programmerEvenement(pool, "territoire", joueur.territoireId, apres(joueur.ne, 2 * HEURE), DEPART_VOYAGEUR, { voyageur: brune });

      await rattraper("territoire", joueur.territoireId, { pool, jusqua: apres(joueur.ne, 3 * HEURE) });
      expect(await sort(brune)).toEqual([null, null]);
      expect(await recits(joueur.territoireId)).toEqual([]);
    });

    it("refuse l'accueil d'un Voyageur déjà reparti : rien ne change, et l'accueil le dit", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenterQuiRepart(territoireId, "Ines", apres(ne, HEURE));
      await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, 14 * HEURE) });
      const [nombre, avant] = [await nombreDHabitants(pool, territoireId), await recits(territoireId)];

      expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 14 * HEURE))).toBe("reparti");
      expect(await nombreDHabitants(pool, territoireId)).toBe(nombre);
      expect(await recits(territoireId)).toEqual(avant);
      expect(await sort(ines)).toEqual(["reparti", apres(ne, 13 * HEURE)]);
    });

    it("programme, à la migration, le départ de chaque Voyageur qui attend déjà aux portes, au bout de son attente, et de lui seul", async () => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        // Des Voyageurs déjà venus, dans des tables temporaires qui masquent les vraies.
        await client.query("create temp table voyageur (id integer, territoire_id integer, arrive_le timestamptz, sort text) on commit drop");
        await client.query("create temp table evenement (element text, element_id integer, survient_le timestamptz, type text, donnees jsonb) on commit drop");
        await client.query(
          `insert into voyageur values (1, 7, '2026-10-07T08:00:00.123Z', null), (2, 7, '2026-10-06T20:00:00Z', null), (3, 8, '2026-10-07T09:30:00Z', null),
           (4, 7, '2026-10-07T07:00:00Z', 'accueilli')`,
        );
        await client.query(departDesVoyageursDejaAuxPortes());
        const { rows } = await client.query("select * from evenement order by donnees->>'voyageur'");
        expect(rows).toEqual(
          [
            [1, 7, "2026-10-07T08:00:00.123Z"],
            [2, 7, "2026-10-06T20:00:00Z"],
            [3, 8, "2026-10-07T09:30:00Z"],
          ].map(([id, territoire, arrive]) => ({
            element: "territoire",
            element_id: territoire,
            survient_le: departDuVoyageur(new Date(arrive)),
            type: "depart_voyageur",
            donnees: { voyageur: id },
          })),
        );
      } finally {
        await client.query("rollback");
        client.release();
      }
    });

    it("ne donne à un Voyageur qu'un sort connu, et toujours avec son heure", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      for (const [valeur, heure] of [["parti", apres(ne, 2 * HEURE)], ["reparti", null], [null, apres(ne, 2 * HEURE)]] as const) {
        await expect(pool.query("update voyageur set sort = $2, sort_le = $3 where id = $1", [ines, valeur, heure]), `${valeur}`).rejects.toMatchObject({ code: "23514" });
      }
      expect(await sort(ines)).toEqual([null, null]);
    });
  });

  describe("les Voyageurs aux portes (US-0332)", () => {
    it("lit ceux qui attendent aux portes du Territoire, du premier arrivé au dernier, et eux seuls", async () => {
      const { territoireId, ne } = await naitre();
      const voisin = await naitre();
      const cael = await presenter(territoireId, "Cael", apres(ne, 5 * HEURE));
      const arno = await presenter(territoireId, "Arno", apres(ne, HEURE));
      await presenter(voisin.territoireId, "Brune", apres(ne, 2 * HEURE));
      // Deux arrivées au même instant : la première enregistrée d'abord.
      const dara = await presenter(territoireId, "Dara", apres(ne, 5 * HEURE));
      // US-0333 : chacun avec l'instant de son départ, s'il n'est pas accueilli d'ici là.
      expect(await voyageursAuxPortes(pool, territoireId)).toEqual([
        { id: arno, prenom: "Arno", arriveLe: apres(ne, HEURE), departLe: departDuVoyageur(apres(ne, HEURE)) },
        { id: cael, prenom: "Cael", arriveLe: apres(ne, 5 * HEURE), departLe: departDuVoyageur(apres(ne, 5 * HEURE)) },
        { id: dara, prenom: "Dara", arriveLe: apres(ne, 5 * HEURE), departLe: departDuVoyageur(apres(ne, 5 * HEURE)) },
      ]);
      expect(await nombreDeVoyageurs(pool, territoireId)).toBe(3);
      expect(await nombreDeVoyageurs(pool, voisin.territoireId)).toBe(1);
    });

    it("ne lit personne quand personne n'attend", async () => {
      const { territoireId } = await naitre();
      expect(await voyageursAuxPortes(pool, territoireId)).toEqual([]);
      expect(await nombreDeVoyageurs(pool, territoireId)).toBe(0);
    });

    it("lit ceux que le temps a fait venir, à l'heure de leur arrivée", async () => {
      const { territoireId, ne } = await naitre();
      const { arrivees: prevu } = prevues(territoireId, ne, apres(ne, 1000 * HEURE));
      await rattraper("territoire", territoireId, { pool, jusqua: new Date(prevu[1].instant) });
      expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.arriveLe.getTime())).toEqual([prevu[0].instant, prevu[1].instant]);
      expect(await nombreDeVoyageurs(pool, territoireId)).toBe(2);
    });
  });

  describe("accueillir un Voyageur (US-0334)", () => {
    /** Les Habitants du Territoire, du premier arrivé au dernier : prénom, Métier, heure d'arrivée. */
    const habitants = async (territoireId: number) =>
      (await habitantsDuTerritoire(pool, territoireId)).sort((a, b) => a.id - b.id).map((h) => [h.prenom, h.metier, h.arriveLe]);
    /** Les quantités des Stocks du Territoire. */
    const stocks = async (territoireId: number) => (await stocksDuTerritoire(pool, territoireId)).map((s) => [s.id, s.quantite]);
    /** Tout ce qu'un accueil peut changer au Territoire : ses Voyageurs, ses Habitants, ses Récits et ses Stocks. */
    const tout = async (territoireId: number) => ({
      voyageurs: await voyageursAuxPortes(pool, territoireId),
      habitants: await habitants(territoireId),
      recits: await recitsDuTerritoire(pool, territoireId),
      stocks: await stocks(territoireId),
    });

    it("fait du Voyageur un Habitant sans Métier, du même prénom, arrivé à l'heure de l'accueil, et le retire des portes", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      const joran = await presenter(territoireId, "Joran", apres(ne, 2 * HEURE));
      const avant = await habitants(territoireId);

      expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))).toBe("accueilli");
      expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).toEqual([joran]);
      expect(await habitants(territoireId)).toEqual([...avant, ["Ines", null, apres(ne, 4 * HEURE)]]);
      // US-0337 : le Voyageur reste connu, avec son sort et son heure.
      expect(await sort(ines)).toEqual(["accueilli", apres(ne, 4 * HEURE)]);
    });

    it("fait monter aussitôt le nombre d'Habitants et l'Entretien, sans rien coûter", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      const [nombre, entretien, quantites] = [await nombreDHabitants(pool, territoireId), await entretienDesHabitants(pool, territoireId), await stocks(territoireId)];

      await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE));
      expect(await nombreDHabitants(pool, territoireId)).toBe(nombre + 1);
      const { habitants: compte, parHeure } = await entretienDesHabitants(pool, territoireId);
      expect([compte, Number(parHeure)]).toEqual([nombre + 1, Number(entretien.parHeure) + ENTRETIEN_HABITANT_PAR_HEURE]);
      expect(await stocks(territoireId)).toEqual(quantites);
    });

    it("écrit un Récit court de l'arrivée du nouvel Habitant, non lu, daté de l'accueil", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE + 20 * MINUTE));
      expect((await recitsDuTerritoire(pool, territoireId)).map(({ titre, texte, survenuLe, luLe }) => ({ titre, texte, survenuLe, luLe }))).toEqual([
        {
          titre: "Ines a rejoint le Territoire",
          texte: "Ines, qui attendait aux portes depuis 3 h, vit désormais au Foyer.",
          survenuLe: apres(ne, 4 * HEURE + 20 * MINUTE),
          luLe: null,
        },
      ]);
    });

    it("ne touche jamais au Voyageur d'un autre Territoire, quel que soit l'identifiant envoyé", async () => {
      const [joueur, voisin] = [await naitre(), await naitre()];
      await presenter(joueur.territoireId, "Ines", apres(joueur.ne, HEURE));
      const brune = await presenter(voisin.territoireId, "Brune", apres(voisin.ne, HEURE));
      const [siens, autres] = [await tout(joueur.territoireId), await tout(voisin.territoireId)];

      expect(await accueillirLeVoyageur(pool, joueur.territoireId, brune, apres(joueur.ne, 4 * HEURE))).toBe("absent");
      expect(await tout(joueur.territoireId)).toEqual(siens);
      expect(await tout(voisin.territoireId)).toEqual(autres);
    });

    it("ne fait rien pour un Voyageur qui n'attend plus aux portes", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))).toBe("accueilli");
      const accueillie = await tout(territoireId);

      expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 5 * HEURE))).toBe("absent");
      expect(await tout(territoireId)).toEqual(accueillie);
    });

    it("accueilli plusieurs fois en même temps, il ne devient qu'un seul Habitant, d'un seul Récit", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      const nombre = await nombreDHabitants(pool, territoireId);

      const accueils = await Promise.all(Array.from({ length: 5 }, () => accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))));
      expect(accueils.filter((a) => a === "accueilli")).toHaveLength(1);
      expect(await nombreDHabitants(pool, territoireId)).toBe(nombre + 1);
      expect(await recitsDuTerritoire(pool, territoireId)).toHaveLength(1);
      expect(await voyageursAuxPortes(pool, territoireId)).toEqual([]);
    });

    describe("quand la place manque (US-0338)", () => {
      /** Fait venir au Territoire des Habitants, sans passer par les portes, jusqu'à en compter `nombre`. */
      const remplir = async (territoireId: number, nombre: number) =>
        pool.query(
          "insert into habitant (territoire_id, prenom) select $1, 'Arno' from generate_series(1, $2 - (select count(*)::int from habitant where territoire_id = $1))",
          [territoireId, nombre],
        );

      it("refuse l'accueil quand toute la place est prise, et le dit : rien ne change, et le Voyageur attend toujours", async () => {
        const { territoireId, ne } = await naitre();
        const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
        await remplir(territoireId, PLACES_DU_FOYER);
        const avant = await tout(territoireId);

        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))).toBe("plus-de-place");
        expect(await tout(territoireId)).toEqual(avant);
        expect(await sort(ines)).toEqual([null, null]);
        // Plus d'Habitants que de places, de même.
        await remplir(territoireId, PLACES_DU_FOYER + 1);
        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))).toBe("plus-de-place");
        expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).toEqual([ines]);
      });

      it("accueille jusqu'à la dernière place, et pas au-delà", async () => {
        const { territoireId, ne } = await naitre();
        const [ines, joran] = [await presenter(territoireId, "Ines", apres(ne, HEURE)), await presenter(territoireId, "Joran", apres(ne, HEURE))];
        await remplir(territoireId, PLACES_DU_FOYER - 1);

        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE))).toBe("accueilli");
        expect(await nombreDHabitants(pool, territoireId)).toBe(PLACES_DU_FOYER);
        expect(await accueillirLeVoyageur(pool, territoireId, joran, apres(ne, 4 * HEURE))).toBe("plus-de-place");
        expect(await nombreDHabitants(pool, territoireId)).toBe(PLACES_DU_FOYER);
        expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).toEqual([joran]);
      });

      it("l'accueille dès que de la place se libère avant la fin de son attente", async () => {
        const { territoireId, ne } = await naitre();
        const ines = await presenterQuiRepart(territoireId, "Ines", apres(ne, HEURE));
        await remplir(territoireId, PLACES_DU_FOYER);
        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 2 * HEURE))).toBe("plus-de-place");

        // Le temps passe sans qu'elle reparte, puis un Habitant laisse sa place.
        await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, 12 * HEURE) });
        await pool.query("delete from habitant where id = (select max(id) from habitant where territoire_id = $1)", [territoireId]);
        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 12 * HEURE))).toBe("accueilli");
        expect(await sort(ines)).toEqual(["accueilli", apres(ne, 12 * HEURE)]);
        expect(await nombreDHabitants(pool, territoireId)).toBe(PLACES_DU_FOYER);
      });

      it("dit d'abord qu'un Voyageur est déjà reparti, même quand la place manque", async () => {
        const { territoireId, ne } = await naitre();
        const ines = await presenterQuiRepart(territoireId, "Ines", apres(ne, HEURE));
        await remplir(territoireId, PLACES_DU_FOYER);
        await rattraper("territoire", territoireId, { pool, jusqua: apres(ne, 14 * HEURE) });
        expect(await accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 14 * HEURE))).toBe("reparti");
      });
    });
  });

  describe("refuser un Voyageur (US-0336)", () => {
    /** Tout ce qu'un refus pourrait changer au Territoire : ses Habitants, ses Récits et ses Stocks. */
    const reste = async (territoireId: number) => ({
      habitants: await habitantsDuTerritoire(pool, territoireId),
      recits: await recitsDuTerritoire(pool, territoireId),
      stocks: (await stocksDuTerritoire(pool, territoireId)).map((s) => [s.id, s.quantite]),
    });

    it("le fait repartir aussitôt : il disparaît des portes, sans devenir Habitant ni laisser de Récit", async () => {
      const { territoireId, ne } = await naitre();
      const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
      const joran = await presenter(territoireId, "Joran", apres(ne, 2 * HEURE));
      const avant = await reste(territoireId);

      expect(await refuserLeVoyageur(pool, territoireId, ines, apres(ne, 3 * HEURE))).toBe(true);
      expect((await voyageursAuxPortes(pool, territoireId)).map((v) => v.id)).toEqual([joran]);
      expect(await reste(territoireId)).toEqual(avant);
      // US-0337 : le Voyageur reste connu, avec son sort et son heure.
      expect(await sort(ines)).toEqual(["refuse", apres(ne, 3 * HEURE)]);
    });

    it("libère sa place aux portes : avec trois Voyageurs qui attendent, la prochaine arrivée en fait entrer un de nouveau", async () => {
      const { territoireId, ne } = await naitre();
      const [premiere] = prevues(territoireId, ne, apres(ne, 1000 * HEURE)).arrivees;
      // Une heure avant la première arrivée, les portes sont pleines : elle serait perdue.
      const [ines, joran, ilda] = [
        await presenter(territoireId, "Ines", new Date(premiere.instant - HEURE)),
        await presenter(territoireId, "Joran", new Date(premiere.instant - HEURE)),
        await presenter(territoireId, "Ilda", new Date(premiere.instant - HEURE)),
      ];
      expect(await nombreDeVoyageurs(pool, territoireId)).toBe(VOYAGEURS_EN_ATTENTE_MAX);

      expect(await refuserLeVoyageur(pool, territoireId, joran, new Date(premiere.instant - HEURE))).toBe(true);
      await rattraper("territoire", territoireId, { pool, jusqua: new Date(premiere.instant) });
      const venus = await voyageursAuxPortes(pool, territoireId);
      expect(venus.map((v) => v.id).slice(0, 2)).toEqual([ines, ilda]);
      expect(venus.map((v) => v.arriveLe.getTime())).toEqual([premiere.instant - HEURE, premiere.instant - HEURE, premiere.instant]);
    });

    it("ne le fait jamais revenir, même quand le temps avance et que d'autres se présentent", async () => {
      const { territoireId, ne } = await naitre();
      const [premiere, deuxieme] = prevues(territoireId, ne, apres(ne, 1000 * HEURE)).arrivees;
      const ines = await presenter(territoireId, "Ines", new Date(premiere.instant - HEURE));

      expect(await refuserLeVoyageur(pool, territoireId, ines, new Date(premiere.instant - HEURE))).toBe(true);
      await rattraper("territoire", territoireId, { pool, jusqua: new Date(deuxieme.instant) });
      const venus = await voyageursAuxPortes(pool, territoireId);
      expect(venus.map((v) => v.arriveLe.getTime())).toEqual([premiere.instant, deuxieme.instant]);
      expect(venus.map((v) => v.id)).not.toContain(ines);
      // Refusé une seconde fois, il n'y a plus personne à faire repartir.
      expect(await refuserLeVoyageur(pool, territoireId, ines, new Date(deuxieme.instant))).toBe(false);
    });

    it("ne touche jamais au Voyageur d'un autre Territoire, quel que soit l'identifiant envoyé", async () => {
      const [joueur, voisin] = [await naitre(), await naitre()];
      await presenter(joueur.territoireId, "Ines", apres(joueur.ne, HEURE));
      const brune = await presenter(voisin.territoireId, "Brune", apres(voisin.ne, HEURE));
      const [siens, autres] = [await voyageursAuxPortes(pool, joueur.territoireId), await voyageursAuxPortes(pool, voisin.territoireId)];

      expect(await refuserLeVoyageur(pool, joueur.territoireId, brune, apres(joueur.ne, 2 * HEURE))).toBe(false);
      expect(await voyageursAuxPortes(pool, joueur.territoireId)).toEqual(siens);
      expect(await voyageursAuxPortes(pool, voisin.territoireId)).toEqual(autres);
    });

    it("accueilli et refusé en même temps, un seul des deux l'emporte : jamais un Habitant en double, ni un Habitant refusé", async () => {
      const { territoireId, ne } = await naitre();
      const nombre = await nombreDHabitants(pool, territoireId);
      for (let essai = 0; essai < 4; essai++) {
        const ines = await presenter(territoireId, "Ines", apres(ne, HEURE));
        const [accueilli, refuse, accueilliAussi, refuseAussi] = await Promise.all([
          accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE)),
          refuserLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE)),
          accueillirLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE)),
          refuserLeVoyageur(pool, territoireId, ines, apres(ne, 4 * HEURE)),
        ]);
        expect([accueilli === "accueilli", refuse, accueilliAussi === "accueilli", refuseAussi].filter(Boolean), `essai ${essai}`).toHaveLength(1);
      }
      // Chaque accueil qui l'a emporté a donné un Habitant et un Récit, et rien de plus.
      const accueils = (await recitsDuTerritoire(pool, territoireId)).length;
      expect(await nombreDHabitants(pool, territoireId)).toBe(nombre + accueils);
      expect(await voyageursAuxPortes(pool, territoireId)).toEqual([]);
    });
  });
});
