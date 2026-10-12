import { Barlow, Barlow_Semi_Condensed, Marcellus, Marcellus_SC } from "next/font/google";

// Les polices du jeu, hébergées par Next avec lui, chacune avec sa police de secours réglée aux mêmes dimensions : rien
// ne saute à l'affichage. Le sous-ensemble « latin » couvre les caractères du jeu (é, è, ê, à, ç, œ, É…). Chacune pose sa
// variable CSS sur la page (layout.tsx) ; typographie.css en fait les noms que les pages emploient.

/** Les titres : une capitale gravée, à l'antique, sans gras (une seule graisse). */
export const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

/** Les mêmes titres en petites capitales, pour un mot gravé (un nom de lieu, un sceau). */
export const marcellusSC = Marcellus_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus-sc",
  display: "swap",
});

/** Le texte et les nombres : nette et serrée, lisible petite ; 500 pour l'interface, 600 et 700 pour ce qui compte. */
export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

/** Les étiquettes en capitales espacées et les petites données : la même, plus étroite. */
export const barlowEtroite = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-barlow-etroite",
  display: "swap",
});

/** Les quatre variables, à poser ensemble sur la page (layout.tsx). */
export const polices = [marcellus, marcellusSC, barlow, barlowEtroite].map((police) => police.variable).join(" ");
