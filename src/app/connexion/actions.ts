"use server";

import { redirect } from "next/navigation";
import { noterConnexion, seConnecterAvecFrein } from "@/comptes/connexion";
import { poserCookieSession } from "@/comptes/cookie-session";
import { normaliserEmail } from "@/comptes/email";
import { empreinteAdresse } from "@/comptes/empreinte-reseau";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { ouvrirSession } from "@/comptes/session";
import { getPool } from "@/db";
import { MOT_DE_PASSE_MAX } from "@/reglages";
import { CONNEXION_REFUSEE, connexionBloquee, ETAT_CONNEXION_INITIAL, type EtatConnexion } from "./etat";

/**
 * L'envoi du formulaire de connexion (US-0116). Il passe par le serveur (POST), jamais par
 * l'adresse de la page. Des identifiants justes ouvrent une session et mènent au jeu ; les
 * essais répétés sont freinés (US-0118).
 */
export async function seConnecter(_precedent: EtatConnexion, donnees: FormData): Promise<EtatConnexion> {
  if (!entreeDuJeuOuverte()) return ETAT_CONNEXION_INITIAL;
  const email = String(donnees.get("email") ?? "");
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  // Un mot de passe démesuré ne peut pas être juste : inutile de calculer son empreinte.
  if ([...motDePasse].length > MOT_DE_PASSE_MAX) return { erreur: CONNEXION_REFUSEE, email };
  const pool = getPool();
  const resultat = await seConnecterAvecFrein(pool, { email, motDePasse, empreinteAdresse: empreinteAdresse(normaliserEmail(email)) });
  if (resultat.statut === "bloquee") return { erreur: connexionBloquee(resultat.minutes), email };
  if (resultat.statut === "refusee") return { erreur: CONNEXION_REFUSEE, email };
  const { compte } = resultat;
  const { jeton, expireLe } = await ouvrirSession(pool, compte.id);
  await noterConnexion(pool, compte.id);
  await poserCookieSession(jeton, expireLe);
  redirect("/jeu");
}
