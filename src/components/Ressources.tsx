"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { productionAffichee, productionHoraire, quantiteAffichee } from "@/monde/quantite";
import styles from "./BarreHaut.module.css";

type Famille = "nourriture" | "materiaux";

/** Ce que la barre montre d'un Stock : la Ressource, sa famille, sa quantité exacte et sa production horaire, en texte. */
export type RessourceDeLaBarre = { id: string; nom: string; famille: Famille; quantite: string; parHeure: string };

/** US-0205 : les deux groupes de Ressources, sous les mots du glossaire. */
const NOM_DE_FAMILLE: Record<Famille, string> = { nourriture: "Nourriture", materiaux: "Matériaux" };

/** US-0204 : l'icône d'une Ressource, rangée sous le nom de son identifiant. */
export const iconeDeRessource = (id: string) => `/illustrations/ressources/${id}.webp`;

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
 * Les quatre ressources du joueur dans la barre du haut (US-0203), toujours dans l'ordre Viande,
 * Végétaux, Bois, Pierre : leur icône, puis la quantité (US-0204), en deux groupes séparés d'un
 * trait, la Nourriture et les Matériaux (US-0205). Le nom de la ressource est le texte de l'icône ;
 * avec celui de son groupe, il paraît dans une bulle au survol ou au toucher, que toucher ailleurs
 * ou Échap referme. Au milieu de la barre ; sur mobile, en bande juste en dessous (voir formes.css).
 */
export function Ressources({ stocks }: { stocks: RessourceDeLaBarre[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const racine = useRef<HTMLDivElement>(null);

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
          {groupe.stocks.map((stock) => (
            <li key={stock.id} className={styles.ressource} data-ouverte={ouverte === stock.id ? "" : undefined}>
              <button type="button" className={styles.boutonRessource} onClick={() => setOuverte((avant) => (avant === stock.id ? null : stock.id))}>
                <Image src={iconeDeRessource(stock.id)} alt={stock.nom} width={22} height={22} className={styles.icone} />
                {/* Une espace entre le nom et la quantité, pour qu'un lecteur d'écran dise « Pierre 42 ». */}{" "}
                <span className={styles.quantite}>{quantiteAffichee(stock.quantite)}</span>
                {/* US-0212 : la production horaire, sur ordinateur ; plus discrète quand elle est nulle. */}
                <span className={styles.production} data-nulle={Number(stock.parHeure) === 0 ? "" : undefined}>
                  <span aria-hidden="true">{productionAffichee(stock.parHeure)}</span>
                  <span className={styles.annonce}>, {productionHoraire(stock.parHeure)} par heure</span>
                </span>
              </button>
              {/* Le nom et le groupe sont déjà dits par l'icône et la liste : la bulle ne sert qu'aux yeux. */}
              <span className={styles.bulle} aria-hidden="true">
                {stock.nom}
                <span className={styles.groupeBulle}>{NOM_DE_FAMILLE[stock.famille]}</span>
              </span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
