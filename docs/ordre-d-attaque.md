# Ordre d'attaque

Le développement avance par petites étapes. Chacune ajoute une seule chose que le joueur peut faire. Elle est mise en ligne et vérifiée avant de passer à la suivante. Les mots du jeu sont ceux de [CONTEXT.md](../CONTEXT.md).

Chaque étape est découpée en user stories dans [stories/](stories/README.md).

Depuis le 2026-10-05, il n'y a plus de Couple de départ : ce sont les explorateurs qui ramènent les premières Bêtes, et l'on attaque donc les jalons 9 puis 8 juste après la carte du Monde, avant les jalons 5, 6 et 7 ; les numéros des jalons et des étapes ne changent pas ([ADR 0008](adr/0008-pas-de-couple-de-depart.md)).

Règle d'or : **on ne commence pas une étape tant que la précédente n'est pas en ligne et testée.** Les étapes d'un même jalon se suivent dans l'ordre. Les chantiers de contenu (espèces, illustrations, constructions, chiffres) avancent en parallèle, voir la fin du document.

---

## Jalon 0 · Les fondations

Rien de visible pour le joueur, mais tout le reste en dépend.

**1. Le projet en ligne.** Un projet Next.js relié à une base Postgres et déployé sur Vercel affiche une page « Bestia ».
_Fini quand_ : l'adresse publique répond, et chaque envoi sur `main` redéploie tout seul.

**2. L'habillage Bento.** On reprend du prototype les couleurs, la police, les blocs arrondis, la barre du haut Encre et le logo du loup. La barre est encore vide.
_Fini quand_ : la page d'accueil a l'allure du prototype, sur ordinateur comme sur mobile.

**3. Le temps du jeu.** Un mécanisme unique fait avancer le Monde : à chaque ouverture de page, on rattrape ce qui s'est passé depuis la dernière visite, et une tâche planifiée passe régulièrement pour les joueurs absents. En développement, un réglage accélère le temps (×100) pour tester sans attendre.
_Fini quand_ : un compteur de test avance correctement, que la page soit ouverte ou fermée, et en vitesse accélérée.

**4. Les premières données.** On met en base les Biomes, et les trois premières Espèces (souris, poule, pigeon, communes de prairie) avec leurs caractéristiques et leurs illustrations.
_Fini quand_ : une page de contrôle interne liste ces données.

---

## Jalon 1 · Entrer dans le jeu

**5. Créer un compte.** Avec une adresse e-mail et un mot de passe.
_Fini quand_ : un nouveau compte est créé, et un deuxième avec la même adresse est refusé proprement.

**6. Se connecter et se déconnecter.** Et rester connecté d'une visite à l'autre.
_Fini quand_ : on se connecte, on ferme l'onglet, on revient, on est toujours connecté ; la déconnexion fonctionne.

**7. Choisir son nom de chef.** Un nom unique dans le Monde, demandé à la première connexion.
_Fini quand_ : un nom déjà pris est refusé ; le nom s'affiche dans la barre du haut.

**9. Naître sur la carte.** Après son nom de chef et un court récit, le joueur reçoit une Case libre de prairie sur la Couronne : c'est son Foyer, avec la hutte du chef. (L'étape 8, le choix d'un Couple de départ, est retirée.)
_Fini quand_ : deux nouveaux joueurs n'obtiennent jamais la même Case, et chacun voit l'illustration de son Foyer.

---

## Jalon 2 · Le territoire respire

**10. Les ressources.** Viande, Végétaux, Bois et Pierre s'affichent dans la barre du haut, avec des quantités de départ.
_Fini quand_ : les quatre valeurs sont justes, sur ordinateur et sur mobile.

**11. La production continue.** Le Foyer produit un peu de ressources selon son Biome, heure après heure.
_Fini quand_ : après une absence, les stocks ont monté d'autant que prévu, et la production horaire s'affiche.

**12. Les stocks ont une limite.** Au-delà de la capacité, la production s'arrête.
_Fini quand_ : un stock plein ne monte plus et le signale.

---

## Jalon 3 · Les Habitants

**13. Les premiers Habitants.** Le joueur commence avec trois Habitants sans Métier, visibles sur une page Habitants.
_Fini quand_ : la page les liste avec leur état.

**14. Donner un Métier.** On affecte un Habitant à un Métier et on peut le changer.
_Fini quand_ : les effectifs par Métier sont justes et restent enregistrés.

**15. Nourrir les Habitants.** Chaque Habitant consomme de la Nourriture chaque heure. Un avertissement « famine imminente » apparaît à l'avance.
_Fini quand_ : les stocks baissent du bon montant et l'avertissement s'affiche au bon moment.

**16. La Famine.** Sans nourriture, des Habitants s'en vont.
_Fini quand_ : en vitesse accélérée, une famine fait partir le bon nombre d'Habitants, et le joueur en est informé.

**17. Les Voyageurs.** Un Voyageur arrive de temps en temps aux portes et y attend un moment. On l'accueille, et il devient un Habitant ; sinon il repart. Il faut de la place pour l'accueillir.
_Fini quand_ : un Voyageur ignoré repart, un Voyageur accueilli rejoint les Habitants, et on ne peut pas dépasser la place disponible.

---

## Jalon 4 · La carte du Monde

**18. Générer le Monde.** Une grande carte en hexagones, avec ses Biomes, son eau (côtes, lacs, rivières, mer), la Couronne à l'extérieur et le Cœur sauvage au centre.
_Fini quand_ : la même graine donne toujours le même Monde, et les Biomes forment des régions crédibles.

**19. Voir la carte.** On se déplace et on zoome sur la carte, depuis son Foyer. Toucher une Case ouvre sa fiche : Biome, propriétaire.
_Fini quand_ : la carte est fluide sur ordinateur et sur mobile.

**20. Le brouillard.** Seules les Cases proches du Foyer sont visibles au départ. Chaque joueur a son propre brouillard.
_Fini quand_ : deux joueurs ne voient pas les mêmes Cases, et le brouillard levé le reste.

---

## Jalon 9 · Explorer et apprivoiser

**38. La première Expédition.** On envoie des explorateurs, avec ou sans escorte de Bêtes, vers une Case lointaine. Le brouillard se lève sur le chemin, et l'Expédition reste sur place le temps choisi.
_Fini quand_ : le trajet, le séjour et le retour se déroulent, et la carte révélée reste visible.

**39. Le Monde fait apparaître des Bêtes.** Des Bêtes sauvages apparaissent de temps en temps sur les Cases, pour une durée limitée. Leur Rareté dépend de l'Anneau, et les communes restent partout les plus nombreuses. Chaque nouveau Foyer a quelques Bêtes communes à portée.
_Fini quand_ : sur une longue simulation, les Raretés apparues suivent les pourcentages par Anneau.

**40. La Rencontre.** Une Bête qui apparaît sur la Case d'une Expédition, et qui est à sa portée, la suit : c'est l'Apprivoisement, et le sexe est tiré au hasard. Sans escorte, seules les Bêtes communes suivent. Le récit s'affiche au retour.
_Fini quand_ : une Bête ramenée par des explorateurs sans escorte rejoint le joueur, et son Espèce entre au Bestiaire.

**41. La Bête trop forte.** Elle reste sur la Case jusqu'à la fin de sa durée, et peut attaquer l'Expédition. Seules les Bêtes de l'escorte subissent des pertes ; les explorateurs fuient.
_Fini quand_ : on peut revenir plus fort la chercher tant qu'elle est là, et les pertes tombent seulement sur les Bêtes.

**42. Blessés et morts.** Une partie des pertes sont des Blessés, qui guérissent avec le temps.
_Fini quand_ : les Blessés reviennent dans l'effectif après leur guérison.

**43. Le Couple réuni.** Quand on a un mâle et une femelle d'une Espèce, le Couple part en Réserve et l'Élevage de l'Espèce est acquis pour toujours (on s'en sert à l'étape 34).
_Fini quand_ : l'Élevage est acquis au bon moment, et le reste même si les Bêtes de l'effectif meurent.

**44. Plusieurs Expéditions sur une Case.** Si plusieurs joueurs sont là, chacun voit la Bête, et les chances de l'emporter sont proportionnelles à la force de chaque escorte. Le perdant reçoit un récit.
_Fini quand_ : sur une longue simulation, les chances suivent bien les forces.

**45. Les pigeons éclaireurs.** Partis comme Éclaireurs plutôt qu'en escorte, ils ne combattent pas, révèlent plus de brouillard et font rester les Bêtes apparues plus visibles pour l'Expédition.
_Fini quand_ : une Expédition avec des pigeons fait mesurablement plus de Rencontres.

---

## Jalon 8 · Les Bêtes à la maison

**33. La Réserve.** On y voit ses Couples réunis, avec la fiche de chaque Espèce : illustration, Rareté, caractéristiques.
_Fini quand_ : la fiche affiche toutes les caractéristiques de l'Espèce.

**34. L'Élevage.** Un Habitant éleveur produit des Bêtes de l'Espèce d'un Couple réuni, en payant de la Nourriture et en attendant. Un éleveur ne s'occupe que d'un Élevage à la fois.
_Fini quand_ : les Bêtes produites s'ajoutent à l'effectif, au bon coût et au bon rythme, et deux éleveurs élèvent deux Espèces en même temps.

**35. L'Entretien et les Places.** Chaque Bête mange chaque heure selon son régime et occupe des Places dans l'Habitat du Foyer. On ne peut pas élever au-delà des Places libres.
_Fini quand_ : la consommation et les Places occupées sont justes, et l'Élevage bloque quand c'est plein.

**36. La Famine des Bêtes.** Sans nourriture, des Bêtes retournent à l'état sauvage, après un avertissement.
_Fini quand_ : en vitesse accélérée, une famine fait partir le bon nombre de Bêtes.

**37. Affecter une Bête à son Rôle.** Une Bête affectée à son Rôle le remplit aussitôt, mais ne combat plus : les poules affectées nourrissent sans chasser.
_Fini quand_ : une poule affectée produit de la Nourriture en continu, et une Bête affectée ne part plus en escorte.

---

## Jalon 5 · Récolter

**21. Une première Récolte.** On envoie des bûcherons sur une Case de forêt. Il y a un trajet aller, un temps de travail choisi par le joueur, puis un retour avec du Bois. Un récit s'affiche au retour.
_Fini quand_ : la durée du trajet dépend de la distance, et le Bois rapporté dépend du nombre de bûcherons et du temps passé.

**22. Les quatre Récoltes.** Bûcheron (forêt, Bois), mineur (montagne, Pierre), chasseur (Viande), cueilleur (Végétaux), chacun sur les Biomes qui lui conviennent.
_Fini quand_ : chaque Métier ne peut récolter que sur ses Biomes.

**23. Rappeler et relancer.** On peut rappeler une Récolte sur le chemin de l'aller, et la relancer en boucle tant que les Habitants sont libres.
_Fini quand_ : un rappel ne rapporte rien, et une boucle repart toute seule.

**24. La Densité du jour.** Chaque Case a une abondance cachée qui change chaque jour et module les Récoltes, ainsi que l'apparition des Bêtes sauvages.
_Fini quand_ : la même Case rapporte plus certains jours que d'autres.

---

## Jalon 6 · Construire

**25. Les huttes.** Première construction : elles ajoutent de la place pour les Habitants. Construire coûte des Matériaux et prend du temps.
_Fini quand_ : une hutte terminée augmente la place, et on voit le chantier avancer.

**26. Les bâtisseurs.** Le temps de construction baisse avec le nombre de bâtisseurs. Une seule construction par type à la fois.
_Fini quand_ : deux bâtisseurs construisent deux fois plus vite qu'un seul.

**27. Les niveaux.** On améliore une construction : chaque niveau coûte et dure plus que le précédent.
_Fini quand_ : les coûts et les durées suivent la bonne progression.

**28. Les stockages.** Grenier (Végétaux), fumoir (Viande), bûcher (Bois), taillerie (Pierre) augmentent les limites de stock.
_Fini quand_ : chaque niveau augmente la bonne limite.

**29. Les Postes.** Certaines constructions ne tournent qu'avec du personnel, et chaque employé augmente leur efficacité.
_Fini quand_ : une construction sans personnel est inactive, et chaque employé change bien son effet.

**30. La tour de guet et la taverne.** La tour repère les Voyageurs plus tôt ; la taverne les fait rester plus longtemps.
_Fini quand_ : les deux effets se mesurent sur l'arrivée et le départ des Voyageurs.

---

## Jalon 7 · La Recherche

**31. Le cercle des sages.** Des chercheurs y mènent une Recherche, qui coûte et prend du temps.
_Fini quand_ : une Recherche aboutit, et son temps baisse avec le nombre de chercheurs.

**32. L'arbre en quatre branches.** Bâtir, Le vivant, Explorer, Défendre. Les premières Recherches débloquent des constructions et agrandissent la portée des Expéditions ; une construction verrouillée dit quelle Recherche l'ouvre.
_Fini quand_ : on ne peut pas construire sans la Recherche, et le lien mène à la bonne Recherche.

---

## Jalon 10 · Le Bestiaire

**46. La page Bestiaire.** Chaque Espèce croisée, apprivoisée, ou dont le Couple est réuni, avec son état. Les Espèces jamais vues apparaissent en silhouette, rangées par Biome et par Rareté.
_Fini quand_ : les trois états s'affichent correctement, et les silhouettes ne trahissent rien.

**47. Les 200 Espèces du lancement.** On charge la liste validée, avec ses caractéristiques et ses illustrations (voir chantiers de contenu).
_Fini quand_ : les 200 Espèces apparaissent dans le Monde et au Bestiaire.

**48. Les récompenses du Bestiaire.** Compléter un Biome ou une Rareté rapporte une récompense.
_Fini quand_ : la récompense tombe une seule fois, au bon moment.

**49. Les autres Rôles.** Porteur, Éclaireur, Nourricier et Bâtisseur fonctionnent pour toutes les Espèces qui en ont un, dès qu'on y affecte une Bête ; qu'une Recherche soit demandée d'abord reste à décider.
_Fini quand_ : un chameau augmente bien la charge d'une Récolte, et un castor débloque bien sa construction.

---

## Jalon 11 · S'étendre

**50. L'Avant-poste.** On revendique une Case voisine de son Territoire.
_Fini quand_ : le Territoire reste d'un seul tenant, et la nouvelle Case produit selon son Biome.

**51. Les Habitats.** Chaque Case possédée offre des Places pour les Espèces de son Biome ; des constructions d'habitat (bassin, glacière, volière…) ajoutent des Places pour un Biome qui manque. On ne peut élever une Espèce que si son Habitat existe.
_Fini quand_ : impossible d'élever des Bêtes polaires sans toundra ni glacière.

**52. Foyer et Marches.** Le Foyer est à l'abri ; les Cases trop éloignées forment les Marches, signalées sur la carte.
_Fini quand_ : la carte montre clairement ce qui peut être pris et ce qui ne le peut pas.

---

## Jalon 12 · Les Épreuves

**53. Les Épreuves guidées.** Une suite d'étapes qui guide le nouveau joueur, débloque l'interface petit à petit et rapporte des récompenses, comme dans le prototype.
_Fini quand_ : un nouveau joueur va de son nom de chef à sa première Bête sans se perdre.

---

## Jalon 13 · Le danger sauvage

**54. Les Incursions.** Des Bêtes sauvages attaquent le Territoire, plus souvent près du Cœur sauvage. La tour de guet les annonce ; les Bêtes restées au Foyer défendent. Une Incursion repoussée peut laisser de la Viande.
_Fini quand_ : l'annonce arrive avec le bon préavis, et le combat se résout par la somme des forces.

**55. Les défenses construites.** Palissade et fosses ajoutent de la force en défense.
_Fini quand_ : une défense change bien l'issue d'un combat.

---

## Jalon 14 · Les autres joueurs

**56. Voir ses voisins.** Les Territoires des autres joueurs apparaissent sur la carte, avec le nom de leur chef.
_Fini quand_ : on voit les voisins dont les Cases ne sont plus dans le brouillard.

**57. Attaquer.** On envoie des Bêtes vers le Territoire d'un autre joueur. Il y a un trajet, puis un combat contre ses Bêtes restées chez lui et ses défenses. Le pillage de Nourriture et de Matériaux est limité par ce que les Bêtes peuvent porter. Jamais de vol de Bêtes.
_Fini quand_ : les deux joueurs reçoivent un récit de combat juste, et le butin respecte la charge.

**58. Les protections.** Préavis de la tour de guet, Bouclier des débutants, limite d'Attaques par cible et par jour.
_Fini quand_ : un débutant ne peut pas être attaqué, et la limite bloque l’Attaque de trop.

**59. Prendre une Marche.** Une Attaque victorieuse peut prendre une Case de Marche.
_Fini quand_ : la Case change de main, et le Foyer ne peut jamais être pris.

**60. Les classements.** Nombre de Couples réunis (le classement principal), taille du Territoire, puissance de l'armée.
_Fini quand_ : les trois classements sont justes et se mettent à jour.

---

## Jalon 15 · Le Monde vivant

**61. Les Migrations.** Une Espèce rare traverse une région pendant quelques jours, annoncée aux joueurs proches.
_Fini quand_ : la région concernée voit bien plus souvent cette Espèce pendant la Migration.

**62. Les Saisons du Monde.** Elles changent la Densité et les Récoltes selon le Biome.
_Fini quand_ : l'effet d'une Saison se mesure sur les Récoltes et les Rencontres.

**63. Les Apparitions.** Une Bête d'Espèce mythique surgit dans le Cœur sauvage pour un temps. Le premier qui la vainc l'apprivoise à coup sûr, les suivants avec des chances décroissantes. Un joueur n'en possède au plus qu'une par Espèce.
_Fini quand_ : les chances suivent bien l'ordre des vainqueurs.

---

## Jalon 16 · Le confort

**64. Les notifications.** Notifications du navigateur, y compris sur mobile, pour les seuls événements importants (Attaque, Incursion, famine imminente, Apparition), réglables par le joueur.
_Fini quand_ : chaque type se coupe séparément, et rien d'autre n'est envoyé.

**65. Le Repos.** Pour une durée minimale, le Territoire ne produit plus, ne consomme plus et ne peut plus être attaqué.
_Fini quand_ : après une semaine de Repos, on retrouve tout exactement comme avant.

**66. Le tour complet sur mobile.** Chaque écran est repris sur un vrai téléphone.
_Fini quand_ : une session entière se joue au pouce, sans zoom ni défilement de côté.

---

## Plus tard

- **Les Clans** : vision partagée des Bêtes repérées, renforts, chasses de Bêtes légendaires et mythiques.
- **De nouvelles Espèces**, jusqu'à 2000.
- **L'ouverture d'un deuxième Monde**, quand le premier est plein.

---

## Chantiers de contenu, en parallèle

Ils avancent pendant le développement et doivent être prêts à temps pour les étapes qui en dépendent.

- **Les 200 Espèces** (pour l'étape 47) : nom, Rareté (100 communes, 50 peu communes, 26 rares, 16 épiques, 6 légendaires, 2 mythiques), Biome, régime, Rôle éventuel, et caractéristiques tirées des données réelles. Proposées, puis validées une à une.
- **Les illustrations** : une par Espèce, dans la direction artistique du prototype. On commence par les trois premières Espèces (étape 4), puis les communes.
- **La liste des constructions** (pour les jalons 6, 11 et 13) : une trentaine, en familles, chacune avec ses coûts, ses Postes et la Recherche qui la débloque.
- **Le rattachement des Rôles aux Métiers** (pour l'étape 49).
- **Les chiffres d'équilibrage**, réglés en jouant : rythme de progression (première peu commune en 3 à 4 jours, rare en 1 mois, épique en 2 à 3 mois, légendaire en 6 mois), distance des Marches, limites d'Attaque, pourcentages de Rareté par Anneau.
