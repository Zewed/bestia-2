// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { suivreLesGestes, type Commandes } from "./gestes";

/** La carte à l'écran, et ce que les gestes lui ont demandé. */
let carte: HTMLElement;
let commandes: { [nom in keyof Commandes]: Mock<Commandes[nom]> };
let arreter: () => void;

beforeEach(() => {
  carte = document.createElement("canvas");
  document.body.append(carte);
  // jsdom ne sait pas capturer un pointeur : on retient seulement qu'on le lui a demandé.
  carte.setPointerCapture = vi.fn();
  commandes = { deplacer: vi.fn() };
  arreter = suivreLesGestes(carte, commandes);
});
afterEach(() => {
  arreter();
  carte.remove();
});

/** Un pointeur qui se pose, bouge ou se lève sur la carte, en (x, y) dans la page : la souris par défaut, bouton principal. */
function pointeur(type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel", x: number, y: number, en: Partial<PointerEventInit> = {}) {
  const evenement = new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: type === "pointermove" ? -1 : 0, bubbles: true, cancelable: true, ...en });
  carte.dispatchEvent(evenement);
  return evenement;
}
/** Les déplacements demandés à la carte, en pixels. */
const deplacements = () => commandes.deplacer.mock.calls.map(([dx, dy]) => [dx, dy]);

describe("glisser la carte à la souris (US-0420)", () => {
  it("la déplace d'autant que la souris, bouton appuyé, à chaque mouvement", () => {
    pointeur("pointerdown", 100, 100);
    pointeur("pointermove", 110, 104);
    pointeur("pointermove", 115, 90);
    pointeur("pointerup", 115, 90);
    expect(deplacements()).toEqual([
      [10, 4],
      [5, -14],
    ]);
    // Le bouton relâché, la souris ne la déplace plus.
    pointeur("pointermove", 200, 200);
    expect(deplacements()).toHaveLength(2);
  });

  it("garde la souris même quand elle sort de la carte pendant le glissement", () => {
    pointeur("pointerdown", 100, 100);
    expect(carte.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("ne prend pas un clic pour un déplacement, même si la main tremble un peu", () => {
    pointeur("pointerdown", 100, 100);
    pointeur("pointermove", 102, 101);
    pointeur("pointermove", 97, 102);
    pointeur("pointerup", 97, 102);
    expect(deplacements()).toEqual([]);
  });

  it("une fois le seuil passé, la déplace depuis le point où le bouton a été appuyé : la carte reste sous la souris", () => {
    pointeur("pointerdown", 100, 100);
    pointeur("pointermove", 102, 101);
    pointeur("pointermove", 106, 100);
    pointeur("pointermove", 107, 100);
    expect(deplacements()).toEqual([
      [6, 0],
      [1, 0],
    ]);
  });

  it("ne glisse qu'au bouton principal", () => {
    pointeur("pointerdown", 100, 100, { button: 2 });
    pointeur("pointermove", 150, 150);
    expect(deplacements()).toEqual([]);
  });

  it("cesse de suivre la souris une fois la page quittée", () => {
    arreter();
    pointeur("pointerdown", 100, 100);
    pointeur("pointermove", 150, 150);
    expect(deplacements()).toEqual([]);
  });
});
