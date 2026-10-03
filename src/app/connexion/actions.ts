"use server";

import { redirect } from "next/navigation";
import { noterConnexion, verifierIdentifiants } from "@/comptes/connexion";
import { poserCookieSession } from "@/comptes/cookie-session";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { ouvrirSession } from "@/comptes/session";
import { getPool } from "@/db";
import { MOT_DE_PASSE_MAX } from "@/reglages";
import { CONNEXION_REFUSEE, ETAT_CONNEXION_INITIAL, type EtatConnexion } from "./etat";

/**
 * L'envoi du formulaire de connexion (US-0116). Il passe par le serveur (POST), jamais par
 * l'adresse de la page. Des identifiants justes ouvrent une session et mènent au jeu.
 */
export async function seConnecter(_precedent: EtatConnexion, donnees: FormData): Promise<EtatConnexion> {
  if (!entreeDuJeuOuverte()) return ETAT_CONNEXION_INITIAL;
  const email = String(donnees.get("email") ?? "");
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  // Un mot de passe démesuré ne peut pas être juste : inutile de calculer son empreinte.
  if ([...motDePasse].length > MOT_DE_PASSE_MAX) return { erreur: CONNEXION_REFUSEE, email };
  const pool = getPool();
  const compte = await verifierIdentifiants(pool, email, motDePasse);
  if (!compte) return { erreur: CONNEXION_REFUSEE, email };
  const { jeton, expireLe } = await ouvrirSession(pool, compte.id);
  await noterConnexion(pool, compte.id);
  await poserCookieSession(jeton, expireLe);
  redirect("/jeu");
}
