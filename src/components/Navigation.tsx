"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BarreHaut.module.css";

/** La page Récits (US-0324), dont l'entrée porte le nombre de Récits non lus. */
const PAGE_RECITS = "/jeu/recits";

/** Les pages du jeu qu'on ouvre depuis la navigation, dans leur ordre. */
const ENTREES_DU_JEU = [
  { chemin: "/jeu", libelle: "Foyer" },
  { chemin: "/jeu/habitants", libelle: "Habitants" },
  { chemin: PAGE_RECITS, libelle: "Récits" },
] as const;

/** L'entrée de la page affichée : « /jeu » pour le Foyer seul, une autre entrée pour ses pages filles aussi. */
function estOuverte(chemin: string, page: string): boolean {
  if (chemin === "/jeu") return page === chemin;
  return page === chemin || page.startsWith(`${chemin}/`);
}

/** « 1 non lu », « 2 non lus » : le nombre tel qu'un lecteur d'écran le dit. */
const nonLusEnMots = (nombre: number) => `${nombre} ${nombre > 1 ? "non lus" : "non lu"}`;

/**
 * US-0302 : la navigation du jeu, une fois le joueur entré dans son Foyer. Sur ordinateur, dans la
 * barre du haut à droite du logo ; sur mobile, en onglets fixés en bas de l'écran, au pouce (voir
 * BarreHaut.module.css). L'entrée de la page affichée est marquée, d'un trait et pas de la couleur seule.
 * US-0324 : l'entrée « Récits » porte en pastille le nombre de Récits non lus, s'il y en a, et le dit
 * dans son nom (« Récits, 2 non lus »).
 */
export function Navigation({ recitsNonLus = 0 }: { recitsNonLus?: number }) {
  const page = usePathname();
  return (
    <nav className={styles.navigation} data-onglets="">
      <ul className={styles.entrees}>
        {ENTREES_DU_JEU.map((entree) => {
          const nonLus = entree.chemin === PAGE_RECITS ? recitsNonLus : 0;
          return (
            <li key={entree.chemin}>
              <Link
                href={entree.chemin}
                className={styles.entree}
                aria-current={estOuverte(entree.chemin, page) ? "page" : undefined}
                aria-label={nonLus > 0 ? `${entree.libelle}, ${nonLusEnMots(nonLus)}` : undefined}
              >
                <span className={styles.libelle}>{entree.libelle}</span>
                {nonLus > 0 ? (
                  <span className={styles.pastille} aria-hidden="true">
                    {nonLus > 99 ? "99+" : nonLus}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
