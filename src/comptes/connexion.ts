// La vérification des identifiants à la connexion (US-0116). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { normaliserEmail } from "./email";
import { verifierEmpreinte } from "./empreinte";

type Base = Pool | PoolClient;

/** Le compte si l'adresse (sous sa forme normale) et le mot de passe sont justes, sinon null. */
export async function verifierIdentifiants(base: Base, email: string, motDePasse: string): Promise<{ id: number; email: string } | null> {
  const { rows } = await base.query<{ id: number; email: string; empreinte: string }>(
    "select id, email, empreinte_mot_de_passe as empreinte from compte where email = $1",
    [normaliserEmail(email)],
  );
  const compte = rows[0];
  if (!compte || !(await verifierEmpreinte(motDePasse, compte.empreinte))) return null;
  return { id: compte.id, email: compte.email };
}

/** Note la date de la connexion sur le compte. */
export async function noterConnexion(base: Base, compteId: number): Promise<void> {
  await base.query("update compte set derniere_connexion_le = now() where id = $1", [compteId]);
}
