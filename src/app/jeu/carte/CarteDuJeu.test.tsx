// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { casesDesAnneaux } from "@/monde/hex";
import type { CarteDuJoueur } from "@/monde/carte";
import { CarteDuJeu } from "./CarteDuJeu";
import { aLEcran, LARGEUR_DE_CASE, vueSurLeFoyer, type Vue } from "./dessin";
import { deplacer, limiteDeLaCarte } from "./vue";

/**
 * Ce que le <canvas> a reçu : ses gestes (mise à l'échelle, remplissages et traits avec leur couleur), le départ de
 * chaque tracé, et combien de fois il a été effacé pour être redessiné.
 */
const toile = vi.hoisted(() => ({ gestes: [] as string[], departs: [] as [number, number][], effacements: 0 }));
/** La place que la page donne à la carte, en pixels. */
const ecran = { largeur: 800, hauteur: 600 };
/** Le suivi de taille du <canvas> : le dernier posé, pour annoncer un changement de taille comme le navigateur. */
let suivi: { annoncer: () => void; suivis: Element[]; arrete: boolean } | null = null;
/** Les illustrations que la carte a demandé de charger, à charger à la main comme le ferait le navigateur. */
let images: { src: string; naturalWidth: number; naturalHeight: number; onload: (() => void) | null }[] = [];
/** Ce que la carte a demandé de faire à la prochaine image de l'écran, à lancer à la main comme le ferait le navigateur. */
let aLaProchaineImage = new Map<number, FrameRequestCallback>();

beforeEach(() => {
  toile.gestes = [];
  toile.departs = [];
  toile.effacements = 0;
  images = [];
  aLaProchaineImage = new Map();
  let demandes = 0;
  vi.stubGlobal("requestAnimationFrame", (rappel: FrameRequestCallback) => {
    aLaProchaineImage.set(++demandes, rappel);
    return demandes;
  });
  vi.stubGlobal("cancelAnimationFrame", (demande: number) => aLaProchaineImage.delete(demande));
  // jsdom ne sait pas capturer un pointeur : la carte peut le lui demander, sans effet.
  HTMLCanvasElement.prototype.setPointerCapture = () => {};
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      naturalWidth = 384;
      naturalHeight = 256;
      onload: (() => void) | null = null;
      constructor() {
        images.push(this);
      }
    },
  );
  const reglages: Record<string, unknown> = {};
  const pinceau = new Proxy(reglages, {
    get: (_, nom: string) =>
      nom in reglages
        ? reglages[nom]
        : (...valeurs: number[]) => {
            if (nom === "moveTo") toile.departs.push([valeurs[0], valeurs[1]]);
            if (nom === "clearRect") toile.effacements++;
            if (nom === "setTransform") toile.gestes.push(`${nom} ${valeurs.join(" ")}`);
            if (nom === "fill") toile.gestes.push(`remplir ${reglages.fillStyle}`);
            if (nom === "stroke") toile.gestes.push(`border ${reglages.strokeStyle}`);
            if (nom === "drawImage") toile.gestes.push(`poser ${(valeurs[0] as unknown as { src: string }).src}`);
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
  foyers: [],
  teintes: ["inconnue"],
  cases: { q: AUTOUR.map((c) => c.q), r: AUTOUR.map((c) => c.r), teinte: AUTOUR.map(() => 0) },
};
const FONDS = ["var(--galet)"];
/** Le rayon d'une Case à l'écran : la pointe du haut d'une Case est à ce rayon au-dessus de son centre. */
const RAYON = LARGEUR_DE_CASE / Math.sqrt(3);
/** Les départs des tracés, chacun une fois : celui de l'hexagone d'une Case est son sommet du haut. */
const departs = () => new Set(toile.departs.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`));
/** Le sommet du haut d'une Case, à l'écran tel qu'il est. */
const sommet = (c: { q: number; r: number }) => {
  const { x, y } = aLEcran(c, vueSurLeFoyer(FOYER, ecran.largeur, ecran.hauteur));
  return `${x.toFixed(6)},${(y - RAYON).toFixed(6)}`;
};
const toutesTracees = () => AUTOUR.every((c) => departs().has(sommet(c)));
const auMilieuDeLEcran = () => departs().has(`${(ecran.largeur / 2).toFixed(6)},${(ecran.hauteur / 2 - RAYON).toFixed(6)}`);
/** Si une Case est dessinée là où une vue la met (le Foyer par défaut) : le sommet du haut de son hexagone est un départ de tracé. */
const dessineeLa = (vue: Vue, c = FOYER) => {
  const { x, y } = aLEcran(c, vue);
  return departs().has(`${x.toFixed(6)},${(y - vue.rayon).toFixed(6)}`);
};
/** La vue à l'ouverture de la carte. */
const ouverte = () => vueSurLeFoyer(FOYER, ecran.largeur, ecran.hauteur);
/** Lance ce que la carte a demandé de faire à la prochaine image de l'écran, en oubliant les tracés d'avant. */
const prochaineImage = () =>
  act(() => {
    const rappels = [...aLaProchaineImage.values()];
    aLaProchaineImage.clear();
    toile.departs = [];
    for (const rappel of rappels) rappel(0);
  });
/** Un pointeur qui se pose, bouge ou se lève sur la carte, en (x, y) : la souris par défaut, bouton principal. */
const pointeur = (type: "pointerdown" | "pointermove" | "pointerup", x: number, y: number, en: Partial<PointerEventInit> = {}) =>
  act(() => {
    const evenement = { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: type === "pointermove" ? -1 : 0, bubbles: true, ...en };
    document.querySelector("canvas")!.dispatchEvent(new PointerEvent(type, evenement));
  });

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
    expect(toutesTracees()).toBe(true);
    expect(auMilieuDeLEcran()).toBe(true);
  });

  it("se redessine quand l'écran change de taille, le Foyer toujours au milieu", () => {
    const { container } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    Object.assign(ecran, { largeur: 375, hauteur: 559 });
    vi.stubGlobal("devicePixelRatio", 3);
    toile.departs = [];
    act(() => suivi!.annoncer());
    expect([container.querySelector("canvas")!.width, container.querySelector("canvas")!.height]).toEqual([1125, 1677]);
    expect(toutesTracees()).toBe(true);
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
    expect(toile.gestes.slice(1, 6)).toEqual([
      "remplir var(--biome-prairie)",
      "remplir var(--biome-eau)",
      // La prairie a un motif sombre, la mer un motif clair.
      "border color-mix(in oklch, var(--encre) 26%, transparent)",
      "border color-mix(in oklch, var(--ivoire) 45%, transparent)",
      "border color-mix(in oklch, var(--encre) 14%, transparent)",
    ]);
  });
});

describe("son Foyer sur la carte (US-0419)", () => {
  it("charge l'illustration de la hutte du chef, celle de l'écran du Foyer, en petit", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    expect(images).toHaveLength(1);
    expect(decodeURIComponent(images[0].src)).toMatch(/^\/_next\/image\?url=\/illustrations\/foyer\/prairie\.webp&w=\d+&q=\d+$/);
    expect(Number(images[0].src.match(/&w=(\d+)/)![1])).toBeLessThanOrEqual(384);
  });

  it("marque son Foyer d'un repère citron cerné d'Encre dès l'ouverture, puis y pose la hutte une fois chargée", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    expect(toile.gestes.slice(-3)).toEqual(["remplir var(--citron)", "border var(--encre)", "remplir var(--encre)"]);
    expect(toile.gestes.filter((g) => g.startsWith("poser"))).toEqual([]);
    toile.gestes = [];
    act(() => images[0].onload!());
    expect(toile.gestes.filter((g) => g.startsWith("poser"))).toEqual([`poser ${images[0].src}`]);
    expect(toile.gestes.slice(-3)).toEqual(["remplir var(--citron)", "border var(--encre)", "remplir var(--encre)"]);
  });

  it("marque les Foyers des autres joueurs d'Encre, sans hutte ni repère de plus", () => {
    render(<CarteDuJeu carte={{ ...CARTE, foyers: [AUTOUR[1], AUTOUR[4]] }} fonds={FONDS} />);
    toile.gestes = [];
    act(() => images[0].onload!());
    // Un remplissage d'Encre pour les deux autres Foyers, un pour l'œil du repère ; une hutte et un repère, au sien.
    expect(toile.gestes.filter((g) => g === "remplir var(--encre)")).toHaveLength(2);
    expect(toile.gestes.filter((g) => g.startsWith("poser") || g === "remplir var(--citron)")).toHaveLength(2);
  });

  it("ne dessine plus rien de la hutte une fois la page quittée", () => {
    const { unmount } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    unmount();
    expect(images[0].onload).toBeNull();
  });
});

describe("glisser la carte à la souris (US-0420)", () => {
  it("la fait suivre la souris, bouton appuyé, redessinée une fois à chaque image de l'écran", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    const effacements = toile.effacements;
    pointeur("pointerdown", 400, 300);
    pointeur("pointermove", 420, 310);
    pointeur("pointermove", 450, 280);
    // Pas un dessin par mouvement : un seul, à la prochaine image.
    expect(toile.effacements).toBe(effacements);
    expect(aLaProchaineImage.size).toBe(1);
    prochaineImage();
    expect(toile.effacements).toBe(effacements + 1);
    expect(dessineeLa(deplacer(ouverte(), 50, -20, 60))).toBe(true);
    pointeur("pointermove", 430, 300);
    pointeur("pointerup", 430, 300);
    prochaineImage();
    expect(dessineeLa(deplacer(ouverte(), 30, 0, 60))).toBe(true);
  });

  it("ne prend pas un clic pour un déplacement", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    pointeur("pointerdown", 400, 300);
    pointeur("pointermove", 402, 301);
    pointeur("pointerup", 402, 301);
    expect(aLaProchaineImage.size).toBe(0);
    expect(auMilieuDeLEcran()).toBe(true);
  });

  it("s'arrête un peu au-delà du bord du Monde : la carte reste en vue", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    // Le Foyer est au nord du Monde, sur l'anneau 57 : tirer la carte loin vers le bas, c'est aller au-delà, vers le nord.
    pointeur("pointerdown", 400, 300);
    pointeur("pointermove", 400, 100_300);
    prochaineImage();
    // Le milieu de l'écran s'est arrêté à 2 Cases au-delà de la plus éloignée de la carte : le Foyer et ses voisines restent en vue.
    expect(limiteDeLaCarte(CARTE)).toBe(60);
    const arretee = deplacer(ouverte(), 0, 100_000, 60);
    expect(arretee.milieu.r).toBeCloseTo(-60, 9);
    expect(AUTOUR.filter((c) => dessineeLa(arretee, c))).toHaveLength(7);
  });

  it("garde le même endroit au milieu quand l'écran change de taille", () => {
    render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    pointeur("pointerdown", 400, 300);
    pointeur("pointermove", 460, 260);
    prochaineImage();
    Object.assign(ecran, { largeur: 375, hauteur: 559 });
    toile.departs = [];
    act(() => suivi!.annoncer());
    expect(dessineeLa({ ...deplacer(ouverte(), 60, -40, 60), largeur: 375, hauteur: 559 })).toBe(true);
  });

  it("cesse de suivre la souris et de dessiner une fois la page quittée", () => {
    const { unmount, container } = render(<CarteDuJeu carte={CARTE} fonds={FONDS} />);
    const canvas = container.querySelector("canvas")!;
    pointeur("pointerdown", 400, 300);
    pointeur("pointermove", 450, 300);
    unmount();
    expect(aLaProchaineImage.size).toBe(0);
    canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: 500, clientY: 300, pointerId: 1, pointerType: "mouse" }));
    expect(aLaProchaineImage.size).toBe(0);
  });
});
