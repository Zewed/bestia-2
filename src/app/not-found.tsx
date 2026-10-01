import type { Metadata } from "next";
import Link from "next/link";
import { Illustration } from "@/components/Illustration";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page introuvable" };

/** Toute adresse inconnue arrive ici, avec le code 404. */
export default function PageIntrouvable() {
  return (
    <main className={styles.page}>
      <div className={styles.image}>
        <Illustration
          chemin="accueil/explorateurs.webp"
          alt="Deux explorateurs et leur lama scrutent l'horizon, carte en main"
          sizes="(max-width: 820px) 100vw, 440px"
          prioritaire
          className={styles.remplir}
        />
      </div>
      <div>
        <p className={styles.code}>Erreur 404</p>
        <h1 className={styles.titre}>Page introuvable</h1>
        <p className={styles.texte}>Même nos explorateurs ne la trouvent pas.</p>
        <Link href="/" className={styles.retour}>
          Revenir à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
