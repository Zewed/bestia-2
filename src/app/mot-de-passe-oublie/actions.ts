"use server";

import { after } from "next/server";
import { verifierEmail } from "@/comptes/email";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { preparerReinitialisation } from "@/comptes/reinitialisation";
import { getPool } from "@/db";
import { envoyerLienReinitialisation } from "@/emails/reinitialisation";
import { ETAT_OUBLI_INITIAL, type EtatOubli } from "./etat";

/**
 * Demander un lien pour changer de mot de passe (US-0126). La réponse est la même que l'adresse
 * ait un compte ou non ; l'e-mail, s'il y a lieu, part après la réponse.
 */
export async function demanderLien(_precedent: EtatOubli, donnees: FormData): Promise<EtatOubli> {
  if (!entreeDuJeuOuverte()) return ETAT_OUBLI_INITIAL;
  const email = String(donnees.get("email") ?? "");
  const erreur = verifierEmail(email);
  if (erreur) return { erreur, email };
  const lien = await preparerReinitialisation(getPool(), email);
  if (lien) after(() => envoyerLienReinitialisation(lien.email, lien.jeton));
  return { envoye: true, email };
}
