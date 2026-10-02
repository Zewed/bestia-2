import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { lireFichier, valider, type Jeu } from "./charger";

const jeu: Jeu<{ id: string; nom: string; rang: number }> = {
  nom: "Essais",
  fichier: "essais.yaml",
  table: "essai_donnee",
  cle: "id",
  schema: z.object({ id: z.string().regex(/^[a-z_]+$/), nom: z.string().min(1), rang: z.number().int().positive() }),
  colonnes: (e) => ({ id: e.id, nom: e.nom, rang: e.rang }),
};

let dossier: string | undefined;
function fichier(contenu: string): string {
  dossier = mkdtempSync(join(tmpdir(), "bestia-donnees-"));
  const chemin = join(dossier, "essais.yaml");
  writeFileSync(chemin, contenu);
  return chemin;
}
afterEach(() => {
  if (dossier) rmSync(dossier, { recursive: true, force: true });
  dossier = undefined;
});

describe("fichiers de données", () => {
  it("se lisent comme une liste YAML, commentaires et accents compris", () => {
    const chemin = fichier("# Les essais\n- id: foret\n  nom: Forêt\n  rang: 1\n- id: coeur\n  nom: Cœur sauvage\n  rang: 2\n");
    expect(valider(jeu, lireFichier(chemin))).toEqual([
      { id: "foret", nom: "Forêt", rang: 1 },
      { id: "coeur", nom: "Cœur sauvage", rang: 2 },
    ]);
  });

  it("refusent un fichier qui n'est pas une liste", () => {
    expect(() => lireFichier(fichier("id: foret\n"))).toThrow(/liste d'entrées/);
  });

  it("disent quelle entrée est invalide, et pourquoi", () => {
    expect(() => valider(jeu, [{ id: "foret", nom: "Forêt", rang: 1 }, { id: "Forêt!", nom: "", rang: 0 }])).toThrow(
      /entrée n° 2 \(id\)[\s\S]*entrée n° 2 \(nom\)[\s\S]*entrée n° 2 \(rang\)/,
    );
  });

  it("refusent deux entrées avec la même clé", () => {
    expect(() => valider(jeu, [{ id: "foret", nom: "A", rang: 1 }, { id: "foret", nom: "B", rang: 2 }])).toThrow(
      /entrée n° 2 : la clé « foret » existe déjà/,
    );
  });
});
