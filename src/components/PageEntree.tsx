import type { ReactNode } from "react";
import { Illustration } from "./Illustration";
import styles from "./PageEntree.module.css";

type PageEntreeProps = {
  /** La grande illustration, sous public/illustrations. */
  illustration: { chemin: string; alt: string };
  titre: string;
  children: ReactNode;
};

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
          <h1 className={styles.titre}>{titre}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
