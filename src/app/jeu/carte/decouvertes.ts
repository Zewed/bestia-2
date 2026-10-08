// Les Cases découvertes depuis la lecture de la carte (US-0442) : la carte ouverte les demande au serveur et les
// dessine aussitôt, sans relire tout le Monde. Côté navigateur.
import { useEffect, useRef, useState } from "react";
import type { CarteDuJoueur, Decouvertes } from "@/monde/carte";
import { BROUILLARD } from "@/monde/couleurs-de-la-carte";
import { CARTE_DECOUVERTES_SECONDES } from "@/reglages";
import { decouvertesDepuis } from "./actions";
import { rangsDesCases } from "./dessin";

/** US-0442 : le nombre de Cases découvertes d'une carte : toutes celles qui ne sont pas sous le brouillard. */
export function nombreDeDecouvertes(carte: CarteDuJoueur): number {
  const brume = carte.teintes.indexOf(BROUILLARD);
  return carte.cases.teinte.reduce((n, t) => (t === brume ? n : n + 1), 0);
}

/**
 * US-0442 : la carte avec les Cases découvertes `decouvertes` (toutes, telles que le serveur les donne) : chacune de sa
 * teinte, une teinte nouvelle rangée après les autres, et de sa zone ; les Foyers des autres chefs, ceux d'entre elles.
 * Sa forme ne change pas (les mêmes colonnes q et r) ; une Case qu'elle n'a pas est passée. La carte d'avant reste
 * telle quelle.
 */
export function avecLesDecouvertes(carte: CarteDuJoueur, decouvertes: Decouvertes): CarteDuJoueur {
  const rangs = rangsDesCases(carte.cases);
  const [teintes, teinte, zone] = [[...carte.teintes], [...carte.cases.teinte], [...carte.cases.zone]];
  decouvertes.cases.q.forEach((q, j) => {
    const i = rangs.get(`${q},${decouvertes.cases.r[j]}`);
    if (i === undefined) return;
    const t = teintes.indexOf(decouvertes.cases.teinte[j]);
    teinte[i] = t >= 0 ? t : teintes.push(decouvertes.cases.teinte[j]) - 1;
    zone[i] = decouvertes.cases.zone[j];
  });
  return { ...carte, teintes, foyers: decouvertes.foyers, cases: { ...carte.cases, teinte, zone } };
}

/**
 * US-0442 : la carte `carte`, telle que la page l'a lue, à jour des Cases découvertes depuis : elle demande au serveur
 * s'il y en a d'autres que celles qu'elle connaît (decouvertesDepuis, à partir de leur nombre) dès que l'onglet
 * redevient visible, et toutes les CARTE_DECOUVERTES_SECONDES secondes tant qu'il l'est ; une demande à la fois, et
 * une demande qui échoue attend la suivante. Une nouvelle lecture de la page repart d'elle.
 */
export function useDecouvertes(carte: CarteDuJoueur): CarteDuJoueur {
  // La carte à jour, et celle de la page dont elle part.
  const [suivie, setSuivie] = useState({ lue: carte, aJour: carte });
  const aJour = suivie.lue === carte ? suivie.aJour : carte;
  const connues = useRef(0);
  useEffect(() => {
    connues.current = nombreDeDecouvertes(aJour);
  }, [aJour]);
  useEffect(() => {
    let [enCours, ouverte] = [false, true];
    const demander = () => {
      if (enCours || document.visibilityState !== "visible") return;
      enCours = true;
      decouvertesDepuis(connues.current)
        .then(
          (decouvertes) => {
            if (!ouverte || !decouvertes) return;
            setSuivie((avant) => ({ lue: carte, aJour: avecLesDecouvertes(avant.lue === carte ? avant.aJour : carte, decouvertes) }));
          },
          () => {},
        )
        .finally(() => {
          enCours = false;
        });
    };
    const minuterie = setInterval(demander, CARTE_DECOUVERTES_SECONDES * 1000);
    document.addEventListener("visibilitychange", demander);
    return () => {
      ouverte = false;
      clearInterval(minuterie);
      document.removeEventListener("visibilitychange", demander);
    };
  }, [carte]);
  return aJour;
}
