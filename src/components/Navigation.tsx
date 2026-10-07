"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BarreHaut.module.css";

/** La page Habitants, dont l'entrée signale les Voyageurs aux portes (US-0332). */
const PAGE_HABITANTS = "/jeu/habitants";
/** La page Récits (US-0324), dont l'entrée porte le nombre de Récits non lus. */
const PAGE_RECITS = "/jeu/recits";

/** Les pages du jeu qu'on ouvre depuis la navigation, dans leur ordre. */
const ENTREES_DU_JEU = [
  { chemin: "/jeu", libelle: "Foyer" },
  { chemin: PAGE_HABITANTS, libelle: "Habitants" },
  { chemin: PAGE_RECITS, libelle: "Récits" },
] as const;

/** L'entrée de la page affichée : « /jeu » pour le Foyer seul, une autre entrée pour ses pages filles aussi. */
function estOuverte(chemin: string, page: string): boolean {
  if (chemin === "/jeu") return page === chemin;
  return page === chemin || page.startsWith(`${chemin}/`);
}

/** « 1 non lu », « 2 non lus » : le nombre tel qu'un lecteur d'écran le dit. */
const nonLusEnMots = (nombre: number) => `${nombre} ${nombre > 1 ? "non lus" : "non lu"}`;

/** US-0332 : « un Voyageur attend », « 2 Voyageurs attendent ». */
const voyageursEnMots = (nombre: number) => (nombre > 1 ? `${nombre} Voyageurs attendent` : "un Voyageur attend");

/**
 * US-0302 : la navigation du jeu, une fois le joueur entré dans son Foyer. Sur ordinateur, dans la
 * barre du haut à droite du logo ; sur mobile, en onglets fixés en bas de l'écran, au pouce (voir
 * BarreHaut.module.css). L'entrée de la page affichée est marquée, d'un trait et pas de la couleur seule.
 * US-0324 : l'entrée « Récits » porte en pastille le nombre de Récits non lus, s'il y en a, et le dit
 * dans son nom (« Récits, 2 non lus »). US-0332 : l'entrée « Habitants » porte un point, sans chiffre,
 * quand des Voyageurs attendent aux portes, et le dit dans son nom (« Habitants, un Voyageur attend »).
 */
export function Navigation({ recitsNonLus = 0, voyageurs = 0 }: { recitsNonLus?: number; voyageurs?: number }) {
  const page = usePathname();
  return (
    <nav className={styles.navigation} data-onglets="">
      <ul className={styles.entrees}>
        {ENTREES_DU_JEU.map((entree) => {
          const nonLus = entree.chemin === PAGE_RECITS ? recitsNonLus : 0;
          const attendent = entree.chemin === PAGE_HABITANTS ? voyageurs : 0;
          const precision = nonLus > 0 ? nonLusEnMots(nonLus) : attendent > 0 ? voyageursEnMots(attendent) : null;
          return (
            <li key={entree.chemin}>
              <Link
                href={entree.chemin}
                className={styles.entree}
                aria-current={estOuverte(entree.chemin, page) ? "page" : undefined}
                aria-label={precision ? `${entree.libelle}, ${precision}` : undefined}
              >
                <span className={styles.libelle}>{entree.libelle}</span>
                {nonLus > 0 ? (
                  <span className={styles.pastille} aria-hidden="true">
                    {nonLus > 99 ? "99+" : nonLus}
                  </span>
                ) : null}
                {attendent > 0 ? <span className={styles.repere} aria-hidden="true" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
