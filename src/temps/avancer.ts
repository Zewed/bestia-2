// Le mécanisme unique qui fait avancer le temps. Tout ce qui dépend du temps passe par
// avancer() : page ouverte, tâche planifiée ou lecture d'un Territoire par un autre joueur.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { maintenant } from "./horloge";
import { avancerMarquePage, type ElementSuivi } from "./marque-page";

export type Evenement = {
  id: number;
  type: string;
  survientLe: Date;
  donnees: Record<string, unknown>;
};

/** Les règles qui font vivre un élément dans le temps. */
export type Regles = {
  /** L'évolution continue entre deux instants sans événement au milieu (production, consommation…). */
  evoluer?: (client: PoolClient, id: number, depuis: Date, jusqua: Date) => Promise<void>;
  /** Ce que fait chaque type d'événement, à son instant exact. */
  evenements?: Record<string, (client: PoolClient, id: number, evenement: Evenement) => Promise<void>>;
};

/**
 * US-0331 : les avancées en cours, par transaction. Un événement programmé par la transaction d'une avancée
 * (une arrivée qui programme la suivante) lui est remis aussitôt : s'il touche l'élément qui avance et tombe
 * avant la fin de l'intervalle, il est appliqué dans la même avancée, à son rang. Sans requête de plus.
 */
const avanceesEnCours = new WeakMap<Pool | PoolClient, (element: ElementSuivi, id: number, evenement: Evenement) => void>();

/** Programme un événement daté sur un élément. */
export async function programmerEvenement(
  db: Pool | PoolClient,
  element: ElementSuivi,
  id: number,
  survientLe: Date,
  type: string,
  donnees: Record<string, unknown> = {},
): Promise<number> {
  const { rows } = await db.query<{ id: string }>(
    `insert into evenement (element, element_id, survient_le, type, donnees)
     values ($1, $2, $3, $4, $5) returning id`,
    [element, id, survientLe, type, JSON.stringify(donnees)],
  );
  const evenementId = Number(rows[0].id);
  avanceesEnCours.get(db)?.(element, id, { id: evenementId, type, survientLe, donnees });
  return evenementId;
}

/**
 * Avance un élément de son marque-page jusqu'à `jusqua` (maintenant par défaut).
 * Le temps est découpé aux instants exacts des événements : l'élément évolue jusqu'au
 * premier, l'événement est appliqué, puis l'évolution reprend jusqu'au suivant, et ainsi
 * de suite. Un événement programmé en chemin par un autre est appliqué dans la même avancée s'il
 * tombe avant la fin (US-0331). Tout se fait dans une seule transaction : en cas d'échec, rien n'est
 * enregistré. Avancer de dix heures d'un coup donne donc le même résultat qu'avancer dix fois d'une heure.
 */
export async function avancer(
  pool: Pool,
  element: ElementSuivi,
  id: number,
  regles: Regles,
  jusqua: Date = maintenant(),
): Promise<{ depuis: Date; jusqua: Date; evenements: number } | null> {
  let traites = 0;
  const intervalle = await avancerMarquePage(pool, element, id, jusqua, async (client, depuis, fin) => {
    const appliques: { id: number; instant: Date }[] = [];
    const { rows } = await client.query<{ id: string; type: string; survient_le: Date; donnees: Record<string, unknown> }>(
      `select id, type, survient_le, donnees from evenement
       where element = $1 and element_id = $2 and traite_le is null and survient_le <= $3
       order by survient_le, id
       for update`,
      [element, id, fin],
    );
    const file: Evenement[] = rows.map((e) => ({ id: Number(e.id), type: e.type, survientLe: e.survient_le, donnees: e.donnees }));
    // US-0331 : un événement programmé en chemin sur cet élément, avant la fin, prend son rang dans la file :
    // après ceux de même instant, déjà programmés avant lui.
    avanceesEnCours.set(client, (pour, elementId, evenement) => {
      if (pour !== element || elementId !== id || evenement.survientLe.getTime() > fin.getTime()) return;
      const rang = file.findIndex((e) => e.survientLe.getTime() > evenement.survientLe.getTime());
      file.splice(rang === -1 ? file.length : rang, 0, evenement);
    });
    let curseur = depuis;
    try {
      for (let suivant = file.shift(); suivant; suivant = file.shift()) {
        // Un événement daté d'avant le marque-page s'applique au marque-page : le temps ne recule pas.
        const instant = suivant.survientLe.getTime() > curseur.getTime() ? suivant.survientLe : curseur;
        if (instant.getTime() > curseur.getTime()) await regles.evoluer?.(client, id, curseur, instant);
        curseur = instant;
        const appliquer = regles.evenements?.[suivant.type];
        if (!appliquer) throw new Error(`Événement inconnu pour ${element} : « ${suivant.type} ».`);
        await appliquer(client, id, { ...suivant, survientLe: instant });
        appliques.push({ id: suivant.id, instant });
        traites += 1;
      }
    } finally {
      avanceesEnCours.delete(client);
    }
    if (fin.getTime() > curseur.getTime()) await regles.evoluer?.(client, id, curseur, fin);
    // Une seule requête pour marquer tous les événements traités, quel que soit leur nombre.
    if (appliques.length > 0) {
      await client.query(
        `update evenement set traite_le = lot.instant
         from unnest($1::bigint[], $2::timestamptz[]) as lot(id, instant)
         where evenement.id = lot.id`,
        [appliques.map((a) => a.id), appliques.map((a) => a.instant)],
      );
    }
  });
  return intervalle ? { ...intervalle, evenements: traites } : null;
}
