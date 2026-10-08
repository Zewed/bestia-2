import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { couleur } from "@/app/controle/monde/CarteDuMonde";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { carteDuJoueur } from "@/monde/carte";
import { CarteDuJeu } from "./CarteDuJeu";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Carte" };

/**
 * La carte du Monde (US-0417), ouverte depuis la navigation : le Monde du joueur dans toute la place sous la barre
 * du haut, son Foyer au milieu, sans un mot de plus. Toutes les Cases sont visibles en attendant le brouillard
 * (étape 20). US-0418 : chaque Biome, et chaque eau, de sa couleur sur la page de contrôle du Monde. Sans
 * session, la garde mène à la connexion, qui ramène ici.
 */
export default async function Carte() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/carte");
  const carte = territoireId === null ? null : await carteDuJoueur(getPool(), territoireId);
  return (
    <main className={styles.page}>
      <h1 className={styles.annonce}>Carte</h1>
      {carte ? <CarteDuJeu carte={carte} fonds={carte.teintes.map(couleur)} /> : null}
    </main>
  );
}
