import type { Pool } from "pg";
import { connectionFailureReason, isConnectionError } from "./db";
import { identifyDatabase } from "./db/production";
import { rattraper } from "./temps/rattraper";

export type Health = {
  statut: "ok" | "panne";
  version: string;
  environnement: string;
  base:
    | { statut: "ok"; production: boolean; latenceMs: number; monde: string | null; calculeJusquA: string | null }
    | { statut: "panne"; code: string; raison: string };
};

/**
 * L'état du jeu et de sa base, pour /sante. Ne contient jamais l'adresse de la base,
 * une clé ou une variable : seulement des codes et des phrases écrites ici.
 */
export async function checkHealth(getPool: () => Pool): Promise<{ httpStatus: number; body: Health }> {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const environnement = process.env.VERCEL_ENV ?? "local";
  const started = performance.now();
  try {
    const pool = getPool();
    const identity = await identifyDatabase(pool);
    const monde = await pool.query<{ id: number; nom: string }>("select id, nom from monde order by id limit 1");
    // Le Monde est rattrapé avant d'être lu, comme sur toute page du jeu.
    const calcule = monde.rows[0] ? await rattraper("monde", monde.rows[0].id, { pool }) : null;
    return {
      httpStatus: 200,
      body: {
        statut: "ok",
        version,
        environnement,
        base: {
          statut: "ok",
          production: identity.isProduction,
          latenceMs: Math.round(performance.now() - started),
          monde: monde.rows[0]?.nom ?? null,
          calculeJusquA: calcule?.toISOString() ?? null,
        },
      },
    };
  } catch (error) {
    return { httpStatus: 503, body: { statut: "panne", version, environnement, base: describeFailure(error) } };
  }
}

function describeFailure(error: unknown): { statut: "panne"; code: string; raison: string } {
  const code = (error as { code?: unknown } | null)?.code;
  if (error instanceof Error && error.name === "MissingEnvError") {
    return { statut: "panne", code: "VARIABLE_MANQUANTE", raison: "l'adresse de la base n'est pas configurée" };
  }
  if (error instanceof Error && error.name === "RattrapageError") {
    return { statut: "panne", code: "RATTRAPAGE_ECHOUE", raison: "le Monde n'a pas pu être mis à jour" };
  }
  if (isConnectionError(error)) {
    return {
      statut: "panne",
      code: typeof code === "string" ? code : "BASE_INJOIGNABLE",
      raison: connectionFailureReason(error),
    };
  }
  return { statut: "panne", code: typeof code === "string" ? code : "ERREUR_INATTENDUE", raison: "la base a renvoyé une erreur" };
}
