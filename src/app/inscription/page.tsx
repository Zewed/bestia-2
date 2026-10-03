import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { compteConnecte } from "@/comptes/cookie-session";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import { FormulaireInscription } from "./FormulaireInscription";

export const metadata: Metadata = { title: "Créer un compte" };

/**
 * L'inscription : une adresse e-mail et un mot de passe, rien d'autre. Un joueur déjà connecté
 * va droit au jeu (US-0122). Fermée en production tant que l'entrée du jeu l'est.
 */
export default async function Inscription() {
  if (!entreeDuJeuOuverte()) notFound();
  if (await compteConnecte()) redirect("/jeu");
  return (
    <PageEntree
      titre="Créer un compte"
      illustration={{ chemin: "entree/inscription.webp", alt: "Un sac d'aventurier ouvert sur un rocher, au-dessus d'une vallée sauvage au lever du soleil" }}
    >
      <FormulaireInscription />
    </PageEntree>
  );
}
