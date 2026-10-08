"use client";

import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { couleur } from "@/monde/couleurs-de-la-carte";
import type { Coordonnees } from "@/monde/hex";
import { ZONE_COEUR, ZONE_COURONNE } from "@/monde/zones";
import { type CarteADessiner, dessinerLaCarte, enSvg, type Peinture, type TraitSvg, vueSurLeFoyer } from "./dessin";
import styles from "./Legende.module.css";

/** Une teinte de la carte (un Biome de terre, ou une eau), et son nom affiché. */
export type TeinteNommee = { teinte: string; nom: string };

/** Ce que l'appareil retient de la légende : « ouverte » ou « fermee ». */
const CLE = "bestia.legende-de-la-carte";

/** Si la légende était ouverte ; sans mémoire de l'appareil (navigation privée stricte), elle reste fermée. */
function legendeOuverte(): boolean {
  try {
    return localStorage.getItem(CLE) === "ouverte";
  } catch {
    return false;
  }
}

/** Retient si la légende est ouverte. Sans mémoire de l'appareil, rien ne casse : elle s'ouvre fermée la prochaine fois. */
function retenirLaLegende(ouverte: boolean): void {
  try {
    localStorage.setItem(CLE, ouverte ? "ouverte" : "fermee");
  } catch {
    // Elle s'ouvrira fermée, voilà tout.
  }
}

/** US-0426 : les écrans où la légende s'ouvre en bas de la carte, ceux de Legende.module.css. */
const MOBILE = "(max-width: 820px)";

/**
 * US-0426 : publie sur la page (--hauteur-legende) la hauteur du panneau ouvert en bas de la carte, sur mobile : les
 * boutons de la carte et la flèche du Foyer restent au-dessus. Rien quand il est fermé, ni sur ordinateur.
 */
function publierLaHauteur(panneau: HTMLElement): void {
  const hauteur = matchMedia(MOBILE).matches ? panneau.getBoundingClientRect().height : 0;
  if (hauteur > 0) document.documentElement.style.setProperty("--hauteur-legende", `${hauteur}px`);
  else document.documentElement.style.removeProperty("--hauteur-legende");
}

/** Les couleurs de la carte en CSS, que le SVG comprend telles quelles : celles que CarteDuJeu donne au <canvas> (un test le vérifie). */
const PEINTURE: Omit<Peinture, "fonds"> = {
  bord: "color-mix(in oklch, var(--encre) 14%, transparent)",
  motifSombre: "color-mix(in oklch, var(--encre) 26%, transparent)",
  motifClair: "color-mix(in oklch, var(--ivoire) 45%, transparent)",
  encre: "var(--encre)",
  repere: "var(--citron)",
};

/** La Case d'un échantillon, et un Foyer assez loin pour ne pas y paraître. */
const ICI: Coordonnees = { q: 0, r: 0 };
const AILLEURS: Coordonnees = { q: 1000, r: 0 };
/** La carte à la taille de son ouverture, sur 120 pixels de côté : les deux Cases d'une limite y tiennent. */
const VUE = vueSurLeFoyer(ICI, 120, 120);
/** Une seule Case, en (0, 0), hors de la Couronne et du Cœur sauvage. */
const UNE_CASE = { q: [ICI.q], r: [ICI.r], teinte: [0], zone: [0] };
/** US-0433 : deux Cases côte à côte, celle de gauche de la zone `zone`, celle de droite non : leur limite entre elles. */
const deuxCases = (zone: number) => ({ q: [0, 1], r: [0, 0], teinte: [0, 0], zone: [zone, 0] });

/** Un nombre de style SVG, au centième de pixel. */
const auCentieme = (n: number) => Math.round(n * 100) / 100;
/** US-0433 : l'opacité d'un remplissage ou d'un trait, quand il n'est pas opaque. */
const opacite = (t: TraitSvg) => (t.opacite < 1 ? t.opacite : undefined);

/** Le style SVG d'un trait de la carte : sa couleur, son épaisseur, ses bouts et ses jointures ; US-0433 : ses tirets et son opacité. */
function trait(t: TraitSvg): CSSProperties {
  return {
    fill: "none",
    stroke: t.couleur,
    strokeWidth: t.epaisseur,
    strokeLinecap: t.bouts,
    strokeLinejoin: t.jointures,
    strokeDasharray: t.tirets.length > 0 ? t.tirets.map(auCentieme).join(" ") : undefined,
    strokeDashoffset: t.tirets.length > 0 ? auCentieme(t.decalage) : undefined,
    opacity: opacite(t),
  };
}

/**
 * US-0432 : un échantillon de la carte, une seule Case de `teinte` (ou les Cases `cases`, toutes de cette teinte),
 * dessinée par la carte elle-même à la taille de son ouverture, écrite en SVG : la même couleur, le même motif, le
 * même bord ; avec son Foyer ou celui d'un autre chef. US-0433 : avec le liseré d'une limite.
 */
function Echantillon({ teinte, cases = UNE_CASE, foyer = AILLEURS, foyers = [] }: { teinte: string; cases?: CarteADessiner["cases"]; foyer?: Coordonnees; foyers?: Coordonnees[] }) {
  const carte = { teintes: [teinte], cases, foyer, foyers };
  const { traits, cadre } = enSvg((pinceau) => dessinerLaCarte(pinceau, carte, VUE, { ...PEINTURE, fonds: [couleur(teinte)] }));
  const [x, y, largeur, hauteur] = [cadre.x, cadre.y, cadre.largeur, cadre.hauteur].map(auCentieme);
  return (
    <svg
      className={styles.echantillon}
      viewBox={`${x} ${y} ${largeur} ${hauteur}`}
      width={largeur}
      height={hauteur}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      {traits.map((t, i) => (
        <path key={i} d={t.d} style={t.geste === "remplir" ? { fill: t.couleur, opacity: opacite(t) } : trait(t)} />
      ))}
    </svg>
  );
}

/** Une liste de la légende, sous son petit titre ; sur une colonne, pour des échantillons plus larges. */
function Groupe({ titre, uneColonne = false, children }: { titre: string; uneColonne?: boolean; children: ReactNode }) {
  return (
    <div className={styles.groupe}>
      <h2 className={styles.titre}>{titre}</h2>
      <ul className={`${styles.liste} ${uneColonne ? styles.uneColonne : ""}`}>{children}</ul>
    </div>
  );
}

/**
 * US-0432 : la légende de la carte, derrière un bouton « Légende » en haut à droite : chaque Biome de terre et chaque
 * eau, dans leur ordre, chacun dans une Case dessinée comme sur la carte, puis le repère de son Foyer et les Foyers des
 * autres chefs ; US-0433 : et les liserés des limites de la Couronne et du Cœur sauvage. Un geste l'ouvre, un autre
 * la ferme ; l'appareil retient si elle était ouverte. Sur ordinateur, un
 * panneau flottant sous le bouton ; sur mobile, un panneau en bas, au-dessus des onglets, qui laisse voir la carte.
 * US-0426 : elle se déclare posée sur la carte, et publie la hauteur de son panneau ouvert en bas.
 */
export function Legende({ terre, eaux }: { terre: TeinteNommee[]; eaux: TeinteNommee[] }) {
  const [ouverte, setOuverte] = useState(false);
  const panneau = useId();
  const refPanneau = useRef<HTMLDivElement>(null);

  // L'appareil retient la légende ouverte : on ne peut le lire qu'une fois dans le navigateur.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'un état extérieur (localStorage)
    if (legendeOuverte()) setOuverte(true);
  }, []);

  // US-0426 : sa hauteur publiée à chaque changement de taille du panneau (ouvert, fermé) ou de l'écran.
  useEffect(() => {
    const publier = () => publierLaHauteur(refPanneau.current!);
    const suivi = new ResizeObserver(publier);
    suivi.observe(refPanneau.current!);
    const ecran = matchMedia(MOBILE);
    ecran.addEventListener("change", publier);
    return () => {
      suivi.disconnect();
      ecran.removeEventListener("change", publier);
      document.documentElement.style.removeProperty("--hauteur-legende");
    };
  }, []);

  const basculer = () => {
    setOuverte(!ouverte);
    retenirLaLegende(!ouverte);
  };

  return (
    <div className={styles.legende} data-sur-la-carte="">
      <button type="button" className={styles.bouton} aria-expanded={ouverte} aria-controls={panneau} onClick={basculer}>
        Légende
      </button>
      <div id={panneau} ref={refPanneau} className={styles.panneau} hidden={!ouverte}>
        <Groupe titre="Terre">
          {terre.map(({ teinte, nom }) => (
            <li key={teinte}>
              <Echantillon teinte={teinte} />
              {nom}
            </li>
          ))}
        </Groupe>
        <Groupe titre="Eau">
          {eaux.map(({ teinte, nom }) => (
            <li key={teinte}>
              <Echantillon teinte={teinte} />
              {nom}
            </li>
          ))}
        </Groupe>
        <Groupe titre="Repères" uneColonne>
          {/* Tous les Foyers naissent en prairie. */}
          <li>
            <Echantillon teinte="prairie" foyer={ICI} />
            Votre Foyer
          </li>
          <li>
            <Echantillon teinte="prairie" foyers={[ICI]} />
            Autres Foyers
          </li>
          <li>
            <Echantillon teinte="prairie" cases={deuxCases(ZONE_COURONNE)} />
            Limite de la Couronne
          </li>
          <li>
            <Echantillon teinte="prairie" cases={deuxCases(ZONE_COEUR)} />
            Limite du Cœur sauvage
          </li>
        </Groupe>
      </div>
    </div>
  );
}
