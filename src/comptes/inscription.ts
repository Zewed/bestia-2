// L'inscription freinée (US-0112) : au plus INSCRIPTIONS_PAR_HEURE_MAX comptes créés en une heure
// depuis une même connexion. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { INSCRIPTIONS_PAR_HEURE_MAX } from "@/reglages";
import { creerCompte } from "./compte";
import { creerLienConfirmation } from "./confirmation";

/** Le compte créé porte son premier lien de confirmation d'adresse (US-0114), créé avec lui. */
export type ResultatInscription =
  | { statut: "cree"; compteId: number; email: string; jetonConfirmation: string }
  | { statut: "deja-inscrite" }
  | { statut: "freinee" };

/**
 * Crée le compte, sauf si la connexion a déjà atteint sa limite de l'heure. Seuls les comptes
 * réellement créés comptent. Un verrou par connexion fait passer ses inscriptions une à une :
 * dix envois au même instant ne dépassent pas la limite.
 */
export async function inscrireCompte(
  pool: Pool,
  demande: { email: string; motDePasse: string; empreinteReseau: string },
): Promise<ResultatInscription> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('inscription:' || $1))", [demande.empreinteReseau]);
    // Ce qui a plus d'une heure ne compte plus, et n'a plus de raison d'être gardé.
    await client.query("delete from inscription_recente where le < now() - interval '1 hour'");
    const { rows } = await client.query<{ n: number }>(
      "select count(*)::int as n from inscription_recente where empreinte_reseau = $1",
      [demande.empreinteReseau],
    );
    if (rows[0].n >= INSCRIPTIONS_PAR_HEURE_MAX) {
      await client.query("commit");
      return { statut: "freinee" };
    }
    const compte = await creerCompte(client, demande.email, demande.motDePasse);
    if (!compte) {
      await client.query("commit");
      return { statut: "deja-inscrite" };
    }
    await client.query("insert into inscription_recente (empreinte_reseau) values ($1)", [demande.empreinteReseau]);
    const jetonConfirmation = await creerLienConfirmation(client, compte.id);
    await client.query("commit");
    return { statut: "cree", compteId: compte.id, email: compte.email, jetonConfirmation };
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}
