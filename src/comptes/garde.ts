// La garde des pages et des actions du jeu (US-0121). Chacune l'appelle avant de lire quoi que
// ce soit : sans session, le visiteur part vers la connexion et rien du jeu ne lui est rendu ;
// sans nom de chef, le joueur part le choisir (US-0131). Un test vérifie que toutes les pages et
// actions du jeu l'appellent. Côté serveur uniquement.
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { chefDuCompte } from "@/chefs/chef";
import { getPool } from "@/db";
import { rattraper } from "@/temps/rattraper";
import { jetonDeSession } from "./cookie-session";
import { compteDeLaSession } from "./session";
import { connexionPuis } from "./suite";

export type CompteConnecte = { id: number; email: string };
/** Un joueur dans le jeu : son compte, son nom de chef et son Territoire (null pour un chef né avant les Territoires). */
export type ChefConnecte = CompteConnecte & { nomDeChef: string; territoireId: number | null };

/** L'écran où le joueur choisit son nom de chef (US-0131). */
export const PAGE_NOM_DE_CHEF = "/jeu/nom-de-chef";

/**
 * Le compte connecté, ou la connexion : `chemin` est la page demandée, où revenir une fois
 * connecté (une action, qui n'a pas de page à elle, mène à l'accueil du jeu). Une action
 * envoyée avec une session expirée s'arrête ici, sans rien appliquer ; la connexion dit alors
 * que la session a expiré (US-0125). Tant que le joueur n'a pas de nom de chef, toute page et
 * toute action mènent à l'écran qui le demande (US-0131). Sinon, son Territoire est d'abord mis
 * à l'heure (US-0156).
 */
export async function exigerCompte(chemin = "/jeu"): Promise<ChefConnecte> {
  const compte = await exigerSession(chemin);
  const chef = await chefDuCompte(getPool(), compte.id);
  if (!chef) redirect(PAGE_NOM_DE_CHEF);
  // US-0156 : le Territoire du joueur est mis à l'heure avant toute page ou action du jeu.
  const territoireId = chef.territoireId ?? null;
  if (territoireId !== null) await rattraper("territoire", territoireId);
  return { ...compte, nomDeChef: chef.nom, territoireId };
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

/**
 * Le joueur connecté et son nom de chef (null tant qu'il ne l'a pas choisi), ou null sans session.
 * Sans redirection : pour la barre du haut, qui ne fait que montrer ; les pages et les actions du
 * jeu, elles, passent par exigerCompte.
 */
export const joueurConnecte = cache(async (): Promise<{ compte: CompteConnecte; nomDeChef: string | null } | null> => {
  const jeton = await jetonDeSession();
  const compte = jeton ? await compteDeLaSession(getPool(), jeton) : null;
  if (!compte) return null;
  const chef = await chefDuCompte(getPool(), compte.id);
  return { compte, nomDeChef: chef?.nom ?? null };
});

