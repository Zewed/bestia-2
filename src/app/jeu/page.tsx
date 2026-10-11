import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte, recitsNonLusALHeure, voyageursALHeure } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Illustration } from "@/components/Illustration";
import { getPool } from "@/db";
import { recapitulatifDAbsence } from "@/monde/absence";
import { departsNonLus, departsPendantLAbsence } from "@/monde/famine";
import { stocksDuTerritoire } from "@/monde/stocks";
import { foyerDuTerritoire } from "@/monde/territoire";
import { maintenant } from "@/temps/horloge";
import styles from "./page.module.css";
import { BlocProduction } from "./BlocProduction";
import { RecapAbsence } from "./RecapAbsence";

export const metadata: Metadata = { title: "Foyer" };

/** Tous les Foyers naissent en prairie (US-0152) : une seule illustration sert à tous. */
const ILLUSTRATION_DU_FOYER = { chemin: "foyer/prairie.webp", alt: "La hutte du chef, au toit de chaume et à la tête de loup, dans la prairie au petit matin" };

/** « Un Voyageur aux portes », « 2 Voyageurs aux portes ». */
const voyageursAuxPortes = (n: number) => `${n > 1 ? `${n} Voyageurs` : "Un Voyageur"} aux portes`;

/** « 1 Récit non lu », « 2 Récits non lus ». */
const recitsNonLus = (n: number) => `${n} ${n > 1 ? "Récits non lus" : "Récit non lu"}`;

/**
 * L'écran du Foyer (US-0157) : la hutte du chef en grand, toute la place de l'écran entre le haut et la rangée des
 * médaillons, et le Biome du Foyer posé dessus. Rien
 * d'autre : le nom du chef est dans la barre du haut, et rien ne mène à une fonction qui n'existe
 * pas encore (US-0163) ; au retour d'une absence, ce que le Foyer a produit entre-temps (US-0216) ;
 * à côté, ou dessous sur mobile, sa production horaire (US-0217). Sans session, la garde mène à la
 * connexion ; sans nom de chef, à son choix.
 *
 * US-0327 : en haut, tant que le joueur n'a pas lu le Récit des départs de Famine, une ligne le signale, « 3 Habitants
 * sont partis pendant votre absence », et « Lire » mène aux Récits.
 *
 * Posés sur la scène comme des écriteaux, ce que la navigation signale déjà, lu de même : les Voyageurs qui attendent aux
 * portes (US-0332), « Voir » menant aux Habitants, et les Récits non lus (US-0324), « Lire » menant aux Récits.
 */
export default async function Foyer() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu");
  const foyer = territoireId === null ? null : await foyerDuTerritoire(getPool(), territoireId);
  const recap = territoireId === null ? { gains: [], pleins: [] } : await recapitulatifDAbsence(getPool(), territoireId, maintenant());
  const stocks = territoireId === null ? [] : await stocksDuTerritoire(getPool(), territoireId);
  const departs = territoireId === null ? null : await departsNonLus(getPool(), territoireId);
  const [voyageurs, nonLus] = territoireId === null ? [0, 0] : await Promise.all([voyageursALHeure(territoireId), recitsNonLusALHeure(territoireId)]);
  return (
    <main className={`${styles.page} ${foyer ? styles.avecProduction : ""}`}>
      {departs ? (
        <p className={styles.departs} data-avis="departs">
          <strong className={styles.nombreDeDeparts}>{departsPendantLAbsence(departs.habitants)}</strong>{" "}
          <Link href="/jeu/recits" className={styles.lireDeparts}>
            Lire
          </Link>
        </p>
      ) : null}
      <section className={styles.foyer}>
        <Illustration chemin={ILLUSTRATION_DU_FOYER.chemin} alt={ILLUSTRATION_DU_FOYER.alt} sizes="100vw" prioritaire className={styles.remplir} />
        <RecapAbsence recap={recap} />
        <h1 className={styles.legende}>{foyer ? `Foyer · ${foyer.biome.nom.toLocaleLowerCase("fr")}` : "Foyer"}</h1>
      </section>
      {voyageurs > 0 ? (
        <p className={styles.avis} data-avis="voyageurs">
          <strong className={styles.texteAvis}>{voyageursAuxPortes(voyageurs)}</strong>{" "}
          <Link href="/jeu/habitants" className={styles.lireDeparts}>
            Voir
          </Link>
        </p>
      ) : null}
      {nonLus > 0 ? (
        <p className={styles.avis} data-avis="recits">
          <strong className={styles.texteAvis}>{recitsNonLus(nonLus)}</strong>{" "}
          <Link href="/jeu/recits" className={styles.lireDeparts}>
            Lire
          </Link>
        </p>
      ) : null}
      {foyer ? <BlocProduction biome={foyer.biome.nom} productions={stocks} /> : null}
    </main>
  );
}
