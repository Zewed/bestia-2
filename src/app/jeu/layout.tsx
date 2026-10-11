import { connection } from "next/server";
import { joueurConnecte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Scene } from "@/components/Scene";
import { Volet } from "@/components/Volet";
import { couleur } from "@/monde/couleurs-de-la-carte";
import { vitesse } from "@/temps/horloge";
import { mondeDuJoueur } from "./carte/monde-du-joueur";

/**
 * La mise en page du jeu : la carte du Monde est l'écran principal, et tout le reste s'ouvre par-dessus elle, pour
 * qu'on voie toujours son Territoire et ses Expéditions. Une fois le chef entré dans son Foyer (son nom choisi, son
 * récit d'arrivée lu), la carte reste en scène sous chaque page du jeu (Scene), lue comme la page de la Carte la lit
 * (mondeDuJoueur), et la page s'ouvre dans un volet (Volet). Avant, ou sans session, la page est seule : chaque page
 * garde sa propre garde. Rien n'y est lu de plus que ce que la carte lit déjà.
 */
export default async function MiseEnPageDuJeu({ children }: LayoutProps<"/jeu">) {
  await connection();
  if (!entreeDuJeuOuverte()) return children;
  const joueur = await joueurConnecte();
  if (!joueur?.nomDeChef || !joueur.recitLu || joueur.territoireId === null) return children;
  const { carte, expeditions, instant } = await mondeDuJoueur(joueur.territoireId);
  if (!carte) return children;
  return (
    <>
      <Scene carte={carte} fonds={carte.teintes.map(couleur)} expeditions={expeditions} maintenant={instant} vitesse={vitesse()} />
      <Volet>{children}</Volet>
    </>
  );
}
