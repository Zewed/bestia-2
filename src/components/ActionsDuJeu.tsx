import { connection } from "next/server";
import { joueurConnecte, stocksALHeure } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { vitesse } from "@/temps/horloge";
import { BoutonDeconnexion } from "./Deconnexion";
import { MenuChef } from "./MenuChef";
import { Presence } from "./Presence";
import { Ressources } from "./Ressources";

/**
 * Les actions du joueur dans la barre du haut, sur les pages du jeu : son nom de chef et son menu
 * (US-0140), ou « Se déconnecter » seul tant qu'il n'a pas de nom ; ses ressources une fois entré
 * dans son Foyer (US-0203), pas avant son récit d'arrivée. Posées par l'emplacement @actions de la
 * mise en page (src/app/@actions/jeu). Elles ne font que montrer : la page du jeu, à côté, exige la
 * session et le nom.
 */
export async function ActionsDuJeu() {
  await connection();
  if (!entreeDuJeuOuverte()) return null;
  const joueur = await joueurConnecte();
  if (!joueur) return null;
  if (!joueur.nomDeChef) return <BoutonDeconnexion />;
  const stocks = joueur.territoireId !== null && joueur.recitLu ? await stocksALHeure(joueur.territoireId) : null;
  return (
    <>
      {/* US-0213 : la clé change avec les quantités, pour que la barre reparte des nouvelles après un recalage. */}
      {stocks ? <Ressources key={stocks.map((s) => s.quantite).join("|")} stocks={stocks} vitesse={vitesse()} /> : null}
      {stocks ? <Presence key={`presence-${stocks.map((s) => s.quantite).join("|")}`} /> : null}
      <MenuChef nom={joueur.nomDeChef} />
    </>
  );
}
