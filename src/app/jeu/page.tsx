import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import styles from "../entree.module.css";

export const metadata: Metadata = { title: "Le jeu" };

/**
 * La page du jeu (US-0116), provisoire : elle accueille le chef par son nom (US-0139), en attendant
 * les premières Bêtes. Sans session, la garde mène à la connexion ; sans nom de chef, à son choix.
 */
export default async function Jeu() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { nomDeChef } = await exigerCompte("/jeu");
  return (
    <PageEntree titre={`Bienvenue, ${nomDeChef}`} illustration={{ chemin: "accueil/plateau.webp", alt: "Le monde de Bestia, sculpté comme un plateau de jeu" }}>
      <p className={styles.texte}>Vos premières Bêtes arrivent bientôt.</p>
    </PageEntree>
  );
}
