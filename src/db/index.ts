import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = env("DATABASE_URL");
    // Échouer vite plutôt que d'attendre sans fin une base qui ne répond pas.
    pool = new Pool({ connectionString: withStrictSsl(connectionString), connectionTimeoutMillis: 5_000 });
  }
  return pool;
}

// Neon fournit sslmode=require, dont le sens va s'affaiblir dans pg 9 : on exige
// dès maintenant la vérification complète du certificat, ce que pg fait déjà.
function withStrictSsl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslmode") === "require") url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function getDb() {
  return drizzle(getPool());
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

export class DatabaseUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DatabaseUnavailableError";
  }
}

const PG_CODES: Record<string, string> = {
  "28P01": "identifiant ou mot de passe refusé",
  "3D000": "cette base n'existe pas",
  "28000": "accès refusé",
};

const NETWORK_CODES: Record<string, string> = {
  ECONNREFUSED: "le serveur refuse la connexion",
  ENOTFOUND: "l'adresse du serveur est introuvable",
  ETIMEDOUT: "le serveur ne répond pas",
  ECONNRESET: "la connexion a été coupée",
};

/** Traduit une erreur du pilote en message lisible, sans jamais y recopier l'adresse de la base. */
export function explainDatabaseError(error: unknown): DatabaseUnavailableError {
  if (error instanceof DatabaseUnavailableError) return error;
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  const reason =
    (code && (PG_CODES[code] ?? NETWORK_CODES[code])) ??
    (/timeout/i.test(message) ? "le serveur ne répond pas" : `erreur inattendue (${code ?? message})`);
  return new DatabaseUnavailableError(
    `Connexion à la base impossible : ${reason}. Vérifiez DATABASE_URL dans .env.local.`,
    { cause: error },
  );
}
