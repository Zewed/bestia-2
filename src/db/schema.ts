// La structure de la base. Chaque table arrive avec la story qui en a besoin ;
// tout changement passe par une migration :
//   npm run db:generate   écrit la migration à partir de ce fichier
//   npm run db:migrate    l'applique
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Un Monde : il naît une fois et ne se réinitialise jamais (la base refuse de l'effacer). */
export const monde = pgTable("monde", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: text("nom").notNull().unique(),
  neLe: timestamp("ne_le", { withTimezone: true }).notNull().defaultNow(),
});
