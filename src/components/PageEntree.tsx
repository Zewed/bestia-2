import type { ReactNode } from "react";
import { Illustration } from "./Illustration";
import styles from "./PageEntree.module.css";

type PageEntreeProps = {
  /** La grande illustration, sous public/illustrations. */
  illustration: { chemin: string; alt: string };
  /** Le titre de la page ; sans titre, le contenu pose le sien avec TitreEntree (il peut alors changer). */
  titre?: string;
  children: ReactNode;
};

/** Le grand titre d'une page d'entrée, pour un contenu qui le change en cours de route. */
export function TitreEntree({ children }: { children: ReactNode }) {
  return <h1 className={styles.titre}>{children}</h1>;
}

/**
 * L'habillage des pages d'entrée du jeu (inscription, connexion) : une grande illustration
 * à gauche, le formulaire dans son bloc à droite. Sur mobile, l'illustration passe en bandeau.
 */
export function PageEntree({ illustration, titre, children }: PageEntreeProps) {
  return (
    <main className={styles.page}>
      <div className={styles.image}>
        <Illustration
          chemin={illustration.chemin}
          alt={illustration.alt}
          sizes="(max-width: 820px) 100vw, 600px"
          prioritaire
          className={styles.remplir}
        />
        <p className={styles.devise} aria-hidden="true">
          Un monde sauvage, des bêtes à apprivoiser.
        </p>
      </div>
      <section className={styles.bloc}>
        <div className={styles.contenu}>
          {titre ? <TitreEntree>{titre}</TitreEntree> : null}
          {children}
        </div>
      </section>
    </main>
  );
}
