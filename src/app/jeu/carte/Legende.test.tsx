// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { couleur } from "@/monde/couleurs-de-la-carte";
import { dessinerLaCarte, enSvg, MOTIFS, vueSurLeFoyer } from "./dessin";
import { Legende } from "./Legende";

/** Les Biomes de terre et les quatre eaux, dans leur ordre, avec leur nom affiché, comme la page les lit en base. */
const TERRE = [
  { teinte: "prairie", nom: "Prairie" },
  { teinte: "foret", nom: "Forêt" },
  { teinte: "jungle", nom: "Jungle" },
  { teinte: "savane", nom: "Savane" },
  { teinte: "desert", nom: "Désert" },
  { teinte: "montagne", nom: "Montagne" },
  { teinte: "toundra", nom: "Toundra" },
  { teinte: "banquise", nom: "Banquise" },
];
const EAUX = [
  { teinte: "cote", nom: "Côte" },
  { teinte: "lac", nom: "Lac" },
  { teinte: "riviere", nom: "Rivière" },
  { teinte: "mer", nom: "Mer" },
];
/** Ce que l'appareil retient de la légende. */
const CLE = "bestia.legende-de-la-carte";

const bouton = () => screen.getByRole("button", { name: "Légende" });
/** Le panneau de la légende, celui que le bouton ouvre. */
const panneau = () => document.getElementById(bouton().getAttribute("aria-controls")!)!;
/** Une entrée de la légende, par son nom. */
const entree = (nom: string) => within(panneau()).getByText(nom).closest("li")!;
/** Les chemins de l'échantillon d'une entrée : leur tracé, et leur couleur de remplissage ou de trait. */
const chemins = (nom: string) =>
  [...entree(nom).querySelectorAll("svg path")].map((p) => {
    const style = (p as SVGPathElement).style;
    return { d: p.getAttribute("d"), couleur: style.fill === "none" ? style.stroke : style.fill };
  });
/** Une carte d'une seule Case, en (0, 0), à la taille de la carte à l'ouverture, écrite en SVG. */
const uneCase = (teinte: string, foyer = { q: 1000, r: 0 }, foyers: { q: number; r: number }[] = []) =>
  enSvg((p) =>
    dessinerLaCarte(p, { teintes: [teinte], cases: { q: [0], r: [0], teinte: [0] }, foyer, foyers }, vueSurLeFoyer({ q: 0, r: 0 }, 0, 0), {
      fonds: [couleur(teinte)],
      bord: "color-mix(in oklch, var(--encre) 14%, transparent)",
      motifSombre: "color-mix(in oklch, var(--encre) 26%, transparent)",
      motifClair: "color-mix(in oklch, var(--ivoire) 45%, transparent)",
      encre: "var(--encre)",
      repere: "var(--citron)",
    }),
  ).traits.map((t) => ({ d: t.d, couleur: t.couleur }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("la légende de la carte (US-0432)", () => {
  it("se tient derrière un bouton « Légende », fermée d'abord", () => {
    render(<Legende terre={TERRE} eaux={EAUX} />);
    expect(bouton().getAttribute("aria-expanded")).toBe("false");
    expect(panneau().hidden).toBe(true);
  });

  it("s'ouvre d'un geste sur les huit Biomes et les quatre eaux, puis le repère du Foyer", async () => {
    render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    expect(bouton().getAttribute("aria-expanded")).toBe("true");
    expect(panneau().hidden).toBe(false);
    expect([...panneau().querySelectorAll("li")].map((li) => li.textContent)).toEqual([...TERRE, ...EAUX].map((t) => t.nom).concat("Votre Foyer", "Autres Foyers"));
  });

  it("montre chaque Biome et chaque eau dans une Case dessinée comme sur la carte : sa couleur, son motif, son bord", async () => {
    render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    for (const { teinte, nom } of [...TERRE, ...EAUX]) {
      expect(chemins(nom), nom).toEqual(uneCase(teinte));
      // Le fond de sa couleur, puis son motif dans le ton de sa teinte.
      expect(chemins(nom)[0].couleur).toBe(couleur(teinte));
      expect(chemins(nom)[1].couleur).toContain(MOTIFS[teinte].ton === "sombre" ? "var(--encre)" : "var(--ivoire)");
    }
  });

  it("montre le repère citron de son Foyer, et le Foyer d'Encre des autres chefs, comme sur la carte", async () => {
    render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    // Tous les Foyers naissent en prairie.
    expect(chemins("Votre Foyer")).toEqual(uneCase("prairie", { q: 0, r: 0 }));
    expect(chemins("Votre Foyer").map((c) => c.couleur)).toContain("var(--citron)");
    expect(chemins("Autres Foyers")).toEqual(uneCase("prairie", { q: 1000, r: 0 }, [{ q: 0, r: 0 }]));
    expect(chemins("Autres Foyers").at(-1)!.couleur).toBe("var(--encre)");
  });

  it("se referme d'un geste", async () => {
    render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    await userEvent.click(bouton());
    expect(bouton().getAttribute("aria-expanded")).toBe("false");
    expect(panneau().hidden).toBe(true);
  });

  it("se rouvre à la visite suivante si elle était ouverte, et reste fermée sinon : l'appareil le retient", async () => {
    const { unmount } = render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    expect(localStorage.getItem(CLE)).toBe("ouverte");
    unmount();
    render(<Legende terre={TERRE} eaux={EAUX} />);
    expect(bouton().getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(bouton());
    expect(localStorage.getItem(CLE)).toBe("fermee");
    cleanup();
    render(<Legende terre={TERRE} eaux={EAUX} />);
    expect(bouton().getAttribute("aria-expanded")).toBe("false");
  });

  it("s'ouvre et se ferme même quand l'appareil ne peut rien retenir", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("stockage interdit");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("stockage interdit");
    });
    render(<Legende terre={TERRE} eaux={EAUX} />);
    await userEvent.click(bouton());
    expect(panneau().hidden).toBe(false);
    await userEvent.click(bouton());
    expect(panneau().hidden).toBe(true);
  });
});
