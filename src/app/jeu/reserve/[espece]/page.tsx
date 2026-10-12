import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { IllustrationEspece } from "@/components/IllustrationEspece";
import { PastilleRarete } from "@/components/PastilleRarete";
import { getPool } from "@/db";
import { coupleEnReserve } from "@/monde/couple";
import { caracteristiqueAffichee as nombre } from "@/monde/quantite";
import styles from "./page.module.css";

// Le titre reste celui de la Réserve : le nom d'une Espèce ne se lit pas sans la garde.
export const metadata: Metadata = { title: "Réserve" };

/** US-0803 : un identifiant d'Espèce, tel que les données du jeu les écrivent (« souris », « peu_commune »). */
const IDENTIFIANT = /^[a-z0-9_]{1,64}$/;

/**
 * US-0803 : la fiche de l'Espèce d'un Couple de la Réserve, qu'ouvre sa carte : son illustration en grand, son nom en
 * titre et sa Rareté, sur la pastille de ses couleurs. « Fermer » ramène à la Réserve. Seulement pour une Espèce dont le
 * joueur a réuni le Couple : toute autre adresse est introuvable, sans dire si un autre joueur l'a réuni.
 *
 * US-0804 : sous le nom, ses caractéristiques telles que la base les a enregistrées, les mêmes pour tous les joueurs :
 * l'attaque, la vie, la vitesse en km/h et la charge, un nom et une valeur chacune, sans phrase (leurs explications
 * arrivent avec US-0807). Toutes sont toujours là : une Espèce à qui il en manque une ne se charge pas en base
 * (src/donnees/jeux.ts).
 */
export default async function FicheDeLEspece({ params }: { params: Promise<{ espece: string }> }) {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { espece } = await params;
  if (!IDENTIFIANT.test(espece)) notFound();
  const { territoireId } = await exigerCompte(`/jeu/reserve/${espece}`);
  const couple = territoireId === null ? null : await coupleEnReserve(getPool(), territoireId, espece);
  if (!couple) notFound();
  return (
    <main className={styles.page}>
      <article className={styles.fiche}>
        <IllustrationEspece espece={couple} format="grand" className={styles.illustration} />
        <div className={styles.entete}>
          <h1 className={styles.nom}>{couple.nom}</h1>
          <PastilleRarete rarete={couple.rarete} />
          <dl className={styles.caracteristiques}>
            <div>
              <dt>Attaque</dt>
              <dd>{nombre(couple.attaque)}</dd>
            </div>
            <div>
              <dt>Vie</dt>
              <dd>{nombre(couple.vie)}</dd>
            </div>
            <div>
              <dt>Vitesse</dt>
              <dd>{nombre(couple.vitesse)}&nbsp;km/h</dd>
            </div>
            <div>
              <dt>Charge</dt>
              <dd>{nombre(couple.charge)}</dd>
            </div>
          </dl>
        </div>
        <Link href="/jeu/reserve" className={styles.fermer}>
          Fermer
        </Link>
      </article>
    </main>
  );
}
