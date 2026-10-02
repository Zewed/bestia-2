// La tâche planifiée : elle avance ce que personne n'a ouvert depuis un moment, pour que
// les événements (une Attaque qui arrive, une Famine qui s'annonce) se produisent même
// quand tout le monde est absent.
import "server-only";
import type { Pool } from "pg";
import { getPool } from "@/db";
import { BUDGET_TACHE_MS, JOURNAL_TACHE_JOURS, RATTRAPER_APRES_MINUTES, TAILLE_LOT } from "@/reglages";
import type { Regles } from "./avancer";
import { maintenant } from "./horloge";
import type { ElementSuivi } from "./marque-page";
import { rattraper } from "./rattraper";

// Les éléments que la tâche fait vivre, avec leur table. Les Territoires s'ajouteront ici.
const SUIVIS: Record<ElementSuivi, string> = { monde: "monde" };

export type ErreurDePassage = { element: string; id: number | null; raison: string };
export type Passage = { rattrapes: number; echecs: number; restants: number; dureeMs: number; erreurs: ErreurDePassage[] };

// La raison d'un échec, courte et sans le détail du pilote de base.
function raison(error: unknown): string {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
  return (cause instanceof Error ? cause.message : String(cause)).slice(0, 200);
}

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
  const passage: Passage = { rattrapes: 0, echecs: 0, restants: 0, dureeMs: 0, erreurs: [] };

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
      } catch (error) {
        // Un élément en panne n'arrête pas les autres ; il sera repris au prochain passage.
        passage.echecs += 1;
        passage.erreurs.push({ element, id, raison: raison(error) });
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

/** Note un passage dans le journal et efface ceux de plus de 7 jours. */
export async function journaliserPassage(pool: Pool, debut: Date, passage: Passage): Promise<void> {
  await pool.query(
    `insert into passage_tache (debut, duree_ms, rattrapes, echecs, restants, erreurs)
     values ($1, $2, $3, $4, $5, $6)`,
    [debut, passage.dureeMs, passage.rattrapes, passage.echecs, passage.restants, JSON.stringify(passage.erreurs)],
  );
  await pool.query("delete from passage_tache where debut < $1", [
    new Date(debut.getTime() - JOURNAL_TACHE_JOURS * 24 * 3_600_000),
  ]);
}

/** Un passage complet de la tâche planifiée : rattrapage des absents, puis trace dans le journal. */
export async function passageDeLaTache(pool: Pool = getPool()): Promise<{ ok: boolean; passage: Passage }> {
  const debut = maintenant();
  const top = performance.now();
  let passage: Passage;
  let ok = true;
  try {
    passage = await rattraperLesAbsents({ pool, maintenant: debut });
  } catch (error) {
    ok = false;
    passage = {
      rattrapes: 0,
      echecs: 1,
      restants: 0,
      dureeMs: Math.round(performance.now() - top),
      erreurs: [{ element: "tache", id: null, raison: raison(error) }],
    };
  }
  try {
    await journaliserPassage(pool, debut, passage);
  } catch (error) {
    console.error(`Tâche planifiée : le passage n'a pas pu être noté (${raison(error)}).`);
  }
  return { ok, passage };
}

/** Le dernier passage noté, pour la page de santé. */
export async function dernierPassage(pool: Pool): Promise<Date | null> {
  const { rows } = await pool.query<{ debut: Date }>("select debut from passage_tache order by debut desc limit 1");
  return rows[0]?.debut ?? null;
}
