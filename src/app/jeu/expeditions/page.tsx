import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { getPool } from "@/db";
import { casesDuFoyer } from "@/expeditions/choix-de-destination";
import { expeditionsEnCours } from "@/expeditions/en-cours";
import type { Phase } from "@/expeditions/phase";
import { maintenant } from "@/temps/horloge";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Expéditions en cours" };

/** US-0911 : la phase d'une Expédition, telle que la liste la dit. */
const PHASES: Record<Phase, string> = { aller: "Aller", sejour: "Séjour", retour: "Retour" };

/**
 * US-0911 : la liste des Expéditions en cours, où mène un départ : chacune y apparaît aussitôt partie, à l'aller, avec sa
 * destination (son Biome, ou « Case inconnue » sous le brouillard) et sa distance au Foyer ; sa phase se lit à l'heure du
 * jeu. Le détail de chacune (temps restant, explorateurs, escorte) arrive avec US-0918. Sans session, la garde mène à la
 * connexion, qui ramène ici.
 */
export default async function ExpeditionsEnCours() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/expeditions");
  const expeditions = territoireId === null ? [] : await expeditionsEnCours(getPool(), territoireId, maintenant());
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Expéditions en cours</h1>
      <Bloc>
        {expeditions.length === 0 ? (
          <p className={styles.vide}>Aucune Expédition en cours</p>
        ) : (
          <ul className={styles.expeditions}>
            {expeditions.map(({ id, destination, phase }) => (
              <li key={id} className={styles.expedition}>
                <strong className={styles.destination}>{"inconnue" in destination ? "Case inconnue" : destination.biome}</strong>
                <span className={styles.distance}>{casesDuFoyer(destination.distance)}</span>
                <span className={styles.phase}>{PHASES[phase]}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloc>
    </main>
  );
}
