import { connection } from "next/server";
import { habitantsALHeure, joueurConnecte, recitsNonLusALHeure, stocksALHeure } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { vitesse } from "@/temps/horloge";
import { CompteurHabitants } from "./CompteurHabitants";
import { BoutonDeconnexion } from "./Deconnexion";
import { MenuChef } from "./MenuChef";
import { Navigation } from "./Navigation";
import { Presence } from "./Presence";
import { Ressources } from "./Ressources";

/**
 * Les actions du joueur dans la barre du haut, sur les pages du jeu : son nom de chef et son menu
 * (US-0140), ou « Se déconnecter » seul tant qu'il n'a pas de nom ; la navigation du jeu (US-0302) avec
 * le nombre de ses Récits non lus (US-0324), ses ressources (US-0203) et le nombre de ses Habitants
 * (US-0304) une fois entré dans son Foyer, pas avant son récit d'arrivée. Posées par l'emplacement
 * @actions de la mise en page (src/app/@actions/jeu). Elles ne font que montrer : la page du jeu, à
 * côté, exige la session et le nom.
 */
export async function ActionsDuJeu() {
  await connection();
  if (!entreeDuJeuOuverte()) return null;
  const joueur = await joueurConnecte();
  if (!joueur) return null;
  if (!joueur.nomDeChef) return <BoutonDeconnexion />;
  const territoireId = joueur.recitLu ? joueur.territoireId : null;
  const [stocks, habitants, recitsNonLus] =
    territoireId !== null
      ? await Promise.all([stocksALHeure(territoireId), habitantsALHeure(territoireId), recitsNonLusALHeure(territoireId)])
      : [null, null, null];
  return (
    <>
      {stocks ? <Navigation recitsNonLus={recitsNonLus ?? 0} /> : null}
      {/* US-0213 : la clé change avec les quantités, pour que la barre reparte des nouvelles après un recalage. */}
      {stocks ? (
        <Ressources key={stocks.map((s) => s.quantite).join("|")} stocks={stocks} vitesse={vitesse()}>
          {/* US-0304 : le nombre d'Habitants, relu à chaque affichage et à chaque recalage de la barre. */}
          {habitants !== null ? <CompteurHabitants nombre={habitants} /> : null}
        </Ressources>
      ) : null}
      {stocks ? <Presence key={`presence-${stocks.map((s) => s.quantite).join("|")}`} /> : null}
      <MenuChef nom={joueur.nomDeChef} />
    </>
  );
}
