import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import styles from "../entree.module.css";

export const metadata: Metadata = { title: "Créer un compte" };

/** Le formulaire d'inscription arrive avec US-0102. En production, la page attend l'ouverture de l'entrée du jeu. */
export default function Inscription() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Créer un compte</h1>
      <p className={styles.texte}>Le formulaire arrive bientôt.</p>
      <Link href="/" className={styles.retour}>
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
