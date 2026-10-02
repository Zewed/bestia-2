// Le rattrapage avant toute lecture : une page qui montre un élément, un joueur qui en
// espionne ou en attaque un autre, la tâche planifiée. L'élément est d'abord avancé
// jusqu'à maintenant, puis lu : il est toujours vu tel qu'il est à la seconde près.
import "server-only";
import type { Pool } from "pg";
import { getPool } from "@/db";
import { avancer, type Regles } from "./avancer";
import { maintenant } from "./horloge";
import { lireMarquePage, type ElementSuivi } from "./marque-page";
import { REGLES } from "./regles";

export class RattrapageError extends Error {
  constructor(element: ElementSuivi, id: number, options?: { cause?: unknown }) {
    super(`Impossible de mettre ${element} ${id} à jour.`, options);
    this.name = "RattrapageError";
  }
}

/** Avance un élément jusqu'à maintenant et renvoie l'instant jusqu'auquel il est calculé. */
export async function rattraper(
  element: ElementSuivi,
  id: number,
  options: { pool?: Pool; regles?: Regles; jusqua?: Date } = {},
): Promise<Date> {
  const pool = options.pool ?? getPool();
  const debut = performance.now();
  try {
    const fait = await avancer(pool, element, id, options.regles ?? REGLES[element], options.jusqua ?? maintenant());
    if (fait) {
      // La durée de chaque rattrapage est notée dans le journal.
      const heures = (fait.jusqua.getTime() - fait.depuis.getTime()) / 3_600_000;
      console.info(
        `Rattrapage ${element} ${id} : ${heures.toFixed(2)} h et ${fait.evenements} événement(s) en ${Math.round(performance.now() - debut)} ms.`,
      );
    }
    return await lireMarquePage(pool, element, id);
  } catch (error) {
    throw new RattrapageError(element, id, { cause: error });
  }
}
