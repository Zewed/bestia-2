// Les comptes en base (US-0107). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { normaliserEmail } from "./email";
import { calculerEmpreinte } from "./empreinte";

export type CompteCree = { id: number; email: string; creeLe: Date };

/**
 * Crée un compte avec l'adresse sous sa forme normale et l'empreinte du mot de passe.
 * Rend null si l'adresse a déjà un compte : la base garantit qu'il n'y en a qu'un, même
 * pour deux inscriptions au même instant.
 */
export async function creerCompte(base: Pool | PoolClient, email: string, motDePasse: string): Promise<CompteCree | null> {
  const empreinte = await calculerEmpreinte(motDePasse);
  const { rows } = await base.query<CompteCree>(
    `insert into compte (email, empreinte_mot_de_passe) values ($1, $2)
     on conflict (email) do nothing
     returning id, email, cree_le as "creeLe"`,
    [normaliserEmail(email), empreinte],
  );
  return rows[0] ?? null;
}
