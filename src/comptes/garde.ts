// La garde des pages et des actions du jeu (US-0121). Chacune l'appelle avant de lire quoi que
// ce soit : sans session, le visiteur part vers la connexion et rien du jeu ne lui est rendu.
// Un test vérifie que toutes les pages et actions du jeu l'appellent. Côté serveur uniquement.
import "server-only";
import { redirect } from "next/navigation";
import { compteConnecte } from "./cookie-session";
import { connexionPuis } from "./suite";

export type CompteConnecte = { id: number; email: string };

/**
 * Le compte connecté, ou la connexion : `chemin` est la page demandée, où revenir une fois
 * connecté (une action, qui n'a pas de page à elle, mène à l'accueil du jeu).
 */
export async function exigerCompte(chemin = "/jeu"): Promise<CompteConnecte> {
  const compte = await compteConnecte();
  if (!compte) redirect(connexionPuis(chemin));
  return compte;
}
