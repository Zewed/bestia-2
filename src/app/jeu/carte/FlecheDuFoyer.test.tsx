// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { vueSurLeFoyer } from "./dessin";
import { FlecheDuFoyer, placerLaFleche } from "./FlecheDuFoyer";
import { deplacer, flecheVersLeFoyer } from "./vue";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("style");
  document.body.innerHTML = "";
});

const FOYER = { q: 31, r: -57 };
const OUVERTE = vueSurLeFoyer(FOYER, 800, 600);
/** La vue dont le Foyer est loin, au sud-est. */
const LOIN = deplacer(OUVERTE, 3000, 2000, 1000);
/** La place de la flèche : 44 px pour le doigt, son centre à 22 px de tout. */
const MARGE = 22;

/** Un élément de la page, à la place `rect` de l'écran (gauche, haut, largeur, hauteur). */
function element(tag: string, [left, top, width, height]: number[], attributs: Record<string, string> = {}) {
  const e = document.createElement(tag);
  for (const [nom, valeur] of Object.entries(attributs)) e.setAttribute(nom, valeur);
  vi.spyOn(e, "getBoundingClientRect").mockReturnValue({ left, top, width, height, right: left + width, bottom: top + height } as DOMRect);
  document.body.append(e);
  return e;
}

/** La flèche, rendue seule, et la carte sous la barre du haut, de 64 pixels. */
function poser() {
  const ref = createRef<HTMLButtonElement>();
  const revenir = vi.fn();
  render(<FlecheDuFoyer ref={ref} revenir={revenir} />);
  return { fleche: ref.current!, toile: element("canvas", [0, 64, 800, 600]), revenir };
}
/** La place de la flèche, telle que vue.ts la calcule, en style. */
const enStyle = (ou: { x: number; y: number; angle: number } | null) => `translate(${ou!.x}px, ${ou!.y}px) rotate(${ou!.angle}rad)`;

describe("la flèche du Foyer (US-0426)", () => {
  it("est cachée d'abord, hors du clavier et des lecteurs d'écran, qui ont le bouton du Foyer ; la toucher ramène au Foyer", async () => {
    const { fleche, revenir } = poser();
    expect(fleche.tagName).toBe("BUTTON");
    expect(fleche.hidden).toBe(true);
    expect(fleche.tabIndex).toBe(-1);
    expect(fleche.getAttribute("aria-hidden")).toBe("true");
    fleche.hidden = false;
    await userEvent.setup().click(fleche);
    expect(revenir).toHaveBeenCalledTimes(1);
  });

  it("se pose au bord de la carte, tournée vers le Foyer, quand il est hors de l'écran, et disparaît quand il revient", () => {
    const { fleche, toile } = poser();
    placerLaFleche(fleche, toile, LOIN, FOYER);
    expect(fleche.hidden).toBe(false);
    expect(fleche.style.transform).toBe(enStyle(flecheVersLeFoyer(LOIN, FOYER, [], MARGE)));
    placerLaFleche(fleche, toile, OUVERTE, FOYER);
    expect(fleche.hidden).toBe(true);
  });

  it("évite ce qui se déclare posé sur la carte, à sa place sur la carte, et pas ce qui n'a pas de place", () => {
    const { fleche, toile } = poser();
    // Les boutons de la carte, en bas à droite, sous la barre du haut ; une légende fermée, sans place.
    element("div", [744, 64 + 400, 44, 148], { "data-sur-la-carte": "" });
    element("div", [0, 0, 0, 0], { "data-sur-la-carte": "" });
    placerLaFleche(fleche, toile, LOIN, FOYER);
    expect(fleche.style.transform).toBe(enStyle(flecheVersLeFoyer(LOIN, FOYER, [{ gauche: 744, haut: 400, droite: 788, bas: 548 }], MARGE)));
    expect(fleche.style.transform).not.toBe(enStyle(flecheVersLeFoyer(LOIN, FOYER, [], MARGE)));
  });

  it("reste au-dessus du panneau ouvert en bas sur mobile, d'après la hauteur qu'il publie, le plus haut des deux", () => {
    const { fleche, toile } = poser();
    document.documentElement.style.setProperty("--hauteur-legende", "180px");
    document.documentElement.style.setProperty("--hauteur-fiche", "240px");
    placerLaFleche(fleche, toile, LOIN, FOYER);
    expect(fleche.style.transform).toBe(enStyle(flecheVersLeFoyer(LOIN, FOYER, [{ gauche: 0, haut: 360, droite: 800, bas: 600 }], MARGE)));
  });
});
