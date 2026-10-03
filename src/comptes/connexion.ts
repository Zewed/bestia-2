// La vérification des identifiants à la connexion (US-0116). Côté serveur uniquement.
import "server-only";
import { randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { normaliserEmail } from "./email";
import { BLOCAGE_CONNEXION_MINUTES, ECHECS_CONNEXION_MAX } from "@/reglages";
import { calculerEmpreinte, verifierEmpreinte } from "./empreinte";

type Base = Pool | PoolClient;

// US-0117 : pour une adresse inconnue, on vérifie quand même le mot de passe contre une empreinte
// factice. La réponse prend alors le même temps que pour un mot de passe faux : la durée ne
// trahit pas quelles adresses ont un compte. L'empreinte factice est calculée une fois.
let empreinteFactice: Promise<string> | undefined;
const factice = () => (empreinteFactice ??= calculerEmpreinte(randomBytes(32).toString("hex")));

/** Le compte si l'adresse (sous sa forme normale) et le mot de passe sont justes, sinon null. */
export async function verifierIdentifiants(base: Base, email: string, motDePasse: string): Promise<{ id: number; email: string } | null> {
  const { rows } = await base.query<{ id: number; email: string; empreinte: string }>(
    "select id, email, empreinte_mot_de_passe as empreinte from compte where email = $1",
    [normaliserEmail(email)],
  );
  const compte = rows[0];
  if (!compte) {
    await verifierEmpreinte(motDePasse, await factice());
    return null;
  }
  if (!(await verifierEmpreinte(motDePasse, compte.empreinte))) return null;
  return { id: compte.id, email: compte.email };
}

/** Note la date de la connexion sur le compte. */
export async function noterConnexion(base: Base, compteId: number): Promise<void> {
  await base.query("update compte set derniere_connexion_le = now() where id = $1", [compteId]);
}

export type ResultatConnexion =
  | { statut: "acceptee"; compte: { id: number; email: string } }
  | { statut: "refusee" }
  | { statut: "bloquee"; minutes: number };

/**
 * La connexion freinée (US-0118) : après ECHECS_CONNEXION_MAX échecs d'affilée sur une même
 * adresse, inconnue ou non, les essais sont bloqués BLOCAGE_CONNEXION_MINUTES minutes, même
 * avec le bon mot de passe. Une connexion réussie remet le décompte à zéro.
 */
export async function seConnecterAvecFrein(
  pool: Pool,
  essai: { email: string; motDePasse: string; empreinteAdresse: string },
): Promise<ResultatConnexion> {
  const blocage = await pool.query<{ minutes: number }>(
    "select ceil(extract(epoch from bloque_jusqua - now()) / 60)::int as minutes from echec_connexion where empreinte_adresse = $1 and bloque_jusqua > now()",
    [essai.empreinteAdresse],
  );
  if (blocage.rows[0]) return { statut: "bloquee", minutes: blocage.rows[0].minutes };

  const compte = await verifierIdentifiants(pool, essai.email, essai.motDePasse);
  if (compte) {
    await pool.query("delete from echec_connexion where empreinte_adresse = $1", [essai.empreinteAdresse]);
    return { statut: "acceptee", compte };
  }

  // Un échec de plus ; au dernier permis, le blocage commence et le décompte repart de zéro.
  // Les échecs d'il y a plus d'un jour ne comptent plus.
  await pool.query("delete from echec_connexion where dernier_echec < now() - interval '1 day' and coalesce(bloque_jusqua, now()) <= now()");
  const { rows } = await pool.query<{ bloque: boolean }>(
    `insert into echec_connexion as e (empreinte_adresse, echecs, bloque_jusqua)
     values ($1, case when 1 >= $2 then 0 else 1 end, case when 1 >= $2 then now() + make_interval(mins => $3) end)
     on conflict (empreinte_adresse) do update set
       echecs = case when e.echecs + 1 >= $2 then 0 else e.echecs + 1 end,
       bloque_jusqua = case when e.echecs + 1 >= $2 then now() + make_interval(mins => $3) else e.bloque_jusqua end,
       dernier_echec = now()
     returning coalesce(bloque_jusqua > now(), false) as bloque`,
    [essai.empreinteAdresse, ECHECS_CONNEXION_MAX, BLOCAGE_CONNEXION_MINUTES],
  );
  return rows[0].bloque ? { statut: "bloquee", minutes: BLOCAGE_CONNEXION_MINUTES } : { statut: "refusee" };
}
