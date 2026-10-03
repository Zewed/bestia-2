import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envoyerEmail, masquerAdresse } from "./envoi";

const email = { a: "nom@exemple.fr", sujet: "Confirmez votre adresse", texte: "Votre lien personnel : https://bestia.test/confirmer/jeton-secret" };
const EN_LIGNE = { VERCEL_ENV: "production", RESEND_API_KEY: "re_cle_de_test" };

describe("envoi des e-mails", () => {
  let journal: { info: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };
  const ecrit = () => JSON.stringify([journal.info.mock.calls, journal.error.mock.calls]);

  beforeEach(() => {
    journal = { info: vi.spyOn(console, "info").mockImplementation(() => {}), error: vi.spyOn(console, "error").mockImplementation(() => {}) };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("affiche l'e-mail dans le journal en local, au lieu de l'envoyer", async () => {
    const resend = vi.fn();
    vi.stubGlobal("fetch", resend);
    expect(await envoyerEmail(email, {})).toBe(true);
    expect(resend).not.toHaveBeenCalled();
    expect(ecrit()).toContain("Bestia <bonjour@bestia.thevibecompany.co>");
    expect(ecrit()).toContain("jeton-secret");
  });

  it("part par Resend en ligne, au nom de Bestia, avec la clé lue dans l'environnement", async () => {
    const resend = vi.fn(async () => new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", resend);
    expect(await envoyerEmail(email, EN_LIGNE)).toBe(true);
    const [adresse, requete] = resend.mock.calls[0] as unknown as [string, RequestInit];
    expect(adresse).toBe("https://api.resend.com/emails");
    expect(requete.method).toBe("POST");
    expect(requete.signal).toBeInstanceOf(AbortSignal); // abandonné au bout de 10 secondes
    expect((requete.headers as Record<string, string>).Authorization).toBe("Bearer re_cle_de_test");
    expect(JSON.parse(requete.body as string)).toMatchObject({
      from: "Bestia <bonjour@bestia.thevibecompany.co>",
      to: ["nom@exemple.fr"],
      subject: "Confirmez votre adresse",
      text: email.texte,
    });
  });

  it.each([
    ["Resend refuse", async () => new Response("{}", { status: 422 }), /Resend a répondu 422/],
    ["Resend est injoignable", async () => Promise.reject(new TypeError("fetch failed")), /service injoignable/],
  ])("note l'échec sans bloquer quand %s", async (_, reponse, raison) => {
    vi.stubGlobal("fetch", vi.fn(reponse));
    await expect(envoyerEmail(email, EN_LIGNE)).resolves.toBe(false);
    expect(ecrit()).toMatch(raison);
  });

  it("note l'échec quand la clé manque en ligne, sans rien envoyer", async () => {
    const resend = vi.fn();
    vi.stubGlobal("fetch", resend);
    expect(await envoyerEmail(email, { VERCEL_ENV: "preview" })).toBe(false);
    expect(resend).not.toHaveBeenCalled();
    expect(ecrit()).toMatch(/RESEND_API_KEY manquante/);
  });

  it("ne garde en ligne ni le contenu, ni l'adresse entière, ni la clé", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    await envoyerEmail(email, EN_LIGNE);
    await envoyerEmail(email, { VERCEL_ENV: "production" });
    expect(ecrit()).not.toMatch(/jeton-secret|nom@exemple\.fr|re_cle_de_test/);
    expect(ecrit()).toContain("n***@exemple.fr");
  });

  it("masque une adresse sans la rendre méconnaissable", () => {
    expect(masquerAdresse("nom@exemple.fr")).toBe("n***@exemple.fr");
    expect(masquerAdresse("pas-une-adresse")).toBe("***");
  });
});
