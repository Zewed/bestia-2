import { describe, expect, it } from "vitest";
import { casesDansLeRayon, type Coordonnees } from "@/monde/hex";
import { BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES, BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES } from "@/reglages";
import { casesRevelees } from "./brouillard";
import { cheminDUneExpedition } from "./chemin";
import type { HorairesDUneExpedition } from "./phase";

const MINUTE_MS = 60_000;
const DEPART = new Date("2026-10-09T07:42:00.000Z");
/** Une heure du jeu, `minutes` après le départ. */
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE_MS);

const FOYER: Coordonnees = { q: 12, r: -7 };
/** Une destination à 6 Cases à l'est du Foyer : son chemin passe par (13, -7), (14, -7)… jusqu'à (18, -7). */
const DESTINATION: Coordonnees = { q: 18, r: -7 };
const CHEMIN = cheminDUneExpedition(FOYER, DESTINATION);
/** 6 Cases au pas des explorateurs, 20 minutes chacune : 2 h d'aller, puis 4 h de séjour, puis 2 h de retour. */
const EXPEDITION: HorairesDUneExpedition = { partLe: DEPART, trajetMinutes: 120, sejourMinutes: 240 };
/** Les Cases que l'Expédition a sorties du brouillard `minutes` après son départ, sous forme de clés « q,r ». */
const a = (minutes: number, horaires = EXPEDITION) => new Set(casesRevelees(FOYER, DESTINATION, horaires, apres(minutes)).map(cle));
const cle = ({ q, r }: Coordonnees) => `${q},${r}`;
/** Les Cases à `rayon` Cases de `c` ou moins, sous forme de clés. */
const autour = (c: Coordonnees, rayon: number) => casesDansLeRayon(c, rayon).map(cle);

describe("le brouillard se lève sur le chemin (US-0914)", () => {
  it("ne se lève pas au départ : rien n'est révélé avant que l'Expédition atteigne la première Case de son chemin", () => {
    expect(a(0)).toEqual(new Set());
    expect(a(19)).toEqual(new Set());
  });

  it(`se lève à chaque Case du chemin à son passage, et sur ${BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES} Case autour d'elle, pas plus loin`, () => {
    expect(a(20)).toEqual(new Set(autour(CHEMIN[0], BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES)));
    expect(a(39)).toEqual(a(20));
    expect(a(40)).toEqual(new Set([...autour(CHEMIN[0], 1), ...autour(CHEMIN[1], 1)]));
    // La troisième Case du chemin, à deux pas de la deuxième, reste sous le brouillard tant qu'elle n'atteint pas la deuxième.
    expect(a(39).has(cle(CHEMIN[2]))).toBe(false);
    expect(a(40).has(cle(CHEMIN[2]))).toBe(true);
    expect(a(40).has(cle(CHEMIN[3]))).toBe(false);
  });

  it(`se lève à l'arrivée sur la destination et ${BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES} Cases autour d'elle`, () => {
    const avant = a(119);
    const arrivee = a(120);
    for (const c of autour(DESTINATION, BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES)) expect(arrivee.has(c)).toBe(true);
    // À deux pas au-delà de la destination, rien n'était révélé juste avant l'arrivée.
    expect(avant.has(cle({ q: 20, r: -7 }))).toBe(false);
    expect(arrivee.has(cle({ q: 20, r: -7 }))).toBe(true);
    expect(arrivee.has(cle({ q: 21, r: -7 }))).toBe(false);
    const toutLeChemin = CHEMIN.slice(0, -1).flatMap((c) => autour(c, BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES));
    expect(arrivee).toEqual(new Set([...toutLeChemin, ...autour(DESTINATION, BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES)]));
  });

  it("ne lève plus rien de neuf pendant le séjour ni au retour, ni une fois l'Expédition rentrée", () => {
    for (const minutes of [120 + 239, 120 + 240, 120 + 240 + 61, 120 + 240 + 120, 30 * 24 * 60]) expect(a(minutes)).toEqual(a(120));
  });

  it("suit l'allure de l'Expédition : une escorte plus lente lève le brouillard d'autant plus tard (US-0912)", () => {
    const lente = { ...EXPEDITION, trajetMinutes: 300 };
    expect(a(49, lente)).toEqual(new Set());
    expect(a(50, lente)).toEqual(new Set(autour(CHEMIN[0], 1)));
    expect(a(299, lente).has(cle({ q: 20, r: -7 }))).toBe(false);
    expect(a(300, lente)).toEqual(a(120));
  });

  it("ne lève rien tant que le trajet d'une escorte n'est pas chiffré (US-0912) : elle reste au Foyer", () => {
    expect(a(30 * 24 * 60, { ...EXPEDITION, trajetMinutes: null })).toEqual(new Set());
  });

  it("dit pour chaque Case l'instant où l'Expédition l'a sortie du brouillard : son premier passage d'où elle la voit", () => {
    const quand = new Map(casesRevelees(FOYER, DESTINATION, EXPEDITION, apres(30 * 24 * 60)).map((c) => [cle(c), c.le]));
    expect(quand.get(cle(CHEMIN[0]))).toEqual(apres(20));
    // La troisième Case du chemin se voit dès la deuxième.
    expect(quand.get(cle(CHEMIN[2]))).toEqual(apres(40));
    expect(quand.get(cle(DESTINATION))).toEqual(apres(100));
    expect(quand.get(cle({ q: 20, r: -7 }))).toEqual(apres(120));
    for (const le of quand.values()) expect(le.getTime()).toBeLessThanOrEqual(apres(120).getTime());
  });

  it("révèle chaque Case une seule fois", () => {
    const revelees = casesRevelees(FOYER, DESTINATION, EXPEDITION, apres(120)).map(cle);
    expect(revelees).toHaveLength(new Set(revelees).size);
  });
});
