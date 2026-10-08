"use client";

import Image from "next/image";
import styles from "./page.module.css";

/** US-0308 : un Métier qu'on peut donner, son icône déjà nommée par le serveur. */
export type MetierAuChoix = { id: string; nom: string; icone: string };

/**
 * US-0308 : sur une ligne, le bouton qui déplie dessous les Métiers au choix, à son texte (« Choisir un Métier », ou le
 * Métier, US-0310 ; US-0335 : sur la ligne d'un Voyageur, « Sans Métier » ou le Métier choisi) ; sa flèche se retourne
 * tant qu'ils sont dépliés. `etiquette`, quand le texte seul ne dit pas de qui il s'agit.
 */
export function BoutonDuMetier({
  id,
  texte,
  etiquette,
  deplie,
  depliant,
  className,
  onClick,
}: {
  id: string;
  texte: string;
  etiquette?: string;
  deplie: boolean;
  depliant: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      className={className ? `${styles.choisir} ${className}` : styles.choisir}
      aria-label={etiquette}
      aria-expanded={deplie}
      aria-controls={deplie ? depliant : undefined}
      onClick={onClick}
    >
      {texte}
      <svg viewBox="0 0 12 12" className={styles.fleche} aria-hidden="true">
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
    </button>
  );
}

/**
 * US-0308 : sous la ligne, sur toute sa largeur, les Métiers au choix, chacun un bouton à son icône muette et à son
 * nom ; en toucher un le choisit. US-0310 : le Métier `actuel` (son nom) est pressé, et ne se rechoisit pas. US-0311 :
 * quand il y en a un, « Sans Métier », en dernier, le retire (null). US-0335 : les mêmes, sur la ligne d'un Voyageur,
 * pour le Métier qu'il aura en arrivant.
 */
export function MetiersAuChoix({
  id,
  etiquette,
  metiers,
  actuel,
  className,
  choisir,
}: {
  id: string;
  etiquette: string;
  metiers: MetierAuChoix[];
  actuel: string | null;
  className?: string;
  choisir: (metier: MetierAuChoix | null) => void;
}) {
  return (
    <div id={id} role="group" aria-label={etiquette} className={className ? `${styles.choix} ${className}` : styles.choix}>
      {metiers.map((m) => {
        const pris = m.nom === actuel;
        return (
          <button key={m.id} type="button" className={styles.metierAuChoix} aria-pressed={pris} disabled={pris} onClick={() => choisir(m)}>
            {/* Le nom est écrit juste à côté : l'icône est muette. */}
            <Image src={m.icone} alt="" width={28} height={28} className={styles.iconeAuChoix} />
            {m.nom}
          </button>
        );
      })}
      {actuel !== null ? (
        <button type="button" className={styles.sansMetierAuChoix} onClick={() => choisir(null)}>
          Sans Métier
        </button>
      ) : null}
    </div>
  );
}
