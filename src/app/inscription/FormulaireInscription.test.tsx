// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMAIL_DEJA_UTILISEE, EMAIL_INVALIDE, EMAIL_VIDE } from "@/comptes/email";
import { MOT_DE_PASSE_TROP_COURT, REGLE_MOT_DE_PASSE } from "@/comptes/mot-de-passe";
import type { EtatInscription } from "./etat";

const serveur = vi.hoisted(() => ({ inscrire: vi.fn() }));
vi.mock("./actions", () => serveur);

import { FormulaireInscription } from "./FormulaireInscription";

describe("message sous le champ e-mail", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({ erreurs: {}, email: String(donnees.get("email")) }));
  });
  afterEach(cleanup);

  const champ = () => screen.getByLabelText("Adresse e-mail");
  const message = () => document.getElementById("email-erreur")?.textContent ?? null;

  it("n'apparaît pas pendant la frappe, mais quand on quitte le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@");
    expect(message()).toBeNull();
    await u.tab();
    expect(message()).toBe(EMAIL_INVALIDE);
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    expect(champ().getAttribute("aria-describedby")).toBe("email-erreur");
  });

  it("demande l'adresse quand on quitte le champ vide", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.click(champ());
    await u.tab();
    expect(message()).toBe(EMAIL_VIDE);
  });

  it("s'efface dès qu'on recommence à écrire, et ne revient pas si l'adresse est bonne", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom.fr");
    await u.tab();
    expect(message()).toBe(EMAIL_INVALIDE);
    await u.clear(champ());
    expect(message()).toBeNull();
    await u.type(champ(), "nom@exemple.fr");
    await u.tab();
    expect(message()).toBeNull();
  });

  it("bloque l'envoi d'une adresse mal écrite, sans rien envoyer au serveur", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@");
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(message()).toBe(EMAIL_INVALIDE);
    expect(document.activeElement).toBe(champ());
    expect(serveur.inscrire).not.toHaveBeenCalled();
  });

  it("montre le refus du serveur, même quand le navigateur a laissé passer", async () => {
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({
      erreurs: { email: EMAIL_INVALIDE },
      email: String(donnees.get("email")),
    }));
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@exemple.fr");
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(serveur.inscrire).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", EMAIL_INVALIDE);
  });
});

describe("règle du mot de passe sous le champ", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({ erreurs: {}, email: String(donnees.get("email")) }));
  });
  afterEach(cleanup);

  const motDePasse = () => screen.getByLabelText("Mot de passe");
  const aide = () => document.getElementById("mot-de-passe-aide");

  it("est écrite avant qu'on se trompe, et le navigateur connaît les longueurs permises", () => {
    render(<FormulaireInscription />);
    expect(aide()?.textContent).toBe(REGLE_MOT_DE_PASSE);
    expect(motDePasse().getAttribute("aria-describedby")).toBe("mot-de-passe-aide");
    expect(motDePasse().getAttribute("minlength")).toBe("12");
    expect(motDePasse().getAttribute("passwordrules")).toBe("minlength: 12; maxlength: 128;");
  });

  it("laisse la place au message quand le mot de passe est trop court, en quittant le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(motDePasse(), "court");
    expect(aide()?.textContent).toBe(REGLE_MOT_DE_PASSE);
    await u.tab();
    expect(aide()?.textContent).toBe(MOT_DE_PASSE_TROP_COURT);
    expect(aide()?.getAttribute("role")).toBe("alert");
    await u.type(motDePasse(), "-et-plus-long");
    expect(aide()?.textContent).toBe(REGLE_MOT_DE_PASSE);
  });

  it("bloque l'envoi d'un mot de passe trop court", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), "nom@exemple.fr");
    await u.type(motDePasse(), "court");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(aide()?.textContent).toBe(MOT_DE_PASSE_TROP_COURT);
    expect(document.activeElement).toBe(motDePasse());
    expect(serveur.inscrire).not.toHaveBeenCalled();
  });

  it("montre le refus du serveur, et l'efface dès qu'on corrige", async () => {
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({
      erreurs: { motDePasse: MOT_DE_PASSE_TROP_COURT },
      email: String(donnees.get("email")),
    }));
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), "nom@exemple.fr");
    await u.type(motDePasse(), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect((await screen.findByRole("alert")).textContent).toBe(MOT_DE_PASSE_TROP_COURT);
    await u.type(motDePasse(), "x");
    expect(aide()?.textContent).toBe(REGLE_MOT_DE_PASSE);
  });
});

describe("bouton pour afficher ou masquer le mot de passe", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
  });
  afterEach(cleanup);

  const motDePasse = () => screen.getByLabelText("Mot de passe");

  it("laisse le mot de passe masqué par défaut", () => {
    render(<FormulaireInscription />);
    expect(motDePasse().getAttribute("type")).toBe("password");
    expect(screen.getByRole("button", { name: "Afficher le mot de passe" })).toBeTruthy();
  });

  it("l'affiche en clair au premier appui, le masque au second, sans envoyer le formulaire", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(motDePasse(), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(motDePasse().getAttribute("type")).toBe("text");
    expect((motDePasse() as HTMLInputElement).value).toBe("une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(motDePasse().getAttribute("type")).toBe("password");
    expect(serveur.inscrire).not.toHaveBeenCalled();
  });

  it("se manie au clavier, juste après le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.click(motDePasse());
    await u.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Afficher le mot de passe");
    await u.keyboard("{Enter}");
    expect(motDePasse().getAttribute("type")).toBe("text");
    await u.keyboard(" ");
    expect(motDePasse().getAttribute("type")).toBe("password");
  });

  it("repasse masqué à l'envoi", async () => {
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({ erreurs: {}, email: String(donnees.get("email")) }));
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), "nom@exemple.fr");
    await u.type(motDePasse(), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(motDePasse().getAttribute("type")).toBe("password");
  });
});

describe("confirmation de la création du compte", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({
      erreurs: {},
      email: String(donnees.get("email")),
      cree: true,
    }));
  });
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  async function inscrire() {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), " Nom@Exemple.fr");
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    return screen.findByRole("status");
  }

  it("affiche « Votre compte est créé » à la place du formulaire, et y porte le regard", async () => {
    const confirmation = await inscrire();
    expect(confirmation.textContent).toContain("Votre compte est créé");
    expect(confirmation.textContent).toContain("nom@exemple.fr");
    expect(document.activeElement?.textContent).toBe("Votre compte est créé");
    expect(screen.queryByRole("button", { name: "Créer mon compte" })).toBeNull();
    expect(screen.queryByText("J'ai déjà un compte")).toBeNull();
  });

  it("propose d'aller à la connexion, avec l'adresse retenue dans la mémoire de l'onglet", async () => {
    await inscrire();
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/connexion");
    expect(sessionStorage.getItem("bestia.adresse-connexion")).toBe("nom@exemple.fr");
  });

  it("ne laisse plus le mot de passe dans la page", async () => {
    await inscrire();
    expect(document.querySelector('[name="motDePasse"]')).toBeNull();
    expect(document.body.innerHTML).not.toContain("une phrase de passe");
  });
});

describe("adresse qui a déjà un compte", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({
      erreurs: { email: EMAIL_DEJA_UTILISEE },
      email: String(donnees.get("email")),
    }));
  });
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  async function envoyer() {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), "Nom@Exemple.fr");
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    await screen.findByRole("alert");
    return u;
  }

  it("affiche « Cette adresse a déjà un compte », avec un lien vers la connexion", async () => {
    await envoyer();
    expect(document.getElementById("email-erreur")?.textContent).toBe(`${EMAIL_DEJA_UTILISEE} · Se connecter`);
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/connexion");
  });

  it("garde l'adresse dans le champ et efface le mot de passe", async () => {
    await envoyer();
    expect((screen.getByLabelText("Adresse e-mail") as HTMLInputElement).value).toBe("Nom@Exemple.fr");
    expect((screen.getByLabelText("Mot de passe") as HTMLInputElement).value).toBe("");
  });

  it("retient l'adresse pour la connexion quand on suit le lien", async () => {
    const u = await envoyer();
    const lien = screen.getByRole("link", { name: "Se connecter" });
    // jsdom ne navigue pas : on n'observe que ce que le lien fait avant de partir.
    lien.addEventListener("click", (e) => e.preventDefault());
    await u.click(lien);
    expect(sessionStorage.getItem("bestia.adresse-connexion")).toBe("nom@exemple.fr");
  });
});

describe("un seul envoi à la fois", () => {
  // Une réponse du serveur qu'on libère quand on veut.
  let repondre: (etat: EtatInscription) => void;
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(() => new Promise<EtatInscription>((ok) => (repondre = ok)));
  });
  afterEach(cleanup);

  async function remplir() {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(screen.getByLabelText("Adresse e-mail"), "nom@exemple.fr");
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    return u;
  }

  it("désactive le bouton pendant l'envoi et montre qu'il travaille", async () => {
    const u = await remplir();
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    const bouton = await screen.findByRole("button", { name: "Création…" });
    expect((bouton as HTMLButtonElement).disabled).toBe(true);
    await act(async () => repondre({ erreurs: {}, email: "nom@exemple.fr", cree: true }));
  });

  // React met un second envoi en file d'attente et le fait partir après la première réponse :
  // on vérifie donc qu'aucun envoi ne suit la réponse.
  async function apresLaReponse() {
    await act(async () => repondre({ erreurs: { email: EMAIL_DEJA_UTILISEE }, email: "nom@exemple.fr" }));
    await act(() => new Promise((ok) => setTimeout(ok, 50)));
  }

  it("n'envoie le formulaire qu'une fois sur un double clic", async () => {
    const u = await remplir();
    await u.dblClick(screen.getByRole("button", { name: "Créer mon compte" }));
    await apresLaReponse();
    expect(serveur.inscrire).toHaveBeenCalledTimes(1);
  });

  it("n'envoie le formulaire qu'une fois sur deux appuis dans le même instant", async () => {
    await remplir();
    const bouton = screen.getByRole("button", { name: "Créer mon compte" }) as HTMLButtonElement;
    // Comme dans un vrai navigateur : les deux appuis arrivent avant que le bouton ne se désactive.
    bouton.click();
    bouton.click();
    await apresLaReponse();
    expect(serveur.inscrire).toHaveBeenCalledTimes(1);
  });

  it("redevient actif quand le serveur refuse", async () => {
    const u = await remplir();
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    await screen.findByRole("button", { name: "Création…" });
    await act(async () => repondre({ erreurs: { email: EMAIL_DEJA_UTILISEE }, email: "nom@exemple.fr" }));
    const bouton = screen.getByRole("button", { name: "Créer mon compte" }) as HTMLButtonElement;
    expect(bouton.disabled).toBe(false);
    await u.type(screen.getByLabelText("Mot de passe"), "une phrase de passe");
    await u.click(bouton);
    expect(serveur.inscrire).toHaveBeenCalledTimes(2);
    await act(async () => repondre({ erreurs: {}, email: "nom@exemple.fr", cree: true }));
  });
});
