"use client";

import styles from "./error.module.css";

/** Si une page n'a pas pu se mettre à jour, on le dit plutôt que d'afficher un état périmé. */
export default function Erreur({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Le Monde n&apos;a pas pu se mettre à jour</h1>
      <p className={styles.texte}>Rien n&apos;est perdu : réessayez dans un instant.</p>
      <button type="button" className={styles.reessayer} onClick={() => retry()}>
        Réessayer
      </button>
    </main>
  );
}
