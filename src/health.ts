import type { Pool } from "pg";
import { connectionFailureReason, isConnectionError } from "./db";
import { identifyDatabase } from "./db/production";

export type Health = {
  statut: "ok" | "panne";
  version: string;
  environnement: string;
  base:
    | { statut: "ok"; production: boolean; latenceMs: number }
    | { statut: "panne"; code: string; raison: string };
};

/**
 * L'état du jeu et de sa base, pour /sante. Ne contient jamais l'adresse de la base,
 * une clé ou une variable : seulement des codes et des phrases écrites ici.
 */
export async function checkHealth(getPool: () => Pool): Promise<{ httpStatus: number; body: Health }> {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const environnement = process.env.VERCEL_ENV ?? "local";
  const started = Date.now();
  try {
    const identity = await identifyDatabase(getPool());
    return {
      httpStatus: 200,
      body: {
        statut: "ok",
        version,
        environnement,
        base: { statut: "ok", production: identity.isProduction, latenceMs: Date.now() - started },
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
  if (isConnectionError(error)) {
    return {
      statut: "panne",
      code: typeof code === "string" ? code : "BASE_INJOIGNABLE",
      raison: connectionFailureReason(error),
    };
  }
  return { statut: "panne", code: typeof code === "string" ? code : "ERREUR_INATTENDUE", raison: "la base a renvoyé une erreur" };
}
