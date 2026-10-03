import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import styles from "../entree.module.css";

export const metadata: Metadata = { title: "Se connecter" };

/** Le formulaire de connexion arrive avec US-0115. En production, la page attend l'ouverture de l'entrée du jeu. */
export default function Connexion() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Se connecter</h1>
      <p className={styles.texte}>Le formulaire arrive bientôt.</p>
      <Link href="/" className={styles.retour}>
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
