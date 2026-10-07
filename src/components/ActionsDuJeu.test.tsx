import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({
  joueurConnecte: vi.fn(),
  stocksALHeure: vi.fn(async () => [
    { id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "8.000000", entretienParHeure: "0.000000", sources: [] },
    { id: "vegetaux", nom: "Végétaux", famille: "nourriture", quantite: "1999.800000", limite: "1000.000000", parHeure: "14.000000", entretienParHeure: "0.000000", sources: [] },
    { id: "bois", nom: "Bois", famille: "materiaux", quantite: "12500.400000", limite: "1000.000000", parHeure: "4.000000", entretienParHeure: "0.000000", sources: [] },
    { id: "pierre", nom: "Pierre", famille: "materiaux", quantite: "0.999999", limite: "1000.000000", parHeure: "4.000000", entretienParHeure: "0.000000", sources: [] },
  ]),
  habitantsALHeure: vi.fn(async () => 3),
  recitsNonLusALHeure: vi.fn(async () => 0),
  voyageursALHeure: vi.fn(async () => 0),
  sansMetierALHeure: vi.fn(async () => 0),
}));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/comptes/deconnexion", () => ({ seDeconnecter: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => "/jeu/habitants" }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import { ActionsDuJeu } from "./ActionsDuJeu";

describe("actions du joueur dans la barre, sur les pages du jeu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.joueurConnecte.mockReset();
    garde.stocksALHeure.mockClear();
    garde.habitantsALHeure.mockClear();
    garde.recitsNonLusALHeure.mockClear();
    garde.voyageursALHeure.mockClear();
    garde.sansMetierALHeure.mockClear();
  });
  const joueur = (chef: { nomDeChef: string | null; territoireId?: number | null; recitLu?: boolean }) =>
    garde.joueurConnecte.mockResolvedValue({ compte: { id: 7, email: "nom@exemple.fr" }, territoireId: null, recitLu: false, ...chef });

  const rendu = async () => {
    const element = await ActionsDuJeu();
    return element ? renderToStaticMarkup(element) : "";
  };

  it("montre le nom de chef, qui ouvre le menu (US-0140)", async () => {
    joueur({ nomDeChef: "Ourse" });
    const html = await rendu();
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*>.*Ourse/);
    expect(html).not.toContain("nom@exemple.fr");
  });

  it("garde « Se déconnecter » seul tant que le joueur n'a pas de nom", async () => {
    joueur({ nomDeChef: null });
    expect(await rendu()).toMatch(/<button[^>]*>Se déconnecter<\/button>/);
  });

  it("montre ses quatre ressources, dans l'ordre, avant son nom, une fois entré dans son Foyer (US-0203)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const html = await rendu();
    expect(garde.stocksALHeure).toHaveBeenCalledWith(12);
    const ressources = [...html.matchAll(/<img[^>]*alt="([^"]+)"[^>]*\/> <span[^>]*>([^<]+)<\/span>/g)].map((m) => [m[1], m[2]]);
    expect(ressources).toEqual([
      ["Viande", "100"],
      ["Végétaux", "1\u00a0999"],
      ["Bois", "12\u00a0500"],
      ["Pierre", "0"],
    ]);
    expect(html).toMatch(/<div[^>]*aria-label="Ressources"/);
    expect(html.indexOf("Ressources")).toBeLessThan(html.indexOf("Ourse"));
  });

  it("ne les montre pas avant le récit d'arrivée, ni sans Territoire", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    expect(await rendu()).not.toContain("Ressources");
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: false });
    expect(await rendu()).not.toContain("Ressources");
    expect(garde.stocksALHeure).not.toHaveBeenCalled();
  });

  it("compte ses Habitants juste après ses ressources, dans la même bande, en lien vers leur page (US-0304)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const html = await rendu();
    expect(garde.habitantsALHeure).toHaveBeenCalledWith(12);
    // Le groupe des ressources se ferme, le compteur suit, la bande se ferme, puis vient le nom du chef.
    const compteur = html.match(/<\/ul><\/div><div[^>]*><a ([^>]*)><img[^>]*alt="Habitants"[^>]*\/><span[^>]*>([^<]+)<\/span><\/a><\/div><\/div><div[^>]*><button[^>]*aria-haspopup="menu"/);
    expect(compteur?.[2]).toBe("3");
    expect(compteur?.[1]).toMatch(/href="\/jeu\/habitants"/);
    expect(compteur?.[1]).toMatch(/aria-label="3 Habitants"/);
  });

  it("ne compte pas ses Habitants avant le récit d'arrivée, ni sans Territoire (US-0304)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    expect(await rendu()).not.toContain("Habitant");
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: true });
    expect(await rendu()).not.toContain("Habitant");
    joueur({ nomDeChef: null });
    expect(await rendu()).not.toContain("Habitant");
    expect(garde.habitantsALHeure).not.toHaveBeenCalled();
  });

  it("pose la navigation du jeu, à côté du logo, une fois entré dans son Foyer (US-0302)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const html = await rendu();
    const nav = html.match(/<nav[^>]*>(.*?)<\/nav>/)?.[1] ?? "";
    const liens = [...nav.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map((m) => [m[2].replace(/<[^>]+>/g, ""), m[1].match(/href="([^"]+)"/)?.[1], /aria-current="page"/.test(m[1])]);
    expect(liens).toEqual([
      ["Foyer", "/jeu", false],
      ["Habitants", "/jeu/habitants", true],
      ["Récits", "/jeu/recits", false],
    ]);
    expect(html.indexOf("<nav")).toBeLessThan(html.indexOf("Ressources"));
  });

  it("compte ses Récits non lus sur l'entrée « Récits » de la navigation (US-0324)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    garde.recitsNonLusALHeure.mockResolvedValueOnce(2);
    const html = await rendu();
    expect(garde.recitsNonLusALHeure).toHaveBeenCalledWith(12);
    const recits = html.match(/<a ([^>]*href="\/jeu\/recits"[^>]*)>(.*?)<\/a>/);
    expect(recits?.[1]).toMatch(/aria-label="Récits, 2 non lus"/);
    expect(recits?.[2]).toMatch(/^<span[^>]*>Récits<\/span><span[^>]*aria-hidden="true"[^>]*>2<\/span>$/);
  });

  it("ne compte pas ses Récits avant le récit d'arrivée, ni sans Territoire (US-0324)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    await rendu();
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: true });
    await rendu();
    joueur({ nomDeChef: null });
    await rendu();
    expect(garde.recitsNonLusALHeure).not.toHaveBeenCalled();
  });

  it("signale sur l'entrée « Habitants » de la navigation les Voyageurs qui attendent aux portes (US-0332)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    garde.voyageursALHeure.mockResolvedValueOnce(2);
    const html = await rendu();
    expect(garde.voyageursALHeure).toHaveBeenCalledWith(12);
    const habitants = html.match(/<a ([^>]*href="\/jeu\/habitants"[^>]*)>(.*?)<\/a>/);
    expect(habitants?.[1]).toMatch(/aria-label="Habitants, 2 Voyageurs attendent"/);
    expect(habitants?.[2]).toMatch(/^<span[^>]*>Habitants<\/span><span[^>]*aria-hidden="true"[^>]*><\/span>$/);
  });

  it("dessine le repère en petit point citron, le même dans la barre sur ordinateur et dans l'onglet sur mobile (US-0332)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const repere = css.match(/\n\.repere \{([^}]*)\}/)?.[1] ?? "";
    expect(repere).toContain("background: var(--citron);");
    expect(repere).toContain("border-radius: 999px;");
    expect(repere).toMatch(/width: 8px;[^}]*height: 8px;/);
    // Rien ne le cache ni ne le change sur mobile : il suit le nom de l'onglet.
    expect(css.slice(css.indexOf("@media (max-width: 820px)"))).not.toContain(".repere");
  });

  it("ne met pas de repère quand personne n'attend aux portes (US-0332)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const html = await rendu();
    expect(html.match(/<a ([^>]*href="\/jeu\/habitants"[^>]*)>(.*?)<\/a>/)?.[2]).toMatch(/^<span[^>]*>Habitants<\/span>$/);
  });

  it("signale du même repère sur l'entrée « Habitants » les Habitants sans Métier, comptés avec le reste (US-0313)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    garde.sansMetierALHeure.mockResolvedValueOnce(2);
    garde.voyageursALHeure.mockResolvedValueOnce(1);
    const html = await rendu();
    expect(garde.sansMetierALHeure).toHaveBeenCalledWith(12);
    const habitants = html.match(/<a ([^>]*href="\/jeu\/habitants"[^>]*)>(.*?)<\/a>/);
    expect(habitants?.[1]).toMatch(/aria-label="Habitants, 2 sans Métier, un Voyageur attend"/);
    expect(habitants?.[2]).toMatch(/^<span[^>]*>Habitants<\/span><span[^>]*aria-hidden="true"[^>]*><\/span>$/);
  });

  it("lit les Habitants sans Métier en même temps que les Stocks, les Habitants, les Récits et les Voyageurs (US-0313)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const lectures: string[] = [];
    let finir = () => {};
    garde.stocksALHeure.mockImplementationOnce(async () => {
      lectures.push("stocks");
      await new Promise<void>((fin) => (finir = fin));
      return [];
    });
    garde.sansMetierALHeure.mockImplementationOnce(async () => (lectures.push("sans Métier"), 0));
    const rendue = rendu();
    await vi.waitFor(() => expect(lectures).toEqual(["stocks", "sans Métier"]));
    finir();
    await rendue;
  });

  it("ne compte pas les Habitants sans Métier avant le récit d'arrivée, ni sans Territoire (US-0313)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    await rendu();
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: true });
    await rendu();
    joueur({ nomDeChef: null });
    await rendu();
    expect(garde.sansMetierALHeure).not.toHaveBeenCalled();
  });

  it("ne compte pas les Voyageurs avant le récit d'arrivée, ni sans Territoire (US-0332)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    await rendu();
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: true });
    await rendu();
    joueur({ nomDeChef: null });
    await rendu();
    expect(garde.voyageursALHeure).not.toHaveBeenCalled();
  });

  it("n'a pas de navigation sans Territoire, avant le récit d'arrivée, ni sans nom de chef (US-0302)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    expect(await rendu()).not.toContain("<nav");
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: false });
    expect(await rendu()).not.toContain("<nav");
    joueur({ nomDeChef: null });
    expect(await rendu()).not.toContain("<nav");
  });

  it("ne montre rien sans session", async () => {
    garde.joueurConnecte.mockResolvedValue(null);
    expect(await rendu()).toBe("");
  });

  it("ne montre rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await rendu()).toBe("");
    expect(garde.joueurConnecte).not.toHaveBeenCalled();
  });
});
