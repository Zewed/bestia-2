"use client";

import { type ReactNode, useEffect, useId, useState } from "react";
import { couleur } from "@/monde/couleurs-de-la-carte";
import type { Coordonnees } from "@/monde/hex";
import { dessinerLaCarte, enSvg, vueSurLeFoyer, type Peinture } from "./dessin";
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

/**
 * US-0432 : un échantillon de la carte, une seule Case de `teinte`, dessinée par la carte elle-même à la taille de
 * son ouverture, écrite en SVG : la même couleur, le même motif, le même bord ; avec son Foyer ou celui d'un autre chef.
 */
function Echantillon({ teinte, foyer = AILLEURS, foyers = [] }: { teinte: string; foyer?: Coordonnees; foyers?: Coordonnees[] }) {
  const carte = { teintes: [teinte], cases: { q: [ICI.q], r: [ICI.r], teinte: [0] }, foyer, foyers };
  const { traits, cadre } = enSvg((pinceau) => dessinerLaCarte(pinceau, carte, vueSurLeFoyer(ICI, 0, 0), { ...PEINTURE, fonds: [couleur(teinte)] }));
  const [x, y, largeur, hauteur] = [cadre.x, cadre.y, cadre.largeur, cadre.hauteur].map((n) => Math.round(n * 100) / 100);
  return (
    <svg className={styles.echantillon} viewBox={`${x} ${y} ${largeur} ${hauteur}`} width={largeur} height={hauteur} aria-hidden="true">
      {traits.map((t, i) => (
        <path
          key={i}
          d={t.d}
          style={t.geste === "remplir" ? { fill: t.couleur } : { fill: "none", stroke: t.couleur, strokeWidth: t.epaisseur, strokeLinecap: t.bouts, strokeLinejoin: t.jointures }}
        />
      ))}
    </svg>
  );
}

/** Une liste de la légende, sous son petit titre. */
function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className={styles.groupe}>
      <h2 className={styles.titre}>{titre}</h2>
      <ul className={styles.liste}>{children}</ul>
    </div>
  );
}

/**
 * US-0432 : la légende de la carte, derrière un bouton « Légende » en haut à droite : chaque Biome de terre et chaque
 * eau, dans leur ordre, chacun dans une Case dessinée comme sur la carte, puis le repère de son Foyer et les Foyers des
 * autres chefs. Un geste l'ouvre, un autre la ferme ; l'appareil retient si elle était ouverte. Sur ordinateur, un
 * panneau flottant sous le bouton ; sur mobile, un panneau en bas, au-dessus des onglets, qui laisse voir la carte.
 */
export function Legende({ terre, eaux }: { terre: TeinteNommee[]; eaux: TeinteNommee[] }) {
  const [ouverte, setOuverte] = useState(false);
  const panneau = useId();

  // L'appareil retient la légende ouverte : on ne peut le lire qu'une fois dans le navigateur.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'un état extérieur (localStorage)
    if (legendeOuverte()) setOuverte(true);
  }, []);

  const basculer = () => {
    setOuverte(!ouverte);
    retenirLaLegende(!ouverte);
  };

  return (
    <div className={styles.legende}>
      <button type="button" className={styles.bouton} aria-expanded={ouverte} aria-controls={panneau} onClick={basculer}>
        Légende
      </button>
      <div id={panneau} className={styles.panneau} hidden={!ouverte}>
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
        <Groupe titre="Repères">
          {/* Tous les Foyers naissent en prairie. */}
          <li>
            <Echantillon teinte="prairie" foyer={ICI} />
            Votre Foyer
          </li>
          <li>
            <Echantillon teinte="prairie" foyers={[ICI]} />
            Autres Foyers
          </li>
        </Groupe>
      </div>
    </div>
  );
}
