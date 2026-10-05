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

const monde = vi.hoisted(() => ({ couronneEnBase: vi.fn(), territoiresSuivis: vi.fn(async (): Promise<{ nombre: number; plusAncien: Date | null }> => ({ nombre: 0, plusAncien: null })) }));
vi.mock("@/monde/en-base", () => monde);
const COURONNE = {
  monde: "Aube",
  cases: [
    { q: 0, r: -2, biome: "prairie", chef: null, foyer: false },
    { q: 1, r: -2, biome: "prairie", chef: null, foyer: false },
    { q: 2, r: -2, biome: "prairie", chef: null, foyer: false },
    { q: 2, r: -1, biome: "eau", chef: null, foyer: false },
  ],
};

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

  it("montre la Couronne vue d'en haut, une forme par Biome, et la part de chacun (US-0151)", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    monde.couronneEnBase.mockResolvedValue(COURONNE);
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Couronne de Aube · 4 Cases");
    expect(html).toMatch(/<svg[^>]*aria-label="La Couronne de Aube, 4 Cases"/);
    expect(html.match(/<path data-biome="([a-z]+)"/g)).toEqual(['<path data-biome="prairie"', '<path data-biome="eau"']);
    expect(html).toContain("fill:var(--biome-prairie)");
    expect(html).toMatch(/Prairie<span[^>]*>3 · 75 %<\/span>/);
    expect(html).toMatch(/Eau<span[^>]*>1 · 25 %<\/span>/);
  });

  it("marque d'un point chaque emplacement où un Foyer pourrait naître, et les compte (US-0152)", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    monde.couronneEnBase.mockResolvedValue(COURONNE);
    const html = renderToStaticMarkup(await Controle());
    // Trois prairies voisines : une seule peut accueillir un Foyer, les autres sont trop près.
    expect(html.match(/<circle /g)).toHaveLength(1);
    expect(html).toMatch(/Emplacements de Foyer<span[^>]*>1<\/span>/);
  });

  it("dit comment préparer la Couronne quand elle n'est pas encore en base", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    monde.couronneEnBase.mockResolvedValue({ monde: "Aube", cases: [] });
    expect(renderToStaticMarkup(await Controle())).toContain("lancez npm run monde:couronne");
  });

  it("cercle chaque Case possédée, avec le nom de son chef au survol, et en tient compte pour les emplacements (US-0153)", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    monde.couronneEnBase.mockResolvedValue({ ...COURONNE, cases: COURONNE.cases.map((c, i) => (i === 0 ? { ...c, chef: "Ourse", foyer: true } : c)) });
    const html = renderToStaticMarkup(await Controle());
    expect(html).toMatch(/<path d="[^"]+"><title>Ourse<\/title><\/path>/);
    expect(html).toMatch(/Cases possédées<span[^>]*>1<\/span>/);
    expect(html).toMatch(/Foyers<span[^>]*>1<\/span>/);
    expect(html).toMatch(/<path class="[^"]*foyers[^"]*" d="M[^"]+Z"/);
    expect(html).toMatch(/Emplacements de Foyer<span[^>]*>0<\/span>/);
  });

  it("compte les Territoires suivis par le temps, et dit le retard du plus en retard (US-0156)", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    monde.territoiresSuivis.mockResolvedValueOnce({ nombre: 2, plusAncien: new Date(Date.now() - 3 * 60_000) });
    const html = renderToStaticMarkup(await Controle());
    expect(html).toContain("Territoires suivis par le temps");
    expect(html).toMatch(/Le plus en retard a été calculé il y a 3 min\./);
  });

  it("dit qu'il n'y a encore aucun Territoire", async () => {
    entetes.authorization = `Basic ${Buffer.from(`controle:${MOT_DE_PASSE}`).toString("base64")}`;
    expect(renderToStaticMarkup(await Controle())).toContain("Aucun Territoire pour l&#x27;instant.");
  });
});

