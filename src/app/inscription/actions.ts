"use server";

import { creerCompte } from "@/comptes/compte";
import { EMAIL_DEJA_UTILISEE, verifierEmail } from "@/comptes/email";
import { verifierMotDePasse } from "@/comptes/mot-de-passe";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { ETAT_INITIAL, type EtatInscription } from "./etat";

/**
 * L'envoi du formulaire d'inscription. Il passe par le serveur (POST), jamais par l'adresse
 * de la page : le mot de passe n'y apparaît pas. Le serveur refait les vérifications du
 * navigateur, qui peut avoir été contourné, puis crée le compte (US-0107). Le mot de passe
 * ne sert qu'à calculer son empreinte : il n'est ni enregistré, ni écrit dans un journal.
 */
export async function inscrire(_precedent: EtatInscription, donnees: FormData): Promise<EtatInscription> {
  if (!entreeDuJeuOuverte()) return ETAT_INITIAL;
  const email = String(donnees.get("email") ?? "");
  const erreurs: EtatInscription["erreurs"] = {};
  const erreurEmail = verifierEmail(email);
  if (erreurEmail) erreurs.email = erreurEmail;
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const erreurMotDePasse = verifierMotDePasse(motDePasse);
  if (erreurMotDePasse) erreurs.motDePasse = erreurMotDePasse;
  if (erreurEmail || erreurMotDePasse) return { erreurs, email };
  const compte = await creerCompte(getPool(), email, motDePasse);
  if (!compte) return { erreurs: { email: EMAIL_DEJA_UTILISEE }, email };
  return { erreurs: {}, email, cree: true };
}
