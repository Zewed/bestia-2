// Les Bêtes sauvages (US-0925) : le Monde en fait apparaître de temps en temps sur chaque Case hors des Territoires, une
// Bête par apparition, que les joueurs soient là ou non ; plusieurs peuvent s'y trouver en même temps. Rien n'en est
// écrit en base : les apparitions d'une Case sont une fonction de la graine de son Monde, de sa place et du temps du
// jeu, calculée à la demande, pour une Case et une période. Aucune ne se voit sur la carte : seules les Expéditions
// présentes sur sa Case la verront (étape 40). Côté serveur et scripts uniquement.
import type { Pool, PoolClient } from "pg";
import { APPARITIONS_PAR_CASE_PAR_JOUR } from "@/reglages";
import { hacher } from "./couronne";
import type { Coordonnees } from "./hex";

/** Le temps du jeu se découpe en tranches d'une heure, depuis le 1er janvier 1970 : chaque Case tire à part celles de chacune. */
const TRANCHE_MS = 3_600_000;
const JOUR_MS = 86_400_000;
/** Au plus 100 apparitions par Case et par tranche (en moyenne, bien moins d'une), pour que leurs numéros ne se mêlent jamais. */
const PAR_TRANCHE = 100;
/** Ce que chaque tranche, puis chaque apparition, tire de son côté. */
const TIRAGE = { nombre: 1, moment: 2 } as const;

/**
 * US-0925 : une Bête sauvage apparue sur une Case : son numéro, propre à sa Case, qui ne revient jamais, et l'instant du
 * jeu où elle apparaît.
 */
export type Apparition = { numero: number; arrivee: Date };

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
 * US-0925 : les Bêtes sauvages apparues dans [de, a) sur les Cases `caseIds`, Case par Case, chacune calculée seule, à la
 * demande. Aucune sur une Case qui appartient à un Territoire ; une Case inconnue n'en a pas non plus.
 */
export async function betesSauvagesDesCases(base: Pool | PoolClient, caseIds: number[], de: Date, a: Date): Promise<Map<number, Apparition[]>> {
  const { rows } = await base.query<Coordonnees & { id: number; graine: string; libre: boolean }>(
    `select c.id, c.q, c.r, m.graine, c.chef_id is null as libre
     from case_du_monde c join monde m on m.id = c.monde_id
     where c.id = any($1::int[])`,
    [caseIds],
  );
  const parCase = new Map(rows.map((c) => [c.id, c]));
  return new Map(
    caseIds.map((id) => {
      const c = parCase.get(id);
      return [id, c?.libre ? apparitions(Number(c.graine), c, de, a) : []];
    }),
  );
}

/** US-0925 : les Bêtes sauvages apparues dans [de, a) sur la Case `caseId`, comme betesSauvagesDesCases. */
export async function betesSauvagesDUneCase(base: Pool | PoolClient, caseId: number, de: Date, a: Date): Promise<Apparition[]> {
  return (await betesSauvagesDesCases(base, [caseId], de, a)).get(caseId)!;
}
