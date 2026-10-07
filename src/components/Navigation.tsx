"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BarreHaut.module.css";

/** Les pages du jeu qu'on ouvre depuis la navigation, dans leur ordre. */
const ENTREES_DU_JEU = [
  { chemin: "/jeu", libelle: "Foyer" },
  { chemin: "/jeu/habitants", libelle: "Habitants" },
] as const;

/** L'entrée de la page affichée : « /jeu » pour le Foyer seul, une autre entrée pour ses pages filles aussi. */
function estOuverte(chemin: string, page: string): boolean {
  if (chemin === "/jeu") return page === chemin;
  return page === chemin || page.startsWith(`${chemin}/`);
}

/**
 * US-0302 : la navigation du jeu, une fois le joueur entré dans son Foyer. Sur ordinateur, dans la
 * barre du haut à droite du logo ; sur mobile, en onglets fixés en bas de l'écran, au pouce (voir
 * BarreHaut.module.css). L'entrée de la page affichée est marquée, d'un trait et pas de la couleur seule.
 */
export function Navigation() {
  const page = usePathname();
  return (
    <nav className={styles.navigation} data-onglets="">
      <ul className={styles.entrees}>
        {ENTREES_DU_JEU.map((entree) => (
          <li key={entree.chemin}>
            <Link href={entree.chemin} className={styles.entree} aria-current={estOuverte(entree.chemin, page) ? "page" : undefined}>
              {entree.libelle}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
