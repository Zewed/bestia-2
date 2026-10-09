"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Bloc } from "@/components/Bloc";
import { SEJOUR_PAR_DEFAUT_MINUTES, sejourChoisi } from "@/expeditions/sejour";
import { SEJOUR_MINUTES, SEJOURS_TOUT_PRETS_MINUTES } from "@/reglages";
import { formaterDuree } from "@/temps/affichage";
import styles from "./Sejour.module.css";

/** US-0906 : le paramètre de l'adresse qui garde la durée choisie, en minutes (« ?sejour=240 »). */
const PARAMETRE_DU_SEJOUR = "sejour";

/** Une durée de séjour, en minutes : « 30 min », « 4 h », « 2 h 30 », « 1 j » (US-0226). */
const duree = (minutes: number) => formaterDuree(minutes / 60);

/**
 * US-0906 : le bloc Séjour de l'écran d'Expédition : la durée choisie, en grand ; un curseur de la plus courte à la plus
 * longue, par pas réguliers ; puis, d'un doigt, les durées toutes prêtes, la choisie pressée. Il s'ouvre sur la durée de
 * l'adresse, sinon sur la première toute prête, et l'adresse la garde à chaque choix (replaceState, que Next.js relie à
 * useSearchParams), pour un rechargement ou un retour de la carte, sans toucher à ses autres paramètres. Le curseur
 * porte la durée au formulaire de départ (US-0911), où le séjour ne commencera qu'à l'arrivée.
 */
export function Sejour() {
  const recherche = useSearchParams();
  const [minutes, setMinutes] = useState(() => sejourChoisi(recherche?.get(PARAMETRE_DU_SEJOUR)) ?? SEJOUR_PAR_DEFAUT_MINUTES);
  const curseur = useId();

  function choisir(choisies: number) {
    setMinutes(choisies);
    const parametres = new URLSearchParams(window.location.search);
    parametres.set(PARAMETRE_DU_SEJOUR, String(choisies));
    window.history.replaceState(null, "", `?${parametres}`);
  }

  return (
    <Bloc titre="Séjour" className={styles.sejour}>
      <div className={styles.reglage}>
        <output htmlFor={curseur} className={styles.duree}>
          {duree(minutes)}
        </output>
        <input
          id={curseur}
          className={styles.curseur}
          type="range"
          name={PARAMETRE_DU_SEJOUR}
          min={SEJOUR_MINUTES.min}
          max={SEJOUR_MINUTES.max}
          step={SEJOUR_MINUTES.pas}
          value={minutes}
          aria-label="Durée du séjour"
          aria-valuetext={duree(minutes)}
          onChange={(e) => choisir(Number(e.target.value))}
        />
        <div className={styles.bornes} aria-hidden="true">
          <span>{duree(SEJOUR_MINUTES.min)}</span>
          <span>{duree(SEJOUR_MINUTES.max)}</span>
        </div>
        <div className={styles.prets} role="group" aria-label="Durées toutes prêtes">
          {SEJOURS_TOUT_PRETS_MINUTES.map((m) => (
            <button key={m} type="button" className={styles.pret} aria-pressed={m === minutes} onClick={() => choisir(m)}>
              {duree(m)}
            </button>
          ))}
        </div>
      </div>
    </Bloc>
  );
}
