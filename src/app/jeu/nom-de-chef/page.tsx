import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompteSansChef } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import styles from "../../entree.module.css";

export const metadata: Metadata = { title: "Nom de chef" };

/**
 * Le nom de chef, demandé dès la première connexion (US-0131) : tant qu'il n'est pas choisi,
 * toutes les pages du jeu mènent ici. « Valider » s'activera avec les règles du nom (US-0132 à
 * US-0139). Avec un nom déjà choisi, le joueur va droit au jeu.
 */
export default async function NomDeChef() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  await exigerCompteSansChef();
  return (
    <PageEntree
      titre="Votre nom de chef"
      illustration={{ chemin: "entree/inscription.webp", alt: "Un sac d'aventurier ouvert sur un rocher, au-dessus d'une vallée sauvage au lever du soleil" }}
    >
      <form className={styles.formulaire}>
        <div className={styles.champ}>
          <input id="nom-de-chef" type="text" name="nom" aria-label="Nom de chef" autoComplete="off" spellCheck={false} />
        </div>
        <button type="submit" className={styles.envoyer} disabled>
          Valider
        </button>
      </form>
    </PageEntree>
  );
}
