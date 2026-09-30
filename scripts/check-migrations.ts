// Refuse toute migration qui viderait ou supprimerait des données : npm run db:guard
import { findDestructiveStatements } from "../src/db/migrations";

const problems = findDestructiveStatements();
if (problems.length > 0) {
  console.error(`Migrations refusées (${problems.length}) :\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Aucune migration ne vide ni ne supprime de données.");
}
