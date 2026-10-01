import { Logo } from "./Logo";
import styles from "./BarreHaut.module.css";

/** La barre du haut, sur chaque page : le logo à gauche ; les informations du joueur viendront plus tard. */
export function BarreHaut() {
  return (
    <header className={styles.barre}>
      <Logo />
    </header>
  );
}
