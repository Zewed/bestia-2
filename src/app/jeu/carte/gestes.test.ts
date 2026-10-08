// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { CARTE_TOUCHER_PIXELS } from "@/reglages";
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
  commandes = { deplacer: vi.fn(), avancer: vi.fn(), zoomer: vi.fn(), toucher: vi.fn() };
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

/** Les zooms demandés à la carte : le facteur, et le point autour duquel zoomer, en pixels depuis son coin. */
const zooms = () => commandes.zoomer.mock.calls.map(([facteur, x, y]) => [Number(facteur.toFixed(6)), x, y]);
/** Un geste Safari sur la carte, à l'échelle `scale` depuis son début ; rend si le navigateur garde son effet ordinaire. */
const geste = (type: string, scale: number) => carte.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { scale, clientX: 410, clientY: 364 }));

describe("zoomer à la molette ou au pavé tactile (US-0423)", () => {
  beforeEach(() => {
    // La carte sous la barre du haut : les pointeurs sont repérés depuis son coin en haut à gauche.
    carte.getBoundingClientRect = () => ({ left: 10, top: 64, width: 800, height: 600 }) as DOMRect;
  });
  /** Un tour de molette sur la carte, en (x, y) dans la page ; rend si le navigateur garde son effet ordinaire. */
  const molette = (x: number, y: number, en: WheelEventInit) => carte.dispatchEvent(new WheelEvent("wheel", { clientX: x, clientY: y, bubbles: true, cancelable: true, ...en }));

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
    expect([geste("gesturestart", 1), geste("gesturechange", 1.2), geste("gesturechange", 1.5), geste("gestureend", 1.5)]).toEqual([false, false, false, false]);
    expect(zooms()).toEqual([
      [1.2, 400, 300],
      [1.25, 400, 300],
    ]);
  });
});

describe("zoomer en pinçant (US-0424)", () => {
  beforeEach(() => {
    carte.getBoundingClientRect = () => ({ left: 10, top: 64, width: 800, height: 600 }) as DOMRect;
  });
  const doigt = (pointerId: number) => ({ pointerType: "touch", pointerId });

  it("zoome autour du point entre les deux doigts, d'autant qu'ils s'écartent ou se rapprochent, et le suit", () => {
    pointeur("pointerdown", 100, 300, doigt(1));
    pointeur("pointerdown", 300, 300, doigt(2));
    // Le second doigt s'écarte : de 200 à 300 pixels entre eux, leur milieu passe de (200, 300) à (250, 300).
    pointeur("pointermove", 400, 300, doigt(2));
    expect(zooms()).toEqual([[1.5, 190, 236]]);
    expect(deplacements()).toEqual([[50, 0]]);
    // Le premier se rapproche : de 300 à 150 pixels, leur milieu passe à (325, 300).
    pointeur("pointermove", 250, 300, doigt(1));
    expect(zooms()).toEqual([
      [1.5, 190, 236],
      [0.5, 240, 236],
    ]);
    expect(deplacements()).toEqual([
      [50, 0],
      [75, 0],
    ]);
  });

  it("ne prend pas le pincement pour un glissement du premier doigt, et laisse le doigt qui reste glisser sans à-coup", () => {
    pointeur("pointerdown", 100, 300, doigt(1));
    pointeur("pointermove", 103, 302, doigt(1));
    pointeur("pointerdown", 300, 300, doigt(2));
    expect(deplacements()).toEqual([]);
    pointeur("pointermove", 103, 340, doigt(1));
    pointeur("pointerup", 103, 340, doigt(1));
    commandes.deplacer.mockClear();
    // Le second doigt, seul, déplace la carte dès qu'il bouge, depuis là où il est.
    pointeur("pointermove", 302, 300, doigt(2));
    expect(deplacements()).toEqual([[2, 0]]);
  });

  it("ne tient compte que de deux doigts", () => {
    pointeur("pointerdown", 100, 300, doigt(1));
    pointeur("pointerdown", 300, 300, doigt(2));
    pointeur("pointerdown", 500, 500, doigt(3));
    pointeur("pointermove", 600, 600, doigt(3));
    expect(zooms()).toEqual([]);
    expect(deplacements()).toEqual([]);
  });

  it("empêche le zoom du navigateur pendant le pincement, sans zoomer deux fois sous Safari, qui l'annonce aussi à sa façon", () => {
    pointeur("pointerdown", 100, 300, doigt(1));
    pointeur("pointerdown", 300, 300, doigt(2));
    expect([geste("gesturestart", 1), geste("gesturechange", 1.5), geste("gestureend", 1.5)]).toEqual([false, false, false]);
    expect(zooms()).toEqual([]);
  });
});

describe("toucher une Case (US-0428)", () => {
  beforeEach(() => {
    carte.getBoundingClientRect = () => ({ left: 10, top: 64, width: 800, height: 600 }) as DOMRect;
  });
  const doigt = (pointerId: number) => ({ pointerType: "touch", pointerId });
  /** Les touchers demandés à la carte, en pixels depuis son coin en haut à gauche. */
  const touchers = () => commandes.toucher.mock.calls.map(([x, y]) => [x, y]);

  it("prend un clic pour un toucher, là où le bouton a été appuyé, même si la main tremble un peu", () => {
    expect(SEUIL_DE_GLISSEMENT).toBe(CARTE_TOUCHER_PIXELS);
    pointeur("pointerdown", 110, 164);
    pointeur("pointermove", 112, 165);
    pointeur("pointerup", 113, 166);
    expect(touchers()).toEqual([[100, 100]]);
    expect(deplacements()).toEqual([]);
  });

  it(`au doigt aussi, qui bouge davantage en se posant : moins de ${CARTE_TOUCHER_PIXELS.doigt} pixels`, () => {
    pointeur("pointerdown", 210, 364, doigt(4));
    pointeur("pointermove", 215, 368, doigt(4));
    pointeur("pointerup", 215, 368, doigt(4));
    expect(touchers()).toEqual([[200, 300]]);
  });

  it("ne prend pas un glissement pour un toucher, même revenu à son point de départ", () => {
    pointeur("pointerdown", 110, 164);
    pointeur("pointermove", 150, 164);
    pointeur("pointermove", 110, 164);
    pointeur("pointerup", 110, 164);
    expect(touchers()).toEqual([]);
  });

  it("ne prend jamais un pincement pour un toucher, même sans que les doigts bougent", () => {
    pointeur("pointerdown", 110, 164, doigt(1));
    pointeur("pointerdown", 310, 164, doigt(2));
    pointeur("pointerup", 310, 164, doigt(2));
    pointeur("pointerup", 110, 164, doigt(1));
    pointeur("pointerdown", 110, 164, doigt(1));
    pointeur("pointerdown", 310, 164, doigt(2));
    pointeur("pointerup", 110, 164, doigt(1));
    pointeur("pointerup", 310, 164, doigt(2));
    expect(touchers()).toEqual([]);
  });

  it("ne prend pas pour un toucher un geste que le navigateur interrompt, ni un autre bouton que le principal", () => {
    pointeur("pointerdown", 110, 164, doigt(1));
    pointeur("pointercancel", 110, 164, doigt(1));
    pointeur("pointerdown", 110, 164, { button: 2 });
    pointeur("pointerup", 110, 164, { button: 2 });
    expect(touchers()).toEqual([]);
  });

  it("touche la Case au milieu de la carte à Entrée, la carte sélectionnée au clavier", () => {
    carte.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(touchers()).toEqual([[400, 300]]);
  });
});
