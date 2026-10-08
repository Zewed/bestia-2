// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordonnees } from "@/monde/hex";
import type { Fiche } from "@/monde/fiche";
import { ZONE_COEUR, ZONE_COURONNE } from "@/monde/zones";
import { CARTE_FICHE_FERMETURE_PIXELS } from "@/reglages";
import { type Choix, FicheDeLaCase, useFicheDeLaCase } from "./FicheDeLaCase";
import { LEGENDE_MONTREE } from "./Legende";

/** Les fiches demandées au serveur : chacune attend qu'on lui réponde, ou qu'on échoue. */
let demandes: { q: number; r: number; repondre: (fiche: Fiche | null) => void; echouer: () => void }[] = [];
const serveur = vi.hoisted(() => ({ ficheDeLaCase: vi.fn() }));
vi.mock("./actions", () => serveur);

/** Le suivi de taille de la fiche : le dernier posé, pour annoncer un changement de taille comme le navigateur. */
let suivi: { annoncer: () => void; arrete: boolean } | null = null;

beforeEach(() => {
  demandes = [];
  serveur.ficheDeLaCase.mockImplementation(
    (q: number, r: number) =>
      new Promise<Fiche | null>((repondre, echouer) => {
        demandes.push({ q, r, repondre, echouer: () => echouer(new Error("Le serveur ne répond pas.")) });
      }),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(rappel: () => void) {
        suivi = { annoncer: rappel, arrete: false };
      }
      observe() {
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
  serveur.ficheDeLaCase.mockReset();
  suivi = null;
});

const ICI = { q: 3, r: -5 };
/** La fiche d'une forêt libre, entre la Couronne et le Cœur sauvage, à 7 Cases du Foyer. */
const FORET: Fiche = { ...ICI, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 7 };
/** La fiche de la Case, telle que la carte la montre. */
const fiche = () => screen.queryByRole("region", { name: "Fiche de la Case" });

/**
 * La carte et la fiche de sa Case choisie, la carte glissant au besoin (`montrer`), avec un bouton pour choisir chaque
 * Case, et un pour toucher la carte hors de ses Cases.
 */
function Carte({ montrer = () => {}, cases = [ICI] }: { montrer?: (c: Coordonnees, cache: { x: number; y: number; largeur: number; hauteur: number }) => void; cases?: Coordonnees[] }) {
  const { choix, choisir, fermer } = useFicheDeLaCase();
  const carte = useRef<HTMLCanvasElement>(null);
  return (
    <>
      <canvas ref={carte} tabIndex={0} />
      {cases.map((c) => (
        <button key={`${c.q},${c.r}`} type="button" onClick={() => choisir(c)}>
          {`${c.q},${c.r}`}
        </button>
      ))}
      <button type="button" onClick={() => choisir(null)}>
        dehors
      </button>
      {choix ? <FicheDeLaCase choix={choix} carte={carte} montrer={montrer} fermer={fermer} /> : null}
    </>
  );
}
/** Touche la Case (q, r) sur la carte d'essai. */
const toucher = (c: Coordonnees) => act(() => screen.getByRole("button", { name: `${c.q},${c.r}` }).click());
/** La réponse du serveur à la demande n° i (la dernière par défaut). */
const repondre = (fiche: Fiche | null, i = demandes.length - 1) => act(async () => demandes[i].repondre(fiche));

describe("la fiche d'une Case (US-0428)", () => {
  it("dit le Biome de la Case et à qui elle est : « Libre », « Votre Foyer » ou le nom du chef", () => {
    const choix = (f: Fiche): Choix => ({ case: ICI, fiche: f, echec: false });
    const carte = { current: null };
    const { rerender } = render(<FicheDeLaCase choix={choix(FORET)} carte={carte} montrer={() => {}} fermer={() => {}} />);
    expect(screen.getByRole("heading", { name: "Forêt" })).toBeTruthy();
    expect(fiche()!.textContent).toContain("Libre");
    rerender(<FicheDeLaCase choix={choix({ ...FORET, biome: "Prairie", chef: "Ourse", aVous: true })} carte={carte} montrer={() => {}} fermer={() => {}} />);
    expect(screen.getByRole("heading", { name: "Prairie" })).toBeTruthy();
    expect(fiche()!.textContent).toContain("Votre Foyer");
    expect(fiche()!.textContent).not.toContain("Ourse");
    rerender(<FicheDeLaCase choix={choix({ ...FORET, biome: "Lac", chef: "Loutre" })} carte={carte} montrer={() => {}} fermer={() => {}} />);
    expect(screen.getByRole("heading", { name: "Lac" })).toBeTruthy();
    expect(fiche()!.textContent).toContain("Loutre");
    expect(fiche()!.textContent).not.toContain("Libre");
  });

  it("s'ouvre aussitôt la Case touchée, et se remplit à la réponse du serveur, qui reçoit la Case seule", async () => {
    render(<Carte />);
    expect(fiche()).toBeNull();
    toucher(ICI);
    expect(serveur.ficheDeLaCase).toHaveBeenCalledExactlyOnceWith(3, -5);
    // En attendant, la fiche est là, vide, et le dit aux lecteurs d'écran.
    expect(fiche()!.getAttribute("aria-busy")).toBe("true");
    expect(fiche()!.textContent).toBe("");
    await repondre(FORET);
    expect(fiche()!.getAttribute("aria-busy")).toBe("false");
    expect(screen.getByRole("heading", { name: "Forêt" })).toBeTruthy();
  });

  it("ne redemande pas la fiche de la Case déjà choisie ; une autre Case la remplace", async () => {
    const autre = { q: 4, r: -5 };
    render(<Carte cases={[ICI, autre]} />);
    toucher(ICI);
    await repondre(FORET);
    toucher(ICI);
    expect(serveur.ficheDeLaCase).toHaveBeenCalledTimes(1);
    toucher(autre);
    expect(serveur.ficheDeLaCase).toHaveBeenLastCalledWith(4, -5);
    expect(screen.queryByRole("heading")).toBeNull();
    await repondre({ ...FORET, ...autre, biome: "Désert" });
    expect(screen.getAllByRole("region", { name: "Fiche de la Case" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Désert" })).toBeTruthy();
  });

  it("se referme si le serveur ne connaît pas la Case dans le Monde du joueur", async () => {
    render(<Carte />);
    toucher(ICI);
    await repondre(null);
    expect(fiche()).toBeNull();
  });

  it("dit quand elle n'a pas pu s'ouvrir, et se redemande en touchant la Case de nouveau", async () => {
    render(<Carte />);
    toucher(ICI);
    await act(async () => demandes[0].echouer());
    expect(fiche()!.textContent).toBe("La fiche n'a pas pu s'ouvrir.");
    toucher(ICI);
    expect(serveur.ficheDeLaCase).toHaveBeenCalledTimes(2);
    await repondre(FORET);
    expect(screen.getByRole("heading", { name: "Forêt" })).toBeTruthy();
  });

  it("demande à la carte de montrer la Case hors de la fiche, à l'ouverture, à chaque Case et quand la fiche change de taille", async () => {
    const montrer = vi.fn();
    const autre = { q: 4, r: -5 };
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 64, width: 800, height: 600 } as DOMRect);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 12, top: 76, width: 300, height: 120 } as DOMRect);
    render(<Carte montrer={montrer} cases={[ICI, autre]} />);
    toucher(ICI);
    // La fiche en pixels de la carte, depuis son coin en haut à gauche.
    expect(montrer).toHaveBeenLastCalledWith(ICI, { x: 12, y: 12, largeur: 300, hauteur: 120 });
    toucher(autre);
    expect(montrer).toHaveBeenLastCalledWith(autre, { x: 12, y: 12, largeur: 300, hauteur: 120 });
    montrer.mockClear();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 12, top: 76, width: 300, height: 200 } as DOMRect);
    await repondre({ ...FORET, ...autre });
    act(() => suivi!.annoncer());
    expect(montrer).toHaveBeenLastCalledWith(autre, { x: 12, y: 12, largeur: 300, hauteur: 200 });
  });

  it("cesse de suivre sa taille une fois fermée", async () => {
    render(<Carte />);
    toucher(ICI);
    await repondre(null);
    expect(suivi!.arrete).toBe(true);
  });
});

describe("situer la Case dans le Monde depuis sa fiche (US-0429)", () => {
  /** Le texte de la fiche de `f`, déjà donnée par le serveur. */
  const texte = (f: Partial<Fiche>) => {
    render(<FicheDeLaCase choix={{ case: ICI, fiche: { ...FORET, ...f }, echec: false }} carte={{ current: null }} montrer={() => {}} fermer={() => {}} />);
    const contenu = fiche()!.textContent!;
    cleanup();
    return contenu;
  };

  it("dit si la Case est de la Couronne, du Cœur sauvage, ou entre les deux", () => {
    expect(texte({ zone: ZONE_COURONNE })).toContain("Couronne");
    expect(texte({ zone: ZONE_COURONNE })).not.toContain("Cœur");
    expect(texte({ zone: ZONE_COEUR })).toContain("Cœur sauvage");
    expect(texte({ zone: ZONE_COEUR })).not.toContain("Couronne");
    expect(texte({ zone: 0 })).toContain("Entre la Couronne et le Cœur sauvage");
  });

  it("donne la distance de la Case au Foyer, en Cases ; rien de plus pour le Foyer lui-même", () => {
    expect(texte({ distance: 7 })).toContain("À 7 Cases de votre Foyer");
    expect(texte({ distance: 1 })).toContain("À 1 Case de votre Foyer");
    expect(texte({ distance: 0, aVous: true })).not.toMatch(/Cases? de votre Foyer/);
  });

  it("dit, d'une Case du Cœur sauvage seulement, que les Espèces les plus rares y vivent", () => {
    expect(texte({ zone: ZONE_COEUR })).toContain("Les Espèces les plus rares vivent ici.");
    expect(texte({ zone: ZONE_COURONNE })).not.toContain("Espèces");
    expect(texte({ zone: 0 })).not.toContain("Espèces");
  });
});

describe("fermer la fiche d'une Case (US-0430)", () => {
  const croix = () => screen.getByRole("button", { name: "Fermer la fiche" });
  const carte = () => document.querySelector("canvas")!;
  const echap = () => act(() => void document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));

  it("se ferme par sa croix, même en attendant le serveur, et rend la main à la carte", async () => {
    render(<Carte />);
    toucher(ICI);
    act(() => croix().click());
    expect(fiche()).toBeNull();
    expect(document.activeElement).toBe(carte());
    toucher(ICI);
    await repondre(FORET);
    act(() => croix().click());
    expect(fiche()).toBeNull();
  });

  it("se ferme à Échap, sur la carte ou dans la fiche, et rend la main à la carte", async () => {
    render(<Carte />);
    toucher(ICI);
    await repondre(FORET);
    act(() => croix().focus());
    echap();
    expect(fiche()).toBeNull();
    expect(document.activeElement).toBe(carte());
    toucher(ICI);
    act(() => carte().focus());
    echap();
    expect(fiche()).toBeNull();
    expect(document.activeElement).toBe(carte());
  });

  it("laisse Échap à ce qui a le regard ailleurs dans la page, comme le menu du chef", async () => {
    const ailleurs = document.body.appendChild(document.createElement("button"));
    render(<Carte />);
    toucher(ICI);
    act(() => ailleurs.focus());
    echap();
    expect(fiche()).not.toBeNull();
    expect(document.activeElement).toBe(ailleurs);
    ailleurs.remove();
  });

  it("se ferme en touchant la carte hors de ses Cases", () => {
    render(<Carte />);
    toucher(ICI);
    act(() => screen.getByRole("button", { name: "dehors" }).click());
    expect(fiche()).toBeNull();
  });

  it("ignore une réponse arrivée après qu'on a choisi une autre Case, ou fermé la fiche", async () => {
    const autre = { q: 4, r: -5 };
    render(<Carte cases={[ICI, autre]} />);
    toucher(ICI);
    toucher(autre);
    await repondre(FORET, 0);
    expect(screen.queryByRole("heading")).toBeNull();
    await repondre({ ...FORET, ...autre, biome: "Désert" }, 1);
    expect(screen.getByRole("heading", { name: "Désert" })).toBeTruthy();
    toucher(ICI);
    act(() => croix().click());
    await repondre(FORET, 2);
    expect(fiche()).toBeNull();
  });
});

describe("lire la fiche d'une Case sur mobile (US-0431)", () => {
  beforeEach(() => {
    // jsdom ne sait pas capturer un pointeur : la fiche peut le lui demander, sans effet.
    HTMLElement.prototype.setPointerCapture = () => {};
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 420, width: 390, height: 180 } as DOMRect);
  });
  afterEach(() => document.documentElement.style.removeProperty("--hauteur-fiche"));
  /** La fiche ouverte sur un téléphone : la feuille de style la pose en bas de l'écran, en position fixe. */
  const ouvrirEnBas = async () => {
    render(<Carte />);
    toucher(ICI);
    await repondre(FORET);
    fiche()!.style.position = "fixed";
    act(() => suivi!.annoncer());
  };
  /** Un pointeur qui se pose, bouge ou se lève sur la fiche, à la hauteur y : le doigt par défaut. */
  const pointeur = (type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel", y: number, cible: Element = fiche()!) =>
    act(() => void cible.dispatchEvent(new PointerEvent(type, { clientX: 200, clientY: y, pointerId: 3, pointerType: "touch", button: type === "pointermove" ? -1 : 0, bubbles: true })));
  const hauteurPubliee = () => document.documentElement.style.getPropertyValue("--hauteur-fiche");

  it("dit sa hauteur aux boutons de la carte tant qu'elle est ouverte en bas de l'écran, et plus du tout une fois fermée", async () => {
    await ouvrirEnBas();
    expect(hauteurPubliee()).toBe("180px");
    act(() => screen.getByRole("button", { name: "Fermer la fiche" }).click());
    expect(hauteurPubliee()).toBe("");
  });

  it("ne la dit pas sur ordinateur, où elle flotte en haut à gauche", async () => {
    render(<Carte />);
    toucher(ICI);
    await repondre(FORET);
    act(() => suivi!.annoncer());
    expect(hauteurPubliee()).toBe("");
  });

  it("se ferme quand on la fait glisser vers le bas au-delà du seuil ; en deçà, elle revient", async () => {
    await ouvrirEnBas();
    pointeur("pointerdown", 450);
    pointeur("pointermove", 450 + CARTE_FICHE_FERMETURE_PIXELS - 10);
    // Elle suit le doigt, vers le bas seulement.
    expect(fiche()!.style.transform).toBe(`translateY(${CARTE_FICHE_FERMETURE_PIXELS - 10}px)`);
    pointeur("pointerup", 450 + CARTE_FICHE_FERMETURE_PIXELS - 10);
    expect(fiche()).not.toBeNull();
    expect(fiche()!.style.transform).toBe("");
    pointeur("pointerdown", 450);
    pointeur("pointermove", 300);
    expect(fiche()!.style.transform).toBe("translateY(0px)");
    pointeur("pointermove", 450 + CARTE_FICHE_FERMETURE_PIXELS + 10);
    pointeur("pointerup", 450 + CARTE_FICHE_FERMETURE_PIXELS + 10);
    expect(fiche()).toBeNull();
  });

  it("se ferme quand la légende se montre en bas de l'écran : un seul panneau à la fois ; pas sur ordinateur", async () => {
    const legendeMontree = () => act(() => void document.dispatchEvent(new Event(LEGENDE_MONTREE)));
    await ouvrirEnBas();
    fiche()!.style.position = "";
    legendeMontree();
    expect(fiche()).not.toBeNull();
    fiche()!.style.position = "fixed";
    legendeMontree();
    expect(fiche()).toBeNull();
    expect(hauteurPubliee()).toBe("");
  });

  it("revient quand le navigateur interrompt le geste ; sa croix et l'ordinateur ne la font pas glisser", async () => {
    await ouvrirEnBas();
    pointeur("pointerdown", 450);
    pointeur("pointermove", 450 + CARTE_FICHE_FERMETURE_PIXELS + 10);
    pointeur("pointercancel", 450 + CARTE_FICHE_FERMETURE_PIXELS + 10);
    expect(fiche()).not.toBeNull();
    expect(fiche()!.style.transform).toBe("");
    pointeur("pointerdown", 450, screen.getByRole("button", { name: "Fermer la fiche" }));
    pointeur("pointermove", 600);
    expect(fiche()!.style.transform).toBe("");
    pointeur("pointerup", 600);
    fiche()!.style.position = "";
    pointeur("pointerdown", 450);
    pointeur("pointermove", 600);
    expect(fiche()!.style.transform).toBe("");
  });
});
