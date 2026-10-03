// La confirmation de l'adresse e-mail (US-0114). Côté serveur uniquement.
//
// Un lien porte un jeton tiré au hasard ; seule son empreinte est gardée en base. Le lien est
// à usage unique et valable LIEN_CONFIRMATION_HEURES heures.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { LIEN_CONFIRMATION_HEURES, NOUVEAU_LIEN_ATTENTE_SECONDES } from "@/reglages";

type Base = Pool | PoolClient;

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Crée un lien de confirmation pour le compte ; rend le jeton, à mettre dans l'adresse du lien. */
export async function creerLienConfirmation(base: Base, compteId: number): Promise<string> {
  const jeton = randomBytes(32).toString("base64url");
  await base.query(
    `insert into lien_confirmation (compte_id, empreinte_jeton, expire_le)
     values ($1, $2, now() + make_interval(hours => $3))`,
    [compteId, empreinte(jeton), LIEN_CONFIRMATION_HEURES],
  );
  return jeton;
}

export type ResultatConfirmation = "confirmee" | "deja-confirmee" | "expire" | "inconnu";

/**
 * Ouvre un lien : marque l'adresse comme confirmée et use le lien. Un lien déjà utilisé, ou
 * celui d'une adresse déjà confirmée, répond « deja-confirmee » ; un lien périmé, « expire ».
 */
export async function confirmerAdresse(pool: Pool, jeton: string): Promise<ResultatConfirmation> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: number; compte_id: number; expire: boolean; utilise: boolean; confirme: boolean }>(
      `select l.id, l.compte_id, l.expire_le <= now() as expire, l.utilise_le is not null as utilise,
              c.email_confirme_le is not null as confirme
       from lien_confirmation l join compte c on c.id = l.compte_id
       where l.empreinte_jeton = $1
       for update of l, c`,
      [empreinte(jeton)],
    );
    const lien = rows[0];
    let resultat: ResultatConfirmation;
    if (!lien) resultat = "inconnu";
    else if (lien.utilise || lien.confirme) resultat = "deja-confirmee";
    else if (lien.expire) resultat = "expire";
    else {
      await client.query("update lien_confirmation set utilise_le = now() where id = $1", [lien.id]);
      await client.query("update compte set email_confirme_le = now() where id = $1", [lien.compte_id]);
      resultat = "confirmee";
    }
    await client.query("commit");
    return resultat;
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * Prépare un nouveau lien à partir d'un ancien (périmé) : rend le compte et le nouveau jeton,
 * ou null s'il n'y a rien à envoyer (lien inconnu, adresse déjà confirmée, ou un lien parti il y
 * a moins de NOUVEAU_LIEN_ATTENTE_SECONDES secondes).
 */
export async function nouveauLienDepuis(pool: Pool, ancienJeton: string): Promise<{ email: string; jeton: string } | null> {
  const { rows } = await pool.query<{ compte_id: number; email: string }>(
    `select c.id as compte_id, c.email
     from lien_confirmation l join compte c on c.id = l.compte_id
     where l.empreinte_jeton = $1 and c.email_confirme_le is null
       and not exists (
         select 1 from lien_confirmation r
         where r.compte_id = c.id and r.cree_le > now() - make_interval(secs => $2)
       )`,
    [empreinte(ancienJeton), NOUVEAU_LIEN_ATTENTE_SECONDES],
  );
  if (!rows[0]) return null;
  return { email: rows[0].email, jeton: await creerLienConfirmation(pool, rows[0].compte_id) };
}
