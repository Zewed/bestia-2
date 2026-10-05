import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { IllustrationEspece } from "@/components/IllustrationEspece";
import { PastilleRarete } from "@/components/PastilleRarete";
import { getPool } from "@/db";
import { couplesDeDepartEnBase } from "@/donnees/en-base";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Couple de départ" };

/**
 * Le choix du Couple de départ, juste après le nom de chef (US-0141) : les trois cartes de la liste
 * des Couples de départ, dans leur ordre, chacune avec l'illustration, le nom et la Rareté de son
 * Espèce. Rien d'autre : le titre et les cartes suffisent.
 */
export default async function CoupleDeDepart() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  await exigerCompte("/jeu/couple-de-depart");
  const couples = await couplesDeDepartEnBase(getPool());
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Votre Couple de départ</h1>
      <ul className={styles.cartes}>
        {couples.map(({ espece, rarete }) => (
          <li key={espece.id}>
            <article className={styles.carte} aria-labelledby={`couple-${espece.id}`}>
              <IllustrationEspece espece={espece} format="carte" className={styles.illustration} />
              <div className={styles.corps}>
                <h2 id={`couple-${espece.id}`} className={styles.nom}>
                  {espece.nom}
                </h2>
                <PastilleRarete rarete={rarete} />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
