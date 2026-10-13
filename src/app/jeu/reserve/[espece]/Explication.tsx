"use client";

import { type ReactNode, type Ref, useEffect, useId, useRef, useState } from "react";
import { EXPLICATIONS, type NomExplique } from "./explications";
import styles from "./page.module.css";

/** Ce qu'un toucher peut activer : un lien, un bouton, un champ. Un toucher ailleurs n'active rien. */
const INTERACTIF = "a, button, input, select, textarea, label, summary, [role='button'], [tabindex]";

/**
 * US-0807 : une explication qu'ouvre le nom d'une caractéristique : ouverte, un toucher ailleurs, Échap ou son bouton la
 * referment ; le bouton rend le regard au nom, Échap aussi quand le regard était sur l'explication ou son nom. Un toucher
 * sur l'explication elle-même la laisse ouverte. Une à la fois : en ouvrir une autre, c'est toucher ailleurs.
 *
 * Le toucher ailleurs : sur ce qui n'active rien (du texte, le fond), elle se ferme dès l'appui, car Safari sur iPhone ne
 * remonte pas jusqu'au document le clic d'un tel toucher. Sur un lien ou un bouton (le nom d'une autre caractéristique,
 * « Fermer »), elle attend le clic : fermée dès l'appui, elle remontait les lignes du dessous avant que le doigt ne se lève,
 * et le clic tombait à côté de ce qu'il visait. Faire défiler la page ne la ferme pas.
 */
function useExplication() {
  const [ouverte, setOuverte] = useState(false);
  const nom = useRef<HTMLButtonElement>(null);
  const explication = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ouverte) return;
    const dedans = (cible: Node) => Boolean(nom.current?.contains(cible) || explication.current?.contains(cible));
    const appui = (evenement: PointerEvent) => {
      const cible = evenement.target as Element;
      if (!dedans(cible) && !cible.closest?.(INTERACTIF)) setOuverte(false);
    };
    const clic = (evenement: MouseEvent) => {
      if (!dedans(evenement.target as Node)) setOuverte(false);
    };
    const touche = (evenement: KeyboardEvent) => {
      if (evenement.key !== "Escape") return;
      const regard = document.activeElement;
      setOuverte(false);
      if (!regard || regard === document.body || dedans(regard)) nom.current?.focus();
    };
    document.addEventListener("pointerdown", appui);
    document.addEventListener("click", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", appui);
      document.removeEventListener("click", clic);
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
