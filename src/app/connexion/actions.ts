"use server";

import { entreeDuJeuOuverte } from "@/comptes/ouverture";

/**
 * L'envoi du formulaire de connexion. Il passe par le serveur (POST), jamais par l'adresse de
 * la page : le mot de passe n'y apparaît pas. La connexion elle-même arrive avec US-0116.
 */
export async function seConnecter(): Promise<void> {
  if (!entreeDuJeuOuverte()) return;
}
