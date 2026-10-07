import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Illustration } from "@/components/Illustration";
import { getPool } from "@/db";
import { recapitulatifDAbsence } from "@/monde/absence";
import { stocksDuTerritoire } from "@/monde/stocks";
import { foyerDuTerritoire } from "@/monde/territoire";
import { maintenant } from "@/temps/horloge";
import styles from "./page.module.css";
import { BlocProduction } from "./BlocProduction";
import { RecapAbsence } from "./RecapAbsence";

export const metadata: Metadata = { title: "Foyer" };

/** Tous les Foyers naissent en prairie (US-0152) : une seule illustration sert à tous. */
export const ILLUSTRATION_DU_FOYER = { chemin: "foyer/prairie.webp", alt: "La hutte du chef, au toit de chaume et à la tête de loup, dans la prairie au petit matin" };

/**
 * L'écran du Foyer (US-0157) : la hutte du chef en grand, et le Biome du Foyer posé dessus. Rien
 * d'autre : le nom du chef est dans la barre du haut, et rien ne mène à une fonction qui n'existe
 * pas encore (US-0163) ; au retour d'une absence, ce que le Foyer a produit entre-temps (US-0216) ;
 * à côté, ou dessous sur mobile, sa production horaire (US-0217). Sans session, la garde mène à la
 * connexion ; sans nom de chef, à son choix.
 */
export default async function Foyer() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu");
  const foyer = territoireId === null ? null : await foyerDuTerritoire(getPool(), territoireId);
  const recap = territoireId === null ? { gains: [], pleins: [] } : await recapitulatifDAbsence(getPool(), territoireId, maintenant());
  const stocks = territoireId === null ? [] : await stocksDuTerritoire(getPool(), territoireId);
  return (
    <main className={`${styles.page} ${foyer ? styles.avecProduction : ""}`}>
      <section className={styles.foyer}>
        <Illustration
          chemin={ILLUSTRATION_DU_FOYER.chemin}
          alt={ILLUSTRATION_DU_FOYER.alt}
          sizes="(max-width: 1180px) 100vw, 1180px"
          prioritaire
          className={styles.remplir}
        />
        <RecapAbsence recap={recap} />
        <h1 className={styles.legende}>{foyer ? `Foyer · ${foyer.biome.nom.toLocaleLowerCase("fr")}` : "Foyer"}</h1>
      </section>
      {foyer ? <BlocProduction biome={foyer.biome.nom} productions={stocks} /> : null}
    </main>
  );
}
