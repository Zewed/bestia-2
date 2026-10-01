import type { ReactNode } from "react";
import styles from "./Bloc.module.css";

type BlocProps = {
  /** Petit titre en capitales en haut du bloc, facultatif. */
  titre?: ReactNode;
  /** Le contenu touche les bords, pour une illustration. */
  plein?: boolean;
  className?: string;
  children: ReactNode;
};

/** La brique de chaque écran : un bloc Bento, avec ou sans titre. */
export function Bloc({ titre, plein = false, className, children }: BlocProps) {
  const classes = [styles.bloc, plein && styles.plein, className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {titre ? <h2 className={styles.titre}>{titre}</h2> : null}
      {children}
    </section>
  );
}
