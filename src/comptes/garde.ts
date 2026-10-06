// La garde des pages et des actions du jeu (US-0121). Chacune l'appelle avant de lire quoi que
// ce soit : sans session, le visiteur part vers la connexion et rien du jeu ne lui est rendu ;
// sans nom de chef, le joueur part le choisir (US-0131). Un test vérifie que toutes les pages et
// actions du jeu l'appellent. Côté serveur uniquement.
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { chefDuCompte, naitreSurLaCouronne } from "@/chefs/chef";
import { getPool } from "@/db";
import { rattraper } from "@/temps/rattraper";
import { jetonDeSession } from "./cookie-session";
import { compteDeLaSession } from "./session";
import { connexionPuis } from "./suite";

export type CompteConnecte = { id: number; email: string };
/** Un joueur dans le jeu : son compte, son nom de chef et son Territoire (null pour un chef né avant les Territoires). */
export type ChefConnecte = CompteConnecte & { nomDeChef: string; territoireId: number | null; recitLu: boolean };

/** L'écran où le joueur choisit son nom de chef (US-0131). */
export const PAGE_NOM_DE_CHEF = "/jeu/nom-de-chef";
/** Le récit d'arrivée (US-0158), montré une fois avant toute autre page du jeu. */
export const PAGE_ARRIVEE = "/jeu/arrivee";

/**
 * Le compte connecté, ou la connexion : `chemin` est la page demandée, où revenir une fois
 * connecté (une action, qui n'a pas de page à elle, mène à l'accueil du jeu). Une action
 * envoyée avec une session expirée s'arrête ici, sans rien appliquer ; la connexion dit alors
 * que la session a expiré (US-0125). Tant que le joueur n'a pas de nom de chef, toute page et
 * toute action mènent à l'écran qui le demande (US-0131). Sinon, son Territoire est d'abord mis
 * à l'heure (US-0156). US-0160 : l'arrivée reprend là où elle s'était arrêtée ; un chef sans Foyer
 * en reçoit un, et tant que le récit d'arrivée n'a pas été montré, il passe avant tout le reste.
 */
export async function exigerCompte(chemin = "/jeu"): Promise<ChefConnecte> {
  const compte = await exigerSession(chemin);
  const chef = await chefDuCompte(getPool(), compte.id);
  if (!chef) redirect(PAGE_NOM_DE_CHEF);
  // Un chef né avant les Foyers (avant US-0153) reçoit le sien à son retour.
  const territoireId = chef.territoireId ?? (await naitreSurLaCouronne(getPool(), compte.id));
  // US-0156 : le Territoire du joueur est mis à l'heure avant toute page ou action du jeu.
  if (territoireId !== null) await rattraper("territoire", territoireId);
  if (territoireId !== null && !chef.recitLu && chemin !== PAGE_ARRIVEE) redirect(PAGE_ARRIVEE);
  return { ...compte, nomDeChef: chef.nom, territoireId, recitLu: Boolean(chef.recitLu) };
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

