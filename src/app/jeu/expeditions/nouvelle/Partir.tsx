"use client";

import { useSearchParams } from "next/navigation";
import { useId } from "react";
import { explorateursChoisis } from "./Explorateurs";
import styles from "./Partir.module.css";

/**
 * US-0910 : ce qui manque encore pour partir, dans l'ordre de l'écran : une destination, puis au moins un explorateur ;
 * l'escorte ne manque jamais (US-0909), et le séjour a toujours sa durée (US-0906). Null quand rien ne manque.
 */
function ceQuiManque(destination: boolean, explorateurs: number): string | null {
  const manque = [destination ? null : "une destination", explorateurs === 0 ? "au moins un explorateur" : null].filter(Boolean);
  return manque.length > 0 ? `Il faut ${manque.join(" et ")}.` : null;
}

/**
 * US-0902 : le bouton de départ, au pied de l'écran d'Expédition. Il faut au moins un explorateur : à zéro, il reste
 * grisé et dit pourquoi, juste dessous (lu aussi par un lecteur d'écran). Dès un explorateur choisi, il se dégrise ;
 * il ne fait encore rien : le départ arrive avec US-0911. US-0910 : il finit le récapitulatif, et il faut aussi une
 * `destination` : tant qu'un choix manque, il reste grisé et le nomme.
 */
export function Partir({ libres, destination }: { libres: number; destination: boolean }) {
  const recherche = useSearchParams();
  const idRaison = useId();
  const raison = ceQuiManque(destination, explorateursChoisis(recherche, libres));
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
