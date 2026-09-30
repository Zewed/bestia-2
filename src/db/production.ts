import type { Pool } from "pg";

// La base de production : la branche principale du projet Neon « bestia », base neondb.
// Chaque branche Neon a son propre identifiant (timeline) ; celles des prévisualisations
// en diffèrent, et le poste local utilise une autre base (bestia_dev).
const PRODUCTION = { timeline: "2ef3d9ca2dbef4d3407b201804d9325d", database: "neondb" };

export type DatabaseIdentity = { database: string; branch: string | null; isProduction: boolean };

export async function identifyDatabase(pool: Pool): Promise<DatabaseIdentity> {
  const { rows } = await pool.query<{ database: string; timeline: string | null }>(
    "select current_database() as database, current_setting('neon.timeline_id', true) as timeline",
  );
  const { database, timeline } = rows[0];
  return {
    database,
    branch: timeline ? timeline.slice(0, 8) : null,
    isProduction: timeline === PRODUCTION.timeline && database === PRODUCTION.database,
  };
}

/** Hors production, refuse de travailler sur la base de production. */
export async function assertNotProductionDatabase(pool: Pool, refusal: string): Promise<DatabaseIdentity> {
  const identity = await identifyDatabase(pool);
  if (identity.isProduction && process.env.VERCEL_ENV !== "production") {
    throw new Error(
      `${refusal} : cet environnement (${process.env.VERCEL_ENV ?? "local"}) est branché sur la base de production.`,
    );
  }
  return identity;
}
