"use server";

import { headers } from "next/headers";
import { EMAIL_DEJA_UTILISEE, verifierEmail } from "@/comptes/email";
import { adresseReseau, empreinteReseau } from "@/comptes/empreinte-reseau";
import { inscrireCompte } from "@/comptes/inscription";
import { verifierMotDePasse } from "@/comptes/mot-de-passe";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { CHAMP_PIEGE, ETAT_INITIAL, INSCRIPTIONS_FREINEES, type EtatInscription } from "./etat";

/**
 * L'envoi du formulaire d'inscription. Il passe par le serveur (POST), jamais par l'adresse
 * de la page : le mot de passe n'y apparaît pas. Le serveur refait les vérifications du
 * navigateur, qui peut avoir été contourné, puis crée le compte (US-0107). Le mot de passe
 * ne sert qu'à calculer son empreinte : il n'est ni enregistré, ni écrit dans un journal.
 * Les robots et les inscriptions en rafale reçoivent un refus poli (US-0112).
 */
export async function inscrire(_precedent: EtatInscription, donnees: FormData): Promise<EtatInscription> {
  if (!entreeDuJeuOuverte()) return ETAT_INITIAL;
  const email = String(donnees.get("email") ?? "");
  // Un humain ne voit pas le champ piège ; s'il est rempli, c'est un robot.
  if (String(donnees.get(CHAMP_PIEGE) ?? "") !== "") return { erreurs: { general: INSCRIPTIONS_FREINEES }, email };
  const erreurs: EtatInscription["erreurs"] = {};
  const erreurEmail = verifierEmail(email);
  if (erreurEmail) erreurs.email = erreurEmail;
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const erreurMotDePasse = verifierMotDePasse(motDePasse);
  if (erreurMotDePasse) erreurs.motDePasse = erreurMotDePasse;
  if (erreurEmail || erreurMotDePasse) return { erreurs, email };
  const empreinte = empreinteReseau(adresseReseau(await headers()));
  const resultat = await inscrireCompte(getPool(), { email, motDePasse, empreinteReseau: empreinte });
  if (resultat === "freinee") return { erreurs: { general: INSCRIPTIONS_FREINEES }, email };
  if (resultat === "deja-inscrite") return { erreurs: { email: EMAIL_DEJA_UTILISEE }, email };
  return { erreurs: {}, email, cree: true };
}
