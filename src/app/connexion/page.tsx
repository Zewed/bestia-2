import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Se connecter" };

/** La connexion (US-0115) : l'adresse et le mot de passe. Fermée en production tant que l'entrée du jeu l'est. */
export default function Connexion() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <PageEntree
      titre="Se connecter"
      illustration={{ chemin: "entree/connexion.webp", alt: "Une hutte au toit de chaume, éclairée au crépuscule, au bout d'un chemin fleuri" }}
    >
      <FormulaireConnexion />
    </PageEntree>
  );
}
