import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { explainDatabaseError, getPool } from "./index";

/**
 * Écrit une ligne dans la base puis la relit, dans une table temporaire
 * qui disparaît avec la transaction : l'essai ne laisse aucune trace.
 */
export async function checkDatabase(): Promise<{ written: string; read: string }> {
  const written = `Bête sauvage ${randomUUID()} · é à ç 🐺`;
  let client;
  try {
    client = await getPool().connect();
  } catch (error) {
    throw explainDatabaseError(error);
  }
  try {
    const db = drizzle(client);
    await db.execute(sql`begin`);
    await db.execute(sql`create temporary table sonde (texte text not null) on commit drop`);
    await db.execute(sql`insert into sonde (texte) values (${written})`);
    const result = await db.execute<{ texte: string }>(sql`select texte from sonde`);
    await db.execute(sql`commit`);
    const read = result.rows[0]?.texte ?? "";
    if (read !== written) {
      throw new Error(`La base a rendu « ${read} » au lieu de « ${written} ».`);
    }
    return { written, read };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
