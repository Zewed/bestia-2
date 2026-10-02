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
  return Number(rows[0].id);
}

/**
 * Avance un élément de son marque-page jusqu'à `jusqua` (maintenant par défaut).
 * Le temps est découpé aux instants exacts des événements : l'élément évolue jusqu'au
 * premier, l'événement est appliqué, puis l'évolution reprend jusqu'au suivant, et ainsi
 * de suite. Tout se fait dans une seule transaction : en cas d'échec, rien n'est enregistré.
 * Avancer de dix heures d'un coup donne donc le même résultat qu'avancer dix fois d'une heure.
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
    const { rows } = await client.query<{ id: string; type: string; survient_le: Date; donnees: Record<string, unknown> }>(
      `select id, type, survient_le, donnees from evenement
       where element = $1 and element_id = $2 and traite_le is null and survient_le <= $3
       order by survient_le, id
       for update`,
      [element, id, fin],
    );
    let curseur = depuis;
    for (const ligne of rows) {
      // Un événement daté d'avant le marque-page s'applique au marque-page : le temps ne recule pas.
      const instant = ligne.survient_le.getTime() > curseur.getTime() ? ligne.survient_le : curseur;
      if (instant.getTime() > curseur.getTime()) await regles.evoluer?.(client, id, curseur, instant);
      curseur = instant;
      const appliquer = regles.evenements?.[ligne.type];
      if (!appliquer) throw new Error(`Événement inconnu pour ${element} : « ${ligne.type} ».`);
      await appliquer(client, id, { id: Number(ligne.id), type: ligne.type, survientLe: instant, donnees: ligne.donnees });
      await client.query("update evenement set traite_le = $2 where id = $1", [ligne.id, instant]);
      traites += 1;
    }
    if (fin.getTime() > curseur.getTime()) await regles.evoluer?.(client, id, curseur, fin);
  });
  return intervalle ? { ...intervalle, evenements: traites } : null;
}
