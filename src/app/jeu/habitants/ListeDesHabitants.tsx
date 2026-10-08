"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type MouseEvent, useEffect, useId, useRef, useState, useTransition } from "react";
import { donnerUnMetier, renvoyerUnHabitant, retirerLeMetier } from "./actions";
import { useHabitantsMontres } from "./HabitantsMontres";
import { BoutonDuMetier, type MetierAuChoix, MetiersAuChoix } from "./MetiersAuChoix";
import styles from "./page.module.css";

export type { MetierAuChoix };

/** Un Habitant tel que la liste le montre : son prénom, le nom de son Métier (null sans Métier) et son état. */
export type HabitantAffiche = { id: number; prenom: string; metier: string | null; etat: string };

/**
 * US-0309 : un compteur : « Sans Métier », ou un Métier avec son icône, le Métier qu'il compte tel que la
 * liste le montre (null : sans Métier) et le nombre d'Habitants qui l'exercent. US-0314 : son identifiant
 * est celui du filtre dans l'adresse (?metier=bucheron, ?metier=sans).
 */
type Effectif = { id: string; nom: string; icone: string | null; metier: string | null; nombre: number };

/** US-0314 : le paramètre de l'adresse qui porte le filtre. */
const PARAMETRE_DU_FILTRE = "metier";

/** US-0330 : « de Brune », « d'Arno ». */
const de = (prenom: string) => (/^[aeiouyhàâäéèêëîïôöùûüœæ]/i.test(prenom) ? `d'${prenom}` : `de ${prenom}`);

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
 * US-0310 : sur la ligne d'un Habitant qui a un Métier, ce Métier est le même bouton : il déplie les Métiers,
 * le sien pressé et hors d'atteinte ; en toucher un autre le lui donne de la même façon, gratuitement et
 * aussitôt. Dans les deux cas, la main revient au bouton de la ligne. US-0311 : en dernier, « Sans Métier » le
 * lui retire de même ; il rejoint aussitôt les sans Métier, en tête de la liste (HabitantsMontres).
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
 *
 * US-0329 : sans aucun Habitant, la liste laisse place à une seule phrase : des Voyageurs finiront par passer aux
 * portes.
 *
 * US-0330 : sous les Métiers dépliés, à part et en dernier, « Renvoyer » fait partir l'Habitant pour de bon, après une
 * confirmation sur place : le premier toucher ne fait que changer le bouton en « Confirmer le renvoi », dans la couleur
 * d'alerte ; le second renvoie. Un toucher ailleurs, le focus ailleurs ou Échap annulent ; le second clic d'un double
 * clic ne confirme pas. La ligne part aussitôt, et avec elle les compteurs et le bandeau des sans Métier
 * (HabitantsMontres), le temps que l'action le renvoie et relise la page, qui fait alors foi ; la main passe à la ligne
 * qui prend sa place, ou à celle d'avant. Le dernier Habitant se renvoie aussi : la phrase d'US-0329 prend sa place.
 */
export function ListeDesHabitants({ habitants, metiers }: { habitants: HabitantAffiche[]; metiers: MetierAuChoix[] }) {
  const [affiches, montrerDAvance] = useHabitantsMontres(habitants);
  const recherche = useSearchParams();
  const effectifs = effectifsParMetier(affiches, metiers);
  const filtre = effectifs.find((e) => e.id === recherche.get(PARAMETRE_DU_FILTRE)) ?? null;
  const montres = filtre ? affiches.filter((h) => h.metier === filtre.metier) : affiches;
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [, demarrer] = useTransition();
  const prefixe = useId();
  const idBouton = (id: number) => `${prefixe}-choisir-${id}`;
  const idChoix = (id: number) => `${prefixe}-metiers-${id}`;
  // US-0330 : l'Habitant dont le renvoi attend sa confirmation, et le bouton qui la donne.
  const [aRenvoyer, setARenvoyer] = useState<number | null>(null);
  const boutonDeConfirmation = useRef<HTMLButtonElement>(null);

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

  // US-0330 : un toucher ou le focus ailleurs que sur « Confirmer le renvoi », ou Échap, annulent la confirmation.
  useEffect(() => {
    if (aRenvoyer === null) return;
    const ailleurs = (evenement: Event) => {
      if (!boutonDeConfirmation.current?.contains(evenement.target as Node)) setARenvoyer(null);
    };
    const echap = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setARenvoyer(null);
    };
    document.addEventListener("pointerdown", ailleurs);
    document.addEventListener("focusin", ailleurs);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", ailleurs);
      document.removeEventListener("focusin", ailleurs);
      document.removeEventListener("keydown", echap);
    };
  }, [aRenvoyer]);

  /** Donne le Métier `metier` à l'Habitant, ou le remet sans Métier (null, US-0311). */
  function donner(habitant: HabitantAffiche, metier: MetierAuChoix | null) {
    setOuvert(null);
    // Le Métier touché s'en va avec le dépliant : la main revient au bouton de la ligne.
    document.getElementById(idBouton(habitant.id))?.focus();
    demarrer(async () => {
      montrerDAvance({ id: habitant.id, metier: metier?.nom ?? null });
      await (metier ? donnerUnMetier(habitant.id, metier.id) : retirerLeMetier(habitant.id));
    });
  }

  /**
   * US-0330 : le toucher sur « Renvoyer » : le premier demande la confirmation, le second renvoie l'Habitant, sauf s'il
   * n'est que le second clic d'un double clic.
   */
  function renvoyer(habitant: HabitantAffiche, evenement: MouseEvent) {
    if (aRenvoyer !== habitant.id) return setARenvoyer(habitant.id);
    if (evenement.detail > 1) return;
    setARenvoyer(null);
    setOuvert(null);
    // La ligne s'en va avec le bouton : la main passe à celle qui prend sa place, ou à celle d'avant.
    const rang = montres.indexOf(habitant);
    const voisin = montres[rang + 1] ?? montres[rang - 1];
    if (voisin) document.getElementById(idBouton(voisin.id))?.focus();
    demarrer(async () => {
      montrerDAvance({ id: habitant.id, renvoye: true });
      await renvoyerUnHabitant(habitant.id);
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

  // US-0329 : sans Habitant, ni compteurs à zéro ni filtre : une phrase, à leur place et à celle de la liste.
  if (affiches.length === 0) {
    return <p className={styles.personne}>Aucun Habitant pour l&apos;instant. Des Voyageurs finiront par passer aux portes.</p>;
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
            const deplie = ouvert === h.id;
            const confirmer = deplie && aRenvoyer === h.id;
            return (
              <li key={h.id} className={styles.habitant}>
                <span className={styles.prenom}>{h.prenom}</span>
                {metiers.length > 0 ? (
                  <BoutonDuMetier
                    id={idBouton(h.id)}
                    texte={h.metier ?? "Choisir un Métier"}
                    deplie={deplie}
                    depliant={idChoix(h.id)}
                    onClick={() => setOuvert(deplie ? null : h.id)}
                  />
                ) : (
                  <span className={styles.metier} data-sans-metier={h.metier === null ? "" : undefined}>
                    {h.metier ?? "sans Métier"}
                  </span>
                )}
                <span className={styles.etat}>{h.etat}</span>
                {/* US-0310 : le Métier qu'il exerce déjà est marqué, et ne se redonne pas. */}
                {deplie ? <MetiersAuChoix id={idChoix(h.id)} etiquette={`Métier de ${h.prenom}`} metiers={metiers} actuel={h.metier} choisir={(m) => donner(h, m)} /> : null}
                {/* US-0330 : à part des Métiers, en dernier ; un lecteur d'écran entend aussi qui il renvoie. */}
                {deplie ? (
                  <button
                    ref={confirmer ? boutonDeConfirmation : undefined}
                    type="button"
                    className={styles.renvoyer}
                    aria-label={confirmer ? `Confirmer le renvoi ${de(h.prenom)}` : `Renvoyer ${h.prenom}`}
                    data-confirmer={confirmer ? "" : undefined}
                    onClick={(evenement) => renvoyer(h, evenement)}
                  >
                    {confirmer ? "Confirmer le renvoi" : "Renvoyer"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
