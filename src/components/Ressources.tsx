"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { quantiteAffichee } from "@/monde/quantite";
import styles from "./BarreHaut.module.css";

/** Ce que la barre montre d'un Stock : la Ressource et sa quantité exacte, en texte. */
export type RessourceDeLaBarre = { id: string; nom: string; quantite: string };

/** US-0204 : l'icône d'une Ressource, rangée sous le nom de son identifiant. */
export const iconeDeRessource = (id: string) => `/illustrations/ressources/${id}.webp`;

/**
 * Les quatre ressources du joueur dans la barre du haut (US-0203), toujours dans l'ordre Viande,
 * Végétaux, Bois, Pierre : leur icône, puis la quantité (US-0204). Le nom de la ressource est le
 * texte de l'icône, et paraît dans une bulle au survol ou au toucher ; toucher ailleurs ou Échap la
 * referme. Au milieu de la barre ; sur mobile, en bande juste en dessous (voir formes.css).
 */
export function Ressources({ stocks }: { stocks: RessourceDeLaBarre[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const racine = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    const toucherDehors = (evenement: PointerEvent) => {
      if (!racine.current?.contains(evenement.target as Node)) setOuverte(null);
    };
    const touche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setOuverte(null);
    };
    document.addEventListener("pointerdown", toucherDehors);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", toucherDehors);
      document.removeEventListener("keydown", touche);
    };
  }, [ouverte]);

  return (
    <ul ref={racine} className={styles.ressources} aria-label="Ressources" data-bande-ressources="">
      {stocks.map((stock) => (
        <li key={stock.id} className={styles.ressource} data-ouverte={ouverte === stock.id ? "" : undefined}>
          <button type="button" className={styles.boutonRessource} onClick={() => setOuverte((avant) => (avant === stock.id ? null : stock.id))}>
            <Image src={iconeDeRessource(stock.id)} alt={stock.nom} width={22} height={22} className={styles.icone} />
            {/* Une espace entre le nom et la quantité, pour qu'un lecteur d'écran dise « Pierre 42 ». */}{" "}
            <span className={styles.quantite}>{quantiteAffichee(stock.quantite)}</span>
          </button>
          {/* Le nom est déjà le texte de l'icône : la bulle ne sert qu'aux yeux. */}
          <span className={styles.bulle} aria-hidden="true">
            {stock.nom}
          </span>
        </li>
      ))}
    </ul>
  );
}
