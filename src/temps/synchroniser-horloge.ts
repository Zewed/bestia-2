// Au démarrage du serveur : charge l'ancre de l'horloge depuis la base, et la déplace si
// la vitesse a changé, sans jamais faire reculer l'heure du jeu.
import "server-only";
import type { Pool } from "pg";
import { definirAncre, heureReelle, type Ancre } from "./horloge";

export async function synchroniserHorloge(pool: Pool, facteur: number): Promise<Ancre> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const reel = heureReelle();
    const { rows } = await client.query<{ facteur: number; reel_ancre: Date; jeu_ancre: Date }>(
      "select facteur, reel_ancre, jeu_ancre from horloge where id = 1 for update",
    );
    let ancre: Ancre;
    if (!rows[0]) {
      ancre = { facteur, reel, jeu: reel };
      await client.query("insert into horloge (id, facteur, reel_ancre, jeu_ancre) values (1, $1, $2, $3)", [
        facteur,
        new Date(reel),
        new Date(reel),
      ]);
    } else {
      const actuelle = { facteur: rows[0].facteur, reel: rows[0].reel_ancre.getTime(), jeu: rows[0].jeu_ancre.getTime() };
      if (actuelle.facteur === facteur) {
        ancre = actuelle;
      } else {
        // Nouvelle vitesse : l'ancre passe à l'heure du jeu de cet instant, calculée à l'ancienne vitesse.
        const jeu = actuelle.jeu + Math.max(0, reel - actuelle.reel) * actuelle.facteur;
        ancre = { facteur, reel, jeu };
        await client.query("update horloge set facteur = $1, reel_ancre = $2, jeu_ancre = $3 where id = 1", [
          facteur,
          new Date(reel),
          new Date(jeu),
        ]);
      }
    }
    await client.query("commit");
    definirAncre(ancre);
    return ancre;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
