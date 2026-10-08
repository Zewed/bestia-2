import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { ANNEAUX_DU_MONDE } from "@/reglages";
import { lireJeu } from "./charger";
import { lireDonnees, lireRaretesParAnneau, RARETES } from "./jeux";

type Ligne = Record<string, number>;

const chances = lireRaretesParAnneau();
/** La part d'une Rareté dans chaque Anneau, de la Couronne au Cœur sauvage. */
const parAnneau = (rareteId: string) => chances.map((ligne) => ligne.find((c) => c.rareteId === rareteId)!.pourcent);

/** Une copie du dossier donnees/ où la table des Raretés par Anneau a subi une erreur de saisie. */
function tableAvec(modifier: (lignes: Ligne[]) => Ligne[]): string {
  const dossier = mkdtempSync(join(tmpdir(), "bestia-donnees-"));
  cpSync("donnees", dossier, { recursive: true });
  const chemin = join(dossier, "raretes-par-anneau.yaml");
  writeFileSync(chemin, stringify(modifier(parse(readFileSync(chemin, "utf8")))));
  return dossier;
}

describe("les Raretés tirées selon l'Anneau (US-0927, donnees/raretes-par-anneau.yaml)", () => {
  it(`donne une ligne par Anneau, de la Couronne au Cœur sauvage (${ANNEAUX_DU_MONDE}), chacune à 100 % en tout`, () => {
    expect(chances).toHaveLength(ANNEAUX_DU_MONDE);
    for (const ligne of chances) expect(ligne.reduce((s, c) => s + c.pourcent, 0)).toBeCloseTo(100, 9);
  });

  it("donne une chance à toutes les Raretés de commune à légendaire, dans l'ordre des Raretés, et jamais aux mythiques", () => {
    const raretes = lireJeu(RARETES).map((r) => r.id);
    for (const ligne of chances) {
      expect(ligne.map((c) => c.rareteId)).toEqual(raretes.filter((id) => id !== "mythique"));
      for (const c of ligne) expect(c.pourcent).toBeGreaterThan(0);
    }
  });

  it("garde les communes majoritaires dans chaque Anneau : plus de la moitié", () => {
    for (const commune of parAnneau("commune")) expect(commune).toBeGreaterThan(50);
  });

  it("rend chaque Rareté au-dessus de commune plus fréquente d'Anneau en Anneau, vers le Cœur sauvage", () => {
    for (const rareteId of ["peu_commune", "rare", "epique", "legendaire"]) {
      const parts = parAnneau(rareteId);
      for (let i = 1; i < parts.length; i++) expect(parts[i], `${rareteId}, Anneau ${i + 1}`).toBeGreaterThan(parts[i - 1]);
    }
  });

  const premiereLigne = (changement: (ligne: Ligne) => Ligne) => (lignes: Ligne[]) => lignes.map((l, i) => (i === 0 ? changement(l) : l));

  it.each([
    ["une ligne qui ne fait pas 100 %", premiereLigne((l) => ({ ...l, commune: l.commune + 1 })), /Anneau 1 : 101 % en tout, pas 100/],
    ["une chance de mythique", premiereLigne((l) => ({ ...l, commune: l.commune - 1, mythique: 1 })), /Anneau 1 : jamais de mythique ainsi/],
    ["une Rareté sans chance", premiereLigne((l) => ({ ...l, commune: l.commune + l.legendaire, legendaire: 0 })), /Anneau 1 : legendaire doit avoir une part plus grande que zéro/],
    ["une Rareté inconnue", premiereLigne((l) => ({ ...l, commune: l.commune - 1, introuvable: 1 })), /Anneau 1 : Rareté inconnue « introuvable »/],
    ["un Anneau de trop", (lignes: Ligne[]) => [...lignes, { ...lignes[0], anneau: lignes.length + 1 }], /Anneaux attendus/],
    ["des Anneaux dans le désordre", (lignes: Ligne[]) => [lignes[1], lignes[0], ...lignes.slice(2)], /ligne n° 1 : anneau 1 attendu/],
  ])("arrête la mise en ligne pour %s", (_, modifier, message) => {
    const dossier = tableAvec(modifier);
    expect(() => lireDonnees(dossier)).toThrow(message);
    rmSync(dossier, { recursive: true, force: true });
  });
});
