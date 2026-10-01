import Link from "next/link";
import styles from "./Logo.module.css";

/** Le logo du loup, qui ramène à l'accueil. Dessiné en vecteur : net sur tous les écrans. */
export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Bestia">
      <svg viewBox="0 0 48 48" className={styles.loup} aria-hidden="true" focusable="false">
        <path className={styles.tete} d="M6 6 L17 15 L31 15 L42 6 L40 24 L32 38 L24 44 L16 38 L8 24 Z" />
        <path className={styles.yeux} d="M17 26 L22 28 L17 30 Z M31 26 L26 28 L31 30 Z M21 36 L24 39 L27 36 Z" />
      </svg>
      <span className={styles.nom} aria-hidden="true">
        Bestia
      </span>
    </Link>
  );
}
