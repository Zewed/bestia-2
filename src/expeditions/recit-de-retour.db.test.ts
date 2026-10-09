import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { betesSauvagesDUneCase } from "@/monde/betes-sauvages";
import { ficheDUneCase } from "@/monde/fiche";
import type { Coordonnees } from "@/monde/hex";
import { nombreDeRecitsNonLus, recitsDuTerritoire } from "@/monde/recits";
import { ABORDS_DU_FOYER_CASES, PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { formaterMinutes } from "@/temps/affichage";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, poolDeTest, preparerMondeDeTest, territoireDuCompte, URL_TEST } from "@/test/base";
import { lancerLExpedition } from "./depart";
import { retourDUneExpedition, sejourDUneExpedition } from "./phase";
import { rencontresDUneExpedition } from "./rencontres";

const MINUTE = 60_000;
/**
 * L'écart au Foyer des destinations des essais, en Cases : au-delà des abords du Foyer, découverts à sa naissance
 * (US-0436), pour que leur Biome ne se connaisse qu'au retour.
 */
const ECART = ABORDS_DU_FOYER_CASES + 2;
/** L'aller vers ces destinations, au pas des explorateurs sans escorte (US-0909), en minutes de jeu ; le retour dure autant. */
const ALLER = ECART * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE;
/** Les durées que dit le récit d'une Expédition d'une heure de séjour : « Aller 2 h, séjour 1 h, retour 2 h. ». */
const DUREES = `Aller ${formaterMinutes(ALLER)}, séjour 1 h, retour ${formaterMinutes(ALLER)}.`;
/** Le titre des Récits de retour, pour les trier parmi ceux du Territoire (un Voyageur reparti en écrit aussi). */
const RETOUR = "Retour d'Expédition";

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai du récit de retour (US-0917)";

describe.skipIf(!URL_TEST)("le récit de retour d'une Expédition (US-0917, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `recit-retour-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** Les comptes des Territoires nés pendant l'essai en cours. */
  const nes: string[] = [];
  const apres = (instant: Date, ms: number) => new Date(instant.getTime() + ms);

  /** Un chef qui vient de naître dans le Monde d'essai, avec deux explorateurs : son Territoire et l'instant de sa naissance. */
  const naitre = async () => {
    const n = ++numero;
    nes.push(`${lancement}-${n}@essai.test`);
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    const nom = `Rec${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[n % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom, Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query("insert into habitant (territoire_id, prenom, metier) values ($1, 'Joran', 'explorateur'), ($1, 'Ilda', 'explorateur')", [territoireId]);
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };
  /** Les Cases libres du Monde du Territoire à ECART Cases de son Foyer, hors de celles de ses Bêtes de naissance (US-0975). */
  const casesAPortee = async (territoireId: number) =>
    (
      await pool.query<Coordonnees & { id: number }>(
        `select c.id, c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
           join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
         where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
           and not exists (select 1 from bete_de_naissance n where n.territoire_id = t.id and n.case_id = c.id)
         order by c.q, c.r`,
        [territoireId, ECART],
      )
    ).rows;
  /**
   * La première Case à ECART Cases du Foyer où se montrent `betes` Bêtes sauvages pendant le séjour de `sejour` minutes d'une
   * Expédition partie à `depart` : aucune pour une Case calme.
   */
  const uneCaseOu = async (territoireId: number, depart: Date, sejour: number, betes: number): Promise<Coordonnees> => {
    const arrivee = apres(depart, ALLER * MINUTE);
    for (const c of await casesAPortee(territoireId)) {
      if ((await betesSauvagesDUneCase(pool, c.id, arrivee, apres(arrivee, sejour * MINUTE))).length === betes) return { q: c.q, r: c.r };
    }
    throw new Error(`Aucune Case à ${ECART} Cases où se montrent ${betes} Bêtes.`);
  };
  /** Un explorateur, sans escorte, part à `depart` vers `destination` pour `sejour` minutes : l'Expédition et l'instant de son retour. */
  const partir = async (territoireId: number, destination: Coordonnees, depart: Date, sejour = 60) => {
    const resultat = await lancerLExpedition(pool, territoireId, { destination, explorateurs: 1, escorte: new Map(), sejourMinutes: sejour }, depart);
    if (!("expeditionId" in resultat)) throw new Error(resultat.refus);
    const horaires = { partLe: depart, trajetMinutes: ALLER, sejourMinutes: sejour };
    return { expeditionId: resultat.expeditionId, retour: retourDUneExpedition(horaires)!, arrivee: sejourDUneExpedition(horaires)!.debut };
  };
  /** Le Territoire mis à l'heure du jeu `instant`, comme à l'ouverture d'une page : le mécanisme unique du temps. */
  const aLHeure = (territoireId: number, instant: Date) => rattraper("territoire", territoireId, { pool, jusqua: instant });
  /** Les Récits de retour du Territoire, tels que la page Récits les liste : du plus récent au plus ancien. */
  const recitsDeRetour = async (territoireId: number) => (await recitsDuTerritoire(pool, territoireId)).filter((r) => r.titre === RETOUR);
  /** Les Cases que le Territoire a découvertes : celles sorties du brouillard se comptent par différence. */
  const decouvertes = async (territoireId: number) =>
    (await pool.query<{ nombre: number }>("select count(*)::int as nombre from case_decouverte where territoire_id = $1", [territoireId])).rows[0].nombre;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    mondeId = await mondeDEssai(pool, MONDE_D_ESSAI);
  });
  afterEach(async () => {
    // Chaque essai rend ses Foyers à la Couronne du Monde d'essai.
    await pool.query("delete from compte where email = any($1)", [nes.splice(0)]);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("chaque retour ajoute un récit à la page Récits, daté de l'heure du retour, non lu, et compté parmi les non lus", async () => {
    const { territoireId, ne } = await naitre();
    const depart = apres(ne, MINUTE);
    const { expeditionId, retour } = await partir(territoireId, await uneCaseOu(territoireId, depart, 60, 0), depart);

    await aLHeure(territoireId, apres(retour, -1));
    expect(await recitsDeRetour(territoireId)).toEqual([]);
    const nonLus = await nombreDeRecitsNonLus(pool, territoireId);

    await aLHeure(territoireId, retour);
    expect(await recitsDeRetour(territoireId)).toEqual([expect.objectContaining({ titre: RETOUR, survenuLe: retour, luLe: null })]);
    expect(await nombreDeRecitsNonLus(pool, territoireId)).toBe(nonLus + 1);

    // Rentrée une fois, elle n'est racontée qu'une fois.
    await aLHeure(territoireId, apres(retour, 3 * 60 * MINUTE));
    expect(await recitsDeRetour(territoireId)).toHaveLength(1);
    expect(await rencontresDUneExpedition(pool, expeditionId)).toEqual([]);
  });

  it("deux Expéditions rentrées donnent deux récits, chacun à son heure", async () => {
    const { territoireId, ne } = await naitre();
    const depart = apres(ne, MINUTE);
    const premiere = await partir(territoireId, await uneCaseOu(territoireId, depart, 60, 0), depart);
    const seconde = await partir(territoireId, await uneCaseOu(territoireId, apres(depart, 30 * MINUTE), 240, 0), apres(depart, 30 * MINUTE), 240);

    await aLHeure(territoireId, seconde.retour);
    expect((await recitsDeRetour(territoireId)).map((r) => r.survenuLe)).toEqual([seconde.retour, premiere.retour]);
  });

  it("donne la destination et son Biome désormais connu, les durées de l'aller, du séjour et du retour, et les Cases sorties du brouillard", async () => {
    const { territoireId, ne } = await naitre();
    const depart = apres(ne, MINUTE);
    const destination = await uneCaseOu(territoireId, depart, 60, 0);
    // Avant le départ, la destination est sous le brouillard : son Biome ne se connaît qu'au retour.
    expect(await ficheDUneCase(pool, territoireId, destination)).toMatchObject({ inconnue: true });
    await aLHeure(territoireId, depart);
    const avant = await decouvertes(territoireId);
    const { retour } = await partir(territoireId, destination, depart);

    await aLHeure(territoireId, retour);
    const fiche = await ficheDUneCase(pool, territoireId, destination);
    expect(fiche).toMatchObject({ biome: expect.any(String), distance: ECART });
    const levees = (await decouvertes(territoireId)) - avant;
    expect(levees).toBeGreaterThan(1);
    expect((await recitsDeRetour(territoireId))[0].texte).toBe(
      [
        `Destination : ${(fiche as { biome: string }).biome}, à ${ECART} Cases de votre Foyer.`,
        DUREES,
        `${levees} Cases sont sorties du brouillard.`,
        "Aucune Bête ne s'est montrée.",
      ].join("\n"),
    );
  });

  it("quand une Bête s'est montrée sur la Case, le récit ne dit plus qu'aucune ne l'a fait", async () => {
    const { territoireId, ne } = await naitre();
    const depart = apres(ne, MINUTE);
    const { expeditionId, retour } = await partir(territoireId, await uneCaseOu(territoireId, depart, 240, 1), depart, 240);

    await aLHeure(territoireId, retour);
    expect(await rencontresDUneExpedition(pool, expeditionId)).toHaveLength(1);
    const texte = (await recitsDeRetour(territoireId))[0].texte;
    expect(texte.split("\n").at(-1)).toBe("Une Bête s'est montrée.");
    expect(texte).not.toContain("Aucune Bête");
  });

  it("le même récit, page ouverte du départ au retour, qu'à la page fermée ou au passage de la tâche planifiée", async () => {
    const lePasse = async (avancer: (territoireId: number, depart: Date, retour: Date) => Promise<void>) => {
      const { territoireId, ne } = await naitre();
      const depart = apres(ne, MINUTE);
      const destination = await uneCaseOu(territoireId, depart, 60, 0);
      await aLHeure(territoireId, depart);
      const avant = await decouvertes(territoireId);
      const { retour } = await partir(territoireId, destination, depart);
      await avancer(territoireId, depart, retour);
      const [recit] = await recitsDeRetour(territoireId);
      return { survenuLe: recit.survenuLe.getTime() - depart.getTime(), lignes: recit.texte.split("\n").slice(1), levees: (await decouvertes(territoireId)) - avant };
    };
    const fermee = await lePasse(async (territoireId, _depart, retour) => {
      await aLHeure(territoireId, apres(retour, 5 * 60 * MINUTE));
    });
    const ouverte = await lePasse(async (territoireId, depart, retour) => {
      for (let instant = depart; instant < retour; instant = apres(instant, 7 * MINUTE + 3_123)) await aLHeure(territoireId, instant);
      await aLHeure(territoireId, apres(retour, 5 * 60 * MINUTE));
    });
    const planifiee = await lePasse(async (territoireId, _depart, retour) => {
      const passage = await rattraperLesAbsents({ pool, maintenant: apres(retour, 3 * 60 * MINUTE + 17 * MINUTE), parmi: { territoire: [territoireId] } });
      expect(passage).toMatchObject({ rattrapes: 1, echecs: 0 });
    });
    for (const passe of [fermee, ouverte, planifiee]) {
      expect(passe).toEqual({
        survenuLe: (2 * ALLER + 60) * MINUTE,
        lignes: [DUREES, `${passe.levees} Cases sont sorties du brouillard.`, "Aucune Bête ne s'est montrée."],
        levees: expect.any(Number),
      });
    }
  }, 60_000);
});
