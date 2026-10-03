// Les sessions (US-0116) : ce qui garde un joueur connecté. Le navigateur garde un jeton tiré
// au hasard ; la base n'en garde que l'empreinte. Côté serveur uniquement.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { SESSION_JOURS } from "@/reglages";

type Base = Pool | PoolClient;

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Ouvre une session pour le compte ; rend le jeton à confier au navigateur, et sa fin. */
export async function ouvrirSession(base: Base, compteId: number): Promise<{ jeton: string; expireLe: Date }> {
  const jeton = randomBytes(32).toString("base64url");
  const { rows } = await base.query<{ expire_le: Date }>(
    `insert into session (compte_id, empreinte_jeton, expire_le)
     values ($1, $2, now() + make_interval(days => $3))
     returning expire_le`,
    [compteId, empreinte(jeton), SESSION_JOURS],
  );
  return { jeton, expireLe: rows[0].expire_le };
}

/** Le compte d'une session encore valable, ou null (jeton inconnu ou session expirée). */
export async function compteDeLaSession(base: Base, jeton: string): Promise<{ id: number; email: string } | null> {
  const { rows } = await base.query<{ id: number; email: string }>(
    `select c.id, c.email from session s join compte c on c.id = s.compte_id
     where s.empreinte_jeton = $1 and s.expire_le > now()`,
    [empreinte(jeton)],
  );
  return rows[0] ?? null;
}
