// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordonnees } from "@/monde/hex";
import type { Fiche } from "@/monde/fiche";
import { ZONE_COEUR, ZONE_COURONNE } from "@/monde/zones";
import { type Choix, FicheDeLaCase, useFicheDeLaCase } from "./FicheDeLaCase";

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

/** La carte et la fiche de sa Case choisie, la carte glissant au besoin (`montrer`), avec des boutons pour choisir une Case. */
function Carte({ montrer = () => {}, cases = [ICI] }: { montrer?: (c: Coordonnees, cache: { x: number; y: number; largeur: number; hauteur: number }) => void; cases?: Coordonnees[] }) {
  const { choix, choisir } = useFicheDeLaCase();
  const carte = useRef<HTMLCanvasElement>(null);
  return (
    <>
      <canvas ref={carte} />
      {cases.map((c) => (
        <button key={`${c.q},${c.r}`} type="button" onClick={() => choisir(c)}>
          {`${c.q},${c.r}`}
        </button>
      ))}
      {choix ? <FicheDeLaCase choix={choix} carte={carte} montrer={montrer} /> : null}
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
    const { rerender } = render(<FicheDeLaCase choix={choix(FORET)} carte={carte} montrer={() => {}} />);
    expect(screen.getByRole("heading", { name: "Forêt" })).toBeTruthy();
    expect(fiche()!.textContent).toContain("Libre");
    rerender(<FicheDeLaCase choix={choix({ ...FORET, biome: "Prairie", chef: "Ourse", aVous: true })} carte={carte} montrer={() => {}} />);
    expect(screen.getByRole("heading", { name: "Prairie" })).toBeTruthy();
    expect(fiche()!.textContent).toContain("Votre Foyer");
    expect(fiche()!.textContent).not.toContain("Ourse");
    rerender(<FicheDeLaCase choix={choix({ ...FORET, biome: "Lac", chef: "Loutre" })} carte={carte} montrer={() => {}} />);
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
    render(<FicheDeLaCase choix={{ case: ICI, fiche: { ...FORET, ...f }, echec: false }} carte={{ current: null }} montrer={() => {}} />);
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
