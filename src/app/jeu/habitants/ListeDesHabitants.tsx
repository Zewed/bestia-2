"use client";

import Image from "next/image";
import { useEffect, useId, useOptimistic, useState, useTransition } from "react";
import { donnerUnMetier } from "./actions";
import styles from "./page.module.css";

/** Un Habitant tel que la liste le montre : son prénom, le nom de son Métier (null sans Métier) et son état. */
export type HabitantAffiche = { id: number; prenom: string; metier: string | null; etat: string };

/** US-0308 : un Métier qu'on peut donner, son icône déjà nommée par le serveur. */
export type MetierAuChoix = { id: string; nom: string; icone: string };

/**
 * Une ligne par Habitant (US-0303) : son prénom, son Métier, son état. US-0308 : sur la ligne d'un Habitant
 * sans Métier, « Choisir un Métier » déplie dessous les Métiers au choix, un seul dépliant à la fois ; Échap
 * ou un second toucher le referment. Toucher un Métier le donne : la ligne le montre aussitôt, le temps que
 * l'action serveur l'enregistre et relise la page, qui fait alors foi.
 */
export function ListeDesHabitants({ habitants, metiers }: { habitants: HabitantAffiche[]; metiers: MetierAuChoix[] }) {
  const [affiches, montrerLeMetier] = useOptimistic(habitants, (actuels, donne: { id: number; metier: string }) =>
    actuels.map((h) => (h.id === donne.id ? { ...h, metier: donne.metier } : h)),
  );
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [, demarrer] = useTransition();
  const prefixe = useId();
  const idBouton = (id: number) => `${prefixe}-choisir-${id}`;
  const idChoix = (id: number) => `${prefixe}-metiers-${id}`;

  // Échap referme le dépliant ouvert sans rien changer, et rend la main à son bouton.
  useEffect(() => {
    if (ouvert === null) return;
    function fermer(evenement: KeyboardEvent) {
      if (evenement.key !== "Escape") return;
      setOuvert(null);
      document.getElementById(`${prefixe}-choisir-${ouvert}`)?.focus();
    }
    document.addEventListener("keydown", fermer);
    return () => document.removeEventListener("keydown", fermer);
  }, [ouvert, prefixe]);

  function donner(habitant: HabitantAffiche, metier: MetierAuChoix) {
    setOuvert(null);
    demarrer(async () => {
      montrerLeMetier({ id: habitant.id, metier: metier.nom });
      await donnerUnMetier(habitant.id, metier.id);
    });
  }

  return (
    <ul className={styles.habitants}>
      {affiches.map((h) => {
        const deplie = ouvert === h.id && h.metier === null;
        return (
          <li key={h.id} className={styles.habitant}>
            <span className={styles.prenom}>{h.prenom}</span>
            {h.metier !== null ? (
              <span className={styles.metier}>{h.metier}</span>
            ) : metiers.length > 0 ? (
              <button
                type="button"
                id={idBouton(h.id)}
                className={styles.choisir}
                aria-expanded={deplie}
                aria-controls={deplie ? idChoix(h.id) : undefined}
                onClick={() => setOuvert(deplie ? null : h.id)}
              >
                Choisir un Métier
                <svg viewBox="0 0 12 12" className={styles.fleche} aria-hidden="true">
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </button>
            ) : (
              <span className={styles.metier} data-sans-metier="">
                sans Métier
              </span>
            )}
            <span className={styles.etat}>{h.etat}</span>
            {deplie ? (
              <div id={idChoix(h.id)} role="group" aria-label={`Métier de ${h.prenom}`} className={styles.choix}>
                {metiers.map((m) => (
                  <button key={m.id} type="button" className={styles.metierAuChoix} onClick={() => donner(h, m)}>
                    {/* Le nom est écrit juste à côté : l'icône est muette. */}
                    <Image src={m.icone} alt="" width={28} height={28} className={styles.iconeAuChoix} />
                    {m.nom}
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
