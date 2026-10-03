"use server";

import { verifierEmail } from "@/comptes/email";
import { verifierMotDePasse } from "@/comptes/mot-de-passe";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { ETAT_INITIAL, type EtatInscription } from "./etat";

/**
 * L'envoi du formulaire d'inscription. Il passe par le serveur (POST), jamais par l'adresse
 * de la page : le mot de passe n'y apparaît pas. Le serveur refait les vérifications du
 * navigateur, qui peut avoir été contourné. La création du compte arrive avec US-0107.
 */
export async function inscrire(_precedent: EtatInscription, donnees: FormData): Promise<EtatInscription> {
  if (!entreeDuJeuOuverte()) return ETAT_INITIAL;
  const email = String(donnees.get("email") ?? "");
  const erreurs: EtatInscription["erreurs"] = {};
  const erreurEmail = verifierEmail(email);
  if (erreurEmail) erreurs.email = erreurEmail;
  const erreurMotDePasse = verifierMotDePasse(String(donnees.get("motDePasse") ?? ""));
  if (erreurMotDePasse) erreurs.motDePasse = erreurMotDePasse;
  return { erreurs, email };
}
