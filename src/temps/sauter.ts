// US-0038 : avancer l'heure du jeu d'un bloc, pour tester une longue absence sans attendre.
// Hors production seulement. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { definirAncre, heureReelle, type Ancre } from "./horloge";

/** Les sauts proposés par la page de contrôle. */
export const SAUTS = { heure: 3_600_000, jour: 86_400_000, semaine: 604_800_000 } as const;
export type Saut = keyof typeof SAUTS;

/**
 * Avance l'heure du jeu de `duree` millisecondes, d'un bloc : l'ancre de l'horloge est déplacée en
 * base, et dans ce serveur. Les autres serveurs déjà démarrés la relisent à leur prochain démarrage.
 * Refusé en production.
 */
export async function sauterDansLeTemps(pool: Pool, duree: number, env: Record<string, string | undefined> = process.env): Promise<Ancre> {
  if (env.VERCEL_ENV === "production") throw new Error("Le temps ne se saute pas en production.");
  if (!(duree > 0)) throw new Error("Un saut dans le temps va toujours vers l'avant.");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const reel = heureReelle();
    const { rows } = await client.query<{ facteur: number; reel_ancre: Date; jeu_ancre: Date }>(
      "select facteur, reel_ancre, jeu_ancre from horloge where id = 1 for update",
    );
    // L'ancre passe à l'heure du jeu de cet instant, avancée du saut, à la même vitesse.
    const actuelle = rows[0] ? { facteur: rows[0].facteur, reel: rows[0].reel_ancre.getTime(), jeu: rows[0].jeu_ancre.getTime() } : { facteur: 1, reel, jeu: reel };
    const ancre: Ancre = { facteur: actuelle.facteur, reel, jeu: actuelle.jeu + Math.max(0, reel - actuelle.reel) * actuelle.facteur + duree };
    await client.query(
      `insert into horloge (id, facteur, reel_ancre, jeu_ancre) values (1, $1, $2, $3)
       on conflict (id) do update set reel_ancre = excluded.reel_ancre, jeu_ancre = excluded.jeu_ancre`,
      [ancre.facteur, new Date(ancre.reel), new Date(ancre.jeu)],
    );
    await client.query("commit");
    definirAncre(ancre);
    return ancre;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
