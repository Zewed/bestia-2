import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { lancerLExpedition } from "@/expeditions/depart";
import { rencontresDUneExpedition, retenirLesRencontres } from "@/expeditions/rencontres";
import { type BeteSauvage, betesSauvagesDUneCase, emmenerUneBete } from "@/monde/betes-sauvages";
import { hacher } from "@/monde/couronne";
import type { Coordonnees } from "@/monde/hex";
import { PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE, PRESENCE_D_UNE_BETE_HEURES } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, poolDeTest, preparerMondeDeTest, territoireDuCompte, URL_TEST } from "@/test/base";
import { bestiaireDuTerritoire, inscrireAuBestiaire } from "./bestiaire";

const MINUTE_MS = 60_000;
const HEURE = 60;
const JOUR = 24 * HEURE;
/** L'aller vers une Case à 2 Cases du Foyer, au pas des explorateurs sans escorte (US-0909). */
const ALLER = 2 * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE;
/** Le temps, en minutes, où aucune autre Bête n'apparaît avant ou après celle d'un essai : sa présence et 6 heures de marge. */
const CALME = PRESENCE_D_UNE_BETE_HEURES * HEURE + 6 * HEURE;

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai du Bestiaire (US-0933)";

describe.skipIf(!URL_TEST)("l'Espèce croisée entre au Bestiaire (US-0933, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `bestiaire-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Une heure du jeu, `minutes` après `instant`. */
  const apres = (instant: Date, minutes: number) => new Date(instant.getTime() + minutes * MINUTE_MS);

  /** Un chef qui vient de naître dans le Monde d'essai, avec un explorateur : son Territoire et l'instant de sa naissance. */
  const naitre = async () => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    const nom = `Best${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[n % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom, Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query("insert into habitant (territoire_id, prenom, metier) values ($1, 'Essai', 'explorateur')", [territoireId]);
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };
  /** La `rang`-ième Case libre du Monde du Territoire à `ecart` Cases de son Foyer : sa place et son identifiant ; null au-delà de la dernière. */
  const aLEcart = async (territoireId: number, ecart: number, rang = 0) => {
    const { rows } = await pool.query<Coordonnees & { id: number }>(
      `select c.id, c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
       order by c.q, c.r limit 1 offset $3`,
      [territoireId, ecart, rang],
    );
    return rows[0] ? { place: { q: rows[0].q, r: rows[0].r }, caseId: rows[0].id } : null;
  };
  /**
   * Une Expédition du Territoire vers la Case `caseId`, telle qu'un départ la poserait en base, avec les horaires donnés,
   * sans souci de la portée ni des explorateurs.
   */
  const poser = async (territoireId: number, caseId: number, partLe: Date, trajetMinutes: number, sejourMinutes: number) => {
    const { rows } = await pool.query<{ id: number }>(
      "insert into expedition (territoire_id, case_id, part_le, trajet_minutes, sejour_minutes) values ($1, $2, $3, $4, $5) returning id",
      [territoireId, caseId, partLe, trajetMinutes, sejourMinutes],
    );
    return rows[0].id;
  };
  /** Le Territoire mis à l'heure du jeu `instant`, comme à l'ouverture d'une page : le mécanisme unique du temps. */
  const rattraperA = (territoireId: number, instant: Date) => rattraper("territoire", territoireId, { pool, jusqua: instant });
  /** Le Bestiaire du Territoire. */
  const bestiaire = (territoireId: number) => bestiaireDuTerritoire(pool, territoireId);
  /** Les Rencontres de l'Expédition, réduites à leur instant, leur Espèce et ce que le Bestiaire en dit. */
  const vues = async (expeditionId: number) =>
    (await rencontresDUneExpedition(pool, expeditionId)).map(({ vueLe, especeId, nouvelleEspece }) => ({ vueLe, especeId, nouvelleEspece }));

  /**
   * Une Bête sauvage seule, qui convient à `voulue`, sur une Case libre à 2 Cases du Foyer du Territoire, apparue après
   * `apresLe` : aucune autre n'apparaît sur sa Case de CALME heures avant elle à CALME heures après. Sa Case et la Bête.
   */
  const uneBeteSeule = async (territoireId: number, apresLe: Date, voulue: (b: BeteSauvage) => boolean = () => true) => {
    const fin = apres(apresLe, 30 * JOUR);
    for (let rang = 0, ici = await aLEcart(territoireId, 2); ici; ici = await aLEcart(territoireId, 2, ++rang)) {
      const betes = await betesSauvagesDUneCase(pool, ici.caseId, apresLe, fin);
      const bete = betes.find(
        (b, i) =>
          voulue(b) &&
          b.arrivee >= apres(apresLe, CALME) &&
          b.arrivee <= apres(fin, -CALME) &&
          (i === 0 || betes[i - 1].arrivee <= apres(b.arrivee, -CALME)) &&
          (i === betes.length - 1 || betes[i + 1].arrivee >= apres(b.arrivee, CALME)),
      );
      if (bete) return { ...ici, bete };
    }
    throw new Error("Aucune Bête seule qui convienne.");
  };

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    mondeId = await mondeDEssai(pool, MONDE_D_ESSAI);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("une Espèce vue lors d'une Rencontre s'inscrit au Bestiaire « croisée », à l'heure de la Rencontre, qui la signale nouvelle", async () => {
    const { territoireId, ne } = await naitre();
    const { place, bete } = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR));
    // Un explorateur part pour arriver une heure avant la Bête, et reste quatre heures.
    const choix = { destination: place, explorateurs: 1, escorte: new Map(), sejourMinutes: 4 * HEURE };
    const depart = await lancerLExpedition(pool, territoireId, choix, apres(bete.arrivee, -ALLER - HEURE));
    if (!("expeditionId" in depart)) throw new Error(depart.refus);

    await rattraperA(territoireId, bete.arrivee);
    expect(await bestiaire(territoireId)).toEqual([]);
    await rattraperA(territoireId, new Date(bete.arrivee.getTime() + 1));
    expect(await bestiaire(territoireId)).toEqual([{ especeId: bete.especeId, etat: "croisee", croiseeLe: bete.arrivee }]);
    expect(await vues(depart.expeditionId)).toEqual([{ vueLe: bete.arrivee, especeId: bete.especeId, nouvelleEspece: true }]);
  });

  it("qu'elle suive l'Expédition ou non : une Bête commune qui la suit, une plus rare qui reste sur sa Case", async () => {
    const { territoireId, ne } = await naitre();
    const suit = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR), (b) => b.rareteId === "commune");
    const reste = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR), (b) => b.rareteId !== "commune");
    // Chacune vue à son apparition par une Expédition arrivée une heure avant elle.
    await poser(territoireId, suit.caseId, apres(suit.bete.arrivee, -90), 30, 4 * HEURE);
    await poser(territoireId, reste.caseId, apres(reste.bete.arrivee, -90), 30, 4 * HEURE);

    await rattraperA(territoireId, new Date(suit.bete.arrivee.getTime() + 1));
    // La commune suit l'Expédition dès la Rencontre (US-0934, US-0935) : elle quitte sa Case.
    expect(await emmenerUneBete(pool, suit.caseId, suit.bete.numero, suit.bete.arrivee)).toBe(true);
    await rattraperA(territoireId, apres(suit.bete.depart > reste.bete.depart ? suit.bete.depart : reste.bete.depart, JOUR));
    const croisees = [suit.bete, reste.bete].sort((x, y) => x.arrivee.getTime() - y.arrivee.getTime());
    expect(await bestiaire(territoireId)).toEqual(croisees.map((b) => ({ especeId: b.especeId, etat: "croisee", croiseeLe: b.arrivee })));
  });

  it("l'inscription se fait une seule fois par Espèce : la revoir, par une autre Expédition ou au rattrapage rejoué, ne change rien", async () => {
    const { territoireId, ne } = await naitre();
    const { caseId, bete } = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR));
    // Une Expédition arrive une heure après la Bête, une autre deux heures après : toutes deux la voient.
    const premiere = await poser(territoireId, caseId, apres(bete.arrivee, 30), 30, HEURE);
    const seconde = await poser(territoireId, caseId, apres(bete.arrivee, 90), 30, HEURE);
    const inscrite = [{ especeId: bete.especeId, etat: "croisee", croiseeLe: apres(bete.arrivee, HEURE) }];

    await rattraperA(territoireId, apres(bete.arrivee, HEURE + 1));
    expect(await bestiaire(territoireId)).toEqual(inscrite);
    await rattraperA(territoireId, apres(bete.depart, JOUR));
    expect(await bestiaire(territoireId)).toEqual(inscrite);
    // Les mêmes Rencontres retenues de nouveau ne s'écrivent pas deux fois, et n'inscrivent rien de plus.
    await retenirLesRencontres(pool, territoireId, apres(bete.arrivee, -HEURE), apres(bete.depart, HEURE));
    expect(await bestiaire(territoireId)).toEqual(inscrite);
    // Seule la première Rencontre de l'Espèce la signale nouvelle au Bestiaire.
    expect(await vues(premiere)).toEqual([{ vueLe: apres(bete.arrivee, HEURE), especeId: bete.especeId, nouvelleEspece: true }]);
    expect(await vues(seconde)).toEqual([{ vueLe: apres(bete.arrivee, 2 * HEURE), especeId: bete.especeId, nouvelleEspece: false }]);
  });

  it("l'état d'une Espèce au Bestiaire ne recule jamais, même quand toutes ses Bêtes meurent", async () => {
    const { territoireId, ne } = await naitre();
    const { caseId, bete } = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR));
    const especeId = bete.especeId;
    // Vue à son apparition, puis revue deux heures et demie après par une autre Expédition.
    await poser(territoireId, caseId, apres(bete.arrivee, -90), 30, 2 * HEURE);
    const revue = await poser(territoireId, caseId, apres(bete.arrivee, 2 * HEURE), 30, HEURE);
    await rattraperA(territoireId, apres(bete.arrivee, 1));

    // Entre-temps, l'Espèce est apprivoisée (US-0938) : deux de ses Bêtes entrent dans l'effectif, puis meurent toutes.
    await inscrireAuBestiaire(pool, territoireId, especeId, "apprivoisee", apres(bete.arrivee, HEURE));
    await pool.query("insert into effectif (territoire_id, espece_id, sexe, nombre) values ($1, $2, 'male', 1), ($1, $2, 'femelle', 1)", [territoireId, especeId]);
    await pool.query("update effectif set nombre = 0 where territoire_id = $1 and espece_id = $2", [territoireId, especeId]);
    const apprivoisee = [{ especeId, etat: "apprivoisee", croiseeLe: bete.arrivee }];
    expect(await bestiaire(territoireId)).toEqual(apprivoisee);

    // Revue lors d'une Rencontre, ou inscrite de nouveau « croisée », elle reste apprivoisée, croisée à sa première Rencontre.
    await rattraperA(territoireId, apres(bete.depart, JOUR));
    expect(await vues(revue)).toEqual([{ vueLe: apres(bete.arrivee, 150), especeId, nouvelleEspece: false }]);
    await inscrireAuBestiaire(pool, territoireId, especeId, "croisee", apres(bete.depart, JOUR));
    expect(await bestiaire(territoireId)).toEqual(apprivoisee);

    // Son Couple réuni (US-0956), elle n'en redescend pas davantage.
    await inscrireAuBestiaire(pool, territoireId, especeId, "couple_reuni", apres(bete.depart, 2 * JOUR));
    await inscrireAuBestiaire(pool, territoireId, especeId, "apprivoisee", apres(bete.depart, 3 * JOUR));
    expect(await bestiaire(territoireId)).toEqual([{ especeId, etat: "couple_reuni", croiseeLe: bete.arrivee }]);
  });

  it("inscrit les mêmes Espèces, signalées nouvelles aux mêmes Rencontres, en direct, par morceaux, d'un bloc ou par la tâche planifiée", async () => {
    const territoires = [await naitre(), await naitre(), await naitre(), await naitre()];
    // Une Case où deux Bêtes au moins se montrent à moins de dix heures d'écart : la période commence une heure avant la première.
    const uneCaseAnimee = async () => {
      const { territoireId, ne } = territoires[0];
      for (let rang = 0, ici = await aLEcart(territoireId, 2); ici; ici = await aLEcart(territoireId, 2, ++rang)) {
        const betes = await betesSauvagesDUneCase(pool, ici.caseId, apres(ne, 3 * JOUR), apres(ne, 30 * JOUR));
        const i = betes.findIndex((b, j) => j + 1 < betes.length && betes[j + 1].arrivee < apres(b.arrivee, 10 * HEURE));
        if (i >= 0) return { caseId: ici.caseId, debut: apres(betes[i].arrivee, -HEURE) };
      }
      throw new Error("Aucune Case animée.");
    };
    const { caseId, debut } = await uneCaseAnimee();
    // Pour chaque Territoire, les mêmes Expéditions sur la Case, qui se suivent et se chevauchent : chaque Bête y est vue
    // plusieurs fois.
    const HORAIRES: [number, number, number][] = [
      [0, 40, 12 * HEURE],
      [100, 13, 30],
      [300, 25, 4 * HEURE],
      [500, 60, 90],
    ];
    const expeditions: number[][] = [];
    for (const { territoireId } of territoires) {
      const ids: number[] = [];
      for (const [partie, trajet, sejour] of HORAIRES) ids.push(await poser(territoireId, caseId, apres(debut, partie), trajet, sejour));
      expeditions.push(ids);
    }
    const fin = apres(debut, 16 * HEURE);
    const [enDirect, parMorceaux, dUnBloc, planifiee] = territoires.map((t) => t.territoireId);

    for (let instant = debut; instant < fin; instant = apres(instant, 5)) await rattraperA(enDirect, instant);
    await rattraperA(enDirect, fin);
    const coupures = Array.from({ length: 30 }, (_, i) => debut.getTime() + Math.floor(hacher(i, 933) * (fin.getTime() - debut.getTime()))).sort((x, y) => x - y);
    for (const t of [...coupures, fin.getTime()]) await rattraperA(parMorceaux, new Date(t));
    await rattraperA(dUnBloc, fin);
    await rattraperLesAbsents({ pool, maintenant: fin, parmi: { territoire: [planifiee] } });

    const bestiaires = await Promise.all(territoires.map((t) => bestiaire(t.territoireId)));
    const rencontres = await Promise.all(expeditions.map((ids) => Promise.all(ids.map(vues))));
    for (const autre of bestiaires.slice(1)) expect(autre).toEqual(bestiaires[0]);
    for (const autres of rencontres.slice(1)) expect(autres).toEqual(rencontres[0]);
    // Chaque Espèce vue est inscrite une fois, croisée à sa première Rencontre, la seule qui la signale nouvelle.
    const toutes = rencontres[0].flat();
    expect(toutes.length).toBeGreaterThan(bestiaires[0].length);
    const parEspece = <T extends { especeId: string }>(lignes: T[]) => [...lignes].sort((x, y) => (x.especeId < y.especeId ? -1 : x.especeId > y.especeId ? 1 : 0));
    const premieres = [...new Set(toutes.map((r) => r.especeId))].map((especeId) => ({
      especeId,
      croiseeLe: new Date(Math.min(...toutes.filter((r) => r.especeId === especeId).map((r) => r.vueLe.getTime()))),
    }));
    expect(parEspece(bestiaires[0])).toEqual(parEspece(premieres.map((p) => ({ ...p, etat: "croisee" }))));
    expect(parEspece(toutes.filter((r) => r.nouvelleEspece).map(({ especeId, vueLe }) => ({ especeId, croiseeLe: vueLe })))).toEqual(parEspece(premieres));
    // Près de 200 rattrapages à la suite : sous la charge de la suite complète, plus que les 20 s par défaut.
  }, 60_000);

  it("une Rencontre retenue sans inscription, pendant une mise en ligne, inscrit son Espèce à la Rencontre suivante, à sa vraie date", async () => {
    const { territoireId, ne } = await naitre();
    const { caseId, bete } = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR));
    const premiere = await poser(territoireId, caseId, apres(bete.arrivee, 30), 30, HEURE);
    const seconde = await poser(territoireId, caseId, apres(bete.arrivee, 90), 30, HEURE);
    await rattraperA(territoireId, apres(bete.arrivee, HEURE + 1));
    // La version d'avant, encore en ligne après la migration, a retenu la première Rencontre sans rien inscrire.
    await pool.query("delete from bestiaire where territoire_id = $1", [territoireId]);

    await rattraperA(territoireId, apres(bete.depart, JOUR));
    expect(await bestiaire(territoireId)).toEqual([{ especeId: bete.especeId, etat: "croisee", croiseeLe: apres(bete.arrivee, HEURE) }]);
    expect([...(await vues(premiere)), ...(await vues(seconde))].map((r) => r.nouvelleEspece)).toEqual([true, false]);
  });

  it("inscrit les Espèces des Rencontres retenues avant lui (migration 0055), à leur première Rencontre, une seule fois", async () => {
    const { territoireId, ne } = await naitre();
    const { caseId, bete } = await uneBeteSeule(territoireId, apres(ne, 3 * JOUR));
    const premiere = await poser(territoireId, caseId, apres(bete.arrivee, 30), 30, HEURE);
    const seconde = await poser(territoireId, caseId, apres(bete.arrivee, 90), 30, HEURE);
    await rattraperA(territoireId, apres(bete.depart, JOUR));
    // Son inscription seulement : la table est déjà là (src/test/preparer-base.ts).
    const migration = readFileSync(join(process.cwd(), "drizzle/0055_bestiaire.sql"), "utf8")
      .split("--> statement-breakpoint")
      .filter((instruction) => instruction.includes("INSERT INTO"))
      .join("\n");
    expect(migration).toContain("INSERT INTO");

    const client = await pool.connect();
    let inscrites: { especeId: string; etat: string; croiseeLe: Date }[];
    let nouvelles: boolean[];
    try {
      await client.query("begin");
      // Retenues avant le Bestiaire : rien ne les inscrivait.
      await client.query("delete from bestiaire where territoire_id = $1", [territoireId]);
      expect(await bestiaireDuTerritoire(client, territoireId)).toEqual([]);
      await client.query(migration);
      // Rejouée, elle ne change rien.
      await client.query(migration);
      inscrites = await bestiaireDuTerritoire(client, territoireId);
      nouvelles = [...(await rencontresDUneExpedition(client, premiere)), ...(await rencontresDUneExpedition(client, seconde))].map((r) => r.nouvelleEspece);
    } finally {
      await client.query("rollback");
      client.release();
    }
    expect(inscrites).toEqual([{ especeId: bete.especeId, etat: "croisee", croiseeLe: apres(bete.arrivee, HEURE) }]);
    expect(nouvelles).toEqual([true, false]);
  });
});
