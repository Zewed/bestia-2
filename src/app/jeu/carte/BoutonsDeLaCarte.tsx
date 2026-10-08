import { CARTE_CRAN_DE_ZOOM } from "@/reglages";
import styles from "./BoutonsDeLaCarte.module.css";

/**
 * US-0425 : « + » au-dessus de « − », par-dessus la carte, en bas à droite : chaque appui la zoome d'un cran
 * (`zoomer`, du facteur du cran), autour du milieu de l'écran. Un bouton est grisé quand sa limite de zoom est
 * atteinte (`rapprocher`, `eloigner` : si l'on peut encore). US-0426 : au-dessus d'eux, le bouton qui ramène la carte
 * sur le Foyer (`revenir`), le repère du Foyer pour icône.
 */
export function BoutonsDeLaCarte({ rapprocher, eloigner, zoomer, revenir }: { rapprocher: boolean; eloigner: boolean; zoomer: (facteur: number) => void; revenir: () => void }) {
  return (
    <div className={styles.boutons} data-sur-la-carte="">
      <button type="button" className={styles.bouton} aria-label="Revenir au Foyer" onClick={revenir}>
        <svg className={styles.repere} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 20.4 7.01 12.93A6 6 0 1 1 16.99 12.93Z" />
          <circle cx="12" cy="9.6" r="2.3" />
        </svg>
      </button>
      <button type="button" className={styles.bouton} aria-label="Zoomer" disabled={!rapprocher} onClick={() => zoomer(CARTE_CRAN_DE_ZOOM)}>
        +
      </button>
      <button type="button" className={styles.bouton} aria-label="Dézoomer" disabled={!eloigner} onClick={() => zoomer(1 / CARTE_CRAN_DE_ZOOM)}>
        −
      </button>
    </div>
  );
}
