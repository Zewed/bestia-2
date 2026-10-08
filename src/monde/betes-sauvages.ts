// Les Bêtes sauvages (US-0925) : le Monde en fait apparaître de temps en temps sur chaque Case hors des Territoires, une
// Bête par apparition, que les joueurs soient là ou non ; plusieurs peuvent s'y trouver en même temps. Rien n'en est
// écrit en base : les apparitions d'une Case sont une fonction de la graine de son Monde, de sa place et du temps du
// jeu, calculée à la demande, pour une Case et une période. Aucune ne se voit sur la carte : seules les Expéditions
// présentes sur sa Case la verront (étape 40). US-0926 : chacune reste un temps sur sa Case, puis s'en va pour toujours ;
// seule une Bête partie plus tôt, en suivant une Expédition, laisse une trace en base (bete_partie). US-0927 : sa Rareté
// se tire selon l'Anneau de sa Case. Côté serveur et scripts uniquement.
import type { Pool, PoolClient } from "pg";
import { type ChancesDeRarete, lireRaretesParAnneau } from "@/donnees/jeux";
import { APPARITIONS_PAR_CASE_PAR_JOUR, PRESENCE_D_UNE_BETE_HEURES } from "@/reglages";
import { anneauDUneCase, type FormeDuMonde } from "./anneaux";
import { hacher } from "./couronne";
import type { Coordonnees } from "./hex";

/** Le temps du jeu se découpe en tranches d'une heure, depuis le 1er janvier 1970 : chaque Case tire à part celles de chacune. */
const TRANCHE_MS = 3_600_000;
const JOUR_MS = 86_400_000;
/** Au plus 100 apparitions par Case et par tranche (en moyenne, bien moins d'une), pour que leurs numéros ne se mêlent jamais. */
const PAR_TRANCHE = 100;
/** Ce que chaque tranche, puis chaque apparition, tire de son côté. */
const TIRAGE = { nombre: 1, moment: 2, rarete: 3 } as const;
/** US-0926 : combien de temps une Bête reste sur sa Case, en temps du jeu. */
const PRESENCE_MS = PRESENCE_D_UNE_BETE_HEURES * TRANCHE_MS;

/**
 * US-0925 : une Bête sauvage apparue sur une Case : son numéro, propre à sa Case, qui ne revient jamais, et l'instant du
 * jeu où elle apparaît.
 */
export type Apparition = { numero: number; arrivee: Date };

/**
 * US-0926 : une Bête sauvage sur sa Case, de son arrivée jusqu'à son départ (exclu) : PRESENCE_D_UNE_BETE_HEURES heures
 * plus tard, la même durée pour toutes, ou plus tôt si elle a suivi une Expédition. US-0927 : sa Rareté.
 */
export type BeteSauvage = Apparition & { depart: Date; rareteId: string };

/**
 * Une Case telle que les Bêtes sauvages la voient : sa place, la graine de son Monde et (US-0927) son Anneau, de 1, la
 * Couronne, à ANNEAUX_DU_MONDE, le Cœur sauvage.
 */
export type CaseSauvage = Coordonnees & { graine: number; anneau: number };

/** US-0927 : les chances de chaque Rareté, Anneau par Anneau, lues une fois pour toutes dans les données du jeu. */
let chancesLues: ChancesDeRarete[] | undefined;
export function raretesParAnneau(): ChancesDeRarete[] {
  return (chancesLues ??= lireRaretesParAnneau());
}

/** US-0927 : la Rareté que le hasard `hasard`, de 0 à 1, tire aux chances d'un Anneau. */
export function tirerUneRarete(chances: ChancesDeRarete, hasard: number): string {
  let cumul = 0;
  for (const { rareteId, pourcent } of chances) {
    cumul += pourcent / 100;
    if (hasard < cumul) return rareteId;
  }
  // Ce que les arrondis laissent au-delà de 100 % revient à la dernière.
  return chances.at(-1)!.rareteId;
}

/** Le nombre d'apparitions d'une tranche, de moyenne `moyenne` : une loi de Poisson, celle d'apparitions indépendantes. */
function combien(moyenne: number, hasard: number): number {
  let [n, probabilite] = [0, Math.exp(-moyenne)];
  let cumul = probabilite;
  while (hasard >= cumul && n < PAR_TRANCHE - 1) {
    n++;
    probabilite *= moyenne / n;
    cumul += probabilite;
  }
  return n;
}

/**
 * US-0925 : les apparitions de la Case `c` d'un Monde de graine `graine` dont l'instant tombe dans [de, a), dans l'ordre
 * du temps : en moyenne `parJour` par jour du jeu, à des moments au hasard. Elles ne dépendent que de la graine, de la
 * Case et du temps du jeu, jamais de l'heure qu'il est : les mêmes, calculées en direct ou après coup, d'un bloc ou par
 * morceaux.
 */
export function apparitions(graine: number, c: Coordonnees, de: Date, a: Date, parJour = APPARITIONS_PAR_CASE_PAR_JOUR): Apparition[] {
  const moyenne = (parJour * TRANCHE_MS) / JOUR_MS;
  const liste: Apparition[] = [];
  for (let tranche = Math.floor(de.getTime() / TRANCHE_MS); tranche * TRANCHE_MS < a.getTime(); tranche++) {
    const nombre = combien(moyenne, hacher(graine, c.q, c.r, tranche, TIRAGE.nombre));
    const moments = Array.from({ length: nombre }, (_, i) => tranche * TRANCHE_MS + Math.floor(hacher(graine, c.q, c.r, tranche, i, TIRAGE.moment) * TRANCHE_MS));
    // Numérotées dans l'ordre où elles arrivent : les numéros d'une Case croissent avec le temps.
    moments.sort((x, y) => x - y);
    moments.forEach((arrivee, rang) => {
      if (arrivee >= de.getTime() && arrivee < a.getTime()) liste.push({ numero: tranche * PAR_TRANCHE + rang, arrivee: new Date(arrivee) });
    });
  }
  return liste;
}

/**
 * US-0926 : les Bêtes sauvages de la Case `laCase` présentes à un moment de [de, a), dans l'ordre de leur arrivée.
 * Chacune reste PRESENCE_D_UNE_BETE_HEURES heures, puis s'en va ; celle qui est partie plus tôt (`parties` : son numéro,
 * l'instant de son départ) n'est plus là dès cet instant. Aucune ne revient : son numéro ne sert qu'une fois. US-0927 : la
 * Rareté de chacune est tirée aux chances de l'Anneau de la Case (`chances`, celles des données du jeu).
 */
export function betesSauvages(
  laCase: CaseSauvage,
  de: Date,
  a: Date,
  { parties = new Map(), chances = raretesParAnneau() }: { parties?: ReadonlyMap<number, Date>; chances?: ChancesDeRarete[] } = {},
): BeteSauvage[] {
  const { graine, q, r, anneau } = laCase;
  return apparitions(graine, laCase, new Date(de.getTime() - PRESENCE_MS + 1), a)
    .map((x) => {
      const partie = parties.get(x.numero);
      const fin = x.arrivee.getTime() + PRESENCE_MS;
      const rareteId = tirerUneRarete(chances[anneau - 1], hacher(graine, q, r, x.numero, TIRAGE.rarete));
      return { ...x, depart: new Date(partie ? Math.min(fin, partie.getTime()) : fin), rareteId };
    })
    .filter((b) => b.depart.getTime() > de.getTime());
}

/** Une Case lue en base : sa place, la graine et la forme de son Monde, si elle est libre, et les Bêtes qui en sont parties. */
type CaseEnBase = Coordonnees & { id: number; graine: string; forme: FormeDuMonde; libre: boolean; parties: { numero: string; partie_le: string }[] };

/**
 * US-0925 : les Bêtes sauvages présentes à un moment de [de, a) sur les Cases `caseIds`, Case par Case, chacune calculée
 * seule, à la demande. Aucune sur une Case qui appartient à un Territoire ; une Case inconnue n'en a pas non plus.
 * US-0926 : une Bête partie en suivant une Expédition n'y est plus dès son départ. US-0927 : l'Anneau de chaque Case se
 * tire de la forme de son Monde.
 */
export async function betesSauvagesDesCases(base: Pool | PoolClient, caseIds: number[], de: Date, a: Date): Promise<Map<number, BeteSauvage[]>> {
  const { rows } = await base.query<CaseEnBase>(
    `select c.id, c.q, c.r, m.graine, c.chef_id is null as libre,
       json_build_object('rayon', m.rayon, 'anneauxCouronne', m.anneaux_couronne, 'rayonCoeur', m.rayon_coeur) as forme,
       coalesce((select json_agg(json_build_object('numero', p.numero, 'partie_le', p.partie_le)) from bete_partie p where p.case_id = c.id), '[]') as parties
     from case_du_monde c join monde m on m.id = c.monde_id
     where c.id = any($1::int[])`,
    [caseIds],
  );
  const parCase = new Map(rows.map((c) => [c.id, c]));
  return new Map(
    caseIds.map((id) => {
      const c = parCase.get(id);
      if (!c?.libre) return [id, []];
      const parties = new Map(c.parties.map((p) => [Number(p.numero), new Date(p.partie_le)]));
      return [id, betesSauvages({ q: c.q, r: c.r, graine: Number(c.graine), anneau: anneauDUneCase(c, c.forme) }, de, a, { parties })];
    }),
  );
}

/** US-0925 : les Bêtes sauvages présentes à un moment de [de, a) sur la Case `caseId`, comme betesSauvagesDesCases. */
export async function betesSauvagesDUneCase(base: Pool | PoolClient, caseId: number, de: Date, a: Date): Promise<BeteSauvage[]> {
  return (await betesSauvagesDesCases(base, [caseId], de, a)).get(caseId)!;
}

/**
 * US-0926 : la Bête `numero` de la Case `caseId` la quitte à l'instant du jeu `instant`, pour suivre une Expédition
 * (étape 40) : elle n'y est plus dès cet instant, pour toujours, et personne d'autre ne peut plus la rencontrer. C'est la
 * seule écriture des Bêtes sauvages. Rend false, sans rien écrire, si elle n'était pas là à cet instant (pas encore
 * arrivée, déjà partie, ou emmenée par une autre Expédition, même au même moment).
 */
export async function emmenerUneBete(base: Pool | PoolClient, caseId: number, numero: number, instant: Date): Promise<boolean> {
  const presentes = await betesSauvagesDUneCase(base, caseId, instant, new Date(instant.getTime() + 1));
  if (!presentes.some((b) => b.numero === numero)) return false;
  const { rowCount } = await base.query("insert into bete_partie (case_id, numero, partie_le) values ($1, $2, $3) on conflict do nothing", [caseId, numero, instant]);
  return rowCount === 1;
}
