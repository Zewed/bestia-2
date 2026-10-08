import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { exigerCompte } from "@/comptes/garde";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { getPool } from "@/db";
import { biomesEnBase } from "@/donnees/en-base";
import { carteDuJoueur } from "@/monde/carte";
import { couleur } from "@/monde/couleurs-de-la-carte";
import { Attente } from "./Attente";
import { CarteDuJeu } from "./CarteDuJeu";
import { Legende } from "./Legende";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Carte" };

/**
 * La carte du Monde (US-0417), ouverte depuis la navigation : le Monde du joueur dans toute la place sous la barre
 * du haut, son Foyer au milieu, sans un mot de plus. Toutes les Cases sont visibles en attendant le brouillard
 * (étape 20). US-0418 : chaque Biome, et chaque eau, de sa couleur sur la page de contrôle du Monde. US-0432 : sa
 * légende, les Biomes de terre puis les eaux de leur nom en base. US-0434 : son attente, jusqu'à ce qu'elle soit
 * dessinée ; si sa lecture échoue, error.tsx. Sans session, la garde mène à la connexion, qui ramène ici.
 */
export default async function Carte() {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { territoireId } = await exigerCompte("/jeu/carte");
  const [carte, biomes] = territoireId === null ? [null, []] : await Promise.all([carteDuJoueur(getPool(), territoireId), biomesEnBase(getPool())]);
  return (
    <main className={styles.page}>
      <h1 className={styles.annonce}>Carte</h1>
      {carte ? <CarteDuJeu carte={carte} fonds={carte.teintes.map(couleur)} /> : null}
      {carte ? <Attente /> : null}
      {carte ? (
        <Legende
          terre={biomes.filter((b) => b.variantes.length === 0).map((b) => ({ teinte: b.id, nom: b.nom }))}
          eaux={biomes.flatMap((b) => b.variantes).map((v) => ({ teinte: v.id, nom: v.nom }))}
        />
      ) : null}
    </main>
  );
}
