import { connection } from "next/server";
import { joueurConnecte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { BoutonDeconnexion } from "./Deconnexion";
import { MenuChef } from "./MenuChef";

/**
 * Les actions du joueur dans la barre du haut, sur les pages du jeu : son nom de chef et son menu
 * (US-0140), ou « Se déconnecter » seul tant qu'il n'a pas de nom. Posées par l'emplacement @actions
 * de la mise en page (src/app/@actions/jeu). Elles ne font que montrer : la page du jeu, à côté,
 * exige la session et le nom.
 */
export async function ActionsDuJeu() {
  await connection();
  if (!entreeDuJeuOuverte()) return null;
  const joueur = await joueurConnecte();
  if (!joueur) return null;
  return joueur.nomDeChef ? <MenuChef nom={joueur.nomDeChef} /> : <BoutonDeconnexion />;
}
