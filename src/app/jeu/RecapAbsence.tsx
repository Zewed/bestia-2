"use client";

import { useState } from "react";
import { quantiteAffichee } from "@/monde/quantite";
import styles from "./page.module.css";

/**
 * US-0216 : ce que le Foyer a produit pendant l'absence, posé sur l'illustration à l'arrivée.
 * Un toucher le ferme ; il ne revient pas, la présence du joueur étant notée (Presence).
 */
export function RecapAbsence({ gains }: { gains: { id: string; nom: string; gain: string }[] }) {
  const [ferme, setFerme] = useState(false);
  if (ferme || gains.length === 0) return null;
  return (
    <button type="button" className={styles.recap} onClick={() => setFerme(true)}>
      Pendant votre absence : {gains.map((g) => `+${quantiteAffichee(g.gain)} ${g.nom}`).join(", ")}
    </button>
  );
}
