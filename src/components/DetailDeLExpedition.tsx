"use client";

import { useId, useState } from "react";
import { casesDuFoyer } from "@/expeditions/choix-de-destination";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";
import { finDeLaPhase, type Phase, phaseDUneExpedition, retourDUneExpedition } from "@/expeditions/phase";
import { formaterDuree, formaterJourEtHeure } from "@/temps/affichage";
import styles from "./DetailDeLExpedition.module.css";

/** Le fuseau des joueurs, pour l'heure de retour prévue. */
const FUSEAU = "Europe/Paris";

/** Ce que le détail dit d'une durée ou d'une heure qu'il ne peut pas encore chiffrer. */
const AUCUNE = "—";

/** US-0911 : la phase d'une Expédition, telle que la liste la dit. */
const PHASES: Record<Phase, string> = { aller: "Aller", sejour: "Séjour", retour: "Retour" };

/** US-0918 : ce qu'annonce la fin de chaque phase : l'arrivée sur la Case, le départ de la Case, la rentrée au Foyer. */
const FIN_DE_LA_PHASE: Record<Phase, string> = { aller: "arrive dans", sejour: "repart dans", retour: "rentre dans" };

/**
 * « Souris grise × 3 » : une Espèce de l'escorte et ses Bêtes parties, comme le récapitulatif l'écrit (US-0910), que le
 * nombre ne quitte jamais (espaces insécables).
 */
const uneEspece = (nom: string, nombre: number) => `${nom} × ${nombre}`;

/**
 * US-0918 : une Expédition en cours, dans la liste des Expéditions et, avec US-0913, sur la carte : sa ligne, avec sa
 * destination (son Biome, ou « Case inconnue » sous le brouillard) et sa distance au Foyer, sa phase et son temps
 * restant ; puis son détail : les prénoms de ses explorateurs, son escorte Espèce par Espèce, ou « Sans escorte », et
 * l'heure de son retour prévu, pour savoir quand elle revient. Sa phase et son temps restant se lisent à l'heure du jeu
 * `instant`, que celui qui l'affiche fait avancer (useHeureDuJeu) : le temps restant est celui de la phase en cours,
 * à la minute supérieure, dit par ce que sa fin annonce : « arrive dans 42 min » à l'aller, « repart dans 3 h 20 » en
 * séjour (le compte à rebours de la durée choisie, US-0915), « rentre dans 35 min » au retour, puis « de retour » ; la
 * phase change d'elle-même. Tant que le trajet d'une escorte n'est pas chiffré (US-0912), ni le temps restant ni le
 * retour : « — ». Aucune zone annoncée : un lecteur d'écran lit le compte quand on y passe, comme celui des Voyageurs.
 *
 * Repliable (`repliable`), sur un téléphone, elle tient sur une ligne, la sienne, qu'un toucher n'importe où déplie
 * pour montrer son détail, et replie de même (DetailDeLExpedition.module.css) ; sur ordinateur, tout se lit.
 */
export function DetailDeLExpedition({ expedition, instant, repliable = false }: { expedition: ExpeditionEnCours; instant: Date; repliable?: boolean }) {
  const [deplie, setDeplie] = useState(false);
  const idLigne = useId();
  const idDetail = useId();
  const { destination, explorateurs, escorte } = expedition;
  const phase = phaseDUneExpedition(expedition, instant);
  const fin = finDeLaPhase(expedition, instant);
  const retour = retourDUneExpedition(expedition);
  const reste = fin === null ? null : fin.getTime() - instant.getTime();
  const classes = [styles.expedition, repliable && styles.repliable, repliable && deplie && styles.deplie].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div id={idLigne} className={styles.ligne} data-ligne="">
        <strong className={styles.destination}>{"inconnue" in destination ? "Case inconnue" : destination.biome}</strong>
        <span className={styles.distance}>{casesDuFoyer(destination.distance)}</span>
        <span className={styles.phase}>{PHASES[phase]}</span>
        <span className={styles.reste}>
          {reste === null ? (
            AUCUNE
          ) : reste > 0 ? (
            <>
              <span className={styles.annonce}>{`${FIN_DE_LA_PHASE[phase]} `}</span>
              {formaterDuree(reste / 3_600_000)}
            </>
          ) : (
            "de retour"
          )}
        </span>
        {repliable ? (
          <button
            type="button"
            className={styles.deplier}
            aria-label="Détail"
            aria-describedby={idLigne}
            aria-expanded={deplie}
            aria-controls={idDetail}
            onClick={() => setDeplie(!deplie)}
          >
            <svg viewBox="0 0 12 12" className={styles.fleche} aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>
        ) : null}
      </div>
      <dl id={idDetail} className={styles.detail}>
        <div>
          <dt>Explorateurs</dt>
          <dd>{explorateurs.join(", ")}</dd>
        </div>
        <div>
          <dt>Escorte</dt>
          <dd>{escorte.length === 0 ? "Sans escorte" : escorte.map((e) => uneEspece(e.nom, e.nombre)).join(", ")}</dd>
        </div>
        <div>
          <dt>Retour prévu</dt>
          <dd>{retour ? <time dateTime={retour.toISOString()}>{formaterJourEtHeure(retour, FUSEAU)}</time> : AUCUNE}</dd>
        </div>
      </dl>
    </div>
  );
}
