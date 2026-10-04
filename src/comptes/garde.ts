// La garde des pages et des actions du jeu (US-0121). Chacune l'appelle avant de lire quoi que
// ce soit : sans session, le visiteur part vers la connexion et rien du jeu ne lui est rendu.
// Un test vérifie que toutes les pages et actions du jeu l'appellent. Côté serveur uniquement.
import "server-only";
import { redirect } from "next/navigation";
import { getPool } from "@/db";
import { jetonDeSession } from "./cookie-session";
import { compteDeLaSession } from "./session";
import { connexionPuis } from "./suite";

export type CompteConnecte = { id: number; email: string };

/**
 * Le compte connecté, ou la connexion : `chemin` est la page demandée, où revenir une fois
 * connecté (une action, qui n'a pas de page à elle, mène à l'accueil du jeu). Une action
 * envoyée avec une session expirée s'arrête ici, sans rien appliquer ; la connexion dit alors
 * que la session a expiré (US-0125).
 */
export async function exigerCompte(chemin = "/jeu"): Promise<CompteConnecte> {
  const jeton = await jetonDeSession();
  const compte = jeton ? await compteDeLaSession(getPool(), jeton) : null;
  if (!compte) redirect(connexionPuis(chemin, { expiree: Boolean(jeton) }));
  return compte;
}
