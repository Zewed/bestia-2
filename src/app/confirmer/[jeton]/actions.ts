"use server";

import { after } from "next/server";
import { nouveauLienDepuis } from "@/comptes/confirmation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { envoyerLienConfirmation } from "@/emails/confirmation";

/**
 * Envoie un nouveau lien de confirmation à partir d'un lien expiré (US-0114). La réponse est
 * toujours la même, qu'un e-mail parte ou non : elle ne dit rien du compte derrière le lien.
 */
export async function demanderNouveauLien(ancienJeton: string): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
  const nouveau = await nouveauLienDepuis(getPool(), ancienJeton);
  if (nouveau) after(() => envoyerLienConfirmation(nouveau.email, nouveau.jeton));
}
