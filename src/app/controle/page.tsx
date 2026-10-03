import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { motDePasseAccepte } from "@/controle/acces";
import { getPool } from "@/db";
import { JOURNAL_TACHE_JOURS } from "@/reglages";
import { derniersPassages, type PassageNote } from "@/temps/absents";
import { formaterInstant } from "@/temps/affichage";
import { maintenant, vitesse } from "@/temps/horloge";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Contrôle", robots: { index: false, follow: false } };

const FUSEAU = "Europe/Paris";

/** La page de contrôle interne (US-0034) : le temps du jeu d'un coup d'œil. Aucun lien n'y mène. */
export default async function Controle() {
  await connection();
  // Le proxy demande déjà le mot de passe ; la page vérifie à nouveau, au cas où il serait contourné.
  if (!motDePasseAccepte((await headers()).get("authorization"))) notFound();
  const passages = await derniersPassages(getPool());
  const facteur = vitesse();

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Contrôle</h1>
      <Grille>
        <Bloc titre="Heure du jeu" largeur={6}>
          <p className={styles.valeur}>{formaterInstant(maintenant(), FUSEAU)}</p>
          <p className={styles.note}>Heure de Paris.</p>
        </Bloc>
        <Bloc titre="Vitesse du temps" largeur={6} teinte={facteur === 1 ? undefined : "citron"}>
          <p className={styles.valeur}>×{facteur}</p>
          <p className={styles.note}>{facteur === 1 ? "Vitesse normale." : "Temps accéléré."}</p>
        </Bloc>
        <Bloc titre="Derniers passages de la tâche planifiée">
          {passages.length === 0 ? (
            <p className={styles.note}>Aucun passage noté ces {JOURNAL_TACHE_JOURS} derniers jours.</p>
          ) : (
            <div className={styles.defilement}>
              <table className={styles.tableau}>
                <thead>
                  <tr>
                    <th>Début</th>
                    <th>Résultat</th>
                    <th>Rattrapés</th>
                    <th>Restants</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {passages.map((p) => (
                    <tr key={p.debut.toISOString()}>
                      <td>{formaterInstant(p.debut, FUSEAU)}</td>
                      <td className={p.echecs > 0 ? styles.echec : undefined}>{resultat(p)}</td>
                      <td>{p.rattrapes}</td>
                      <td>{p.restants}</td>
                      <td>{(p.dureeMs / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>
      </Grille>
    </main>
  );
}

function resultat(p: PassageNote): string {
  if (p.echecs === 0) return "Réussi";
  const raison = p.erreurs[0]?.raison;
  return `${p.echecs} échec${p.echecs > 1 ? "s" : ""}${raison ? ` : ${raison}` : ""}`;
}
