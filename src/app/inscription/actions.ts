"use server";

import { entreeDuJeuOuverte } from "@/comptes/ouverture";

/**
 * L'envoi du formulaire d'inscription. Pour l'instant il ne fait rien : les vérifications
 * arrivent avec US-0103 à US-0106, la création du compte avec US-0107. Il passe par le
 * serveur (POST), jamais par l'adresse de la page : le mot de passe n'y apparaît pas.
 */
export async function inscrire(): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
}
