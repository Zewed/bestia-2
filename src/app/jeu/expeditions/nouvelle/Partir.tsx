"use client";

import { useSearchParams } from "next/navigation";
import { useId } from "react";
import { explorateursChoisis } from "./Explorateurs";
import styles from "./Partir.module.css";

/**
 * US-0902 : le bouton de départ, au pied de l'écran d'Expédition. Il faut au moins un explorateur : à zéro, il reste
 * grisé et dit pourquoi, juste dessous (lu aussi par un lecteur d'écran). Dès un explorateur choisi, il se dégrise ;
 * il ne fait encore rien : le départ arrive avec US-0911, et les autres choix qui manquent avec US-0910.
 */
export function Partir({ libres }: { libres: number }) {
  const recherche = useSearchParams();
  const idRaison = useId();
  const raison = explorateursChoisis(recherche, libres) === 0 ? "Il faut au moins un explorateur." : null;
  return (
    <div className={styles.depart}>
      <button type="button" className={styles.partir} disabled={raison !== null} aria-describedby={raison ? idRaison : undefined}>
        Partir
      </button>
      {raison ? (
        <p id={idRaison} className={styles.raison}>
          {raison}
        </p>
      ) : null}
    </div>
  );
}
