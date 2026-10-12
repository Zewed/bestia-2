"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type MouseEvent, useEffect, useId, useRef, useState, useTransition } from "react";
import { EN_EXPEDITION } from "@/monde/etat-habitant";
import { ajouterAuMetier, donnerUnMetier, renvoyerUnHabitant, retirerDuMetier, retirerLeMetier } from "./actions";
import { useHabitantsMontres } from "./HabitantsMontres";
import { BoutonDuMetier, type MetierAuChoix, MetiersAuChoix } from "./MetiersAuChoix";
import styles from "./page.module.css";

export type { MetierAuChoix };

/** US-0307 : un Métier tel que le tableau le montre : son icône, sa phrase et, tant qu'il ne sert à rien, ce qu'il attend. */
export type MetierDuTableau = MetierAuChoix & { phrase?: string; servira?: string | null };

/** Un Habitant tel que la liste le montre : son prénom, le nom de son Métier (null sans Métier) et son état. */
export type HabitantAffiche = { id: number; prenom: string; metier: string | null; etat: string };

/**
 * US-0309 : un compteur : « Sans Métier », ou un Métier avec son icône, le Métier qu'il compte tel que la
 * liste le montre (null : sans Métier) et le nombre d'Habitants qui l'exercent. US-0314 : son identifiant
 * est celui du filtre dans l'adresse (?metier=bucheron, ?metier=sans).
 */
type Effectif = { id: string; nom: string; icone: string | null; metier: string | null; nombre: number; phrase?: string; servira?: string | null; metierId?: string };

/** US-0314 : le paramètre de l'adresse qui porte le filtre. */
const PARAMETRE_DU_FILTRE = "metier";

/** Le portrait d'un Habitant sans Métier : un Habitant du jeu, du même trait que les icônes des Métiers. */
const PORTRAIT_SANS_METIER = "/illustrations/icones/habitants.webp";

/** US-0330 : « de Brune », « d'Arno ». */
const de = (prenom: string) => (/^[aeiouyhàâäéèêëîïôöùûüœæ]/i.test(prenom) ? `d'${prenom}` : `de ${prenom}`);

/**
 * US-0309 : les effectifs de la liste même, Habitant par Habitant : ceux sans Métier d'abord, puis chaque
 * Métier dans son ordre, même quand personne ne l'exerce. Chaque Habitant compte une fois : leur somme est
 * le nombre d'Habitants.
 */
function effectifsParMetier(habitants: HabitantAffiche[], metiers: MetierDuTableau[]): Effectif[] {
  const compter = (metier: string | null) => habitants.filter((h) => h.metier === metier).length;
  return [
    { id: "sans", nom: "Sans Métier", icone: null, metier: null, nombre: compter(null) },
    ...metiers.map((m) => ({ ...m, metierId: m.id, metier: m.nom, nombre: compter(m.nom) })),
  ];
}

/**
 * US-0312 : celui que « − » remet sans Métier : le dernier arrivé au Territoire de ceux qui exercent le Métier
 * `nom`, soit le plus grand identifiant (les Habitants sont numérotés à leur arrivée), comme la base le choisira ;
 * null quand personne ne l'exerce. US-0911 : parmi ceux restés au Foyer.
 */
function dernierArrive(habitants: HabitantAffiche[], nom: string): HabitantAffiche | null {
  return habitants
    .filter((h) => h.metier === nom && h.etat !== EN_EXPEDITION)
    .reduce<HabitantAffiche | null>((dernier, h) => (dernier && dernier.id > h.id ? dernier : h), null);
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
 *
 * US-0911 : un explorateur parti est « en Expédition » sur sa ligne, son Métier écrit sans bouton : rien ne se déplie,
 * ni Métier ni renvoi, avant son retour.
 */
export function ListeDesHabitants({ habitants, metiers }: { habitants: HabitantAffiche[]; metiers: MetierDuTableau[] }) {
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
      // Son étiquette change de rangée : la main la suit.
      requestAnimationFrame(() => document.getElementById(idBouton(habitant.id))?.focus());
      await (metier ? donnerUnMetier(habitant.id, metier.id) : retirerLeMetier(habitant.id));
    });
  }

  /** US-0312 : « + » et « − » d'une rangée : montre aussitôt le Métier de l'Habitant que la base choisira. */
  function repartir(habitant: HabitantAffiche | null, metier: string | null, action: () => Promise<void>) {
    if (!habitant) return;
    demarrer(async () => {
      montrerDAvance({ id: habitant.id, metier });
      await action();
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
    // La ligne s'en va avec le bouton : la main passe à celle qui prend sa place, ou à celle d'avant ; US-0911 : à la
    // plus proche qui a son bouton, celle d'un explorateur parti n'en ayant pas.
    const aBouton = montres.filter((h) => h === habitant || h.etat !== EN_EXPEDITION);
    const rang = aBouton.indexOf(habitant);
    const voisin = aBouton[rang + 1] ?? aBouton[rang - 1];
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

  // US-0329 : sans Habitant, ni rangées ni filtre : une phrase, à leur place.
  if (affiches.length === 0) {
    return <p className={styles.personne}>Aucun Habitant pour l&apos;instant. Des Voyageurs finiront par passer aux portes.</p>;
  }

  // Les sans Métier passent les premiers dans la liste, rangés comme la base les range (HabitantsMontres).
  const premierSansMetier = affiches.find((h) => h.metier === null) ?? null;
  // La rangée des sans Métier ne paraît que s'il y en a, ou quand on la filtre ; US-0314 : un filtre ne garde que la sienne.
  const rangees = effectifs.filter((e) => (filtre ? e === filtre : e.metier !== null || e.nombre > 0));

  return (
    <section className={styles.tableau} aria-label="Métiers">
      {filtre ? (
        <div className={styles.filtreActif}>
          <button type="button" className={styles.tous} onClick={() => filtrer(null)}>
            Tous les Métiers
          </button>
        </div>
      ) : null}
      <ul className={styles.rangees}>
        {rangees.map((e) => {
          const ceux = affiches.filter((h) => h.metier === e.metier);
          const ouvertIci = ceux.find((h) => h.id === ouvert && h.etat !== EN_EXPEDITION) ?? null;
          const auFoyer = e.metier === null ? null : dernierArrive(affiches, e.metier);
          return (
            <li key={e.id} className={styles.rangee} data-sans-metier={e.metier === null ? "" : undefined} data-personne={ceux.length === 0 ? "" : undefined}>
              <div className={styles.metierDeLaRangee}>
                {/* Le nom est écrit juste à côté : l'icône est muette. */}
                <Image src={e.icone ?? PORTRAIT_SANS_METIER} alt="" width={40} height={40} className={styles.iconeRangee} />
                <h3 className={styles.nomRangee}>
                  {/* US-0314 : le nom filtre la liste sur sa rangée ; le toucher de nouveau retire le filtre. */}
                  <button type="button" className={styles.filtre} aria-pressed={filtre?.id === e.id} onClick={() => filtrer(filtre?.id === e.id ? null : e.id)}>
                    {e.nom}
                  </button>
                </h3>
                <p className={styles.phraseRangee}>
                  {e.phrase}
                  {e.servira ? <span className={styles.servira}>{`Servira ${e.servira}.`}</span> : null}
                </p>
                {e.metier !== null && e.metierId ? (
                  <div className={styles.repartition}>
                    <button
                      type="button"
                      className={styles.plusMoins}
                      aria-label={`Un ${e.nom} de moins`}
                      disabled={auFoyer === null}
                      onClick={() => repartir(auFoyer, null, () => retirerDuMetier(e.metierId as string))}
                    >
                      −
                    </button>
                    <span className={styles.effectifRangee}>{e.nombre}</span>
                    <button
                      type="button"
                      className={styles.plusMoins}
                      aria-label={`Un ${e.nom} de plus`}
                      disabled={premierSansMetier === null}
                      onClick={() => repartir(premierSansMetier, e.metier, () => ajouterAuMetier(e.metierId as string))}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className={styles.effectifRangee}>{e.nombre}</span>
                )}
              </div>
              {ceux.length === 0 && e.metier === null ? <p className={styles.personneIci}>Personne n&apos;est sans Métier.</p> : null}
              {ceux.length > 0 ? (
                <ul className={styles.jetons}>
                  {ceux.map((h) => (
                    <li key={h.id} className={styles.jeton} data-absent={h.etat === EN_EXPEDITION ? "" : undefined}>
                      {metiers.length > 0 && h.etat !== EN_EXPEDITION ? (
                        <BoutonDuMetier
                          id={idBouton(h.id)}
                          texte={h.prenom}
                          etiquette={`${h.prenom}, ${h.metier ?? "sans Métier"}, ${h.etat}`}
                          deplie={ouvert === h.id}
                          depliant={idChoix(h.id)}
                          className={styles.boutonJeton}
                          onClick={() => setOuvert(ouvert === h.id ? null : h.id)}
                        />
                      ) : (
                        <span className={styles.prenom}>{h.prenom}</span>
                      )}
                      <span className={styles.etat} data-absent={h.etat === EN_EXPEDITION ? "" : undefined}>
                        {h.etat}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
                {/* US-0308, US-0310, US-0311 : les Métiers au choix de l'Habitant touché, sous les étiquettes de sa rangée. */}
                {ouvertIci ? (
                  <div className={styles.depliant}>
                    <p className={styles.quiDeplie}>{`Métier ${de(ouvertIci.prenom)}`}</p>
                    <MetiersAuChoix
                      id={idChoix(ouvertIci.id)}
                      etiquette={`Métier de ${ouvertIci.prenom}`}
                      metiers={metiers}
                      actuel={ouvertIci.metier}
                      choisir={(m) => donner(ouvertIci, m)}
                    />
                    {/* US-0330 : à part des Métiers, en dernier ; un lecteur d'écran entend aussi qui il renvoie. */}
                    <button
                      ref={aRenvoyer === ouvertIci.id ? boutonDeConfirmation : undefined}
                      type="button"
                      className={styles.renvoyer}
                      aria-label={aRenvoyer === ouvertIci.id ? `Confirmer le renvoi ${de(ouvertIci.prenom)}` : `Renvoyer ${ouvertIci.prenom}`}
                      data-confirmer={aRenvoyer === ouvertIci.id ? "" : undefined}
                      onClick={(evenement) => renvoyer(ouvertIci, evenement)}
                    >
                      {aRenvoyer === ouvertIci.id ? "Confirmer le renvoi" : "Renvoyer"}
                    </button>
                  </div>
                ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
