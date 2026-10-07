"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { productionAffichee, productionHoraire, quantiteAffichee, quantiteDetaillee } from "@/monde/quantite";
import { RECALER_LA_BARRE_MINUTES } from "@/reglages";
import { iconeDeRessource } from "./icone-de-ressource";
import styles from "./BarreHaut.module.css";

type Famille = "nourriture" | "materiaux";

/** Ce que la barre montre d'un Stock : la Ressource, sa famille, sa quantité exacte, sa production horaire et ses sources, en texte. */
export type RessourceDeLaBarre = {
  id: string;
  nom: string;
  famille: Famille;
  quantite: string;
  limite: string;
  parHeure: string;
  sources: { libelle: string; parHeure: string }[];
};

/** US-0205 : les deux groupes de Ressources, sous les mots du glossaire. */
const NOM_DE_FAMILLE: Record<Famille, string> = { nourriture: "Nourriture", materiaux: "Matériaux" };

/** Les Ressources rangées par famille, dans leur ordre : la Nourriture, puis les Matériaux. */
function parFamille(stocks: RessourceDeLaBarre[]): { famille: Famille; stocks: RessourceDeLaBarre[] }[] {
  const groupes: { famille: Famille; stocks: RessourceDeLaBarre[] }[] = [];
  for (const stock of stocks) {
    const dernier = groupes.at(-1);
    if (dernier?.famille === stock.famille) dernier.stocks.push(stock);
    else groupes.push({ famille: stock.famille, stocks: [stock] });
  }
  return groupes;
}

/**
 * US-0213 : la quantité d'un Stock `ecoule` millisecondes réelles après sa lecture, montée depuis au
 * rythme de sa production, accélérée comme le temps du jeu ; elle s'arrête à la limite (US-0221), et
 * un Stock déjà au-dessus ne bouge pas.
 */
export function quantiteMontee(stock: RessourceDeLaBarre, ecoule: number, vitesse: number): number {
  const quantite = Number(stock.quantite);
  const limite = Number(stock.limite);
  if (quantite >= limite) return quantite;
  return Math.min(limite, quantite + (Number(stock.parHeure) * vitesse * Math.max(0, ecoule)) / 3_600_000);
}

/**
 * Les quatre ressources du joueur dans la barre du haut (US-0203), toujours dans l'ordre Viande,
 * Végétaux, Bois, Pierre : leur icône, puis la quantité (US-0204), en deux groupes séparés d'un
 * trait, la Nourriture et les Matériaux (US-0205). Le nom de la ressource est le texte de l'icône ;
 * avec celui de son groupe, il paraît dans une bulle au survol ou au toucher, que toucher ailleurs
 * ou Échap referme. Au milieu de la barre ; sur mobile, en bande juste en dessous (voir formes.css).
 *
 * US-0213 : page ouverte, les quantités montent d'elles-mêmes au rythme de la production, depuis leur
 * arrivée dans la page ; la barre se recale sur les quantités exactes du jeu toutes les
 * RECALER_LA_BARRE_MINUTES minutes et dès qu'on revient sur l'onglet (une action, elle, recharge déjà
 * la page). De nouvelles quantités arrivent avec une nouvelle clé (ActionsDuJeu) : tout repart d'elles.
 */
export function Ressources({ stocks, vitesse = 1 }: { stocks: RessourceDeLaBarre[]; vitesse?: number }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [ecoule, setEcoule] = useState<number | null>(null);
  const racine = useRef<HTMLDivElement>(null);
  const routeur = useRouter();

  useEffect(() => {
    // Le temps écoulé depuis l'arrivée des quantités, sur l'horloge du navigateur : sans écart possible avec celle du serveur.
    const depart = performance.now();
    const battement = setInterval(() => setEcoule(performance.now() - depart), 1000);
    const recalage = setInterval(() => routeur.refresh(), RECALER_LA_BARRE_MINUTES * 60_000);
    const retour = () => {
      if (document.visibilityState === "visible") routeur.refresh();
    };
    document.addEventListener("visibilitychange", retour);
    return () => {
      clearInterval(battement);
      clearInterval(recalage);
      document.removeEventListener("visibilitychange", retour);
    };
  }, [routeur]);

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
    <div ref={racine} role="group" className={styles.ressources} aria-label="Ressources" data-bande-ressources="">
      {parFamille(stocks).map((groupe) => (
        <ul key={groupe.famille} className={styles.groupe} aria-label={NOM_DE_FAMILLE[groupe.famille]}>
          {groupe.stocks.map((stock) => {
            const quantite = ecoule === null ? Number(stock.quantite) : quantiteMontee(stock, ecoule, vitesse);
            return (
            <li key={stock.id} className={styles.ressource} data-ouverte={ouverte === stock.id ? "" : undefined}>
              <button type="button" className={styles.boutonRessource} onClick={() => setOuverte((avant) => (avant === stock.id ? null : stock.id))}>
                <Image src={iconeDeRessource(stock.id)} alt={stock.nom} width={22} height={22} className={styles.icone} />
                {/* Une espace entre le nom et la quantité, pour qu'un lecteur d'écran dise « Pierre 42 ». */}{" "}
                <span className={styles.quantite}>{quantiteAffichee(quantite)}</span>
                {/* US-0212 : la production horaire, sur ordinateur ; plus discrète quand elle est nulle. */}
                <span className={styles.production} data-nulle={Number(stock.parHeure) === 0 ? "" : undefined}>
                  <span aria-hidden="true">{productionAffichee(stock.parHeure)}</span>
                  <span className={styles.annonce}>, {productionHoraire(stock.parHeure)} par heure</span>
                </span>
              </button>
              {/*
                US-0214 : le détail de la ressource, au survol, au clavier ou au toucher : son nom et son groupe,
                sa quantité exacte et d'où vient sa production. Le nom, la quantité et la production sont déjà
                dits au lecteur d'écran par le bouton : la bulle ne sert qu'aux yeux.
              */}
              <span className={styles.bulle} aria-hidden="true">
                <span className={styles.nomBulle}>{stock.nom}</span>
                <span className={styles.groupeBulle}>{NOM_DE_FAMILLE[stock.famille]}</span>
                {/* US-0223 : la quantité et la limite, avec la jauge de remplissage. */}
                <span className={styles.quantiteBulle}>
                  {quantiteDetaillee(quantite)} / {quantiteAffichee(stock.limite)}
                </span>
                <span className={styles.jauge}>
                  <span className={styles.remplissage} style={{ width: `${Math.min(100, (quantite / Number(stock.limite)) * 100)}%` }} />
                </span>
                {stock.sources.length === 0 ? (
                  <span className={styles.sourceBulle}>{productionAffichee(0)}</span>
                ) : (
                  stock.sources.map((source) => (
                    <span key={source.libelle} className={styles.sourceBulle}>
                      {source.libelle} : {productionAffichee(source.parHeure)}
                    </span>
                  ))
                )}
              </span>
            </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
