import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { type BeteSauvage, betesSauvagesDesCases, betesSauvagesDUneCase } from "@/monde/betes-sauvages";
import { hacher } from "@/monde/couronne";
import { type Coordonnees, distance } from "@/monde/hex";
import { PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, poolDeTest, preparerMondeDeTest, territoireDuCompte, URL_TEST } from "@/test/base";
import { cheminDUneExpedition } from "./chemin";
import { lancerLExpedition } from "./depart";
import { rencontresDUneExpedition } from "./rencontres";

const MINUTE_MS = 60_000;
const HEURE = 60;
const JOUR = 24 * HEURE;
/** Le pas des explorateurs sans escorte, en minutes de jeu par Case (US-0909). */
const PAS = PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE;
/** L'aller vers une Case à 2 Cases du Foyer. */
const ALLER = 2 * PAS;

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai de la Rencontre (US-0932)";

describe.skipIf(!URL_TEST)("la Rencontre (US-0932, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `rencontre-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Une heure du jeu, `minutes` après `instant`. */
  const apres = (instant: Date, minutes: number) => new Date(instant.getTime() + minutes * MINUTE_MS);
  /** L'instant `instant`, à `ms` millisecondes près. */
  const decale = (instant: Date, ms: number) => new Date(instant.getTime() + ms);

  /**
   * Un chef qui vient de naître dans le Monde d'essai, avec `explorateurs` explorateurs : son Territoire, l'instant de sa
   * naissance, d'où part son temps, et la place de son Foyer.
   */
  const naitre = async (explorateurs = 1) => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    const nom = `Renc${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[n % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom, Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query(`insert into habitant (territoire_id, prenom, metier) select $1, 'Essai', 'explorateur' from generate_series(1, $2)`, [territoireId, explorateurs]);
    const { rows } = await pool.query<{ foyer: Coordonnees }>(
      "select json_build_object('q', f.q, 'r', f.r) as foyer from territoire t join case_du_monde f on f.id = t.foyer_case_id where t.id = $1",
      [territoireId],
    );
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId), foyer: rows[0].foyer };
  };
  /** La `rang`-ième Case libre du Monde du Territoire à `ecart` Cases de son Foyer : sa place et son identifiant. */
  const aLEcart = async (territoireId: number, ecart: number, rang = 0) => {
    const { rows } = await pool.query<Coordonnees & { id: number }>(
      `select c.id, c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
       order by c.q, c.r limit 1 offset $3`,
      [territoireId, ecart, rang],
    );
    return { place: { q: rows[0].q, r: rows[0].r }, caseId: rows[0].id };
  };
  /** Le départ d'un explorateur vers `destination`, à `instant`, pour `sejourMinutes` de séjour ; rend l'Expédition. */
  const partir = async (territoireId: number, destination: Coordonnees, instant: Date, sejourMinutes: number) => {
    const depart = await lancerLExpedition(pool, territoireId, { destination, explorateurs: 1, escorte: new Map(), sejourMinutes }, instant);
    if (!("expeditionId" in depart)) throw new Error(depart.refus);
    return depart.expeditionId;
  };
  /**
   * Une Expédition du Territoire vers la Case `caseId`, telle qu'un départ la poserait en base, avec les horaires donnés,
   * sans souci de la portée ni des explorateurs : pour mettre sur une même Case des Expéditions de Territoires éloignés.
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
  /** Les Rencontres retenues de l'Expédition, sans leur identifiant (toEqual ne compte pas une propriété indéfinie). */
  const rencontres = async (expeditionId: number) => (await rencontresDUneExpedition(pool, expeditionId)).map((r) => ({ ...r, id: undefined }));
  /** Ce que retient la Rencontre de la Bête sauvage `b` de la Case `caseId`, vue à `vueLe`. */
  const vue = (b: BeteSauvage, caseId: number, vueLe: Date) => ({
    vueLe,
    caseId,
    apparueLe: b.arrivee,
    especeId: b.especeId,
    rareteId: b.rareteId,
    numero: b.numero,
    beteDeNaissanceId: null,
  });
  /** Toutes les Rencontres que le Territoire a retenues sur la Case `caseId`, quelle que soit l'Expédition. */
  const retenuesSur = async (territoireId: number, caseId: number) =>
    (await pool.query("select r.* from rencontre r join expedition x on x.id = r.expedition_id where x.territoire_id = $1 and x.case_id = $2", [territoireId, caseId]))
      .rows;

  /**
   * Une Bête sauvage seule sur une Case libre à `ecart` Cases du Foyer du Territoire, apparue au moins 18 heures après
   * `apresLe` : aucune autre n'est sur sa Case de 12 heures avant son apparition à 12 heures après. Sa Case et la Bête.
   */
  const uneBeteSeule = async (territoireId: number, ecart: number, apresLe: Date) => {
    const fin = apres(apresLe, 30 * JOUR);
    for (let rang = 0; rang < 40; rang++) {
      const { place, caseId } = await aLEcart(territoireId, ecart, rang);
      const betes = await betesSauvagesDUneCase(pool, caseId, apresLe, fin);
      const bete = betes.find(
        (b, i) =>
          b.arrivee >= apres(apresLe, 18 * HEURE) &&
          b.arrivee <= apres(fin, -12 * HEURE) &&
          (i === 0 || betes[i - 1].arrivee <= apres(b.arrivee, -18 * HEURE)) &&
          (i === betes.length - 1 || betes[i + 1].arrivee >= apres(b.arrivee, 12 * HEURE)),
      );
      if (bete) return { place, caseId, bete };
    }
    throw new Error("Aucune Bête seule à cet écart.");
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

  it("quand une Bête apparaît sur la Case où une Expédition séjourne, c'est une Rencontre, à l'heure de l'apparition", async () => {
    const { territoireId, ne } = await naitre();
    const { place, caseId, bete } = await uneBeteSeule(territoireId, 2, apres(ne, 3 * JOUR));
    // Elle arrive une heure avant la Bête, et reste quatre heures.
    const depart = apres(bete.arrivee, -ALLER - HEURE);
    const id = await partir(territoireId, place, depart, 4 * HEURE);

    await rattraperA(territoireId, bete.arrivee);
    expect(await rencontres(id)).toEqual([]);
    await rattraperA(territoireId, decale(bete.arrivee, 1));
    expect(await rencontres(id)).toEqual([vue(bete, caseId, bete.arrivee)]);
    // Jusqu'à son retour, et bien après : une seule Rencontre, toujours à l'heure de l'apparition.
    await rattraperA(territoireId, apres(depart, 2 * ALLER + 4 * HEURE + JOUR));
    expect(await rencontres(id)).toEqual([vue(bete, caseId, bete.arrivee)]);
  });

  it("une Expédition qui arrive sur une Case où une Bête est encore présente la rencontre dès son arrivée ; partie, elle ne la voit plus", async () => {
    const { territoireId, ne } = await naitre(3);
    const { place, caseId, bete } = await uneBeteSeule(territoireId, 2, apres(ne, 3 * JOUR));
    // Elle arrive deux heures après la Bête ; une autre arrive à l'instant où la Bête s'en va ; une dernière repart à l'instant où elle apparaît.
    const pendant = await partir(territoireId, place, apres(bete.arrivee, 2 * HEURE - ALLER), HEURE);
    const tropTard = await partir(territoireId, place, apres(bete.depart, -ALLER), HEURE);
    const tropTot = await partir(territoireId, place, apres(bete.arrivee, -ALLER - HEURE), HEURE);

    await rattraperA(territoireId, apres(bete.depart, JOUR));
    expect(await rencontres(pendant)).toEqual([vue(bete, caseId, apres(bete.arrivee, 2 * HEURE))]);
    expect(await rencontres(tropTard)).toEqual([]);
    expect(await rencontres(tropTot)).toEqual([]);
  });

  it("une Expédition qui ne fait que traverser une Case pendant son trajet ne voit pas ses Bêtes ; celle qui y séjourne les voit", async () => {
    const { territoireId, ne, foyer } = await naitre(2);
    const ECART = 6;
    const debut = apres(ne, 3 * JOUR);
    // Une destination sans aucune Bête de l'aller au retour, et une Case de son chemin où une Bête se trouve au passage.
    const traversee = async () => {
      for (let rang = 0; rang < 20; rang++) {
        const { place: destination, caseId } = await aLEcart(territoireId, ECART, rang);
        // Les Cases libres du chemin, sans la destination, avec leur rang : la k-ième est passée entre la (k − 1)-ième et la k-ième Case de l'aller.
        const chemin = cheminDUneExpedition(foyer, destination).slice(0, -1);
        const { rows: etapes } = await pool.query<Coordonnees & { id: number; rang: string }>(
          `select c.id, c.q, c.r, e.rang from unnest($2::int[], $3::int[]) with ordinality as e(q, r, rang)
           join case_du_monde c on c.monde_id = $1 and c.q = e.q and c.r = e.r and c.chef_id is null`,
          [mondeId, chemin.map((c) => c.q), chemin.map((c) => c.r)],
        );
        const betes = await betesSauvagesDesCases(pool, [caseId, ...etapes.map((e) => e.id)], debut, apres(debut, 20 * JOUR));
        for (let depart = debut; depart < apres(debut, 19 * JOUR); depart = apres(depart, HEURE)) {
          const retour = apres(depart, 2 * ECART * PAS + HEURE);
          if (betes.get(caseId)!.some((b) => b.arrivee < retour && b.depart > depart)) continue;
          for (const { id, q, r, rang: k } of etapes) {
            const [entree, sortie] = [apres(depart, (Number(k) - 1) * PAS), apres(depart, Number(k) * PAS)];
            const bete = betes.get(id)!.find((b) => b.arrivee < sortie && b.depart > entree);
            if (bete) return { destination, depart, etape: { place: { q, r }, entree }, bete };
          }
        }
      }
      throw new Error("Aucun chemin où une Bête se trouve au passage.");
    };
    const { destination, depart, etape, bete } = await traversee();
    const passe = await partir(territoireId, destination, depart, HEURE);
    // L'autre part vers la Case du chemin pour y arriver quand la première y entre, et y reste quatre heures.
    const reste = await partir(territoireId, etape.place, apres(etape.entree, -distance(foyer, etape.place) * PAS), 4 * HEURE);

    await rattraperA(territoireId, apres(depart, 2 * ECART * PAS + HEURE + JOUR));
    expect(await rencontres(passe)).toEqual([]);
    expect((await rencontres(reste)).map((r) => [r.numero, r.apparueLe])).toContainEqual([bete.numero, bete.arrivee]);
  });

  it("un joueur sans Expédition sur la Case n'apprend rien de la Bête, même venu juste avant son apparition ou à l'instant de son départ", async () => {
    const [joueur, voisin, tiers] = [await naitre(), await naitre(), await naitre()];
    const { place, caseId, bete } = await uneBeteSeule(joueur.territoireId, 2, apres(joueur.ne, 3 * JOUR));
    const sienne = await partir(joueur.territoireId, place, apres(bete.arrivee, -ALLER - HEURE), 4 * HEURE);
    // Le voisin y séjourne jusqu'à l'instant où la Bête apparaît, puis y revient à l'instant où elle s'en va.
    await poser(voisin.territoireId, caseId, apres(bete.arrivee, -2 * HEURE), 30, 90);
    await poser(voisin.territoireId, caseId, apres(bete.depart, -30), 30, HEURE);

    for (const { territoireId } of [joueur, voisin, tiers]) await rattraperA(territoireId, apres(bete.depart, JOUR));
    expect(await rencontres(sienne)).toEqual([vue(bete, caseId, bete.arrivee)]);
    expect(await retenuesSur(voisin.territoireId, caseId)).toEqual([]);
    expect(await retenuesSur(tiers.territoireId, caseId)).toEqual([]);
  });

  it("voit aussi les Bêtes de naissance de son Territoire, et jamais celles d'un autre, qui voit pourtant les mêmes Bêtes sauvages", async () => {
    const [joueur, voisin] = [await naitre(), await naitre()];
    const { rows } = await pool.query<Coordonnees & { id: number; caseId: number; especeId: string; arrivee: Date }>(
      `select b.id, b.case_id as "caseId", c.q, c.r, b.espece_id as "especeId", b.arrivee
       from bete_de_naissance b join case_du_monde c on c.id = b.case_id
       where b.territoire_id = $1 and c.chef_id is null order by b.id limit 1`,
      [joueur.territoireId],
    );
    const bn = rows[0];
    // Une heure après la naissance, une Expédition part vers la Case de sa première Bête de naissance ; une du voisin y séjourne aux mêmes heures.
    const sienne = await partir(joueur.territoireId, { q: bn.q, r: bn.r }, apres(joueur.ne, HEURE), HEURE);
    const { rows: horaires } = await pool.query<{ partLe: Date; trajet: number }>("select part_le as \"partLe\", trajet_minutes as trajet from expedition where id = $1", [
      sienne,
    ]);
    const { partLe, trajet } = horaires[0];
    const chezLeVoisin = await poser(voisin.territoireId, bn.caseId, partLe, trajet, HEURE);
    const arrivee = apres(partLe, trajet);

    for (const { territoireId } of [joueur, voisin]) await rattraperA(territoireId, apres(arrivee, JOUR));
    const siennes = await rencontres(sienne);
    expect(siennes.filter((r) => r.beteDeNaissanceId !== null)).toEqual([
      { vueLe: arrivee, caseId: bn.caseId, apparueLe: bn.arrivee, especeId: bn.especeId, rareteId: "commune", numero: null, beteDeNaissanceId: bn.id },
    ]);
    expect(await rencontres(chezLeVoisin)).toEqual(siennes.filter((r) => r.beteDeNaissanceId === null));
  });

  it("retient les mêmes Rencontres, aux mêmes instants, en direct, par morceaux, d'un bloc au rattrapage, ou par la tâche planifiée", async () => {
    const territoires = [await naitre(), await naitre(), await naitre(), await naitre()];
    // Une Case où deux Bêtes au moins se montrent à moins de dix heures d'écart : la période commence une heure avant la première.
    const uneCaseAnimee = async () => {
      for (let rang = 0; rang < 40; rang++) {
        const { caseId } = await aLEcart(territoires[0].territoireId, 2, rang);
        const betes = await betesSauvagesDUneCase(pool, caseId, apres(territoires[0].ne, 3 * JOUR), apres(territoires[0].ne, 30 * JOUR));
        const i = betes.findIndex((b, j) => j + 1 < betes.length && betes[j + 1].arrivee < apres(b.arrivee, 10 * HEURE));
        if (i >= 0) return { caseId, debut: apres(betes[i].arrivee, -HEURE) };
      }
      throw new Error("Aucune Case animée.");
    };
    const { caseId, debut } = await uneCaseAnimee();
    // Pour chaque Territoire, les mêmes Expéditions sur la Case : une qui y séjourne douze heures, d'autres qui se suivent et se chevauchent.
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

    // En direct, page ouverte, toutes les cinq minutes.
    for (let instant = debut; instant < fin; instant = apres(instant, 5)) await rattraperA(enDirect, instant);
    await rattraperA(enDirect, fin);
    // Par morceaux coupés au hasard.
    const coupures = Array.from({ length: 30 }, (_, i) => debut.getTime() + Math.floor(hacher(i, 932) * (fin.getTime() - debut.getTime()))).sort((x, y) => x - y);
    for (const t of [...coupures, fin.getTime()]) await rattraperA(parMorceaux, new Date(t));
    // D'un bloc, au retour du joueur, ou par la tâche planifiée pendant son absence.
    await rattraperA(dUnBloc, fin);
    await rattraperLesAbsents({ pool, maintenant: fin, parmi: { territoire: [planifiee] } });

    const vues = await Promise.all(expeditions.map((ids) => Promise.all(ids.map(rencontres))));
    for (const autres of vues.slice(1)) expect(autres).toEqual(vues[0]);
    // Celle qui séjourne douze heures voit chaque Bête présente pendant son séjour : dès son arrivée si elle était déjà là, à son apparition sinon.
    const [arrivee, depart] = [apres(debut, 40), apres(debut, 40 + 12 * HEURE)];
    const attendues = (await betesSauvagesDUneCase(pool, caseId, arrivee, depart)).map((b) => vue(b, caseId, b.arrivee < arrivee ? arrivee : b.arrivee));
    expect(attendues.length).toBeGreaterThanOrEqual(2);
    expect(vues[0][0]).toEqual(attendues);
  });
});
