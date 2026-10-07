import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { getPool } from "@/db";
import { recitsDuTerritoire } from "@/monde/recits";
import { formaterInstant } from "@/temps/affichage";
import { ListeDesRecits } from "./ListeDesRecits";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Récits" };

/** Le fuseau des dates, comme sur la page de contrôle, en attendant celui de chaque joueur. */
const FUSEAU = "Europe/Paris";

/**
 * La page Récits (US-0324), ouverte depuis la navigation : ce qui est arrivé sur le Territoire, du plus
 * récent au plus ancien, chaque Récit avec sa date et son heure. Sans session, la garde mène à la
 * connexion, qui ramène ici.
 */
export default async function Recits() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/recits");
  const recits = territoireId === null ? [] : await recitsDuTerritoire(getPool(), territoireId);
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Récits</h1>
      <Bloc>
        {recits.length === 0 ? (
          <p className={styles.vide}>Rien à raconter pour l&apos;instant.</p>
        ) : (
          <ListeDesRecits
            recits={recits.map((r) => ({
              id: r.id,
              titre: r.titre,
              texte: r.texte,
              instant: r.survenuLe.toISOString(),
              quand: formaterInstant(r.survenuLe, FUSEAU),
              lu: r.luLe !== null,
            }))}
          />
        )}
      </Bloc>
    </main>
  );
}
