// US-0944 : quand une Bête trop forte attaque une Expédition (US-0943), le combat se règle par la somme des forces : la
// Bête l'emporte, l'escorte perd des Bêtes au prorata de ses Espèces, à l'instant de l'attaque, et elles quittent
// l'effectif ; jamais les explorateurs, ni les Bêtes restées au Foyer, ni les Couples ; la Bête reste sur sa Case. Les
// mêmes pertes page ouverte, au retour du joueur ou par la tâche planifiée.
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { type BeteSauvage, betesSauvagesDUneCase, hasardsDeLAttaque } from "@/monde/betes-sauvages";
import { couplesDuTerritoire } from "@/monde/couple";
import { betesDisponibles } from "@/monde/effectif";
import { explorateursDuTerritoire } from "@/monde/explorateurs";
import { type Coordonnees, distance } from "@/monde/hex";
import { PRESENCE_D_UNE_BETE_HEURES, RATTRAPER_APRES_MINUTES } from "@/reglages";
import { rattraperLesAbsents } from "@/temps/absents";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { mondeDEssai, nomDEssai, poolDansLaTransaction, poolDeTest, preparerMondeDeTest, suffixeDEssai, territoireDuCompte, URL_TEST } from "@/test/base";
import { dureeDuTrajetMinutes } from "./allure";
import { chanceDAttaqueParHeure, instantDeLAttaque, type Regime } from "./attaque";
import { type Perte, pertesDuCombat } from "./combat";
import { lancerLExpedition } from "./depart";
import { expeditionsEnCours } from "./en-cours";
import { forceDUneBete } from "./force";
import { retourDUneExpedition } from "./phase";
import { attaquesSubies } from "./rencontres";

const MINUTE_MS = 60_000;
const HEURE = 60;
const JOUR = 24 * HEURE;
/** Le temps, en minutes, où aucune autre Bête n'apparaît avant ou après celle d'un essai : sa présence et 6 heures de marge. */
const CALME = PRESENCE_D_UNE_BETE_HEURES * HEURE + 6 * HEURE;
/** Le séjour d'une Expédition arrivée une heure après la Bête et repartie une heure avant elle. */
const SEJOUR = (PRESENCE_D_UNE_BETE_HEURES - 2) * HEURE;
/**
 * Au plus tant d'Expéditions lancées vers une même Bête pour en trouver une qu'elle attaque : avec un herbivore, à 5 % par
 * heure, une sur cinq environ l'est ; cent sans attaque n'arrivent qu'une fois sur un milliard.
 */
const LANCEES_AU_PLUS = 100;

/** Le Monde d'essai de ce fichier, où naissent ses chefs : la Couronne d'Aube est partagée par toute la suite (src/test/base.ts). */
const MONDE_D_ESSAI = "Essai du combat (US-0944)";

/** Une Espèce telle que l'essai la voit : sa vitesse, la force d'une de ses Bêtes (US-0905) et son régime. */
type Espece = { id: string; vitesse: number; force: number; regime: Regime };
/** Un chef né près d'une Bête rare seule : son Territoire, sa naissance, son Foyer, la Case de la Bête et la Bête. */
type Chef = { territoireId: number; ne: Date; foyer: Coordonnees; place: Coordonnees; caseId: number; bete: BeteSauvage };
/** Une Expédition de l'essai : son identifiant, son départ, son retour prévu, et l'instant où la Bête l'attaque (null : jamais). */
type Lancee = { id: number; partLe: Date; retour: Date; attaque: Date | null };

describe.skipIf(!URL_TEST)("le combat par la somme des forces (US-0944, sur base)", () => {
  let pool: Pool;
  let mondeId: number;
  let graine: number;
  /** Les Espèces du jeu, par identifiant ; la Souris grise et la poule, communes, font les escortes des essais. */
  let especes: Map<string, Espece>;
  const lancement = `combat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const suffixe = suffixeDEssai();
  let numero = 0;
  /** Les Cases déjà prises par un essai de ce fichier : chacun a la sienne, sans Expédition d'un autre. */
  const prises = new Set<number>();
  const apres = (instant: Date, minutes: number) => new Date(instant.getTime() + minutes * MINUTE_MS);

  /**
   * Un chef qui vient de naître dans le Monde d'essai, avec LANCEES_AU_PLUS explorateurs et de quoi les nourrir des
   * semaines, sans Famine qui les fasse partir (US-0326) : son Territoire, sa naissance et son Foyer.
   */
  const naitre = async () => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    expect(await enregistrerNomDeChef(pool, compte.id, nomDEssai("Combat", suffixe, n), Math.random, mondeId)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await territoireDuCompte(pool, compte.id))!;
    await pool.query("insert into habitant (territoire_id, prenom, metier) select $1, 'Essai', 'explorateur' from generate_series(1, $2)", [
      territoireId,
      LANCEES_AU_PLUS,
    ]);
    await pool.query("update stock set limite = 1e9, quantite = 1e8 where territoire_id = $1 and ressource_id in ('viande', 'vegetaux')", [territoireId]);
    const { rows } = await pool.query<{ foyer: Coordonnees }>(
      "select json_build_object('q', f.q, 'r', f.r) as foyer from territoire t join case_du_monde f on f.id = t.foyer_case_id where t.id = $1",
      [territoireId],
    );
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId), foyer: rows[0].foyer };
  };
  /** La `rang`-ième Case libre du Monde du Territoire à `ecart` Cases de son Foyer, hors de ses Bêtes de naissance ; null au-delà de la dernière. */
  const aLEcart = async (territoireId: number, ecart: number, rang = 0) => {
    const { rows } = await pool.query<Coordonnees & { id: number }>(
      `select c.id, c.q, c.r from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join case_du_monde c on c.monde_id = f.monde_id and c.chef_id is null
       where t.id = $1 and greatest(abs(c.q - f.q), abs(c.r - f.r), abs(c.q - f.q + c.r - f.r)) = $2
         and not exists (select 1 from bete_de_naissance n where n.territoire_id = t.id and n.case_id = c.id)
       order by c.q, c.r limit 1 offset $3`,
      [territoireId, ecart, rang],
    );
    return rows[0] ? { place: { q: rows[0].q, r: rows[0].r }, caseId: rows[0].id } : null;
  };
  /**
   * Une Bête sauvage plus rare que commune, seule, sur une Case libre à 2 à 6 Cases du Foyer qu'aucun autre essai n'a
   * prise, apparue dans les 30 jours après `apresLe` : aucune autre n'apparaît sur sa Case de CALME minutes avant elle à
   * CALME minutes après. Sa Case et la Bête ; null si le Foyer n'en a aucune autour de lui.
   */
  const uneBeteRareSeule = async (territoireId: number, apresLe: Date) => {
    const fin = apres(apresLe, 30 * JOUR);
    for (let ecart = 2; ecart <= 6; ecart++) {
      for (let rang = 0, ici = await aLEcart(territoireId, ecart); ici; ici = await aLEcart(territoireId, ecart, ++rang)) {
        if (prises.has(ici.caseId)) continue;
        const betes = await betesSauvagesDUneCase(pool, ici.caseId, apresLe, fin);
        const bete = betes.find(
          (b, i) =>
            b.rareteId !== "commune" &&
            b.arrivee >= apres(apresLe, CALME) &&
            b.arrivee <= apres(fin, -CALME) &&
            (i === 0 || betes[i - 1].arrivee <= apres(b.arrivee, -CALME)) &&
            (i === betes.length - 1 || betes[i + 1].arrivee >= apres(b.arrivee, CALME)),
        );
        if (bete) {
          prises.add(ici.caseId);
          return { ...ici, bete };
        }
      }
    }
    return null;
  };
  /** Un chef né là où une Bête rare se montre seule autour de son Foyer : s'il n'y en a aucune, il renaît ailleurs, jusqu'à trois fois. */
  const naitrePresDUneBeteRare = async (): Promise<Chef> => {
    for (let essai = 0; essai < 3; essai++) {
      const chef = await naitre();
      const ici = await uneBeteRareSeule(chef.territoireId, apres(chef.ne, 3 * JOUR));
      if (ici) return { ...chef, ...ici };
    }
    throw new Error("Aucune Bête rare seule autour de trois Foyers.");
  };
  /**
   * Une escorte de poules et de Souris grises un peu moins forte que la Bête du chef : assez de poules pour en approcher la
   * force, au moins une, puis des Souris grises tant qu'elle reste plus forte. Trop forte pour l'escorte, la Bête ne la suit
   * pas (US-0942), et le combat ne lui coûte que peu de Bêtes.
   */
  const presqueAussiForte = ({ bete }: Chef): Map<string, number> => {
    const [poule, souris, force] = [especes.get("poule")!, especes.get("souris")!, especes.get(bete.especeId)!.force];
    const poules = Math.max(1, Math.floor((force - 1) / poule.force) - 1);
    return new Map([
      ["poule", poules],
      ["souris", Math.floor((force - 1 - poules * poule.force) / souris.force)],
    ]);
  };
  /**
   * Des Expéditions du chef, chacune d'un explorateur et de l'escorte `escorte`, lancées depuis le Foyer pour arriver une
   * heure après la Bête et repartir une heure avant elle, l'une après l'autre jusqu'à ce que la Bête en attaque une,
   * d'après ses tirages : la dernière. L'effectif compte pour elles assez de mâles de chaque Espèce, et une femelle.
   */
  const lancerJusquALAttaque = async (chef: Chef, escorte: Map<string, number>): Promise<Lancee[]> => {
    for (const [especeId, nombre] of escorte) {
      await pool.query("insert into effectif (territoire_id, espece_id, sexe, nombre) values ($1, $2, 'male', $3), ($1, $2, 'femelle', 1)", [
        chef.territoireId,
        especeId,
        nombre * LANCEES_AU_PLUS,
      ]);
    }
    const betes = [...escorte].map(([id, nombre]) => ({ vitesse: especes.get(id)!.vitesse, nombre }));
    const aller = dureeDuTrajetMinutes(distance(chef.foyer, chef.place), betes);
    const arrivee = apres(chef.bete.arrivee, HEURE);
    const partLe = apres(arrivee, -aller);
    const lancees: Lancee[] = [];
    while (!lancees.at(-1)?.attaque) {
      if (lancees.length === LANCEES_AU_PLUS) throw new Error(`${LANCEES_AU_PLUS} Expéditions lancées sans qu'aucune soit attaquée.`);
      const lancee = await lancerLExpedition(pool, chef.territoireId, { destination: chef.place, explorateurs: 1, escorte, sejourMinutes: SEJOUR }, partLe);
      if (!("expeditionId" in lancee)) throw new Error(lancee.refus);
      const id = lancee.expeditionId;
      const attaque = instantDeLAttaque(
        { debut: arrivee, fin: new Date(Math.min(chef.bete.depart.getTime(), apres(arrivee, SEJOUR).getTime())) },
        chanceDAttaqueParHeure(especes.get(chef.bete.especeId)!.regime),
        (heure) => hasardsDeLAttaque({ graine, ...chef.place }, chef.bete.numero, id, heure),
      );
      lancees.push({ id, partLe, retour: retourDUneExpedition({ partLe, trajetMinutes: aller, sejourMinutes: SEJOUR })!, attaque });
    }
    return lancees;
  };
  /** Le Territoire mis à l'heure du jeu `instant` avec `jeu`, comme à l'ouverture d'une page : le mécanisme unique du temps. */
  const rattraperA = (territoireId: number, instant: Date, jeu: Pool = pool) => rattraper("territoire", territoireId, { pool: jeu, jusqua: instant });
  /** Ce que la liste des Expéditions en cours montre de l'escorte de l'Expédition `id` : Espèce par Espèce, combien il en reste. */
  const escorteEnCours = async (territoireId: number, id: number, instant: Date, jeu: Pool = pool) =>
    Object.fromEntries((await expeditionsEnCours(jeu, territoireId, instant)).find((x) => x.id === id)!.escorte.map((e) => [e.id, e.nombre]));
  /** Ce que l'écran d'Expédition propose des Espèces de l'escorte : les disponibles, et les mâles et femelles possédés. */
  const proposees = async (territoireId: number, escorte: Map<string, number>, jeu: Pool = pool) =>
    Object.fromEntries(
      (await betesDisponibles(jeu, territoireId)).filter((e) => escorte.has(e.id)).map((e) => [e.id, { disponibles: e.disponibles, males: e.males, femelles: e.femelles }]),
    );
  /** Ce que l'escorte `escorte` perd au combat contre la Bête du chef, Espèce par Espèce, selon la règle (src/expeditions/combat.ts). */
  const pertesAttendues = ({ bete }: Chef, escorte: Map<string, number>): Perte[] =>
    pertesDuCombat(
      especes.get(bete.especeId)!.force,
      [...escorte].map(([especeId, nombre]) => ({ especeId, nombre, force: especes.get(especeId)!.force })),
    );

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
    mondeId = await mondeDEssai(pool, MONDE_D_ESSAI);
    graine = Number((await pool.query<{ graine: string }>("select graine from monde where id = $1", [mondeId])).rows[0].graine);
    // Les Bêtes emmenées lors d'un lancement précédent de ce fichier sont revenues sur leur Case.
    await pool.query("delete from bete_partie p using case_du_monde c where c.id = p.case_id and c.monde_id = $1", [mondeId]);
    const { rows } = await pool.query<Omit<Espece, "force"> & { attaque: number; vie: number }>("select id, vitesse, attaque, vie, regime from espece");
    especes = new Map(rows.map(({ attaque, vie, ...e }) => [e.id, { ...e, force: forceDUneBete({ attaque, vie }) }]));
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.query("delete from bete_partie p using case_du_monde c where c.id = p.case_id and c.monde_id = $1", [mondeId]);
    await pool.end();
  });

  it("à l'instant de l'attaque, l'escorte perd des Bêtes au prorata de ses Espèces, qui quittent l'effectif ; ni les explorateurs, ni les Bêtes restées au Foyer, ni les Couples ; la Bête reste sur sa Case", async () => {
    const chef = await naitrePresDUneBeteRare();
    const escorte = presqueAussiForte(chef);
    // Les Couples des deux Espèces de l'escorte, réunis avant, à l'abri en Réserve : aucun autre ne se formera au retour.
    await pool.query("insert into couple (territoire_id, espece_id, reuni_le) values ($1, 'poule', $2), ($1, 'souris', $2)", [chef.territoireId, chef.ne]);
    const lancees = await lancerJusquALAttaque(chef, escorte);
    const x = lancees.at(-1)!;
    const le = x.attaque!;
    const pertes = pertesAttendues(chef, escorte);
    // Plus forte que l'escorte, la Bête l'emporte : l'escorte perd au moins une Bête, mais pas toutes, la force lui manquant à peine.
    const perdues = pertes.reduce((n, p) => n + p.nombre, 0);
    expect(perdues).toBeGreaterThan(0);
    expect(perdues).toBeLessThan([...escorte.values()].reduce((n, x) => n + x, 0));

    await rattraperA(chef.territoireId, apres(le, -1 / 60_000));
    const avant = await proposees(chef.territoireId, escorte);
    expect(await escorteEnCours(chef.territoireId, x.id, le)).toEqual(Object.fromEntries(escorte));
    const explorateurs = await explorateursDuTerritoire(pool, chef.territoireId);

    await rattraperA(chef.territoireId, apres(le, 1 / 60_000));
    // L'escorte en cours n'a plus que ses survivantes.
    expect(await escorteEnCours(chef.territoireId, x.id, le)).toEqual(
      Object.fromEntries([...escorte].map(([id, nombre]) => [id, nombre - (pertes.find((p) => p.especeId === id)?.nombre ?? 0)])),
    );
    // Les Bêtes perdues ont quitté l'effectif, prises au sexe le plus nombreux : les mâles ; celles du Foyer, toujours là.
    expect(await proposees(chef.territoireId, escorte)).toEqual(
      Object.fromEntries(
        Object.entries(avant).map(([id, p]) => [id, { ...p, males: p.males - (pertes.find((x) => x.especeId === id)?.nombre ?? 0) }]),
      ),
    );
    // Les explorateurs n'ont rien perdu ; les Couples non plus.
    expect(await explorateursDuTerritoire(pool, chef.territoireId)).toEqual(explorateurs);
    expect(await couplesDuTerritoire(pool, chef.territoireId)).toEqual([
      { especeId: "poule", reuniLe: chef.ne },
      { especeId: "souris", reuniLe: chef.ne },
    ]);
    // La Bête sauvage n'a rien perdu : elle reste sur sa Case jusqu'à la fin de sa durée.
    expect((await betesSauvagesDUneCase(pool, chef.caseId, le, apres(le, 1))).map((b) => b.numero)).toEqual([chef.bete.numero]);
    expect(await attaquesSubies(pool, x.id)).toEqual([expect.objectContaining({ especeId: chef.bete.especeId, le })]);

    // Au retour, l'escorte rentre sans les Bêtes perdues : l'écran d'Expédition en propose d'autant moins.
    const retour = new Date(Math.max(...lancees.map((l) => l.retour.getTime())));
    await rattraperA(chef.territoireId, retour);
    expect(await proposees(chef.territoireId, escorte)).toEqual(
      Object.fromEntries(
        [...escorte].map(([id, nombre]) => {
          const perdue = pertes.find((p) => p.especeId === id)?.nombre ?? 0;
          return [id, { disponibles: nombre * LANCEES_AU_PLUS + 1 - perdue, males: nombre * LANCEES_AU_PLUS - perdue, femelles: 1 }];
        }),
      ),
    );
    expect(await explorateursDuTerritoire(pool, chef.territoireId)).toEqual({ libres: LANCEES_AU_PLUS, total: LANCEES_AU_PLUS });
  }, 60_000);

  it("attaquée sans escorte, l'Expédition ne perd aucune Bête, et celles du Foyer restent toutes", async () => {
    const chef = await naitrePresDUneBeteRare();
    const lancees = await lancerJusquALAttaque(chef, new Map());
    await pool.query("insert into effectif (territoire_id, espece_id, sexe, nombre) values ($1, 'souris', 'male', 3), ($1, 'souris', 'femelle', 2)", [
      chef.territoireId,
    ]);
    const x = lancees.at(-1)!;
    await rattraperA(chef.territoireId, apres(x.attaque!, 1));
    expect(await attaquesSubies(pool, x.id)).toEqual([expect.objectContaining({ le: x.attaque })]);
    expect(await proposees(chef.territoireId, new Map([["souris", 0]]))).toEqual({ souris: { disponibles: 5, males: 3, femelles: 2 } });
    expect(await escorteEnCours(chef.territoireId, x.id, x.attaque!)).toEqual({});
  }, 60_000);

  describe("les mêmes pertes, au même instant, page ouverte, au retour du joueur ou par la tâche planifiée", () => {
    /** Ce que le combat laisse au Territoire : chaque escorte, et ses pertes, et l'effectif de chaque Espèce, par sexe. */
    const bilan = async (jeu: Pool, territoireId: number) => ({
      escortes: (
        await jeu.query(
          `select s.expedition_id, s.espece_id, s.nombre, s.perdues from expedition_escorte s join expedition x on x.id = s.expedition_id
           where x.territoire_id = $1 order by 1, 2`,
          [territoireId],
        )
      ).rows,
      effectif: (await jeu.query("select espece_id, sexe, nombre from effectif where territoire_id = $1 order by 1, 2", [territoireId])).rows,
    });
    /** L'essai dans une transaction annulée ensuite, où chaque transaction du jeu devient un point de reprise : le suivant repart du même état. */
    const enEssai = async <T,>(essai: (jeu: Pool) => Promise<T>): Promise<T> => {
      const client: PoolClient = await pool.connect();
      try {
        await client.query("begin");
        return await essai(poolDansLaTransaction(client));
      } finally {
        await client.query("rollback");
        client.release();
      }
    };

    it("le même combat, et les mêmes Bêtes perdues, quel que soit le découpage du temps", async () => {
      const chef = await naitrePresDUneBeteRare();
      const escorte = presqueAussiForte(chef);
      const lancees = await lancerJusquALAttaque(chef, escorte);
      const [debut, fin] = [lancees[0].partLe, apres(new Date(Math.max(...lancees.map((l) => l.retour.getTime()))), HEURE)];
      const le = lancees.at(-1)!.attaque!;
      await rattraperA(chef.territoireId, debut);
      const bilans = [
        // Page ouverte toutes les sept minutes, et de part et d'autre de l'attaque.
        await enEssai(async (jeu) => {
          const pas = new Set([le.getTime(), le.getTime() + 1]);
          for (let t = debut.getTime(); t < fin.getTime(); t += 7 * MINUTE_MS + 3_123) pas.add(t);
          for (const t of [...pas, fin.getTime()].sort((a, b) => a - b)) await rattraperA(chef.territoireId, new Date(t), jeu);
          return bilan(jeu, chef.territoireId);
        }),
        // D'un bloc, au retour du joueur.
        await enEssai(async (jeu) => {
          await rattraperA(chef.territoireId, fin, jeu);
          return bilan(jeu, chef.territoireId);
        }),
        // Par la seule tâche planifiée, toutes les heures.
        await enEssai(async (jeu) => {
          for (let t = debut.getTime(); t <= fin.getTime() + (HEURE + RATTRAPER_APRES_MINUTES) * MINUTE_MS; t += HEURE * MINUTE_MS) {
            await rattraperLesAbsents({ pool: jeu, maintenant: new Date(t), parmi: { territoire: [chef.territoireId] } });
          }
          return bilan(jeu, chef.territoireId);
        }),
      ];
      expect(bilans[1]).toEqual(bilans[0]);
      expect(bilans[2]).toEqual(bilans[0]);
      // Seule l'Expédition attaquée a perdu des Bêtes, celles que dit la règle.
      const pertes = new Map(pertesAttendues(chef, escorte).map((p) => [p.especeId, p.nombre]));
      expect(bilans[0].escortes).toEqual(
        lancees.flatMap((l) =>
          [...escorte].map(([id, nombre]) => ({ expedition_id: l.id, espece_id: id, nombre, perdues: l.attaque ? (pertes.get(id) ?? 0) : 0 })).sort((a, b) => (a.espece_id < b.espece_id ? -1 : 1)),
        ),
      );
    }, 60_000);
  });
});
