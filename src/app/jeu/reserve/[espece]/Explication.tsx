"use client";

import { type ReactNode, type Ref, useEffect, useId, useRef, useState } from "react";
import { EXPLICATIONS, type NomExplique } from "./explications";
import styles from "./page.module.css";

/**
 * US-0807 : une explication qu'ouvre le nom d'une caractéristique : ouverte, un toucher ailleurs, Échap ou son bouton la
 * referment ; Échap et le bouton rendent le regard au nom. Un toucher sur l'explication elle-même la laisse ouverte. Une
 * à la fois : en ouvrir une autre, c'est toucher ailleurs.
 */
function useExplication() {
  const [ouverte, setOuverte] = useState(false);
  const nom = useRef<HTMLButtonElement>(null);
  const explication = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ouverte) return;
    const toucherAilleurs = (evenement: PointerEvent) => {
      const cible = evenement.target as Node;
      if (!nom.current?.contains(cible) && !explication.current?.contains(cible)) setOuverte(false);
    };
    const touche = (evenement: KeyboardEvent) => {
      if (evenement.key !== "Escape") return;
      setOuverte(false);
      nom.current?.focus();
    };
    document.addEventListener("pointerdown", toucherAilleurs);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", toucherAilleurs);
      document.removeEventListener("keydown", touche);
    };
  }, [ouverte]);

  /** L'élément de l'explication, quel qu'il soit (dd, p) : un toucher dedans ne la ferme pas. */
  const poserExplication = (element: HTMLElement | null) => {
    explication.current = element;
  };
  const basculer = () => setOuverte((etait) => !etait);
  const fermer = () => {
    setOuverte(false);
    nom.current?.focus();
  };
  return { ouverte, nom, poserExplication, basculer, fermer };
}

/** US-0807 : le nom d'une caractéristique, un bouton au pointillé de cuivre qui ouvre son explication. */
function Nom({ ref, texte, id, ouverte, basculer }: { ref: Ref<HTMLButtonElement>; texte: NomExplique; id: string; ouverte: boolean; basculer: () => void }) {
  return (
    <button ref={ref} type="button" className={styles.terme} aria-expanded={ouverte} aria-controls={id} onClick={basculer}>
      {texte}
    </button>
  );
}

/** US-0807 : la phrase de l'explication, et le bouton qui la referme. */
function Phrase({ texte, fermer }: { texte: NomExplique; fermer: () => void }) {
  return (
    <>
      <span>{EXPLICATIONS[texte]}</span>
      <button type="button" className={styles.fermerExplication} aria-label="Fermer l'explication" onClick={fermer}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </>
  );
}

/**
 * US-0807 : une ligne des caractéristiques de la fiche : son nom, qui ouvre son explication, puis sa valeur ; l'explication
 * dessous, de toute la largeur de la liste. Fermée, elle reste dans la page, cachée : le nom la désigne (aria-controls).
 */
export function Caracteristique({ nom, className, children }: { nom: NomExplique; className?: string; children: ReactNode }) {
  const { ouverte, nom: refNom, poserExplication, basculer, fermer } = useExplication();
  const id = useId();
  return (
    <div className={className}>
      <dt>
        <Nom ref={refNom} texte={nom} id={id} ouverte={ouverte} basculer={basculer} />
      </dt>
      <dd>{children}</dd>
      <dd ref={poserExplication} id={id} className={styles.explication} hidden={!ouverte}>
        <Phrase texte={nom} fermer={fermer} />
      </dd>
    </div>
  );
}

/** US-0807 : l'effectif de l'Espèce, son nom qui ouvre son explication, puis son nombre en grand ; l'explication dessous. */
export function Effectif({ nombre }: { nombre: number }) {
  const { ouverte, nom, poserExplication, basculer, fermer } = useExplication();
  const id = useId();
  return (
    <>
      <p className={styles.effectif}>
        <Nom ref={nom} texte="Effectif" id={id} ouverte={ouverte} basculer={basculer} /> <strong className={styles.nombre}>{nombre}</strong>
      </p>
      <p ref={poserExplication} id={id} className={styles.explication} hidden={!ouverte}>
        <Phrase texte="Effectif" fermer={fermer} />
      </p>
    </>
  );
}
