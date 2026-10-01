import type { CSSProperties, ReactNode } from "react";
import styles from "./Bloc.module.css";

export type Largeur = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type BlocProps = {
  /** Petit titre en capitales en haut du bloc, facultatif. */
  titre?: ReactNode;
  /** Le contenu touche les bords, pour une illustration. */
  plein?: boolean;
  /** Dans une Grille : le nombre de colonnes occupées sur ordinateur, sur 12 (toutes par défaut). */
  largeur?: Largeur;
  className?: string;
  children: ReactNode;
};

/** La brique de chaque écran : un bloc Bento, avec ou sans titre. */
export function Bloc({ titre, plein = false, largeur, className, children }: BlocProps) {
  const classes = [styles.bloc, plein && styles.plein, className].filter(Boolean).join(" ");
  const place = largeur ? ({ "--largeur": largeur } as CSSProperties) : undefined;
  return (
    <section className={classes} style={place} data-etroit={largeur && largeur <= 6 ? "" : undefined}>
      {titre ? <h2 className={styles.titre}>{titre}</h2> : null}
      {children}
    </section>
  );
}
