import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import styles from "../entree.module.css";

export const metadata: Metadata = { title: "Se connecter" };

/** Le formulaire de connexion arrive avec US-0115. En production, la page attend l'ouverture de l'entrée du jeu. */
export default function Connexion() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <PageEntree
      titre="Se connecter"
      illustration={{ chemin: "entree/connexion.webp", alt: "Une hutte au toit de chaume, éclairée au crépuscule, au bout d'un chemin fleuri" }}
    >
      <p className={styles.texte}>Le formulaire arrive bientôt.</p>
      <p className={styles.autre}>
        <Link href="/inscription" className={styles.lien}>
          Créer un compte
        </Link>
      </p>
    </PageEntree>
  );
}
