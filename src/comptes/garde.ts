// La garde des pages et des actions du jeu (US-0121). Chacune l'appelle avant de lire quoi que
// ce soit : sans session, le visiteur part vers la connexion et rien du jeu ne lui est rendu ;
// sans nom de chef, le joueur part le choisir (US-0131). Un test vérifie que toutes les pages et
// actions du jeu l'appellent. Côté serveur uniquement.
import "server-only";
import { redirect } from "next/navigation";
import { chefDuCompte } from "@/chefs/chef";
import { getPool } from "@/db";
import { jetonDeSession } from "./cookie-session";
import { compteDeLaSession } from "./session";
import { connexionPuis } from "./suite";

export type CompteConnecte = { id: number; email: string };

/** L'écran où le joueur choisit son nom de chef (US-0131). */
export const PAGE_NOM_DE_CHEF = "/jeu/nom-de-chef";

/**
 * Le compte connecté, ou la connexion : `chemin` est la page demandée, où revenir une fois
 * connecté (une action, qui n'a pas de page à elle, mène à l'accueil du jeu). Une action
 * envoyée avec une session expirée s'arrête ici, sans rien appliquer ; la connexion dit alors
 * que la session a expiré (US-0125). Tant que le joueur n'a pas de nom de chef, toute page et
 * toute action mènent à l'écran qui le demande (US-0131).
 */
export async function exigerCompte(chemin = "/jeu"): Promise<CompteConnecte> {
  const compte = await exigerSession(chemin);
  if (!(await chefDuCompte(getPool(), compte.id))) redirect(PAGE_NOM_DE_CHEF);
  return compte;
}

/** Pour l'écran du nom de chef seulement : le compte connecté encore sans nom ; avec un nom, le jeu. */
export async function exigerCompteSansChef(): Promise<CompteConnecte> {
  const compte = await exigerSession(PAGE_NOM_DE_CHEF);
  if (await chefDuCompte(getPool(), compte.id)) redirect("/jeu");
  return compte;
}

async function exigerSession(chemin: string): Promise<CompteConnecte> {
  const jeton = await jetonDeSession();
  const compte = jeton ? await compteDeLaSession(getPool(), jeton) : null;
  if (!compte) redirect(connexionPuis(chemin, { expiree: Boolean(jeton) }));
  return compte;
}
