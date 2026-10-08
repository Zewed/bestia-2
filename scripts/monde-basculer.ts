// Bascule le jeu vers un Monde généré (US-0414) : npm run monde:basculer -- --vers "Essai" [--essai]
// Le Monde visé (son nom ou son numéro), généré en entier par npm run monde:generer, devient le Monde du jeu : chaque
// chef y reçoit son Foyer, son Territoire intact, et l'ancien Monde est fermé. Tout ou rien, en une transaction.
// Avec --essai, tout est fait puis annulé : la commande dit ce qu'elle ferait, sans rien changer.
// Ne tourne jamais à la mise en ligne, et refuse la base de production hors production (VERCEL_ENV=production) :
// la lancer en production attend l'accord d'Antoine.
import { parseArgs } from "node:util";
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { assertNotProductionDatabase } from "../src/db/production";
import { assertEnv } from "../src/env";
import { basculerLeMonde } from "../src/monde/bascule";

const USAGE = 'Usage : npm run monde:basculer -- --vers "Essai" [--essai]';

/** Le Monde visé, et s'il ne s'agit que d'un essai. */
function lireLesOptions(): { vers: string; essai: boolean } {
  let valeurs;
  try {
    valeurs = parseArgs({ options: { vers: { type: "string" }, essai: { type: "boolean", default: false } } }).values;
  } catch {
    throw new Error(USAGE);
  }
  const vers = valeurs.vers?.trim();
  if (!vers) throw new Error(`Quel Monde ouvrir ? ${USAGE}`);
  return { vers, essai: valeurs.essai };
}

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    const { vers, essai } = lireLesOptions();
    assertEnv();
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    await assertNotProductionDatabase(pool, "Bascule refusée");
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { depuis, vers: nom, foyers, sansFoyer, restantes } = await basculerLeMonde(client, vers);
      await client.query(essai ? "rollback" : "commit");
      for (const { chef, avant, apres } of foyers) console.log(`  ${chef} : Foyer (${avant.q}, ${avant.r}) → (${apres.q}, ${apres.r})`);
      const sansFoyerAuRetour = sansFoyer > 0 ? ` ; ${sansFoyer} chef(s) sans Foyer le recevront à leur retour` : "";
      console.log(
        essai
          ? `Essai, rien n'a changé : « ${nom} » deviendrait le Monde du jeu et « ${depuis} » serait fermé. ${foyers.length} chef(s) y recevraient leur Foyer, Territoire intact${sansFoyerAuRetour}. ${restantes} emplacement(s) de naissance resteraient libres.`
          : `« ${nom} » est le Monde du jeu ; « ${depuis} » est fermé. ${foyers.length} chef(s) y ont reçu leur Foyer, Territoire intact (Stocks, Habitants, Voyageurs, Récits)${sansFoyerAuRetour}. ${restantes} emplacement(s) de naissance libres.`,
      );
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(isConnectionError(error) ? explainDatabaseError(error).message : error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
