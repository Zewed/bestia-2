import Image from "next/image";
import type { EntreeDuJeu } from "./entrees-du-jeu";
import styles from "./Medaillon.module.css";

/**
 * Le médaillon d'une page du jeu : son illustration peinte, dans un rond de bois cerclé de doré, comme les boutons
 * d'un jeu sur la carte. La hutte du chef est recadrée sur son toit, comme sur la Case du Foyer. Il ne sert qu'aux
 * yeux : le nom de la page est écrit à côté.
 */
export function Medaillon({ entree, grand = false }: { entree: EntreeDuJeu; grand?: boolean }) {
  return (
    <span className={`${styles.medaillon} ${grand ? styles.grand : ""}`} data-hutte={entree.hutte ? "" : undefined} aria-hidden="true">
      <Image src={entree.icone} alt="" width={entree.hutte ? 192 : 96} height={entree.hutte ? 128 : 96} className={styles.image} />
    </span>
  );
}
