// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { casesDesAnneaux } from "@/monde/hex";
import type { CarteDuJoueur } from "@/monde/carte";
import { CarteDuJeu } from "./CarteDuJeu";
import { LARGEUR_DE_CASE } from "./dessin";

/** Ce que le <canvas> a reçu : ses gestes (mise à l'échelle, remplissages et traits avec leur couleur), et le départ de chaque tracé. */
const toile = vi.hoisted(() => ({ gestes: [] as string[], departs: [] as [number, number][] }));
/** La place que la page donne à la carte, en pixels. */
const ecran = { largeur: 800, hauteur: 600 };
/** Le suivi de taille du <canvas> : le dernier posé, pour annoncer un changement de taille comme le navigateur. */
let suivi: { annoncer: () => void; suivis: Element[]; arrete: boolean } | null = null;

beforeEach(() => {
  toile.gestes = [];
  toile.departs = [];
  const reglages: Record<string, unknown> = {};
  const pinceau = new Proxy(reglages, {
    get: (_, nom: string) =>
      nom in reglages
        ? reglages[nom]
        : (...valeurs: number[]) => {
            if (nom === "moveTo") toile.departs.push([valeurs[0], valeurs[1]]);
            if (nom === "setTransform") toile.gestes.push(`${nom} ${valeurs.join(" ")}`);
            if (nom === "fill") toile.gestes.push(`remplir ${reglages.fillStyle}`);
            if (nom === "stroke") toile.gestes.push(`border ${reglages.strokeStyle}`);
          },
    set: (_, nom: string, valeur) => {
      reglages[nom] = valeur;
      return true;
    },
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pinceau as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width: ecran.largeur, height: ecran.hauteur }) as DOMRect);
  // La couleur calculée d'une expression CSS sur le <canvas> : l'expression elle-même, pour reconnaître chaque couleur qu'il reçoit.
  const calculer = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = calculer(element, pseudo);
    if (!(element instanceof HTMLCanvasElement) || !element.style.color) return style;
    return new Proxy(style, {
      get: (cible, nom) => (nom === "color" ? element.style.color : typeof Reflect.get(cible, nom) === "function" ? Reflect.get(cible, nom).bind(cible) : Reflect.get(cible, nom)),
    });
  });
  // Un écran haute densité : deux pixels de l'écran par pixel de la page.
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(rappel: () => void) {
        suivi = { annoncer: rappel, suivis: [], arrete: false };
      }
      observe(element: Element) {
        suivi!.suivis.push(element);
        suivi!.annoncer();
      }
      disconnect() {
        suivi!.arrete = true;
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.assign(ecran, { largeur: 800, hauteur: 600 });
  suivi = null;
});

const FOYER = { q: 31, r: -57 };
const AUTOUR = casesDesAnneaux(0, 1).map((c) => ({ q: c.q + FOYER.q, r: c.r + FOYER.r }));
/** Le Foyer et ses six voisines, d'une teinte sans motif : on n'y voit que les hexagones. */
const CARTE: CarteDuJoueur = {
  monde: "Aube",
  foyer: FOYER,
  teintes: ["inconnue"],
  cases: { q: AUTOUR.map((c) => c.q), r: AUTOUR.map((c) => c.r), teinte: AUTOUR.map(() => 0) },
};
const FONDS = ["var(--galet)"];
/** Le rayon d'une Case à l'écran : la pointe du haut d'une Case est à ce rayon au-dessus de son centre. */
const RAYON = LARGEUR_DE_CASE / Math.sqrt(3);
/** Les Cases tracées, chacune une fois : le départ de leur hexagone, en haut. */
const casesTracees = () => new Set(toile.departs.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`));
const auMilieuDeLEcran = () => casesTracees().has(`${(ecran.largeur / 2).toFixed(6)},${(ecran.hauteur / 2 - RAYON).toFixed(6)}`);

describe("la carte du Monde (US-0417)", () => {
  it("est une image du Monde du joueur pour les lecteurs d'écran", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    expect(screen.getByRole("img", { name: "Carte du Monde Aube, votre Foyer au milieu" }).tagName).toBe("CANVAS");
  });

  it("dessine les Cases dès l'ouverture, le Foyer au milieu, nette sur un écran haute densité", () => {
    const { container } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    const canvas = container.querySelector("canvas")!;
    // Deux pixels de l'écran par pixel de la page : la toile est deux fois plus grande, et le dessin mis à l'échelle.
    expect([canvas.width, canvas.height]).toEqual([1600, 1200]);
    expect(toile.gestes[0]).toBe("setTransform 2 0 0 2 0 0");
    expect(casesTracees().size).toBe(7);
    expect(auMilieuDeLEcran()).toBe(true);
  });

  it("se redessine quand l'écran change de taille, le Foyer toujours au milieu", () => {
    const { container } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    Object.assign(ecran, { largeur: 375, hauteur: 559 });
    vi.stubGlobal("devicePixelRatio", 3);
    toile.departs = [];
    act(() => suivi!.annoncer());
    expect([container.querySelector("canvas")!.width, container.querySelector("canvas")!.height]).toEqual([1125, 1677]);
    expect(auMilieuDeLEcran()).toBe(true);
  });

  it("cesse de suivre la taille de l'écran une fois la page quittée", () => {
    const { unmount, container } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    expect(suivi!.suivis).toEqual([container.querySelector("canvas")]);
    unmount();
    expect(suivi!.arrete).toBe(true);
  });
});

describe("les Biomes sur la carte (US-0418)", () => {
  it("peint chaque teinte de la couleur que la page lui donne, ses motifs d'Encre ou d'Ivoire légers, et un bord d'Encre à peine marqué", () => {
    const carte: CarteDuJoueur = { ...CARTE, teintes: ["prairie", "mer"], cases: { ...CARTE.cases, teinte: AUTOUR.map((c) => (c.r === FOYER.r ? 0 : 1)) } };
    render(<CarteDuJeu carte={carte} fonds={["var(--biome-prairie)", "var(--biome-eau)"]} />);
    expect(toile.gestes.slice(1)).toEqual([
      "remplir var(--biome-prairie)",
      "remplir var(--biome-eau)",
      // La prairie a un motif sombre, la mer un motif clair.
      "border color-mix(in oklch, var(--encre) 26%, transparent)",
      "border color-mix(in oklch, var(--ivoire) 45%, transparent)",
      "border color-mix(in oklch, var(--encre) 14%, transparent)",
    ]);
  });
});
