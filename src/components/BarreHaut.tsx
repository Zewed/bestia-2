import type { ReactNode } from "react";
import { Logo } from "./Logo";
import styles from "./BarreHaut.module.css";

/**
 * La barre du haut, sur chaque page : le logo à gauche, et à droite les actions du joueur, que
 * chaque page fournit (l'emplacement @actions de la mise en page) : rien hors du jeu, le nom de
 * chef et son menu dans le jeu (US-0140), et au milieu ses ressources (US-0203).
 */
export function BarreHaut({ actions }: { actions?: ReactNode }) {
  return (
    <header className={styles.barre}>
      <Logo />
      {actions}
    </header>
  );
}
