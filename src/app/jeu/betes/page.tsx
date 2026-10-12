import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { IllustrationEspece } from "@/components/IllustrationEspece";
import { PastilleRarete } from "@/components/PastilleRarete";
import { getPool } from "@/db";
import { blessesAuFoyer } from "@/monde/blesses";
import { blessesAffiches, blessesDans } from "@/monde/blesses-affiches";
import { effectifParEspece } from "@/monde/effectif";
import { maintenant } from "@/temps/horloge";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Bêtes" };

/** « 1 Bête », « 12 Bêtes ». */
const betes = (nombre: number) => (nombre > 1 ? "Bêtes" : "Bête");

/**
 * US-0810 : la page Bêtes, qu'ouvre le bloc « Bêtes » du Foyer : le total des Bêtes du joueur en haut, puis chaque Espèce
 * de son effectif (effectifParEspece), de la plus commune à la plus rare : sa vignette, son nom, sa Rareté et son
 * effectif. Les Bêtes d'un Couple, en Réserve, n'y comptent pas. Toucher une Espèce ouvre sa fiche (US-0803), qui se
 * referme ici. Sans session, la garde mène à la connexion, qui ramène ici. US-0952 : sous le nom et la Rareté d'une Espèce,
 * chaque groupe de ses Blessés au Foyer (blessesAuFoyer, à l'heure du jeu, jamais plus que son effectif) et le temps qui lui
 * reste avant sa guérison : « dont 3 Blessés, guéris dans 5 h » ; rien sans Blessé.
 */
export default async function Betes() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/betes");
  const especes = territoireId === null ? [] : await effectifParEspece(getPool(), territoireId);
  const instant = maintenant();
  const groupes = territoireId === null || especes.length === 0 ? new Map() : await blessesAuFoyer(getPool(), territoireId, instant);
  const blesses = (especeId: string, effectif: number) => blessesAffiches(groupes.get(especeId) ?? [], instant, effectif).map((g) => `dont ${blessesDans(g)}`);
  const total = especes.reduce((somme, espece) => somme + espece.effectif, 0);
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Bêtes</h1>
      <Bloc>
        <p className={styles.total}>
          <strong className={styles.nombre}>{total}</strong> {betes(total)}
        </p>
      </Bloc>
      {especes.length > 0 ? (
        <ul className={styles.especes} aria-label="Effectif">
          {especes.map((espece) => {
            const lignes = blesses(espece.especeId, espece.effectif);
            return (
              <li key={espece.especeId}>
                <Link
                  href={`/jeu/reserve/${espece.especeId}?depuis=betes`}
                  className={styles.espece}
                  aria-label={[`${espece.nom}, ${espece.rarete.nom}, ${espece.effectif} ${betes(espece.effectif)}`, ...lignes].join(", ")}
                >
                  <IllustrationEspece espece={espece} format="vignette" className={styles.vignette} />
                  <span className={styles.identite}>
                    <span className={styles.nom}>{espece.nom}</span>
                    <PastilleRarete rarete={espece.rarete} />
                    {lignes.map((ligne, i) => (
                      <span key={i} className={styles.blesses}>
                        {ligne}
                      </span>
                    ))}
                  </span>
                  <span className={styles.effectif}>{espece.effectif}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
