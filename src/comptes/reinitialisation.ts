// Les liens pour changer un mot de passe oublié (US-0126). Côté serveur uniquement.
//
// Un lien porte un jeton tiré au hasard ; seule son empreinte est gardée en base. Il est à usage
// unique et valable LIEN_REINITIALISATION_MINUTES minutes. Le lien part vers toute adresse qui a
// un compte, confirmée ou non : s'en servir prouve que l'adresse appartient au joueur (US-0128).
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { calculerEmpreinte } from "./empreinte";
import { LIEN_REINITIALISATION_MINUTES, NOUVELLE_REINITIALISATION_ATTENTE_SECONDES } from "@/reglages";
import { normaliserEmail } from "./email";

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/**
 * Prépare un lien pour l'adresse : rend l'adresse du compte et le jeton à mettre dans le lien,
 * ou null s'il n'y a rien à envoyer (pas de compte, ou un lien parti il y a moins d'une minute).
 * Les liens précédents du compte, pas encore utilisés, expirent aussitôt (US-0129). L'appelant
 * répond la même chose dans tous les cas.
 */
export async function preparerReinitialisation(pool: Pool, email: string): Promise<{ email: string; jeton: string } | null> {
  const jeton = randomBytes(32).toString("base64url");
  const { rows } = await pool.query<{ email: string }>(
    `with vise as (
       select c.id, c.email from compte c
       where c.email = $1
         and not exists (
           select 1 from lien_reinitialisation r
           where r.compte_id = c.id and r.cree_le > now() - make_interval(secs => $4)
         )
     ),
     anciens as (
       update lien_reinitialisation set expire_le = now()
       where compte_id in (select id from vise) and utilise_le is null and expire_le > now()
     )
     insert into lien_reinitialisation (compte_id, empreinte_jeton, expire_le)
     select id, $2, now() + make_interval(mins => $3) from vise
     returning (select email from vise) as email`,
    [normaliserEmail(email), empreinte(jeton), LIEN_REINITIALISATION_MINUTES, NOUVELLE_REINITIALISATION_ATTENTE_SECONDES],
  );
  return rows[0] ? { email: rows[0].email, jeton } : null;
}

export type EtatDuLien = { etat: "valable"; email: string } | { etat: "expire" | "utilise" | "inconnu" };

/**
 * Ce que vaut un lien (US-0129) : valable (avec l'adresse du compte), expiré (trop vieux, ou
 * remplacé par un lien plus récent), déjà utilisé, ou inconnu.
 */
export async function etatDuLien(pool: Pool, jeton: string): Promise<EtatDuLien> {
  const { rows } = await pool.query<{ email: string; utilise: boolean; expire: boolean }>(
    `select c.email, l.utilise_le is not null as utilise, l.expire_le <= now() as expire
     from lien_reinitialisation l join compte c on c.id = l.compte_id
     where l.empreinte_jeton = $1`,
    [empreinte(jeton)],
  );
  const lien = rows[0];
  if (!lien) return { etat: "inconnu" };
  if (lien.utilise) return { etat: "utilise" };
  if (lien.expire) return { etat: "expire" };
  return { etat: "valable", email: lien.email };
}

/**
 * Change le mot de passe avec un lien encore valable (US-0128), tout ou rien : le nouveau
 * remplace l'ancien, l'adresse est confirmée, ce lien est usé et les autres liens du compte
 * aussi, et toutes les sessions du compte sont fermées (si l'ancien mot de passe a été volé,
 * qui s'en servait perd l'accès). Rend le compte, ou null si le lien n'est plus valable.
 */
export async function changerMotDePasse(pool: Pool, jeton: string, nouveauMotDePasse: string): Promise<{ id: number; email: string } | null> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: number; compte_id: number; email: string }>(
      `select l.id, l.compte_id, c.email from lien_reinitialisation l join compte c on c.id = l.compte_id
       where l.empreinte_jeton = $1 and l.utilise_le is null and l.expire_le > now()
       for update of l, c`,
      [empreinte(jeton)],
    );
    const lien = rows[0];
    if (!lien) {
      await client.query("rollback");
      return null;
    }
    const empreinteMotDePasse = await calculerEmpreinte(nouveauMotDePasse);
    await client.query(
      "update compte set empreinte_mot_de_passe = $2, email_confirme_le = coalesce(email_confirme_le, now()) where id = $1",
      [lien.compte_id, empreinteMotDePasse],
    );
    // Ce lien a servi ; les autres liens du compte, jamais utilisés, expirent.
    await client.query("update lien_reinitialisation set utilise_le = now() where id = $1", [lien.id]);
    await client.query(
      "update lien_reinitialisation set expire_le = now() where compte_id = $1 and utilise_le is null and expire_le > now()",
      [lien.compte_id],
    );
    await client.query("delete from session where compte_id = $1", [lien.compte_id]);
    await client.query("commit");
    return { id: lien.compte_id, email: lien.email };
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}
