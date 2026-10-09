import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { casesDecouvertes } from "@/monde/brouillard";
import { decouvertesDuJoueur } from "@/monde/carte";
import { BROUILLARD } from "@/monde/couleurs-de-la-carte";
import { ficheDUneCase } from "@/monde/fiche";
import { casesDansLeRayon, type Coordonnees, distance } from "@/monde/hex";
import { ABORDS_DU_FOYER_CASES, BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES, PORTEE_D_EXPLORATION_CASES } from "@/reglages";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, poolDeTest, preparerMondeDeTest, territoireDuCompte, URL_TEST } from "@/test/base";
import { casesRevelees } from "./brouillard";
import { cheminDUneExpedition } from "./chemin";
import { lancerLExpedition } from "./depart";
import { type HorairesDUneExpedition, retourDUneExpedition, sejourDUneExpedition } from "./phase";
import { passagesDUneExpedition } from "./position";

const MINUTE_MS = 60_000;
/** Une Case, sous forme de clé « q,r ». */
const cle = ({ q, r }: Coordonnees) => `${q},${r}`;
/** Un instant, `ms` millisecondes après `instant`. */
const decale = (instant: Date, ms: number) => new Date(instant.getTime() + ms);

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai du brouillard levé sur le chemin (US-0914)";

describe.skipIf(!URL_TEST)("le brouillard se lève sur le chemin (US-0914, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `chemin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  /**
   * Un chef qui vient de naître dans le Monde d'essai, avec un explorateur : son Territoire, la Case de son Foyer, l'instant
   * de sa naissance et les Cases qu'il a découvertes en naissant, les abords de son Foyer (US-0436).
   */
  const naitre = async () => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    const nom = `Chem${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[n % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom, Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query("insert into habitant (territoire_id, prenom, metier) values ($1, 'Essai', 'explorateur')", [territoireId]);
    const { rows } = await pool.query<Coordonnees>("select f.q, f.r from territoire t join case_du_monde f on f.id = t.foyer_case_id where t.id = $1", [
      territoireId,
    ]);
    return { territoireId, foyer: rows[0], ne: await lireMarquePage(pool, "territoire", territoireId), abords: await decouvertes(territoireId) };
  };
  /** Les Cases que le Territoire a découvertes, sous forme de clés. */
  const decouvertes = async (territoireId: number) => new Set((await casesDecouvertes(pool, territoireId)).map(cle));
  /**
   * Une Case libre du Monde du Territoire au bout de sa portée d'exploration (PORTEE_D_EXPLORATION_CASES), la plus proche du
   * milieu du Monde : son chemin part de la Couronne vers l'intérieur, loin au-delà des abords du Foyer.
   */
  const auBoutDeLaPortee = async (territoireId: number) => {
    const { rows } = await pool.query<Coordonnees>(
      `select c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
       order by greatest(abs(c.q), abs(c.r), abs(c.q + c.r)), c.q, c.r limit 1`,
      [territoireId, PORTEE_D_EXPLORATION_CASES],
    );
    return rows[0];
  };
  /** Le Territoire mis à l'heure du jeu `instant`, comme à l'ouverture d'une page ou par la tâche planifiée. */
  const aLHeure = (territoireId: number, instant: Date) => rattraper("territoire", territoireId, { pool, jusqua: instant });
  /**
   * Le départ, à `instant`, de l'explorateur du Territoire vers `destination`, après la mise à l'heure du Territoire, comme
   * depuis l'écran d'Expédition ; rend les horaires de l'Expédition, tels qu'enregistrés.
   */
  const partir = async (territoireId: number, destination: Coordonnees, instant: Date): Promise<HorairesDUneExpedition> => {
    await aLHeure(territoireId, instant);
    const depart = await lancerLExpedition(pool, territoireId, { destination, explorateurs: 1, escorte: new Map(), sejourMinutes: 60 }, instant);
    if (!("expeditionId" in depart)) throw new Error(depart.refus);
    const { rows } = await pool.query<HorairesDUneExpedition>(
      `select part_le as "partLe", trajet_minutes as "trajetMinutes", sejour_minutes as "sejourMinutes" from expedition where id = $1`,
      [depart.expeditionId],
    );
    return rows[0];
  };
  /**
   * Ce que le Territoire doit avoir découvert à l'instant `instant` : les abords de son Foyer, et les Cases que son
   * Expédition a révélées (casesRevelees), celles que son Monde a.
   */
  const attendues = async (territoireId: number, abords: Set<string>, foyer: Coordonnees, destination: Coordonnees, horaires: HorairesDUneExpedition, instant: Date) => {
    const revelees = casesRevelees(foyer, destination, horaires, instant);
    const { rows } = await pool.query<Coordonnees>(
      `select c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join unnest($2::int[], $3::int[]) as v(q, r) on true join case_du_monde c on c.monde_id = f.monde_id and c.q = v.q and c.r = v.r
       where t.id = $1`,
      [territoireId, revelees.map((c) => c.q), revelees.map((c) => c.r)],
    );
    return new Set([...abords, ...rows.map(cle)]);
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

  it("lève le brouillard sur les Cases traversées et leurs voisines au fur et à mesure du passage, pas toutes au départ", async () => {
    const { territoireId, foyer, ne, abords } = await naitre();
    const destination = await auBoutDeLaPortee(territoireId);
    const horaires = await partir(territoireId, destination, decale(ne, MINUTE_MS));
    const chemin = cheminDUneExpedition(foyer, destination);
    const passages = passagesDUneExpedition(foyer, destination, horaires);
    expect(passages).toHaveLength(PORTEE_D_EXPLORATION_CASES);

    // Au départ, et jusqu'à la première Case, rien de plus que les abords du Foyer.
    expect(await decouvertes(territoireId)).toEqual(abords);
    await aLHeure(territoireId, decale(passages[0].le, -1));
    expect(await decouvertes(territoireId)).toEqual(abords);

    // Puis Case après Case, à l'heure de chaque passage, à la milliseconde près.
    let uneAUne = 0;
    for (const { rang, le } of passages) {
      await aLHeure(territoireId, decale(le, -1));
      const avant = await decouvertes(territoireId);
      expect(avant).toEqual(await attendues(territoireId, abords, foyer, destination, horaires, decale(le, -1)));
      await aLHeure(territoireId, le);
      const apres = await decouvertes(territoireId);
      expect(apres).toEqual(await attendues(territoireId, abords, foyer, destination, horaires, le));
      // La Case suivante du chemin, au-delà des abords du Foyer, sort du brouillard à ce passage-là, pas avant.
      if (rang < chemin.length && distance(chemin[rang], foyer) > ABORDS_DU_FOYER_CASES) {
        expect(avant.has(cle(chemin[rang]))).toBe(false);
        expect(apres.has(cle(chemin[rang]))).toBe(true);
        uneAUne += 1;
      }
    }
    expect(uneAUne).toBe(PORTEE_D_EXPLORATION_CASES - ABORDS_DU_FOYER_CASES);
  });

  it("révèle à l'arrivée la destination et ses voisines, Biome compris", async () => {
    const { territoireId, foyer, ne } = await naitre();
    const destination = await auBoutDeLaPortee(territoireId);
    const horaires = await partir(territoireId, destination, decale(ne, MINUTE_MS));
    const arrivee = sejourDUneExpedition(horaires)!.debut;
    // La destination et ses voisines, toutes dans le Monde : le chemin va de la Couronne vers l'intérieur.
    const autour = casesDansLeRayon(destination, BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES);
    const { rows } = await pool.query<Coordonnees & { biome: string }>(
      `select c.q, c.r, c.biome_id as biome from case_du_monde c join unnest($2::int[], $3::int[]) as v(q, r) on c.q = v.q and c.r = v.r where c.monde_id = $1`,
      [mondeId, autour.map((c) => c.q), autour.map((c) => c.r)],
    );
    expect(rows).toHaveLength(autour.length);
    // Les Cases à deux pas de la destination, plus loin du Foyer qu'elle : aucune Case du chemin ne les montre avant l'arrivée.
    const auDela = autour.filter((c) => distance(c, foyer) === PORTEE_D_EXPLORATION_CASES + BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES);
    expect(auDela.length).toBeGreaterThan(0);

    await aLHeure(territoireId, decale(arrivee, -1));
    const avant = await decouvertes(territoireId);
    for (const c of auDela) expect(avant.has(cle(c))).toBe(false);
    expect(await ficheDUneCase(pool, territoireId, auDela[0])).toMatchObject({ inconnue: true });

    await aLHeure(territoireId, arrivee);
    const vues = new Map((await casesDecouvertes(pool, territoireId)).map((c) => [cle(c), c.biome]));
    for (const c of rows) expect(vues.get(cle(c)), cle(c)).toBe(c.biome);
    // La carte ouverte les reçoit (US-0442), chacune de sa teinte, plus aucune sous le brouillard.
    const carte = (await decouvertesDuJoueur(pool, territoireId, avant.size))!;
    const teintes = new Map(carte.cases.q.map((q, i) => [cle({ q, r: carte.cases.r[i] }), carte.cases.teinte[i]]));
    for (const c of rows) expect(teintes.get(cle(c)), cle(c)).toSatisfy((t: string | undefined) => t !== undefined && t !== BROUILLARD);
    // Sa fiche sur la carte le dit aussi : la destination et les Cases au-delà ne sont plus des Cases inconnues.
    for (const c of [destination, auDela[0]]) {
      const fiche = await ficheDUneCase(pool, territoireId, c);
      expect(fiche).not.toHaveProperty("inconnue");
      expect(fiche).toMatchObject({ ...c, biome: expect.any(String), distance: distance(c, foyer) });
    }
  });

  it("le laisse levé pour toujours, et pour ce joueur seulement", async () => {
    const joueur = await naitre();
    const voisin = await naitre();
    const destination = await auBoutDeLaPortee(joueur.territoireId);
    const horaires = await partir(joueur.territoireId, destination, decale(joueur.ne, MINUTE_MS));
    const rentree = retourDUneExpedition(horaires)!;

    await aLHeure(joueur.territoireId, sejourDUneExpedition(horaires)!.debut);
    const aLArrivee = await decouvertes(joueur.territoireId);
    expect(aLArrivee.size).toBeGreaterThan(joueur.abords.size);
    for (const instant of [decale(rentree, -1), rentree, decale(rentree, 30 * 24 * 60 * MINUTE_MS)]) {
      await aLHeure(joueur.territoireId, instant);
      expect(await decouvertes(joueur.territoireId)).toEqual(aLArrivee);
    }
    // Le voisin, mis à l'heure lui aussi, n'en découvre rien : il n'a que les abords de son Foyer.
    await aLHeure(voisin.territoireId, decale(rentree, MINUTE_MS));
    expect(await decouvertes(voisin.territoireId)).toEqual(voisin.abords);
  });

  it("après une absence, révèle exactement les Cases qu'on aurait vues en suivant l'Expédition en direct", async () => {
    const enDirect = await naitre();
    const absent = await naitre();
    const suivre = async (chef: Awaited<ReturnType<typeof naitre>>) => {
      const destination = await auBoutDeLaPortee(chef.territoireId);
      const horaires = await partir(chef.territoireId, destination, decale(chef.ne, MINUTE_MS));
      return { ...chef, destination, horaires, arrivee: sejourDUneExpedition(horaires)!.debut, rentree: retourDUneExpedition(horaires)! };
    };
    const [a, b] = [await suivre(enDirect), await suivre(absent)];
    const attenduesA = (x: typeof a, instant: Date) => attendues(x.territoireId, x.abords, x.foyer, x.destination, x.horaires, instant);

    // En direct : une page ouverte toutes les 7 minutes du jeu, du départ au retour.
    for (let instant = a.horaires.partLe; instant < decale(a.rentree, 7 * MINUTE_MS); instant = decale(instant, 7 * MINUTE_MS)) {
      await aLHeure(a.territoireId, instant);
      expect(await decouvertes(a.territoireId)).toEqual(await attenduesA(a, instant));
    }

    // Absent : de retour à mi-chemin, entre deux passages, puis seulement après le retour de l'Expédition.
    const passages = passagesDUneExpedition(b.foyer, b.destination, b.horaires);
    const miChemin = decale(passages[5].le, 7 * MINUTE_MS);
    await aLHeure(b.territoireId, miChemin);
    expect(await decouvertes(b.territoireId)).toEqual(await attenduesA(b, miChemin));
    expect((await decouvertes(b.territoireId)).has(cle(b.destination))).toBe(false);
    await aLHeure(b.territoireId, decale(b.rentree, 3 * 60 * MINUTE_MS));
    expect(await decouvertes(b.territoireId)).toEqual(await attenduesA(b, b.arrivee));
  });

  it("lève au premier rattrapage le chemin d'une Expédition déjà partie avant que le brouillard s'y lève", async () => {
    const { territoireId, foyer, ne, abords } = await naitre();
    const destination = await auBoutDeLaPortee(territoireId);
    // Le Territoire est déjà à l'heure de la fin de son séjour quand le brouillard commence à se lever sur les chemins.
    const horaires: HorairesDUneExpedition = { partLe: decale(ne, MINUTE_MS), trajetMinutes: PORTEE_D_EXPLORATION_CASES * 20, sejourMinutes: 60 };
    const finDuSejour = sejourDUneExpedition(horaires)!.fin;
    await pool.query("update territoire set calcule_jusqu_a = $2 where id = $1", [territoireId, finDuSejour]);
    await pool.query(
      `insert into expedition (territoire_id, case_id, part_le, trajet_minutes, sejour_minutes)
       select $1, c.id, $4, $5, $6 from case_du_monde c where c.monde_id = $7 and c.q = $2 and c.r = $3`,
      [territoireId, destination.q, destination.r, horaires.partLe, horaires.trajetMinutes, horaires.sejourMinutes, mondeId],
    );
    expect(await decouvertes(territoireId)).toEqual(abords);

    await aLHeure(territoireId, decale(finDuSejour, MINUTE_MS));
    expect(await decouvertes(territoireId)).toEqual(await attendues(territoireId, abords, foyer, destination, horaires, finDuSejour));
    expect((await decouvertes(territoireId)).has(cle(destination))).toBe(true);
  });
});
