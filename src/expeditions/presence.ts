// La présence des Expéditions sur une Case (US-0915) : de son arrivée à la fin de la durée choisie, une Expédition est
// sur sa Case ; pendant son aller et son retour, elle n'y est pas. C'est là qu'auront lieu ses Rencontres (étape 40). Le
// seul endroit qui dit quelles Expéditions sont présentes sur une Case, à un instant ou pendant une période. Comme les
// apparitions des Bêtes sauvages (src/monde/betes-sauvages.ts, US-0930), elle ne dépend que des horaires fixés au départ
// et du temps du jeu, jamais de l'heure qu'il est : les mêmes Expéditions, lues en direct, au rattrapage ou par la tâche
// planifiée, d'un bloc ou par morceaux, pour une Case seule ou avec d'autres, tant que la ligne de chacune reste en base.
// Rien ne s'écrit : à la fin du séjour, l'Expédition repart seule vers le Foyer. Côté serveur et scripts uniquement.
import type { Pool, PoolClient } from "pg";
import { type HorairesDUneExpedition, sejourDUneExpedition } from "./phase";

/**
 * US-0915 : une Expédition présente sur une Case : son identifiant, son Territoire, et son séjour sur la Case, de son
 * arrivée (comprise) jusqu'à son départ vers le Foyer (exclu), à la fin de la durée choisie.
 */
export type ExpeditionPresente = { id: number; territoireId: number; arrivee: Date; depart: Date };

/**
 * US-0915 : les Expéditions présentes à un moment de [de, a) sur les Cases `caseIds`, Case par Case, dans l'ordre de leur
 * arrivée, de tous les Territoires : arrivées avant la période ou parties après, elles y comptent dès qu'elles y étaient
 * à l'un de ses instants. Le séjour de chacune est celui de sa phase « séjour » (sejourDUneExpedition) : la base n'écarte
 * que les Expéditions qui ne peuvent pas y être, la règle est là. Une Case sans Expédition, ou que le jeu n'a pas, n'en a
 * aucune.
 */
export async function expeditionsPresentesSurLesCases(base: Pool | PoolClient, caseIds: number[], de: Date, a: Date): Promise<Map<number, ExpeditionPresente[]>> {
  const { rows } = await base.query<HorairesDUneExpedition & { id: number; territoireId: number; caseId: number }>(
    `select x.id, x.territoire_id as "territoireId", x.case_id as "caseId",
       x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x
     where x.case_id = any($1::int[]) and x.part_le < $3 and x.part_le + make_interval(mins => x.trajet_minutes + x.sejour_minutes) > $2`,
    [caseIds, de, a],
  );
  const presentes = new Map(caseIds.map((id) => [id, [] as ExpeditionPresente[]]));
  for (const { id, territoireId, caseId, ...horaires } of rows) {
    const sejour = sejourDUneExpedition(horaires);
    // Présente à un instant de la période : son séjour et la période se recouvrent.
    if (sejour && Math.max(sejour.debut.getTime(), de.getTime()) < Math.min(sejour.fin.getTime(), a.getTime())) {
      presentes.get(caseId)!.push({ id, territoireId, arrivee: sejour.debut, depart: sejour.fin });
    }
  }
  for (const liste of presentes.values()) liste.sort((x, y) => x.arrivee.getTime() - y.arrivee.getTime() || x.id - y.id);
  return presentes;
}

/**
 * US-0915 : les Expéditions présentes sur la Case `caseId` à un moment de [de, a), comme expeditionsPresentesSurLesCases ;
 * sans `a`, à l'instant du jeu `de`.
 */
export async function expeditionsPresentesSurLaCase(base: Pool | PoolClient, caseId: number, de: Date, a = new Date(de.getTime() + 1)): Promise<ExpeditionPresente[]> {
  return (await expeditionsPresentesSurLesCases(base, [caseId], de, a)).get(caseId)!;
}
