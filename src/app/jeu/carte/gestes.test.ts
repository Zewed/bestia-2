// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { SEUIL_DE_GLISSEMENT, suivreLesGestes, type Commandes } from "./gestes";

/** La carte à l'écran, et ce que les gestes lui ont demandé. */
let carte: HTMLElement;
let commandes: { [nom in keyof Commandes]: Mock<Commandes[nom]> };
let arreter: () => void;

beforeEach(() => {
  carte = document.createElement("canvas");
  document.body.append(carte);
  // jsdom ne sait pas capturer un pointeur : on retient seulement qu'on le lui a demandé.
  carte.setPointerCapture = vi.fn();
  commandes = { deplacer: vi.fn(), avancer: vi.fn(), zoomer: vi.fn() };
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

describe("glisser la carte au doigt (US-0421)", () => {
  const doigt = { pointerType: "touch", pointerId: 7 };

  it("la déplace d'autant que le doigt, à chaque mouvement", () => {
    pointeur("pointerdown", 200, 300, doigt);
    pointeur("pointermove", 190, 280, doigt);
    pointeur("pointermove", 150, 260, doigt);
    pointeur("pointerup", 150, 260, doigt);
    expect(deplacements()).toEqual([
      [-10, -20],
      [-40, -20],
    ]);
    expect(carte.setPointerCapture).toHaveBeenCalledWith(7);
  });

  it("ne prend pas un toucher bref pour un déplacement : un doigt bouge plus qu'une souris en se posant", () => {
    expect(SEUIL_DE_GLISSEMENT.doigt).toBeGreaterThan(SEUIL_DE_GLISSEMENT.souris);
    pointeur("pointerdown", 200, 300, doigt);
    pointeur("pointermove", 205, 304, doigt);
    pointeur("pointerup", 205, 304, doigt);
    expect(deplacements()).toEqual([]);
    // La même hésitation à la souris, c'est déjà un glissement.
    pointeur("pointerdown", 200, 300);
    pointeur("pointermove", 205, 304);
    expect(deplacements()).toEqual([[5, 4]]);
  });

  it("une fois le doigt levé ou le geste interrompu par le navigateur, ne déplace plus rien", () => {
    pointeur("pointerdown", 200, 300, doigt);
    pointeur("pointermove", 230, 300, doigt);
    pointeur("pointercancel", 230, 300, doigt);
    pointeur("pointermove", 260, 300, doigt);
    expect(deplacements()).toEqual([[30, 0]]);
  });
});

describe("la carte au clavier (US-0422)", () => {
  /** Une touche appuyée sur la carte sélectionnée ; rend si le navigateur garde son effet ordinaire. */
  const touche = (key: string, en: KeyboardEventInit = {}) => carte.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...en }));
  const pas = () => commandes.avancer.mock.calls.map(([colonnes, rangees]) => [colonnes, rangees]);

  it("avance d'un pas à chaque flèche, vers l'endroit qu'elle montre, sans faire défiler la page", () => {
    expect([touche("ArrowRight"), touche("ArrowLeft"), touche("ArrowDown"), touche("ArrowUp")]).toEqual([false, false, false, false]);
    expect(pas()).toEqual([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]);
  });

  it("laisse les autres touches, et les flèches avec Alt, Ctrl ou Cmd, au navigateur", () => {
    expect([touche("Tab"), touche("a"), touche("ArrowLeft", { altKey: true }), touche("ArrowRight", { ctrlKey: true }), touche("ArrowUp", { metaKey: true })]).toEqual([true, true, true, true, true]);
    expect(pas()).toEqual([]);
  });
});

describe("zoomer à la molette ou au pavé tactile (US-0423)", () => {
  beforeEach(() => {
    // La carte sous la barre du haut : les pointeurs sont repérés depuis son coin en haut à gauche.
    carte.getBoundingClientRect = () => ({ left: 10, top: 64, width: 800, height: 600 }) as DOMRect;
  });
  /** Un tour de molette sur la carte, en (x, y) dans la page ; rend si le navigateur garde son effet ordinaire. */
  const molette = (x: number, y: number, en: WheelEventInit) => carte.dispatchEvent(new WheelEvent("wheel", { clientX: x, clientY: y, bubbles: true, cancelable: true, ...en }));
  const zooms = () => commandes.zoomer.mock.calls.map(([facteur, x, y]) => [Number(facteur.toFixed(6)), x, y]);

  it("rapproche en tournant la molette vers l'avant, éloigne vers l'arrière, autour du pointeur, d'autant plus qu'elle tourne", () => {
    molette(210, 164, { deltaY: -100 });
    molette(210, 164, { deltaY: 100 });
    molette(30, 70, { deltaY: -300 });
    expect(zooms()).toEqual([
      [Number((2 ** (1 / 3)).toFixed(6)), 200, 100],
      [Number((2 ** (-1 / 3)).toFixed(6)), 200, 100],
      [2, 20, 6],
    ]);
  });

  it("compte une molette qui tourne par lignes comme une qui tourne par pixels", () => {
    molette(210, 164, { deltaY: -3, deltaMode: WheelEvent.DOM_DELTA_LINE });
    expect(zooms()).toEqual([[Number((2 ** (120 / 300)).toFixed(6)), 200, 100]]);
  });

  it("suit le geste de zoom du pavé tactile, plus fin, que le navigateur annonce comme une molette avec Ctrl", () => {
    molette(210, 164, { deltaY: -10, ctrlKey: true });
    molette(210, 164, { deltaY: 25, ctrlKey: true });
    expect(zooms()).toEqual([
      [Number((2 ** 0.1).toFixed(6)), 200, 100],
      [Number((2 ** -0.25).toFixed(6)), 200, 100],
    ]);
  });

  it("ne laisse jamais la page zoomer ni défiler à la place", () => {
    expect([molette(210, 164, { deltaY: -100 }), molette(210, 164, { deltaY: 10, ctrlKey: true })]).toEqual([false, false]);
    // Le navigateur ne laisse empêcher son effet qu'à un écouteur qui le dit à l'avance.
    const ecouter = vi.spyOn(EventTarget.prototype, "addEventListener");
    suivreLesGestes(document.createElement("canvas"), commandes)();
    expect(ecouter).toHaveBeenCalledWith("wheel", expect.any(Function), { passive: false });
    ecouter.mockRestore();
  });

  it("suit aussi le pincement du pavé tactile sous Safari, qui l'annonce à sa façon, sans zoomer la page", () => {
    /** Un geste Safari sur la carte, à l'échelle `scale` depuis son début ; rend si le navigateur garde son effet ordinaire. */
    const geste = (type: string, scale: number) => carte.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { scale, clientX: 410, clientY: 364 }));
    expect([geste("gesturestart", 1), geste("gesturechange", 1.2), geste("gesturechange", 1.5), geste("gestureend", 1.5)]).toEqual([false, false, false, false]);
    expect(zooms()).toEqual([
      [1.2, 400, 300],
      [1.25, 400, 300],
    ]);
  });
});
