"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { productionAffichee, productionHoraire, quantiteAffichee, quantiteDetaillee } from "@/monde/quantite";
import { PRESQUE_PLEIN_POURCENT, RECALER_LA_BARRE_MINUTES } from "@/reglages";
import { formaterDuree } from "@/temps/affichage";
import { iconeDeRessource } from "./icone-de-ressource";
import styles from "./BarreHaut.module.css";

type Famille = "nourriture" | "materiaux";

/**
 * Ce que la barre montre d'un Stock : la Ressource, sa famille, sa quantité exacte, sa production horaire,
 * l'Entretien pris sur lui par heure (US-0316) et ses sources, en texte.
 */
export type RessourceDeLaBarre = {
  id: string;
  nom: string;
  famille: Famille;
  quantite: string;
  limite: string;
  parHeure: string;
  entretienParHeure: string;
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
 * US-0213 : la quantité d'un Stock `ecoule` millisecondes réelles après sa lecture, au rythme du jeu
 * (accéléré comme lui) : elle monte de sa production et descend de l'Entretien pris sur lui (US-0316),
 * sans passer sous zéro ni dépasser la limite (US-0221). Au-dessus de sa limite (US-0230), le Stock ne
 * produit plus : seul l'Entretien le fait descendre, jusqu'à elle ; sans Entretien, il ne bouge pas.
 */
export function quantiteMontee(stock: RessourceDeLaBarre, ecoule: number, vitesse: number): number {
  const quantite = Number(stock.quantite);
  const limite = Number(stock.limite);
  const entretien = Number(stock.entretienParHeure);
  let heures = (vitesse * Math.max(0, ecoule)) / 3_600_000;
  let depart = quantite;
  if (quantite > limite) {
    if (entretien * heures <= quantite - limite) return quantite - entretien * heures;
    heures -= (quantite - limite) / entretien;
    depart = limite;
  }
  return Math.min(limite, Math.max(0, depart + (Number(stock.parHeure) - entretien) * heures));
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
            // US-0224 : un Stock plein se signale dans la barre, par la couleur et par le mot « plein ».
            const plein = quantite >= Number(stock.limite);
            // US-0227 : avant d'être plein, le Stock prévient, d'une autre couleur.
            const presquePlein = !plein && quantite >= (Number(stock.limite) * PRESQUE_PLEIN_POURCENT) / 100;
            // US-0316 : ce que le Stock gagne par heure, Entretien payé.
            const montee = Number(stock.parHeure) - Number(stock.entretienParHeure);
            return (
            <li key={stock.id} className={styles.ressource} data-ouverte={ouverte === stock.id ? "" : undefined} data-plein={plein ? "" : undefined} data-presque-plein={presquePlein ? "" : undefined}>
              <button type="button" className={styles.boutonRessource} onClick={() => setOuverte((avant) => (avant === stock.id ? null : stock.id))}>
                <Image src={iconeDeRessource(stock.id)} alt={stock.nom} width={22} height={22} className={styles.icone} />
                {/* Une espace entre le nom et la quantité, pour qu'un lecteur d'écran dise « Pierre 42 ». */}{" "}
                <span className={styles.quantite}>{quantiteAffichee(quantite)}</span>
                {presquePlein ? <span className={styles.annonce}>, presque plein</span> : null}
                {plein ? (
                  <>
                    {" "}
                    <span className={styles.plein}>plein</span>
                  </>
                ) : null}
                {/* US-0212 : la production horaire, sur ordinateur ; plus discrète quand elle est nulle. Un Stock plein n'en a plus : « PLEIN » en tient lieu (US-0225). */}
                {plein ? (
                  <span className={styles.annonce}>, production perdue</span>
                ) : (
                  <span className={styles.production} data-nulle={Number(stock.parHeure) === 0 ? "" : undefined}>
                    <span aria-hidden="true">{productionAffichee(stock.parHeure)}</span>
                    <span className={styles.annonce}>, {productionHoraire(stock.parHeure)} par heure</span>
                  </span>
                )}
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
                {plein ? (
                  <>
                    {/* US-0225 : ce que coûte l'attente, et ce qui reprendra. */}
                    <span className={styles.perdue}>Stock plein : la production de {stock.nom} est perdue.</span>
                    {Number(stock.parHeure) > 0 ? (
                      <span className={`${styles.sourceBulle} ${styles.reprise}`}>Elle reprendra à {productionAffichee(stock.parHeure)} dès qu&apos;il y aura de la place.</span>
                    ) : null}
                  </>
                ) : Number(stock.parHeure) > 0 ? (
                  <>
                    {/* US-0226 : dans combien de temps, au rythme du jeu, ce Stock sera plein ; US-0316 : s'il monte encore, Entretien payé. */}
                    {montee > 0 ? (
                      <span className={styles.sourceBulle}>plein dans {formaterDuree((Number(stock.limite) - quantite) / (montee * vitesse))}</span>
                    ) : null}
                    {stock.sources.map((source) => (
                      <span key={source.libelle} className={styles.sourceBulle}>
                        {source.libelle} : {productionAffichee(source.parHeure)}
                      </span>
                    ))}
                  </>
                ) : stock.sources.length === 0 ? (
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
