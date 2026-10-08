import type { Ref } from "react";
import type { Coordonnees } from "@/monde/hex";
import type { Vue } from "./dessin";
import styles from "./FlecheDuFoyer.module.css";
import { flecheVersLeFoyer, type Rectangle } from "./vue";

/** US-0426 : la moitié de la place de la flèche, 44 px pour le doigt : son centre reste à autant des bords de la carte et de ce qui est posé dessus. */
const DEMI_PLACE = 22;

/** US-0426 : les panneaux ouverts en bas de la carte sur mobile publient leur hauteur sur la page (0 ou rien sinon). */
const PANNEAUX_DU_BAS = ["--hauteur-legende", "--hauteur-fiche"];

/**
 * US-0426 : ce qui est posé sur la carte (`toile`), en rectangles depuis son coin en haut à gauche : ce qui le déclare
 * (`data-sur-la-carte` : ses boutons, la légende…) et qui a une place à l'écran ; sur mobile, la bande du panneau
 * ouvert en bas.
 */
function obstacles(toile: HTMLElement, vue: Vue): Rectangle[] {
  const { left, top } = toile.getBoundingClientRect();
  const poses = [...document.querySelectorAll("[data-sur-la-carte]")]
    .map((element) => element.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ gauche: r.left - left, haut: r.top - top, droite: r.right - left, bas: r.bottom - top }));
  const enBas = Math.max(0, ...PANNEAUX_DU_BAS.map((nom) => parseFloat(document.documentElement.style.getPropertyValue(nom)) || 0));
  return enBas > 0 ? [...poses, { gauche: 0, haut: vue.hauteur - enBas, droite: vue.largeur, bas: vue.hauteur }] : poses;
}

/**
 * US-0426 : pose la flèche du Foyer sur la carte `toile` montrée par `vue` : au bord, tournée vers le Foyer (vue.ts),
 * ou cachée quand il se voit. La carte l'appelle à chaque dessin : la flèche suit la vue à chaque image.
 */
export function placerLaFleche(fleche: HTMLElement | null, toile: HTMLElement, vue: Vue, foyer: Coordonnees): void {
  if (!fleche) return;
  const ou = flecheVersLeFoyer(vue, foyer, obstacles(toile, vue), DEMI_PLACE);
  fleche.hidden = !ou;
  if (ou) fleche.style.transform = `translate(${ou.x}px, ${ou.y}px) rotate(${ou.angle}rad)`;
}

/**
 * US-0426 : la flèche du Foyer, par-dessus la carte, cachée tant que placerLaFleche ne l'a pas posée. La toucher
 * ramène la carte sur le Foyer (`revenir`), comme le bouton du Foyer, que le clavier et les lecteurs d'écran ont déjà.
 */
export function FlecheDuFoyer({ ref, revenir }: { ref: Ref<HTMLButtonElement>; revenir: () => void }) {
  return (
    <button ref={ref} type="button" className={styles.fleche} hidden tabIndex={-1} aria-hidden="true" onClick={revenir}>
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M21 12 5 20l3.5-8L5 4Z" />
      </svg>
    </button>
  );
}
