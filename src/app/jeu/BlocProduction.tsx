import Image from "next/image";
import { Bloc } from "@/components/Bloc";
import { iconeDeRessource } from "@/components/icone-de-ressource";
import { productionAffichee } from "@/monde/quantite";
import styles from "./page.module.css";

/**
 * US-0217 : ce que le Territoire produit par heure, Ressource par Ressource, avec le Biome du Foyer
 * qui l'explique ; une Ressource que le Biome ne donne pas est dite comme telle.
 */
export function BlocProduction({ biome, productions }: { biome: string; productions: { id: string; nom: string; parHeure: string }[] }) {
  return (
    <Bloc titre={`Production · ${biome.toLocaleLowerCase("fr")}`}>
      <ul className={styles.productions}>
        {productions.map((p) =>
          Number(p.parHeure) > 0 ? (
            <li key={p.id} className={styles.ligneProduction}>
              <Image src={iconeDeRessource(p.id)} alt="" width={22} height={22} />
              <span>{p.nom}</span>
              <span className={styles.parHeure}>{productionAffichee(p.parHeure)}</span>
            </li>
          ) : (
            <li key={p.id} className={styles.ligneProduction} data-nulle="">
              <Image src={iconeDeRessource(p.id)} alt="" width={22} height={22} />
              <span>Ce Biome ne donne pas de {p.nom}.</span>
            </li>
          ),
        )}
      </ul>
    </Bloc>
  );
}
