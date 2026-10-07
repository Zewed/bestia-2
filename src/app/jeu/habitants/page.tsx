import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { Bloc } from "@/components/Bloc";
import { getPool } from "@/db";
import { habitantsDuTerritoire } from "@/monde/habitants";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Habitants" };

/** « 1 Habitant », « 3 Habitants ». */
function nombreDHabitants(nombre: number): string {
  return `${nombre} ${nombre > 1 ? "Habitants" : "Habitant"}`;
}

/**
 * La page Habitants (US-0302), ouverte depuis la navigation : leur nombre, puis une ligne par Habitant
 * avec son prénom, son Métier et son état, dans l'ordre de la lecture (US-0303). Sans session, la
 * garde mène à la connexion, qui ramène ici.
 */
export default async function Habitants() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/habitants");
  const habitants = territoireId === null ? [] : await habitantsDuTerritoire(getPool(), territoireId);
  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Habitants</h1>
      <Bloc>
        <p className={styles.nombre}>{nombreDHabitants(habitants.length)}</p>
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
    </main>
  );
}
