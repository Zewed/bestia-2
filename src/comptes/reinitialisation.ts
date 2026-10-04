// Les liens pour changer un mot de passe oublié (US-0126). Côté serveur uniquement.
//
// Un lien porte un jeton tiré au hasard ; seule son empreinte est gardée en base. Il est à usage
// unique et valable LIEN_REINITIALISATION_MINUTES minutes. Le lien part vers toute adresse qui a
// un compte, confirmée ou non : l'ouvrir prouve que l'adresse appartient au joueur.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { LIEN_REINITIALISATION_MINUTES, NOUVELLE_REINITIALISATION_ATTENTE_SECONDES } from "@/reglages";
import { normaliserEmail } from "./email";

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/**
 * Prépare un lien pour l'adresse : rend l'adresse du compte et le jeton à mettre dans le lien,
 * ou null s'il n'y a rien à envoyer (pas de compte, ou un lien parti il y a moins d'une minute).
 * L'appelant répond la même chose dans tous les cas.
 */
export async function preparerReinitialisation(pool: Pool, email: string): Promise<{ email: string; jeton: string } | null> {
  const jeton = randomBytes(32).toString("base64url");
  const { rows } = await pool.query<{ email: string }>(
    `insert into lien_reinitialisation (compte_id, empreinte_jeton, expire_le)
     select c.id, $2, now() + make_interval(mins => $3) from compte c
     where c.email = $1
       and not exists (
         select 1 from lien_reinitialisation r
         where r.compte_id = c.id and r.cree_le > now() - make_interval(secs => $4)
       )
     returning (select email from compte where id = compte_id) as email`,
    [normaliserEmail(email), empreinte(jeton), LIEN_REINITIALISATION_MINUTES, NOUVELLE_REINITIALISATION_ATTENTE_SECONDES],
  );
  return rows[0] ? { email: rows[0].email, jeton } : null;
}
