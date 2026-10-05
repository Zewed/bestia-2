"use server";

import { redirect } from "next/navigation";
import { enregistrerNomDeChef, nomDejaPris, nomInterdit } from "@/chefs/chef";
import { mondeComplet, NOM_DEJA_PRIS, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "@/chefs/nom";
import { exigerCompteSansChef } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import type { EtatValidation } from "./etat";

/**
 * Si le nom est interdit (US-0138) ou déjà porté dans le Monde (US-0135) : le message à afficher,
 * ou null. Un nom interdit ne dit pas s'il est pris. Un nom qui enfreint une autre règle n'est pas
 * cherché, le navigateur le refuse déjà. Ne réserve rien : l'enregistrement vérifiera encore.
 */
export async function verifierNomLibre(saisie: string): Promise<string | null> {
  if (!entreeDuJeuOuverte()) return null;
  await exigerCompteSansChef();
  const nom = nettoyerNom(String(saisie));
  if (verifierNomDeChef(nom)) return null;
  if (await nomInterdit(getPool(), nom)) return NOM_NON_AUTORISE;
  return (await nomDejaPris(getPool(), nom)) ? NOM_DEJA_PRIS : null;
}

/**
 * Valider le nom de chef (US-0139) : enregistré, avec sa Case sur la Couronne (US-0153), le
 * joueur passe à la suite de son arrivée (la
 * page du jeu, en attendant la naissance sur la carte de l'étape 9) ;
 * sinon, il reste sur l'écran avec la raison. Un deuxième envoi du même joueur trouve son chef
 * déjà créé et passe à la suite lui aussi.
 */
export async function validerNomDeChef(_precedent: EtatValidation, donnees: FormData): Promise<EtatValidation> {
  if (!entreeDuJeuOuverte()) return { nom: "" };
  const compte = await exigerCompteSansChef();
  const nom = nettoyerNom(String(donnees.get("nom") ?? ""));
  const resultat = await enregistrerNomDeChef(getPool(), compte.id, nom);
  if (resultat.statut === "refuse") return { nom, erreur: resultat.erreur };
  if (resultat.statut === "pris") return { nom, pris: true };
  if (resultat.statut === "complet") return { nom, erreur: mondeComplet(resultat.monde) };
  redirect("/jeu");
}

