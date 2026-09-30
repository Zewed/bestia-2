// Refuse tout secret dans ce qui peut partir dans le dépôt.
//   npm run secrets           fichiers suivis et nouveaux fichiers non ignorés
//   npm run secrets:history   tout l'historique Git
// Le message nomme le fichier, la ligne et la règle, jamais la valeur trouvée.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { filledExampleLines, findSecrets, isForbiddenFile } from "./lib/secrets";

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 512 });
}

function scanWorkingTree(problems: string[]) {
  const files = git("ls-files", "-z", "--cached", "--others", "--exclude-standard")
    .split("\0")
    .filter(Boolean);
  for (const file of files) {
    if (isForbiddenFile(file)) {
      problems.push(`${file} : fichier de secrets qui ne doit pas être dans le dépôt`);
      continue;
    }
    let content: Buffer;
    try {
      content = readFileSync(file);
    } catch {
      continue; // supprimé mais pas encore validé
    }
    if (content.subarray(0, 8000).includes(0)) continue; // fichier binaire
    const text = content.toString("utf8");
    for (const { line, rule } of findSecrets(text)) problems.push(`${file}:${line} : ${rule}`);
    if (file === ".env.example") {
      for (const line of filledExampleLines(text)) {
        problems.push(`.env.example:${line} : une valeur est renseignée, laissez-la vide`);
      }
    }
  }
}

function scanHistory(problems: string[]) {
  const log = git("log", "--all", "-p", "--no-color", "--format=commit %H");
  let commit = "";
  let file = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("commit ")) commit = line.slice(7, 14);
    else if (line.startsWith("+++ b/")) file = line.slice(6);
    else if (line.startsWith("+") && !line.startsWith("+++")) {
      for (const { rule } of findSecrets(line.slice(1))) problems.push(`${commit} ${file} : ${rule}`);
    }
  }
}

const problems: string[] = [];
const history = process.argv.includes("--history");
if (history) scanHistory(problems);
else scanWorkingTree(problems);

if (problems.length > 0) {
  console.error(`Secrets repérés (${problems.length}) :\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(history ? "Aucun secret dans l'historique Git." : "Aucun secret dans les fichiers du dépôt.");
}
