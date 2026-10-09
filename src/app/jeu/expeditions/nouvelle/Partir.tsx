"use client";

import { useActionState, useId } from "react";
import type { Coordonnees } from "@/monde/hex";
import { type EtatDuDepart, partir } from "./actions";
import { FORMULAIRE_DE_DEPART } from "./formulaire";
import styles from "./Partir.module.css";

/**
 * US-0910 : ce qui manque encore pour partir, dans l'ordre de l'écran : une destination, puis au moins un explorateur ;
 * l'escorte ne manque jamais (US-0909), et le séjour a toujours sa durée (US-0906). Null quand rien ne manque.
 */
function ceQuiManque(destination: boolean, explorateurs: number): string | null {
  const manque = [destination ? null : "une destination", explorateurs === 0 ? "au moins un explorateur" : null].filter(Boolean);
  return manque.length > 0 ? `Il faut ${manque.join(" et ")}.` : null;
}

const SANS_REFUS: EtatDuDepart = { refus: null };

/**
 * US-0902 : le bouton de départ, au pied de l'écran d'Expédition. Il faut au moins un explorateur : à zéro, il reste
 * grisé et dit pourquoi, juste dessous (lu aussi par un lecteur d'écran). US-0910 : il finit le récapitulatif, et il faut
 * aussi une `destination` : tant qu'un choix manque, il reste grisé et le nomme.
 *
 * US-0911 : il confirme le départ : il envoie la destination, les `explorateurs` et l'`escorte` choisis (Espèce par
 * Espèce, telle que l'écran la montre), et le séjour du curseur. Grisé le temps de l'envoi, pour ne partir qu'une fois.
 * Fait, le départ mène à la liste des Expéditions en cours ; refusé, rien n'est retenu, et il dit pourquoi, juste dessous,
 * dans la couleur d'alerte, sur l'écran relu.
 */
export function Partir({ destination, explorateurs, escorte }: { destination: Coordonnees | null; explorateurs: number; escorte: ReadonlyMap<string, number> }) {
  const [{ refus }, envoyer, enCours] = useActionState(partir, SANS_REFUS);
  const idRaison = useId();
  const raison = ceQuiManque(destination !== null, explorateurs);
  const dit = raison ?? refus;
  return (
    <form id={FORMULAIRE_DE_DEPART} action={envoyer} className={styles.depart}>
      {destination ? (
        <>
          <input type="hidden" name="q" value={destination.q} />
          <input type="hidden" name="r" value={destination.r} />
        </>
      ) : null}
      <input type="hidden" name="explorateurs" value={explorateurs} />
      {[...escorte].map(([especeId, nombre]) => (nombre > 0 ? <input key={especeId} type="hidden" name="escorte" value={`${especeId}.${nombre}`} /> : null))}
      <button type="submit" className={styles.partir} disabled={raison !== null || enCours} aria-describedby={dit ? idRaison : undefined}>
        Partir
      </button>
      {dit ? (
        <p id={idRaison} className={raison ? styles.raison : styles.refus} role={raison ? undefined : "alert"}>
          {dit}
        </p>
      ) : null}
    </form>
  );
}
