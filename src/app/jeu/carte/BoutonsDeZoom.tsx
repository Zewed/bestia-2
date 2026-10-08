import { CARTE_CRAN_DE_ZOOM } from "@/reglages";
import styles from "./BoutonsDeZoom.module.css";

/**
 * US-0425 : « + » au-dessus de « − », par-dessus la carte, en bas à droite : chaque appui la zoome d'un cran
 * (`zoomer`, du facteur du cran), autour du milieu de l'écran. Un bouton est grisé quand sa limite de zoom est
 * atteinte (`rapprocher`, `eloigner` : si l'on peut encore).
 */
export function BoutonsDeZoom({ rapprocher, eloigner, zoomer }: { rapprocher: boolean; eloigner: boolean; zoomer: (facteur: number) => void }) {
  return (
    <div className={styles.zoom}>
      <button type="button" className={styles.bouton} aria-label="Zoomer" disabled={!rapprocher} onClick={() => zoomer(CARTE_CRAN_DE_ZOOM)}>
        +
      </button>
      <button type="button" className={styles.bouton} aria-label="Dézoomer" disabled={!eloigner} onClick={() => zoomer(1 / CARTE_CRAN_DE_ZOOM)}>
        −
      </button>
    </div>
  );
}
