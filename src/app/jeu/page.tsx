import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { compteConnecte } from "@/comptes/cookie-session";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import styles from "../entree.module.css";

export const metadata: Metadata = { title: "Le jeu" };

/**
 * La page du jeu (US-0116), provisoire : elle accueille le joueur connecté, en attendant le
 * choix du nom de chef et des premières Bêtes. Sans session, retour à la connexion.
 */
export default async function Jeu() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const compte = await compteConnecte();
  if (!compte) redirect("/connexion");
  return (
    <PageEntree titre="Bienvenue dans Bestia" illustration={{ chemin: "accueil/plateau.webp", alt: "Le monde de Bestia, sculpté comme un plateau de jeu" }}>
      <p className={styles.texte}>
        Vous êtes connecté avec <strong>{compte.email}</strong>.
      </p>
      <p className={styles.texte}>La suite arrive : votre nom de chef, puis vos premières Bêtes.</p>
    </PageEntree>
  );
}
