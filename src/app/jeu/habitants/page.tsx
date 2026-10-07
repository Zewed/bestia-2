import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { Grille } from "@/components/Grille";
import { getPool } from "@/db";
import { type EntretienDesHabitants, entretienDesHabitants, habitantsDuTerritoire, placesDuTerritoire } from "@/monde/habitants";
import { quantiteExacte } from "@/monde/quantite";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Habitants" };

/** « 1 Habitant », « 3 Habitants ». */
function nombreDHabitants(nombre: number): string {
  return `${nombre} ${nombre > 1 ? "Habitants" : "Habitant"}`;
}

/** US-0305 : « 3 Habitants sur 5 places », « 1 Habitant sur 1 place ». */
function habitantsSurPlaces(habitants: number, places: number): string {
  return `${nombreDHabitants(habitants)} sur ${places} ${places > 1 ? "places" : "place"}`;
}

/** US-0318 : le détail de l'Entretien, en une ligne : « 3 Habitants × 2 Nourriture = », puis le total. */
function LigneEntretien({ entretien }: { entretien: EntretienDesHabitants }) {
  return (
    <p className={styles.ligneEntretien}>
      {`${nombreDHabitants(entretien.habitants)} × ${quantiteExacte(String(entretien.parHabitant))} Nourriture = `}
      <strong className={styles.totalEntretien}>{`${quantiteExacte(entretien.parHeure)} Nourriture par heure`}</strong>
    </p>
  );
}

/**
 * La page Habitants (US-0302), ouverte depuis la navigation : leur nombre sur la place du Territoire,
 * avec « Plus de place » quand elle est toute prise (US-0305), puis une ligne par Habitant avec son
 * prénom, son Métier et son état, dans l'ordre de la lecture (US-0303) ; à côté, ou dessous sur mobile,
 * leur Entretien par heure (US-0318). Tout est lu à chaque affichage. Sans session, la garde mène à la
 * connexion, qui ramène ici.
 */
export default async function Habitants() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/habitants");
  const [habitants, places, entretien] = await Promise.all([
    territoireId === null ? [] : habitantsDuTerritoire(getPool(), territoireId),
    territoireId === null ? 0 : placesDuTerritoire(getPool(), territoireId),
    territoireId === null ? null : entretienDesHabitants(getPool(), territoireId),
  ]);
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Habitants</h1>
      <Grille>
        <Bloc largeur={8}>
          <div className={styles.entete}>
            <p className={styles.nombre}>{habitantsSurPlaces(habitants.length, places)}</p>
            {habitants.length >= places ? <p className={styles.plein}>Plus de place</p> : null}
          </div>
          {habitants.length > 0 ? (
            <ul className={styles.habitants}>
              {habitants.map((h) => (
                <li key={h.id} className={styles.habitant}>
                  <span className={styles.prenom}>{h.prenom}</span>
                  <span className={styles.metier} data-sans-metier={h.metier === null ? "" : undefined}>
                    {h.metier ?? "sans Métier"}
                  </span>
                  <span className={styles.etat}>{h.etat}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Bloc>
        {entretien ? (
          <Bloc titre="Entretien" largeur={4} className={styles.entretien}>
            <LigneEntretien entretien={entretien} />
          </Bloc>
        ) : null}
      </Grille>
    </main>
  );
}
