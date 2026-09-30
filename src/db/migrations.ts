import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MIGRATIONS_FOLDER = "drizzle";

// Un Monde ne se réinitialise jamais : aucune migration ne peut vider ni supprimer
// une table, un schéma ou une colonne. Retirer des données se fait autrement,
// par une story qui le décide.
const DESTRUCTIVE: { name: string; pattern: RegExp }[] = [
  { name: "TRUNCATE vide une table", pattern: /\btruncate\b/i },
  { name: "DELETE FROM efface des lignes", pattern: /\bdelete\s+from\b/i },
  { name: "DROP TABLE supprime une table", pattern: /\bdrop\s+table\b/i },
  { name: "DROP SCHEMA supprime des tables", pattern: /\bdrop\s+schema\b/i },
  { name: "DROP DATABASE supprime la base", pattern: /\bdrop\s+database\b/i },
  {
    name: "DROP COLUMN supprime une colonne",
    pattern: /\balter\s+table\b[^;]*\bdrop\s+(?!constraint\b|default\b|not\s+null\b|identity\b|expression\b)/i,
  },
];

// Remplace les commentaires par des blancs de même forme, pour garder les numéros de ligne.
function withoutComments(sql: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return sql.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/--.*$/gm, blank);
}

/** Liste les instructions destructrices des migrations, avec leur fichier et leur ligne. */
export function findDestructiveStatements(folder = MIGRATIONS_FOLDER): string[] {
  let files: string[];
  try {
    files = readdirSync(folder).filter((file) => file.endsWith(".sql")).sort();
  } catch {
    return [];
  }
  const problems: string[] = [];
  for (const file of files) {
    const sql = withoutComments(readFileSync(join(folder, file), "utf8"));
    let offset = 0;
    for (const statement of sql.split(";")) {
      const start = offset + statement.search(/\S|$/);
      const line = sql.slice(0, start).split("\n").length;
      for (const rule of DESTRUCTIVE) {
        if (rule.pattern.test(statement)) {
          problems.push(`${folder}/${file}:${line} : ${rule.name}, or un Monde ne se réinitialise jamais`);
        }
      }
      offset += statement.length + 1;
    }
  }
  return problems;
}
