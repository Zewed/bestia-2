// US-0966 : une Bête restée sur sa Case, trop forte pour l'escorte qui l'a vue (US-0942), suit une Expédition assez forte
// arrivée ensuite, d'un autre joueur ou du même, dès son arrivée ; quand plusieurs assez fortes arrivent au même instant,
// le tirage proportionnel à la force (US-0963) désigne la seule qui l'emporte. L'Expédition déjà présente qui la perd
// ainsi l'apprend dans son récit, à l'heure du départ de la Bête (US-0950). Le même résultat quel que soit le Territoire
// mis à l'heure le premier.
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bestiaireDuTerritoire } from "@/bestiaire/bestiaire";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { type BeteSauvage, betesSauvagesDesCases } from "@/monde/betes-sauvages";
import { recitsDuTerritoire } from "@/monde/recits";
import { PRESENCE_D_UNE_BETE_HEURES } from "@/reglages";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, nomDEssai, poolDansLaTransaction, poolDeTest, preparerMondeDeTest, suffixeDEssai, territoireDuCompte, URL_TEST } from "@/test/base";
import { lExpeditionSuivie } from "./apprivoisement";
import { forceDUneBete } from "./force";
import { type HorairesDUneExpedition, retourDUneExpedition } from "./phase";
import { attaquesSubies } from "./rencontres";
import { programmerLeRetour } from "./retour";

const MINUTE_MS = 60_000;
const HEURE = 60;
const JOUR = 24 * HEURE;
/** Le temps, en minutes, où aucune autre Bête n'apparaît avant ou après celle d'un essai : sa présence et 6 heures de marge. */
const CALME = PRESENCE_D_UNE_BETE_HEURES * HEURE + 6 * HEURE;
/** L'aller et le retour des Expéditions des essais, posées sur la Case sans souci de la distance à leur Foyer. */
const TRAJET = 30;

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai d'une Expédition assez forte arrivée ensuite (US-0966)";
type Joueur = "A" | "B" | "C";
const JOUEURS = ["A", "B", "C"] as const;

/** Une Espèce telle que l'essai la choisit pour une escorte : la force d'une de ses Bêtes (US-0905). */
type Espece = { id: string; rareteId: string; force: number };
/** Une Expédition à poser : son joueur, son arrivée sur la Case, son séjour, et son escorte (Espèce, nombre), s'il en a une. */
type APoser = { joueur: Joueur; arrivee: Date; sejour: number; escorte?: [Espece, number] };
/** Ce qu'une Expédition laisse à son joueur, une fois rentrée : sa Rencontre de la Bête et ses attaques subies. */
type Vecue = { apprivoisee: boolean; vueLe: Date; attaques: Date[] };

describe.skipIf(!URL_TEST)("une Expédition assez forte arrive ensuite (US-0966, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  const lancement = `ensuite-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  /** La fin des noms des chefs de ce lancement, qui n'y forme aucun mot interdit (src/test/base.ts). */
  const suffixe = suffixeDEssai();
  let numero = 0;
  let especes: Espece[];
  /** La commune la plus forte du jeu, dont les escortes assez fortes des essais sont faites. */
  let forte: Espece;
  const territoires = {} as Record<Joueur, number>;
  let ne: Date;
  /** La Bête des essais, plus rare que commune, seule sur sa Case, et sa force. */
  let caseId: number;
  let bete: BeteSauvage;
  let force: number;
  /** Combien de Bêtes de `forte` il faut à une escorte pour l'avoir à portée. */
  let assez: number;
  const apres = (instant: Date, minutes: number) => new Date(instant.getTime() + minutes * MINUTE_MS);
  /** L'instant où arrivent les Expéditions assez fortes : deux heures après la Bête, qui a encore quatre heures à rester. */
  const ensuite = () => apres(bete.arrivee, 2 * HEURE);
  /** Les horaires d'une Expédition qui arrive sur sa Case à `arrivee` et y séjourne `sejourMinutes`. */
  const arriveeA = (arrivee: Date, sejourMinutes: number): HorairesDUneExpedition => ({ partLe: apres(arrivee, -TRAJET), trajetMinutes: TRAJET, sejourMinutes });
  /** L'Expédition de A, sans escorte, arrivée une heure avant la Bête et restée huit heures : elle la voit, trop forte. */
  const premiere = (): APoser => ({ joueur: "A", arrivee: apres(bete.arrivee, -HEURE), sejour: 8 * HEURE });

  /** Un chef qui vient de naître dans le Monde d'essai : son Territoire et l'instant de sa naissance. */
  const naitre = async () => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomDEssai("Ensu", suffixe, n), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };
  /** L'Expédition `x` posée en base sur la Case de la Bête comme un départ l'aurait fait, son retour programmé (US-0916). */
  const poser = async (client: PoolClient, x: APoser) => {
    const h = arriveeA(x.arrivee, x.sejour);
    const { rows } = await client.query<{ id: number }>(
      "insert into expedition (territoire_id, case_id, part_le, trajet_minutes, sejour_minutes) values ($1, $2, $3, $4, $5) returning id",
      [territoires[x.joueur], caseId, h.partLe, h.trajetMinutes, h.sejourMinutes],
    );
    if (x.escorte) await client.query("insert into expedition_escorte (expedition_id, espece_id, nombre) values ($1, $2, $3)", [rows[0].id, x.escorte[0].id, x.escorte[1]]);
    await programmerLeRetour(client, territoires[x.joueur], rows[0].id, h);
    return rows[0].id;
  };
  /**
   * Les Expéditions `posees`, vécues dans une transaction annulée ensuite jusqu'au retour de toutes, les Territoires mis à
   * l'heure dans l'ordre `ordre` : pour chacune, sa Rencontre de la Bête et ses attaques subies ; pour chaque joueur, ses
   * Récits de retour, l'effectif de l'Espèce de la Bête et son Bestiaire.
   */
  const vivre = async (posees: APoser[], ordre: readonly Joueur[]) => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const jeu = poolDansLaTransaction(client);
      const ids: number[] = [];
      for (const x of posees) ids.push(await poser(client, x));
      const fin = apres(new Date(Math.max(...posees.map((x) => retourDUneExpedition(arriveeA(x.arrivee, x.sejour))!.getTime()))), HEURE);
      for (const joueur of ordre) await rattraper("territoire", territoires[joueur], { pool: jeu, jusqua: fin });
      const vecues: Vecue[] = [];
      for (const id of ids) {
        const { rows } = await client.query<{ apprivoisee: boolean; vueLe: Date }>(
          `select apprivoisee, vue_le as "vueLe" from rencontre where expedition_id = $1 and numero = $2`,
          [id, bete.numero],
        );
        expect(rows).toHaveLength(1);
        vecues.push({ ...rows[0], attaques: (await attaquesSubies(client, id)).map((a) => a.le) });
      }
      const joueurs = {} as Record<Joueur, { recits: Awaited<ReturnType<typeof recitsDuTerritoire>>; effectif: number; etat: string | undefined }>;
      for (const joueur of JOUEURS) {
        const { rows } = await client.query<{ nombre: number }>("select coalesce(sum(nombre), 0)::int as nombre from effectif where territoire_id = $1 and espece_id = $2", [
          territoires[joueur],
          bete.especeId,
        ]);
        joueurs[joueur] = {
          recits: (await recitsDuTerritoire(jeu, territoires[joueur])).filter((r) => r.titre === "Retour d'Expédition"),
          effectif: rows[0].nombre,
          etat: (await bestiaireDuTerritoire(jeu, territoires[joueur])).find((e) => e.especeId === bete.especeId)?.etat,
        };
      }
      return { vecues, joueurs };
    } finally {
      await client.query("rollback");
      client.release();
    }
  };
  /**
   * Ce qui ne dépend pas de l'ordre des mises à l'heure, ni des identifiants des Expéditions, propres à chaque essai : qui
   * la Bête suit, et quand chacune la voit ; ce que chaque joueur en garde, et ce que ses récits disent de sa Rencontre.
   * Les attaques, elles, se tirent par Expédition (US-0943).
   */
  const sansLeHasard = ({ vecues, joueurs }: Awaited<ReturnType<typeof vivre>>) => ({
    suites: vecues.map(({ apprivoisee, vueLe }) => ({ apprivoisee, vueLe })),
    joueurs: JOUEURS.map((j) => ({ effectif: joueurs[j].effectif, etat: joueurs[j].etat, rencontres: joueurs[j].recits.map((r) => r.rencontres) })),
  });
  /** La Rencontre de la Bête dans le récit de retour de l'Expédition d'un joueur arrivée à `arrivee`. */
  const rencontreDuRecit = (recits: Awaited<ReturnType<typeof recitsDuTerritoire>>, arrivee: Date) =>
    recits.flatMap((r) => r.rencontres ?? []).find((r) => r.especeId === bete.especeId && r.vueLe.getTime() === Math.max(arrivee.getTime(), bete.arrivee.getTime()));

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    mondeId = await mondeDEssai(pool, MONDE_D_ESSAI);
    const { rows } = await pool.query<{ id: string; rareteId: string; attaque: number; vie: number }>('select id, rarete_id as "rareteId", attaque, vie from espece order by id');
    especes = rows.map(({ attaque, vie, ...e }) => ({ ...e, force: forceDUneBete({ attaque, vie }) }));
    forte = especes.filter((e) => e.rareteId === "commune").sort((x, y) => y.force - x.force || x.id.localeCompare(y.id))[0];
    for (const joueur of JOUEURS) {
      const chef = await naitre();
      territoires[joueur] = chef.territoireId;
      ne = chef.ne;
    }
    const { rows: libres } = await pool.query<{ id: number }>(
      `select c.id from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) between 2 and 6
         and not exists (select 1 from bete_de_naissance n where n.case_id = c.id and n.territoire_id = any($2::int[]))
       order by c.id`,
      [territoires.A, JOUEURS.map((j) => territoires[j])],
    );
    // Une Bête plus rare que commune, seule sur sa Case, que le tirage entre deux escortes assez fortes arrivées ensuite
    // au même instant, l'une deux fois plus forte que l'autre, donne à la seconde posée : pas à la première par son rang.
    const [de, a] = [apres(ne, 3 * JOUR), apres(ne, 40 * JOUR)];
    for (const [ici, betes] of await betesSauvagesDesCases(pool, libres.map((c) => c.id), de, a)) {
      const trouvee = betes.find((x, i) => {
        const f = especes.find((e) => e.id === x.especeId)!.force;
        const n = Math.ceil(f / forte.force);
        if (x.rareteId === "commune" || x.arrivee < apres(de, CALME) || x.arrivee > apres(a, -CALME)) return false;
        if ((i > 0 && betes[i - 1].arrivee > apres(x.arrivee, -CALME)) || (i < betes.length - 1 && betes[i + 1].arrivee < apres(x.arrivee, CALME))) return false;
        const sur = (arrivee: Date, sejour: number) => ({ arrivee, depart: apres(arrivee, sejour) });
        const suivie = lExpeditionSuivie({ ...x, force: f, caseId: ici, beteDeNaissanceId: null }, [
          { id: 1, ...sur(apres(x.arrivee, -HEURE), 8 * HEURE), escorte: null },
          { id: 2, ...sur(apres(x.arrivee, 2 * HEURE), HEURE), escorte: n * forte.force },
          { id: 3, ...sur(apres(x.arrivee, 2 * HEURE), HEURE), escorte: 2 * n * forte.force },
        ]);
        return suivie?.expeditionId === 3;
      });
      if (trouvee) {
        [caseId, bete] = [ici, trouvee];
        break;
      }
    }
    if (!bete) throw new Error("Aucune Bête plus rare seule autour du Foyer de A.");
    force = especes.find((e) => e.id === bete.especeId)!.force;
    assez = Math.ceil(force / forte.force);
  }, 60_000);

  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("une Expédition assez forte d'un autre joueur arrive ensuite : la Bête la suit dès son arrivée, et celle déjà présente l'apprend à son retour", async () => {
    const posees: APoser[] = [premiere(), { joueur: "B", arrivee: ensuite(), sejour: HEURE, escorte: [forte, assez] }];
    const { vecues, joueurs } = await vivre(posees, ["A", "B"]);
    // Trop forte pour A, elle reste sur sa Case ; B arrive, assez fort : elle le suit à cet instant, et il la ramène.
    expect(vecues.map(({ apprivoisee, vueLe }) => ({ apprivoisee, vueLe }))).toEqual([
      { apprivoisee: false, vueLe: bete.arrivee },
      { apprivoisee: true, vueLe: ensuite() },
    ]);
    expect([joueurs.B.effectif, joueurs.B.etat]).toEqual([1, "apprivoisee"]);
    expect([joueurs.A.effectif, joueurs.A.etat]).toEqual([0, "croisee"]);
    expect(joueurs.B.recits.map((r) => r.texte.split("\n").at(-1))).toEqual([expect.stringMatching(/^Bête ramenée au Foyer : /)]);
    // Partie avec B, elle n'attaque plus A ; A, qui la perd, l'apprend dans son récit, à l'heure de son départ.
    expect(vecues[0].attaques.every((le) => le < ensuite())).toBe(true);
    const perdue = rencontreDuRecit(joueurs.A.recits, posees[0].arrivee)!;
    expect(perdue.issue).not.toBe("apprivoisee");
    expect(perdue.repartieLe).toEqual(ensuite());
    // Le même résultat, B mis à l'heure le premier.
    expect(sansLeHasard(await vivre(posees, ["B", "A"]))).toEqual(sansLeHasard({ vecues, joueurs }));
  }, 60_000);

  it("une Expédition assez forte du même joueur arrive ensuite : la Bête la suit, et l'autre Expédition du joueur la perd", async () => {
    const posees: APoser[] = [premiere(), { joueur: "A", arrivee: ensuite(), sejour: HEURE, escorte: [forte, assez] }];
    const { vecues, joueurs } = await vivre(posees, ["A"]);
    expect(vecues.map(({ apprivoisee, vueLe }) => ({ apprivoisee, vueLe }))).toEqual([
      { apprivoisee: false, vueLe: bete.arrivee },
      { apprivoisee: true, vueLe: ensuite() },
    ]);
    expect([joueurs.A.effectif, joueurs.A.etat]).toEqual([1, "apprivoisee"]);
    expect(joueurs.A.recits).toHaveLength(2);
    expect(rencontreDuRecit(joueurs.A.recits, posees[0].arrivee)?.repartieLe).toEqual(ensuite());
    expect(rencontreDuRecit(joueurs.A.recits, ensuite())?.issue).toBe("apprivoisee");
  }, 60_000);

  it("plusieurs Expéditions assez fortes arrivent au même instant : une seule l'emporte, celle que désigne le tirage proportionnel à la force", async () => {
    // B avec une escorte juste assez forte, C deux fois plus forte : le tirage de cette Bête désigne C, posée après B.
    const posees: APoser[] = [
      premiere(),
      { joueur: "B", arrivee: ensuite(), sejour: HEURE, escorte: [forte, assez] },
      { joueur: "C", arrivee: ensuite(), sejour: HEURE, escorte: [forte, 2 * assez] },
    ];
    const { vecues, joueurs } = await vivre(posees, ["A", "B", "C"]);
    expect(vecues.map(({ apprivoisee, vueLe }) => ({ apprivoisee, vueLe }))).toEqual([
      { apprivoisee: false, vueLe: bete.arrivee },
      // B la voit au même instant que C, qu'elle suit (US-0962) : il ne la ramène pas.
      { apprivoisee: false, vueLe: ensuite() },
      { apprivoisee: true, vueLe: ensuite() },
    ]);
    expect(JOUEURS.map((j) => joueurs[j].effectif)).toEqual([0, 0, 1]);
    expect(JOUEURS.map((j) => joueurs[j].etat)).toEqual(["croisee", "croisee", "apprivoisee"]);
    expect(sansLeHasard(await vivre(posees, ["C", "B", "A"]))).toEqual(sansLeHasard({ vecues, joueurs }));
  }, 60_000);
});
