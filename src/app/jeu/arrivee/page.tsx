import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import { getPool } from "@/db";
import { marquerRecitLu } from "@/monde/territoire";
import { maintenant } from "@/temps/horloge";
import styles from "../../entree.module.css";
import { recitDArrivee } from "./recit";

export const metadata: Metadata = { title: "Arrivée" };

/**
 * Le récit d'arrivée (US-0158), juste après le nom de chef : le nom du chef, la prairie, la Couronne
 * au bord du Monde, et un bouton vers le Foyer. Il est noté comme lu dès qu'il s'affiche : y revenir
 * mène droit au Foyer.
 */
export default async function Arrivee() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { nomDeChef, territoireId } = await exigerCompte("/jeu/arrivee");
  const premiereFois = territoireId === null ? null : await marquerRecitLu(getPool(), territoireId, maintenant());
  if (!premiereFois) redirect("/jeu");
  return (
    <PageEntree titre={`${nomDeChef}.`} illustration={{ chemin: "accueil/plateau.webp", alt: "Le monde de Bestia, sculpté comme un plateau de jeu" }}>
      <p className={styles.recit}>{recitDArrivee(premiereFois.monde)}</p>
      <Link href="/jeu" className={styles.envoyer}>
        Entrer dans mon Foyer
      </Link>
    </PageEntree>
  );
}
