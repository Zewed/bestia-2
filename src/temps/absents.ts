// La tâche planifiée : elle avance ce que personne n'a ouvert depuis un moment, pour que
// les événements (une Attaque qui arrive, une Famine qui s'annonce) se produisent même
// quand tout le monde est absent.
import "server-only";
import type { Pool } from "pg";
import { getPool } from "@/db";
import { BUDGET_TACHE_MS, RATTRAPER_APRES_MINUTES, TAILLE_LOT } from "@/reglages";
import type { Regles } from "./avancer";
import { maintenant } from "./horloge";
import type { ElementSuivi } from "./marque-page";
import { rattraper } from "./rattraper";

// Les éléments que la tâche fait vivre, avec leur table. Les Territoires s'ajouteront ici.
const SUIVIS: Record<ElementSuivi, string> = { monde: "monde" };

export type Passage = { rattrapes: number; echecs: number; restants: number; dureeMs: number };

/** Un passage de la tâche planifiée : un lot par élément, dans la limite du budget de temps. */
export async function rattraperLesAbsents(
  options: {
    pool?: Pool;
    maintenant?: Date;
    tailleLot?: number;
    budgetMs?: number;
    /** Pour les tests : se limiter à ces éléments, et à ces règles. */
    parmi?: number[];
    regles?: Regles;
  } = {},
): Promise<Passage> {
  const pool = options.pool ?? getPool();
  const instant = options.maintenant ?? maintenant();
  const limite = new Date(instant.getTime() - RATTRAPER_APRES_MINUTES * 60_000);
  const debut = performance.now();
  const budget = options.budgetMs ?? BUDGET_TACHE_MS;
  const passage: Passage = { rattrapes: 0, echecs: 0, restants: 0, dureeMs: 0 };

  for (const [element, table] of Object.entries(SUIVIS) as [ElementSuivi, string][]) {
    const filtre = options.parmi ? "and id = any($3)" : "";
    const parametres: unknown[] = [limite, options.tailleLot ?? TAILLE_LOT];
    if (options.parmi) parametres.push(options.parmi);
    const { rows } = await pool.query<{ id: number }>(
      `select id from ${table} where calcule_jusqu_a < $1 ${filtre} order by calcule_jusqu_a limit $2`,
      parametres,
    );
    for (const { id } of rows) {
      if (performance.now() - debut > budget) break; // la suite au prochain passage
      try {
        await rattraper(element, id, { pool, jusqua: instant, regles: options.regles });
        passage.rattrapes += 1;
      } catch {
        // Un élément en panne n'arrête pas les autres ; il sera repris au prochain passage.
        passage.echecs += 1;
      }
    }
    const reste = await pool.query<{ n: number }>(
      `select count(*)::int as n from ${table} where calcule_jusqu_a < $1 ${options.parmi ? "and id = any($2)" : ""}`,
      options.parmi ? [limite, options.parmi] : [limite],
    );
    passage.restants += reste.rows[0].n;
  }
  passage.dureeMs = Math.round(performance.now() - debut);
  return passage;
}
