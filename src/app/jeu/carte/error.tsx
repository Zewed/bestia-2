"use client";

import { Bloc } from "@/components/Bloc";
import erreur from "../../error.module.css";
import etats from "./etats.module.css";
import styles from "./page.module.css";

/**
 * US-0434 : si la carte n'a pas pu s'afficher (sa lecture a échoué), un bloc Bento à sa place le dit, avec de quoi
 * réessayer : la page relit alors la carte, sans recharger le reste.
 */
export default function ErreurDeLaCarte({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.annonce}>Carte</h1>
      <div className={etats.erreur}>
        <Bloc className={etats.etat}>
          <p role="alert" className={erreur.texte}>
            La carte n&apos;a pas pu s&apos;afficher.
          </p>
          <button type="button" className={erreur.reessayer} onClick={() => retry()}>
            Réessayer
          </button>
        </Bloc>
      </div>
    </main>
  );
}
