import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import { FormulaireInscription } from "./FormulaireInscription";

export const metadata: Metadata = { title: "Créer un compte" };

/** L'inscription : une adresse e-mail et un mot de passe, rien d'autre. Fermée en production tant que l'entrée du jeu l'est. */
export default function Inscription() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <PageEntree
      titre="Créer un compte"
      illustration={{ chemin: "entree/inscription.webp", alt: "Un sac d'aventurier ouvert sur un rocher, au-dessus d'une vallée sauvage au lever du soleil" }}
    >
      <FormulaireInscription />
    </PageEntree>
  );
}
