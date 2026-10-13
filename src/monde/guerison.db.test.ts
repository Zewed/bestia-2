// US-0954 : les Blessés guérissent seuls avec le temps, GUERISON_DES_BLESSES_HEURES après leur retour au Foyer, même le
// joueur absent, et un Récit le dit, daté de la guérison. Le temps qui avance (src/temps/avancer.ts) l'écrit en chemin,
// quel que soit son découpage : la même guérison est vécue ici page ouverte, d'un bloc au retour du joueur et par la seule
// tâche planifiée, et ce qu'elle laisse se compare. Les Expéditions de ces essais séjournent là où rien ne se montre : aucune
// Rencontre, donc aucun combat ; leurs Blessés sont posés sur l'escorte, comme un combat les y aurait laissés (US-0951).
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { lancerLExpedition } from "@/expeditions/depart";
import { retourDUneExpedition } from "@/expeditions/phase";
import { GUERISON_DES_BLESSES_HEURES, PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, nomDEssai, poolDansLaTransaction, poolDeTest, preparerMondeDeTest, suffixeDEssai, territoireDuCompte, URL_TEST } from "@/test/base";
import { blessesAuFoyer } from "./blesses";
import { betesSauvagesDesCases } from "./betes-sauvages";
import type { Coordonnees } from "./hex";
import { estUnRecitDeGuerison } from "./recit-de-guerison";
import { recitsDuTerritoire } from "./recits";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai de la guérison avec le temps (US-0954)";

/** Les manières de vivre la même guérison : page ouverte d'heure en heure, d'un bloc au retour du joueur, ou par la seule tâche planifiée. */
const MANIERES = ["page ouverte", "d'un bloc", "par la tâche planifiée"] as const;
type Maniere = (typeof MANIERES)[number];

/** Ce qu'une guérison laisse au Territoire : ses Récits de guérison, et ses Blessés encore au Foyer. */
type Bilan = { guerisons: { titre: string; texte: string; survenuLe: Date }[]; blesses: Record<string, unknown> };

describe.skipIf(!URL_TEST)("la guérison des Blessés avec le temps (US-0954, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `guerison-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  /** La fin des noms de chef de ce lancement, qu'aucun mot interdit ne refuse (src/test/base.ts). */
  const suffixe = suffixeDEssai();
  let numero = 0;
  /** Les comptes des Territoires nés pendant l'essai en cours. */
  const nes: string[] = [];
  const apres = (instant: Date, ms: number) => new Date(instant.getTime() + ms);

  /**
   * Un chef qui vient de naître dans le Monde d'essai, avec deux explorateurs, quatre souris et trois pigeons, tous mâles :
   * un mâle et une femelle au Foyer réuniraient leur Couple au retour (US-0956). Son Territoire et l'instant de sa naissance.
   */
  const naitre = async () => {
    const n = ++numero;
    nes.push(`${lancement}-${n}@essai.test`);
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomDEssai("Gue", suffixe, n), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query(
      `with partis as (delete from habitant where territoire_id = $1)
       insert into habitant (territoire_id, prenom, metier) values ($1, 'Joran', 'explorateur'), ($1, 'Ilda', 'explorateur')`,
      [territoireId],
    );
    await pool.query("insert into effectif (territoire_id, espece_id, sexe, nombre) values ($1, 'souris', 'male', 4), ($1, 'pigeon', 'male', 3)", [
      territoireId,
    ]);
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };

  /**
   * Une Expédition partie à `instant` vers une Case à deux Cases du Foyer où rien ne se montre pendant son heure de séjour,
   * escortée de `escorte` ; puis, Espèce par Espèce, ses Bêtes perdues au combat et ses Blessées parmi elles, posées sur
   * l'escorte comme un combat les y aurait laissées. Son identifiant et l'instant de son retour au Foyer.
   */
  const partir = async (territoireId: number, instant: Date, escorte: [string, number][], pertes: [string, number, number][]) => {
    await rattraper("territoire", territoireId, { pool, jusqua: instant });
    const arrivee = apres(instant, 2 * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE * MINUTE);
    const { rows } = await pool.query<Coordonnees & { id: number }>(
      `select c.id, c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = 2
         and not exists (select 1 from bete_de_naissance n where n.territoire_id = t.id and n.case_id = c.id)
       order by c.q, c.r`,
      [territoireId],
    );
    const sauvages = await betesSauvagesDesCases(pool, rows.map((c) => c.id), arrivee, apres(arrivee, HEURE));
    const calme = rows.find((c) => sauvages.get(c.id)!.length === 0);
    if (!calme) throw new Error("Aucune Case à deux Cases du Foyer où rien ne se montre pendant le séjour.");
    const depart = await lancerLExpedition(
      pool,
      territoireId,
      { destination: { q: calme.q, r: calme.r }, explorateurs: 1, escorte: new Map(escorte), sejourMinutes: 60 },
      instant,
    );
    if (!("expeditionId" in depart)) throw new Error(depart.refus);
    for (const [especeId, perdues, blessees] of pertes) {
      await pool.query("update expedition_escorte set perdues = $3, blessees = $4 where expedition_id = $1 and espece_id = $2", [
        depart.expeditionId,
        especeId,
        perdues,
        blessees,
      ]);
    }
    const { rows: horaires } = await pool.query<{ partLe: Date; trajetMinutes: number; sejourMinutes: number }>(
      `select part_le as "partLe", trajet_minutes as "trajetMinutes", sejour_minutes as "sejourMinutes" from expedition where id = $1`,
      [depart.expeditionId],
    );
    return { expeditionId: depart.expeditionId, retour: retourDUneExpedition(horaires[0])! };
  };

  /** Les Récits de guérison du Territoire, du plus récent au plus ancien, et ses Blessés au Foyer à l'instant `instant`. */
  const bilan = async (jeu: Pool, territoireId: number, instant: Date): Promise<Bilan> => ({
    guerisons: (await recitsDuTerritoire(jeu, territoireId))
      .filter((r) => estUnRecitDeGuerison(r.titre))
      .map(({ titre, texte, survenuLe }) => ({ titre, texte, survenuLe })),
    blesses: Object.fromEntries(await blessesAuFoyer(jeu, territoireId, instant)),
  });

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

  it(
    "les Blessés guérissent GUERISON_DES_BLESSES_HEURES après leur retour, et un Récit le dit à cet instant : le même page ouverte, d'un bloc ou par la tâche planifiée",
    async () => {
      const t = await naitre();
      const { retour } = await partir(
        t.territoireId,
        t.ne,
        [
          ["souris", 3],
          ["pigeon", 2],
        ],
        [
          ["souris", 2, 2],
          ["pigeon", 2, 1],
        ],
      );
      const guerison = apres(retour, GUERISON_DES_BLESSES_HEURES * HEURE);
      const fin = apres(guerison, HEURE);
      // La tâche planifiée passe toutes les heures (vercel.json), la dernière fois à `fin`.
      const heures = Math.ceil((fin.getTime() - t.ne.getTime()) / HEURE);
      const passages = Array.from({ length: heures }, (_, i) => new Date(Math.min(t.ne.getTime() + (i + 1) * HEURE, fin.getTime())));

      const bilans = {} as Record<Maniere, Bilan>;
      for (const maniere of MANIERES) {
        const client = await pool.connect();
        try {
          await client.query("begin");
          const jeu = poolDansLaTransaction(client);
          if (maniere === "page ouverte") {
            for (const instant of passages.filter((p) => p < guerison)) await rattraper("territoire", t.territoireId, { pool: jeu, jusqua: instant });
            // Une milliseconde avant la guérison, ils sont encore Blessés, et rien ne l'a dit.
            await rattraper("territoire", t.territoireId, { pool: jeu, jusqua: apres(guerison, -1) });
            expect(await bilan(jeu, t.territoireId, apres(guerison, -1))).toEqual({
              guerisons: [],
              blesses: { pigeon: [{ nombre: 1, gueriLe: guerison }], souris: [{ nombre: 2, gueriLe: guerison }] },
            });
            await rattraper("territoire", t.territoireId, { pool: jeu, jusqua: guerison });
            await rattraper("territoire", t.territoireId, { pool: jeu, jusqua: fin });
          } else if (maniere === "d'un bloc") {
            await rattraper("territoire", t.territoireId, { pool: jeu, jusqua: fin });
          } else {
            for (const instant of passages) {
              expect(await rattraperLesAbsents({ pool: jeu, maintenant: instant, parmi: { territoire: [t.territoireId] } })).toMatchObject({
                rattrapes: 1,
                echecs: 0,
              });
            }
          }
          expect(await lireMarquePage(jeu, "territoire", t.territoireId)).toEqual(fin);
          bilans[maniere] = await bilan(jeu, t.territoireId, fin);
        } finally {
          await client.query("rollback");
          client.release();
        }
      }

      expect(bilans["page ouverte"]).toEqual({
        guerisons: [{ titre: "3 Blessés ont guéri", texte: "De nouveau valides : Pigeon biset (1) et Souris grise (2).", survenuLe: guerison }],
        blesses: {},
      });
      expect(bilans["d'un bloc"]).toEqual(bilans["page ouverte"]);
      expect(bilans["par la tâche planifiée"]).toEqual(bilans["page ouverte"]);
    },
    120_000,
  );

  it("une Expédition rentrée sans Blessé, avec ou sans pertes, ne guérit personne, et aucun Récit ne le dit", async () => {
    const t = await naitre();
    const sansPerte = await partir(t.territoireId, t.ne, [["souris", 1]], []);
    const desMorts = await partir(t.territoireId, t.ne, [["pigeon", 2]], [["pigeon", 2, 0]]);
    const fin = apres(desMorts.retour, (GUERISON_DES_BLESSES_HEURES + 1) * HEURE);
    expect(sansPerte.retour).toEqual(desMorts.retour);

    await rattraper("territoire", t.territoireId, { pool, jusqua: fin });
    expect(await bilan(pool, t.territoireId, fin)).toEqual({ guerisons: [], blesses: {} });
  }, 60_000);

  it("des Blessés rentrés à des instants différents guérissent chacun à son heure, chacun avec son Récit", async () => {
    const t = await naitre();
    const premiere = await partir(t.territoireId, t.ne, [["souris", 2]], [["souris", 1, 1]]);
    const seconde = await partir(t.territoireId, apres(t.ne, 3 * HEURE), [["pigeon", 3]], [["pigeon", 3, 3]]);
    const fin = apres(seconde.retour, (GUERISON_DES_BLESSES_HEURES + 1) * HEURE);

    await rattraper("territoire", t.territoireId, { pool, jusqua: fin });
    expect((await bilan(pool, t.territoireId, fin)).guerisons).toEqual([
      { titre: "3 Blessés ont guéri", texte: "De nouveau valides : Pigeon biset (3).", survenuLe: apres(seconde.retour, GUERISON_DES_BLESSES_HEURES * HEURE) },
      { titre: "1 Blessé a guéri", texte: "De nouveau valide : Souris grise (1).", survenuLe: apres(premiere.retour, GUERISON_DES_BLESSES_HEURES * HEURE) },
    ]);
  }, 60_000);

  it("des Blessés rentrés au même instant, par deux Expéditions, guérissent ensemble : un seul Récit (US-0952, un groupe)", async () => {
    const t = await naitre();
    const premiere = await partir(t.territoireId, t.ne, [["souris", 2]], [["souris", 2, 1]]);
    const seconde = await partir(t.territoireId, t.ne, [["souris", 2], ["pigeon", 1]], [["souris", 1, 1], ["pigeon", 1, 1]]);
    expect(seconde.retour).toEqual(premiere.retour);
    const guerison = apres(premiere.retour, GUERISON_DES_BLESSES_HEURES * HEURE);

    await rattraper("territoire", t.territoireId, { pool, jusqua: apres(guerison, HEURE) });
    expect((await bilan(pool, t.territoireId, guerison)).guerisons).toEqual([
      { titre: "3 Blessés ont guéri", texte: "De nouveau valides : Pigeon biset (1) et Souris grise (2).", survenuLe: guerison },
    ]);
  }, 60_000);

  it("les Blessés d'un autre joueur ne guérissent pas chez soi : son Récit est le sien", async () => {
    const t = await naitre();
    const voisin = await naitre();
    const { retour } = await partir(voisin.territoireId, voisin.ne, [["souris", 2]], [["souris", 2, 2]]);
    const fin = apres(retour, (GUERISON_DES_BLESSES_HEURES + 1) * HEURE);

    await rattraper("territoire", t.territoireId, { pool, jusqua: fin });
    await rattraper("territoire", voisin.territoireId, { pool, jusqua: fin });
    expect((await bilan(pool, t.territoireId, fin)).guerisons).toEqual([]);
    expect((await bilan(pool, voisin.territoireId, fin)).guerisons).toEqual([
      { titre: "2 Blessés ont guéri", texte: "De nouveau valides : Souris grise (2).", survenuLe: apres(retour, GUERISON_DES_BLESSES_HEURES * HEURE) },
    ]);
  }, 60_000);
});
