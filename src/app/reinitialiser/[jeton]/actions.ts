"use server";

import { redirect } from "next/navigation";
import { noterConnexion } from "@/comptes/connexion";
import { poserCookieSession } from "@/comptes/cookie-session";
import { verifierMotDePasse } from "@/comptes/mot-de-passe";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { changerMotDePasse, etatDuLien } from "@/comptes/reinitialisation";
import { ouvrirSession } from "@/comptes/session";
import { getPool } from "@/db";
import { ETAT_NOUVEAU_INITIAL, type EtatNouveauMotDePasse } from "./etat";

/**
 * Choisir un nouveau mot de passe avec le lien reçu (US-0128) : mêmes règles qu'à l'inscription.
 * Le nouveau remplace l'ancien, les sessions du compte sont fermées, puis le joueur est connecté
 * ici et arrive dans son jeu.
 */
export async function choisirMotDePasse(jeton: string, _precedent: EtatNouveauMotDePasse, donnees: FormData): Promise<EtatNouveauMotDePasse> {
  if (!entreeDuJeuOuverte()) return ETAT_NOUVEAU_INITIAL;
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const erreur = verifierMotDePasse(motDePasse);
  if (erreur) return { erreur };
  const pool = getPool();
  const compte = await changerMotDePasse(pool, jeton, motDePasse);
  if (!compte) {
    // Le lien ne sert plus : on dit pourquoi (US-0129).
    const lien = await etatDuLien(pool, jeton);
    return { lien: lien.etat === "valable" ? "inconnu" : lien.etat };
  }
  const session = await ouvrirSession(pool, compte.id);
  await noterConnexion(pool, compte.id);
  await poserCookieSession(session.jeton, session.expireLe);
  redirect("/jeu");
}
