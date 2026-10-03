"use client";

import type { InputHTMLAttributes, Ref } from "react";
import styles from "./entree.module.css";

type ChampMotDePasseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Le mot de passe s'affiche en clair. */
  visible: boolean;
  basculer: () => void;
  refChamp?: Ref<HTMLInputElement>;
};

/**
 * Un champ mot de passe et son œil, posé à l'intérieur, à droite (US-0106) : masqué par défaut,
 * en clair au premier appui. Affiché, le champ ne corrige rien et ne met pas de majuscules.
 */
export function ChampMotDePasse({ visible, basculer, refChamp, id, ...attributs }: ChampMotDePasseProps) {
  return (
    <div className={styles.saisie}>
      <input
        ref={refChamp}
        id={id}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...attributs}
      />
      <button
        type="button"
        className={styles.oeil}
        onClick={basculer}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-controls={id}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible ? <path d="M4 20 20 4" /> : null}
        </svg>
      </button>
    </div>
  );
}
