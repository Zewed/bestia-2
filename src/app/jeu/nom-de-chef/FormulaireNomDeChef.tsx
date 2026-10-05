"use client";

import { useState, type ChangeEvent } from "react";
import { couperNom, longueurDuNom, nettoyerNom, nettoyerSaisie, verifierCaracteresDuNom, verifierLongueurDuNom } from "@/chefs/nom";
import { NOM_DE_CHEF_MAX } from "@/reglages";
import styles from "../../entree.module.css";

/**
 * Le champ du nom de chef. US-0132 : le compteur paraît dès qu'on écrit, le champ ne prend pas
 * plus de 16 caractères, et un nom trop court se signale quand on quitte le champ, jamais pendant
 * la frappe. US-0133 : un caractère refusé se signale dès qu'il est tapé, pour qu'on voie lequel
 * retirer. US-0134 : le champ montre le nom tel qu'il sera enregistré ; un espace en tête ou un
 * deuxième espace de suite ne s'écrivent pas, l'espace de fin disparaît quand on quitte le champ.
 * « Valider » s'activera avec l'enregistrement du nom (US-0139).
 */
export function FormulaireNomDeChef() {
  const [nom, setNom] = useState("");
  const [erreurLongueur, setErreurLongueur] = useState<string | null>(null);
  const erreur = verifierCaracteresDuNom(nom) ?? erreurLongueur;
  const decrit = [erreur ? "nom-erreur" : null, nom ? "nom-compteur" : null].filter(Boolean).join(" ");

  function saisir(e: ChangeEvent<HTMLInputElement>) {
    const champ = e.target;
    const propre = couperNom(nettoyerSaisie(champ.value));
    // Un espace retiré ne doit pas renvoyer le curseur en fin de champ : le champ est corrigé sur
    // place, et le curseur reste où l'on tapait, avant que la lettre suivante n'arrive.
    if (propre !== champ.value && champ.selectionStart !== null) {
      const curseur = Math.min(nettoyerSaisie(champ.value.slice(0, champ.selectionStart)).length, propre.length);
      champ.value = propre;
      champ.setSelectionRange(curseur, curseur);
    }
    setNom(propre);
    setErreurLongueur(null);
  }

  function quitter() {
    const propre = nettoyerNom(nom);
    setNom(propre);
    setErreurLongueur(propre ? verifierLongueurDuNom(propre) : null);
  }
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
          onChange={saisir}
          onBlur={quitter}
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
