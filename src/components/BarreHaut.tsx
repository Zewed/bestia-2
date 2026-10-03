import { ActionsJoueur } from "./ActionsJoueur";
import { Logo } from "./Logo";
import styles from "./BarreHaut.module.css";

/** La barre du haut, sur chaque page : le logo à gauche, les actions du joueur à droite sur les pages du jeu. */
export function BarreHaut() {
  return (
    <header className={styles.barre}>
      <Logo />
      <ActionsJoueur />
    </header>
  );
}
