"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { donnerUnMetier } from "./actions";
import { useHabitantsMontres } from "./HabitantsMontres";
import styles from "./page.module.css";

/** Un Habitant tel que la liste le montre : son prénom, le nom de son Métier (null sans Métier) et son état. */
export type HabitantAffiche = { id: number; prenom: string; metier: string | null; etat: string };

/** US-0308 : un Métier qu'on peut donner, son icône déjà nommée par le serveur. */
export type MetierAuChoix = { id: string; nom: string; icone: string };

/**
 * US-0309 : un compteur : « Sans Métier », ou un Métier avec son icône, le Métier qu'il compte tel que la
 * liste le montre (null : sans Métier) et le nombre d'Habitants qui l'exercent. US-0314 : son identifiant
 * est celui du filtre dans l'adresse (?metier=bucheron, ?metier=sans).
 */
type Effectif = { id: string; nom: string; icone: string | null; metier: string | null; nombre: number };

/** US-0314 : le paramètre de l'adresse qui porte le filtre. */
const PARAMETRE_DU_FILTRE = "metier";

/**
 * US-0309 : les effectifs de la liste même, Habitant par Habitant : ceux sans Métier d'abord, puis chaque
 * Métier dans son ordre, même quand personne ne l'exerce. Chaque Habitant compte une fois : leur somme est
 * le nombre d'Habitants.
 */
function effectifsParMetier(habitants: HabitantAffiche[], metiers: MetierAuChoix[]): Effectif[] {
  const compter = (metier: string | null) => habitants.filter((h) => h.metier === metier).length;
  return [
    { id: "sans", nom: "Sans Métier", icone: null, metier: null, nombre: compter(null) },
    ...metiers.map((m) => ({ ...m, metier: m.nom, nombre: compter(m.nom) })),
  ];
}

/**
 * Une ligne par Habitant (US-0303) : son prénom, son Métier, son état. US-0308 : sur la ligne d'un Habitant
 * sans Métier, « Choisir un Métier » déplie dessous les Métiers au choix, un seul dépliant à la fois ; Échap
 * ou un second toucher le referment. Toucher un Métier le donne : la ligne le montre aussitôt, le temps que
 * l'action serveur l'enregistre et relise la page, qui fait alors foi.
 *
 * US-0309 : au-dessus de la liste, une rangée de compteurs, « Sans Métier » puis un par Métier, comptés sur
 * les lignes mêmes : un Métier donné les fait bouger aussitôt, avec la ligne.
 *
 * US-0314 : chaque compteur filtre la liste sur son Métier, « Tous », en tête de la rangée, retire le filtre,
 * et toucher le compteur pressé aussi. Le filtre ne touche qu'à la liste, sans recharger la page ; il vit
 * dans l'adresse, qui survit au rechargement et sert de lien. Un identifiant inconnu ne filtre rien.
 *
 * US-0313 : dans la page, les Habitants montrés, Métier donné d'avance compris, sont ceux qu'elle partage avec le
 * bandeau des sans Métier (HabitantsMontres).
 */
export function ListeDesHabitants({ habitants, metiers }: { habitants: HabitantAffiche[]; metiers: MetierAuChoix[] }) {
  const [affiches, montrerLeMetier] = useHabitantsMontres(habitants);
  const recherche = useSearchParams();
  const effectifs = effectifsParMetier(affiches, metiers);
  const filtre = effectifs.find((e) => e.id === recherche.get(PARAMETRE_DU_FILTRE)) ?? null;
  const montres = filtre ? affiches.filter((h) => h.metier === filtre.metier) : affiches;
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

  /**
   * US-0314 : filtre la liste sur un compteur, ou retire le filtre (null). Next.js relie replaceState à
   * useSearchParams : la liste se relit sans requête, et l'historique ne garde pas chaque filtre essayé.
   */
  function filtrer(id: string | null) {
    const parametres = new URLSearchParams(recherche.toString());
    if (id === null) parametres.delete(PARAMETRE_DU_FILTRE);
    else parametres.set(PARAMETRE_DU_FILTRE, id);
    const suite = parametres.toString();
    window.history.replaceState(null, "", suite ? `?${suite}` : window.location.pathname);
  }

  return (
    <>
      <ul className={styles.effectifs} aria-label="Effectifs par Métier">
        <li>
          <button type="button" className={styles.effectif} aria-pressed={filtre === null} onClick={() => filtrer(null)}>
            Tous
          </button>
        </li>
        {effectifs.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              className={styles.effectif}
              aria-pressed={filtre?.id === e.id}
              data-personne={e.nombre === 0 ? "" : undefined}
              onClick={() => filtrer(filtre?.id === e.id ? null : e.id)}
            >
              {/* Le nom est écrit juste à côté : l'icône est muette. */}
              {e.icone ? <Image src={e.icone} alt="" width={22} height={22} className={styles.iconeEffectif} /> : null}
              {e.nom} <strong className={styles.nombreEffectif}>{e.nombre}</strong>
            </button>
          </li>
        ))}
      </ul>
      {montres.length === 0 ? (
        <p className={styles.personne}>{filtre?.metier === null ? "Personne n'est sans Métier." : "Personne n'exerce ce Métier."}</p>
      ) : (
        <ul className={styles.habitants}>
          {montres.map((h) => {
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
      )}
    </>
  );
}
