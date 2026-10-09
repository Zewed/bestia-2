import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { betesDisponibles } from "@/monde/effectif";
import { explorateursDuTerritoire, prochainRetourDUnExplorateur } from "@/monde/explorateurs";
import type { Coordonnees } from "@/monde/hex";
import { PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE, PORTEE_D_EXPLORATION_CASES, SEJOUR_MINUTES } from "@/reglages";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { type ChoixDuDepart, EXPLORATEUR_PLUS_LIBRE, lancerLExpedition } from "./depart";
import { expeditionsEnCours } from "./en-cours";

const MINUTE_MS = 60_000;

describe.skipIf(!URL_TEST)("plusieurs Expéditions à la fois (US-0919, sur base)", () => {
  let pool: Pool;
  const lancement = `plusieurs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  /** L'heure du jeu du premier départ. */
  const INSTANT = new Date("2026-10-09T07:42:00.000Z");
  /** L'heure du jeu `minutes` après le premier départ. */
  const apres = (minutes: number) => new Date(INSTANT.getTime() + minutes * MINUTE_MS);

  /** Un joueur qui vient de naître, et son Territoire, avec ses trois Habitants sans Métier et sans Bête. */
  const nouveauTerritoire = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    const nom = `Plu${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom)).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  /** `n` explorateurs de plus au Territoire. */
  const explorateurs = (territoireId: number, n: number) =>
    pool.query(`insert into habitant (territoire_id, prenom, metier) select $1, 'Essai', 'explorateur' from generate_series(1, $2)`, [territoireId, n]);
  /** Des Bêtes dans l'effectif du Territoire : une ligne par Espèce et par sexe, avec leur nombre. */
  const betes = (territoireId: number, lignes: [string, "male" | "femelle", number][]) =>
    pool.query(
      `insert into effectif (territoire_id, espece_id, sexe, nombre)
       select $1, e, s::sexe, n from unnest($2::text[], $3::text[], $4::int[]) as l(e, s, n)`,
      [territoireId, lignes.map((l) => l[0]), lignes.map((l) => l[1]), lignes.map((l) => l[2])],
    );
  /** Une Case libre du Monde du Territoire, à `ecart` Cases de son Foyer. */
  const aLEcart = async (territoireId: number, ecart: number): Promise<Coordonnees> => {
    const { rows } = await pool.query<Coordonnees>(
      `select c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
       order by c.q, c.r limit 1`,
      [territoireId, ecart],
    );
    return rows[0];
  };
  /** Un départ vers `destination` : `n` explorateurs, l'escorte donnée Espèce par Espèce, et le séjour en minutes. */
  const choix = (destination: Coordonnees, n: number, sejourMinutes: number, escorte: [string, number][] = []): ChoixDuDepart => ({
    destination,
    explorateurs: n,
    escorte: new Map(escorte),
    sejourMinutes,
  });
  /** Une Expédition partie : son identifiant. */
  const partie = async (depart: Promise<{ expeditionId: number } | { refus: string }>) => {
    const fait = await depart;
    expect(fait).toEqual({ expeditionId: expect.any(Number) });
    return (fait as { expeditionId: number }).expeditionId;
  };
  /** Tout ce qu'une Expédition a retenu à son départ : sa destination, ses horaires, son escorte et ses explorateurs. */
  const retenue = async (expeditionId: number) =>
    (
      await pool.query(
        `select c.q, c.r, x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes",
           (select coalesce(json_object_agg(s.espece_id, s.nombre order by s.espece_id), '{}') from expedition_escorte s where s.expedition_id = x.id) as escorte,
           (select coalesce(array_agg(h.id order by h.id), '{}') from habitant h where h.expedition_id = x.id) as explorateurs
         from expedition x join case_du_monde c on c.id = x.case_id
         where x.id = $1`,
        [expeditionId],
      )
    ).rows[0];
  /** La phase de l'Expédition `id` dans la liste des Expéditions en cours du Territoire, à l'heure du jeu `instant`. */
  const phase = async (territoireId: number, id: number, instant: Date) => (await expeditionsEnCours(pool, territoireId, instant)).find((x) => x.id === id)?.phase;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("lance une nouvelle Expédition pendant qu'une autre est en route, tant qu'il reste au moins un explorateur libre", async () => {
    const t = await nouveauTerritoire();
    await explorateurs(t, 3);
    const premiere = await partie(lancerLExpedition(pool, t, choix(await aLEcart(t, PORTEE_D_EXPLORATION_CASES), 2, 240), INSTANT));
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 1, total: 3 });

    // Une heure plus tard, la première est encore à l'aller, et le dernier explorateur libre part à son tour.
    expect(await phase(t, premiere, apres(60))).toBe("aller");
    const seconde = await partie(lancerLExpedition(pool, t, choix(await aLEcart(t, 2), 1, 240), apres(60)));
    expect((await expeditionsEnCours(pool, t, apres(60))).map((x) => x.id)).toEqual([premiere, seconde]);
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 0, total: 3 });

    // Plus aucun explorateur libre : un troisième départ est refusé, sans rien changer aux deux autres.
    const avant = await Promise.all([retenue(premiere), retenue(seconde)]);
    expect(await lancerLExpedition(pool, t, choix(await aLEcart(t, 1), 1, 240), apres(61))).toEqual({ refus: EXPLORATEUR_PLUS_LIBRE });
    expect(await Promise.all([retenue(premiere), retenue(seconde)])).toEqual(avant);
    expect((await expeditionsEnCours(pool, t, apres(61))).map((x) => x.id)).toEqual([premiere, seconde]);
  });

  it("donne à chaque Expédition sa destination, son escorte et ses horaires, sans effet sur les autres", async () => {
    const t = await nouveauTerritoire();
    await explorateurs(t, 5);
    await betes(t, [
      ["souris", "male", 2],
      ["souris", "femelle", 1],
      ["poule", "femelle", 2],
    ]);
    const p = PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE;
    const [loin, proche] = [await aLEcart(t, PORTEE_D_EXPLORATION_CASES), await aLEcart(t, 1)];

    // La plus lointaine part la première, deux explorateurs sans escorte, pour le plus long séjour tout prêt.
    const a = await partie(lancerLExpedition(pool, t, choix(loin, 2, 720), INSTANT));
    const aAuDepart = await retenue(a);
    expect(aAuDepart).toEqual({
      ...loin,
      partLe: INSTANT,
      trajetMinutes: PORTEE_D_EXPLORATION_CASES * p,
      sejourMinutes: 720,
      escorte: {},
      explorateurs: [expect.any(Number), expect.any(Number)],
    });
    // Puis deux escortes, chacune avec ses Bêtes, et la plus proche, sans escorte, pour le plus court séjour.
    const b = await partie(lancerLExpedition(pool, t, choix(await aLEcart(t, 2), 1, SEJOUR_MINUTES.max, [["souris", 2]]), apres(5)));
    const c = await partie(lancerLExpedition(pool, t, choix(proche, 1, SEJOUR_MINUTES.min), apres(10)));
    const d = await partie(lancerLExpedition(pool, t, choix(await aLEcart(t, 3), 1, SEJOUR_MINUTES.max, [["souris", 1], ["poule", 1]]), apres(15)));

    // Chacune a retenu ce qu'on lui a choisi, et rien de celles parties avant ou après elle.
    expect(await retenue(a)).toEqual(aAuDepart);
    expect(await retenue(b)).toMatchObject({ partLe: apres(5), sejourMinutes: SEJOUR_MINUTES.max, escorte: { souris: 2 }, explorateurs: [expect.any(Number)] });
    expect(await retenue(c)).toEqual({ ...proche, partLe: apres(10), trajetMinutes: p, sejourMinutes: SEJOUR_MINUTES.min, escorte: {}, explorateurs: [expect.any(Number)] });
    expect(await retenue(d)).toMatchObject({ partLe: apres(15), sejourMinutes: SEJOUR_MINUTES.max, escorte: { poule: 1, souris: 1 }, explorateurs: [expect.any(Number)] });
    const partis = (await Promise.all([a, b, c, d].map(retenue))).flatMap((x) => x.explorateurs);
    expect(new Set(partis).size).toBe(5);
    // Les Bêtes disponibles retirent l'escorte de chacune : il ne reste qu'une poule.
    expect(await betesDisponibles(pool, t)).toEqual([expect.objectContaining({ id: "poule", disponibles: 1 })]);

    // Chacune vit à ses horaires : la plus proche arrive, séjourne et repart pendant que la plus lointaine marche encore.
    const arriveeDeC = 10 + p;
    const retourDeC = arriveeDeC + SEJOUR_MINUTES.min;
    expect([await phase(t, a, apres(arriveeDeC)), await phase(t, c, apres(arriveeDeC))]).toEqual(["aller", "sejour"]);
    expect([await phase(t, a, apres(retourDeC)), await phase(t, c, apres(retourDeC))]).toEqual(["aller", "retour"]);
    expect([await phase(t, a, apres(PORTEE_D_EXPLORATION_CASES * p)), await phase(t, c, apres(PORTEE_D_EXPLORATION_CASES * p))]).toEqual(["sejour", "retour"]);
    // Le prochain retour (US-0903) est celui de la dernière partie, la plus proche, et non celui de la première.
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 0, total: 5 });
    expect(await prochainRetourDUnExplorateur(pool, t)).toEqual(apres(retourDeC + p));
  });

  it("n'a d'autre plafond que les explorateurs libres : une Expédition par explorateur, puis une de plus dès qu'un explorateur s'ajoute", async () => {
    const t = await nouveauTerritoire();
    const n = 10;
    await explorateurs(t, n);
    const destination = await aLEcart(t, 3);
    const ids: number[] = [];
    for (let i = 0; i < n; i++) ids.push(await partie(lancerLExpedition(pool, t, choix(destination, 1, 240), apres(i))));
    expect((await expeditionsEnCours(pool, t, apres(n))).map((x) => x.id)).toEqual(ids);
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 0, total: n });
    expect(await lancerLExpedition(pool, t, choix(destination, 1, 240), apres(n))).toEqual({ refus: EXPLORATEUR_PLUS_LIBRE });

    // Seul un explorateur libre de plus permet une Expédition de plus.
    await explorateurs(t, 1);
    ids.push(await partie(lancerLExpedition(pool, t, choix(destination, 1, 240), apres(n + 1))));
    expect((await expeditionsEnCours(pool, t, apres(n + 1))).map((x) => x.id)).toEqual(ids);
  });
});
