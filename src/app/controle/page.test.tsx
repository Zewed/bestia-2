import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const entetes = vi.hoisted(() => ({ authorization: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(entetes.authorization ? { authorization: entetes.authorization } : {}),
}));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("@/temps/absents", () => ({
  derniersPassages: async () => [
    { debut: new Date("2026-10-03T09:05:00Z"), rattrapes: 0, echecs: 1, restants: 2, dureeMs: 45000, erreurs: [{ element: "tache", id: null, raison: "base injoignable" }] },
    { debut: new Date("2026-10-03T09:00:00Z"), rattrapes: 3, echecs: 0, restants: 0, dureeMs: 840, erreurs: [] },
  ],
}));

vi.mock("@/donnees/en-base", () => ({
  biomesEnBase: async () => [
    { id: "prairie", nom: "Prairie", variantes: [] },
    {
      id: "eau",
      nom: "Eau",
      variantes: [
        { id: "cote", nom: "Côte" },
        { id: "lac", nom: "Lac" },
        { id: "riviere", nom: "Rivière" },
        { id: "mer", nom: "Mer" },
      ],
    },
  ],
  especesEnBase: async () => [
    {
      id: "poule",
      nom: "Poule",
      attaque: 5981,
      vie: 14953,
      vitesse: 14,
      charge: 500,
      taille: 31.623,
      regime: "omnivore",
      entretienParHeure: 5,
      biome: { id: "prairie", nom: "Prairie" },
      rarete: { id: "commune", nom: "Commune" },
      role: { id: "nourricier", nom: "Nourricier" },
      masseG: 2000,
      facteurArme: 0.4,
      illustration: "especes/poule.webp",
      source: "Gallus gallus domesticus",
    },
    {
      id: "essai",
      nom: "Bête d'essai",
      attaque: 473,
      vie: 473,
      vitesse: 2,
      charge: 5,
      taille: 1,
      regime: "herbivore",
      entretienParHeure: 0.167,
      biome: { id: "prairie", nom: "Prairie" },
      rarete: { id: "peu_commune", nom: "Peu commune" },
      role: null,
      masseG: null,
      facteurArme: null,
      illustration: null,
      source: null,
    },
  ],
  raretesEnBase: async () => [
    { id: "commune", nom: "Commune", rang: 1, selevent: true },
    { id: "mythique", nom: "Mythique", rang: 6, selevent: false },
  ],
  rolesEnBase: async () => [{ id: "eclaireur", nom: "Éclaireur", phrase: "Voit loin." }],
}));

import Controle from "./page";

const MOT_DE_PASSE = "mot-de-passe-d-essai";

describe("page de contrôle", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", MOT_DE_PASSE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    entetes.authorization = null;
  });

  it("répond « page introuvable » sans le mot de passe, même si le proxy était contourné", async () => {
    await expect(Controle()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("montre l'heure du jeu, la vitesse du temps et les derniers passages de la tâche", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Heure du jeu");
    expect(html).toContain("×1");
    expect(html).toContain("Vitesse normale.");
    expect(html).toContain("1 échec : base injoignable");
    expect(html).toContain("Réussi");
    expect(html).toContain("0,8 s");
    expect(html.indexOf("1 échec")).toBeLessThan(html.indexOf("Réussi"));
  });

  it("liste les Biomes en base, avec leur nom, leur identifiant et les quatre formes de l'eau", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Biomes en base · 2");
    expect(html).toMatch(/Prairie<\/span> <code[^>]*>prairie<\/code>/);
    expect(html).toContain('aria-label="Les 4 formes : Eau"');
    for (const forme of ["Côte", "Lac", "Rivière", "Mer"]) expect(html).toContain(`<li>${forme} <code`);
  });

  it("montre chaque Espèce avec sa vignette, sa Rareté, son Rôle et toutes ses caractéristiques", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Espèces en base · 2");
    expect(html).toMatch(/srcSet="\/_next\/image\?url=%2Fillustrations%2Fespeces%2Fpoule\.webp/);
    expect(html).toContain('sizes="96px"');
    expect(html).toContain('data-rarete="commune"');
    expect(html).toContain("Nourricier");
    for (const valeur of ["5 981", "14 953", "14 km/h", "31,623", "5 / h", "omnivore", "2 000 g", "0,4", "Gallus gallus domesticus"]) {
      expect(html.replaceAll("\u202f", " ")).toContain(valeur);
    }
  });

  it("signale en couleur chaque champ vide, et met la tête de loup à la place d'une illustration absente", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    const essai = html.slice(html.indexOf("Bête d&#x27;essai"));
    // L'illustration, la masse, l'arme et la source : quatre champs vides.
    expect(essai.match(/class="[^"]*vide[^"]*"( title="[^"]*")?>vide</g)).toHaveLength(4);
    expect(essai).toContain('title="Pas d&#x27;illustration en base"');
    expect(html).toContain('aria-label="Bête d&#x27;essai"');
    expect(html).toContain('data-rarete="peu_commune"');
    expect(essai).toContain("Aucun Rôle");
  });

  it("liste aussi les Raretés et les Rôles en base", async () => {
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Raretés en base · 2");
    expect(html).toContain("rang 6 · ne s&#x27;élèvent pas");
    expect(html).toContain("Rôles en base · 1");
    expect(html).toContain("Voit loin.");
  });
});
