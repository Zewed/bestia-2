"use client";

import { useActionState } from "react";
import { fixerUnStock } from "./actions";
import styles from "./page.module.css";

/** US-0208 : le champ et le bouton qui fixent un Stock, avec l'erreur sous eux s'il y en a une. */
export function FixerStock({ territoireId, ressourceId, nom }: { territoireId: number; ressourceId: string; nom: string }) {
  const [etat, envoyer, enCours] = useActionState(fixerUnStock, { erreur: null });
  const id = `fixer-${ressourceId}`;
  return (
    <form action={envoyer} className={styles.fixer}>
      <input type="hidden" name="territoire" value={territoireId} />
      <input type="hidden" name="ressource" value={ressourceId} />
      <input
        id={id}
        name="quantite"
        inputMode="decimal"
        autoComplete="off"
        aria-label={`Nouvelle quantité de ${nom}`}
        aria-invalid={etat.erreur ? true : undefined}
        aria-describedby={etat.erreur ? `${id}-erreur` : undefined}
        className={styles.champ}
        required
      />
      <button type="submit" className={styles.bouton} disabled={enCours}>
        Fixer
      </button>
      {etat.erreur ? (
        <p id={`${id}-erreur`} className={styles.erreurChamp} role="alert">
          {etat.erreur}
        </p>
      ) : null}
    </form>
  );
}
