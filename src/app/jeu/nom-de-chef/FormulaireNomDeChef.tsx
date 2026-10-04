"use client";

import { useState } from "react";
import { couperNom, longueurDuNom, verifierLongueurDuNom } from "@/chefs/nom";
import { NOM_DE_CHEF_MAX } from "@/reglages";
import styles from "../../entree.module.css";

/**
 * Le champ du nom de chef. US-0132 : le compteur paraît dès qu'on écrit, le champ ne prend pas
 * plus de 16 caractères, et un nom trop court se signale quand on quitte le champ, jamais pendant
 * la frappe. « Valider » s'activera avec l'enregistrement du nom (US-0139).
 */
export function FormulaireNomDeChef() {
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const decrit = [erreur ? "nom-erreur" : null, nom ? "nom-compteur" : null].filter(Boolean).join(" ");
  return (
    <form className={styles.formulaire} noValidate>
      <div className={styles.champ}>
        <input
          id="nom-de-chef"
          type="text"
          name="nom"
          aria-label="Nom de chef"
          autoComplete="off"
          spellCheck={false}
          value={nom}
          onChange={(e) => {
            setNom(couperNom(e.target.value));
            setErreur(null);
          }}
          onBlur={() => setErreur(nom ? verifierLongueurDuNom(nom) : null)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit || undefined}
        />
        {erreur || nom ? (
          <div className={styles.sousLeChamp}>
            {erreur ? (
              <p id="nom-erreur" className={styles.erreur} role="alert">
                {erreur}
              </p>
            ) : null}
            {nom ? (
              <span id="nom-compteur" className={styles.compteur}>
                {longueurDuNom(nom)}/{NOM_DE_CHEF_MAX}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <button type="submit" className={styles.envoyer} disabled>
        Valider
      </button>
    </form>
  );
}
