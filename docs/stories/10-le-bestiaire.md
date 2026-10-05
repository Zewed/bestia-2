# Jalon 10 · Le Bestiaire

Le joueur ouvre son Bestiaire : les 200 Espèces du lancement, celles qu'il a croisées, apprivoisées ou dont il a réuni le Couple, et toutes les autres en silhouette ; compléter un Biome ou une Rareté le récompense, et les quatre Rôles servent pour toutes les Espèces qui en ont un, dès qu'on y affecte une Bête. Étapes couvertes : 46 à 49 de l'ordre d'attaque.

## Étape 46 · La page Bestiaire

### US-1001 · Ouvrir le Bestiaire
**En tant que** joueur, **je veux** ouvrir mon Bestiaire depuis le menu, **afin de** voir d'un coup d'œil toutes les Espèces que je connais.

- **Débloquée par** : Étape 40
- **Critères d'acceptation** :
  - Le menu donne accès à une page Bestiaire, sur ordinateur comme sur mobile.
  - La page reprend l'habillage Bento : une vignette par Espèce.
  - Toutes les inscriptions faites depuis le jalon 9 (croisée, apprivoisée, Couple réuni) s'y retrouvent.

### US-1002 · Le Bestiaire d'un nouveau chef
**En tant que** nouveau joueur, **je veux** voir dès mon arrivée tout ce que le Monde me cache, **afin de** savoir d'emblée tout ce qu'il me reste à découvrir.

- **Débloquée par** : US-1001
- **Critères d'acceptation** :
  - Avant sa première Rencontre, le Bestiaire d'un nouveau chef ne montre que des silhouettes, compteurs à zéro, sans phrase d'explication.
  - Dès sa première Rencontre (US-0933), l'Espèce croisée y prend sa place.
  - Un chef arrivé avant ce jalon retrouve toutes ses inscriptions depuis le jalon 9, et rien d'autre.

### US-1003 · Ranger les Espèces par Biome et par Rareté
**En tant que** joueur, **je veux** que les Espèces soient rangées par Biome puis par Rareté, **afin de** voir où chercher et ce qu'il me reste à trouver.

- **Débloquée par** : US-1001
- **Critères d'acceptation** :
  - Les Espèces sont groupées par Biome, chaque groupe portant le nom et le pictogramme de son Biome ; l'ordre des Biomes (à décider).
  - Dans chaque Biome, elles vont de commune à mythique ; l'ordre au sein d'une même Rareté, alphabétique ou du plus faible au plus fort (à décider).
  - Chaque Espèce garde toujours le même emplacement, connue ou en silhouette : en découvrir une ne décale rien.
  - Côte, lac, rivière et mer forment un seul groupe « eau », comme le Biome.

### US-1004 · La silhouette d'une Espèce jamais vue
**En tant que** joueur, **je veux** voir en silhouette les Espèces que je n'ai jamais croisées, **afin de** mesurer tout ce que le Monde me cache encore.

- **Débloquée par** : US-1003
- **Critères d'acceptation** :
  - Une Espèce jamais croisée apparaît en silhouette à son emplacement, avec pour seuls indices son Biome et sa Rareté (par son groupe et par la couleur de la Rareté).
  - Son nom est remplacé par « ??? ».
  - Silhouette générique ou contour réel de l'animal (à décider), tant qu'elle ne permet pas de reconnaître l'Espèce.

### US-1005 · Des silhouettes qui ne trahissent rien
**En tant que** joueur, **je veux** que rien ne permette de deviner une Espèce que je n'ai jamais vue, **afin de** garder intacte la surprise de la découverte.

- **Débloquée par** : US-1004
- **Critères d'acceptation** :
  - Pour une Espèce jamais vue, ni son nom, ni son illustration, ni ses caractéristiques ne sont envoyés au navigateur (vérifiable en inspectant les échanges de la page).
  - Les adresses des images de silhouette ne contiennent pas le nom de l'Espèce et ne permettent pas de remonter à son illustration.
  - Le nombre d'Espèces par Biome et par Rareté reste visible : c'est voulu.

### US-1006 · L'état « croisée »
**En tant que** joueur, **je veux** reconnaître les Espèces que j'ai seulement croisées, **afin de** savoir lesquelles il me reste à apprivoiser.

- **Débloquée par** : US-1003
- **Critères d'acceptation** :
  - Une Espèce croisée montre son illustration, son nom et sa Rareté, avec une marque « croisée ».
  - Elle se distingue d'un coup d'œil d'une Espèce apprivoisée ; par quel moyen, illustration adoucie, cadre ou autre (à décider).
  - La date de la première Rencontre s'affiche au survol ou au toucher.

### US-1007 · L'état « apprivoisée »
**En tant que** joueur, **je veux** voir les Espèces dont j'ai apprivoisé au moins une Bête, et ce qu'il me manque pour leur Couple, **afin de** viser le bon sexe lors des prochaines Expéditions.

- **Débloquée par** : US-1006
- **Critères d'acceptation** :
  - Une Espèce apprivoisée montre son illustration pleine et une marque « apprivoisée ».
  - Tant que son Couple n'est pas réuni, la vignette indique combien de mâles et de femelles on possède.
  - Si l'un des deux sexes manque, la vignette le dit (« il manque une femelle »).

### US-1008 · L'état « Couple réuni »
**En tant que** joueur, **je veux** que mes Espèces au Couple réuni se voient mieux que les autres, **afin de** mesurer ma vraie progression.

- **Débloquée par** : US-1007
- **Critères d'acceptation** :
  - Une Espèce dont le Couple est réuni porte la marque du Couple, la plus visible des trois.
  - La vignette indique l'effectif possédé, valides et Blessés.
  - Une Espèce mythique n'atteint jamais cet état : son meilleur état est « apprivoisée », puisqu'un joueur n'en possède qu'une Bête.

### US-1009 · Signaler les nouvelles inscriptions
**En tant que** joueur, **je veux** repérer tout de suite ce qui a changé dans mon Bestiaire, **afin de** ne rater aucune nouvelle Espèce.

- **Débloquée par** : US-1006
- **Critères d'acceptation** :
  - Une Espèce qui a changé d'état depuis la dernière visite du Bestiaire porte une marque « nouveau ».
  - Le menu affiche une pastille tant qu'il reste des nouveautés non vues.
  - La marque disparaît à l'ouverture de la page ou à celle de la fiche (à décider).

### US-1010 · Ouvrir la fiche d'une Espèce
**En tant que** joueur, **je veux** ouvrir la fiche complète d'une Espèce connue, **afin de** connaître ce qu'elle vaut au combat et ce qu'elle coûte.

- **Débloquée par** : US-1007, Étape 33
- **Critères d'acceptation** :
  - Toucher une Espèce apprivoisée ou au Couple réuni ouvre sa fiche : grande illustration, nom, Rareté, Biome d'Habitat, régime, attaque, vie, vitesse, charge, taille en Places, Entretien par heure, Rôle éventuel.
  - La fiche rappelle l'état au Bestiaire et la date de chaque étape franchie (croisée, apprivoisée, Couple réuni).
  - Elle reprend la présentation de la fiche de la Réserve.
  - Sur mobile, elle s'ouvre en plein écran et se ferme d'un geste.

### US-1011 · La fiche d'une Espèce seulement croisée
**En tant que** joueur, **je veux** ouvrir la fiche d'une Espèce que j'ai seulement croisée, **afin de** juger si elle vaut une nouvelle Expédition.

- **Débloquée par** : US-1010
- **Critères d'acceptation** :
  - La fiche montre l'illustration, le nom, la Rareté et le Biome d'Habitat.
  - Les caractéristiques d'une Espèce seulement croisée : visibles, partielles ou cachées jusqu'à l'Apprivoisement (à décider).
  - La fiche dit ce qu'il reste à faire : « Apprivoisez-en une ».

### US-1012 · Toucher une silhouette
**En tant que** joueur, **je veux** qu'une silhouette me dise au moins où chercher, **afin de** bien viser mes Expéditions.

- **Débloquée par** : US-1005
- **Critères d'acceptation** :
  - Toucher une silhouette ouvre une fiche minimale : « Espèce inconnue », son Biome et sa Rareté.
  - Elle suggère où chercher (« vit en toundra ») sans rien révéler de plus.
  - Aucune donnée cachée n'est envoyée au navigateur à cette occasion.

### US-1013 · Depuis la fiche, retrouver ses Bêtes
**En tant que** joueur, **je veux** passer de la fiche d'une Espèce à mes Bêtes de cette Espèce, **afin de** passer à l'action sans chercher dans les menus.

- **Débloquée par** : US-1010, Étape 43
- **Critères d'acceptation** :
  - La fiche montre l'effectif possédé : valides, Blessés, partis en Expédition.
  - Une Espèce au Couple réuni propose un bouton vers son Élevage.
  - Une Espèce sans Bête dans l'effectif le dit simplement, sans bouton inutile.

### US-1014 · Les compteurs de complétion
**En tant que** joueur, **je veux** voir combien d'Espèces j'ai croisées, apprivoisées et réunies en Couple, **afin de** suivre ma progression de dresseur.

- **Débloquée par** : US-1008
- **Critères d'acceptation** :
  - En haut du Bestiaire, trois compteurs : Espèces croisées, apprivoisées, Couples réunis, chacun sur le total des Espèces du jeu.
  - Une Espèce au Couple réuni compte aussi comme croisée et apprivoisée.
  - Le total des Couples ne compte pas les Espèces mythiques, qui ne forment jamais de Couple.
  - Les compteurs se mettent à jour dès le retour d'une Expédition, sans recharger la page.

### US-1015 · Les compteurs par Biome et par Rareté
**En tant que** joueur, **je veux** voir ma progression Biome par Biome et Rareté par Rareté, **afin de** choisir sur quoi concentrer mes efforts.

- **Débloquée par** : US-1014
- **Critères d'acceptation** :
  - Chaque groupe de Biome affiche sa propre progression : croisées, apprivoisées, Couples.
  - Une vue par Rareté donne la même progression pour chacune des six Raretés.
  - Un Biome ou une Rareté complet est mis en valeur (le sens de « complet » est fixé à l'étape 48).

### US-1016 · Filtrer par Biome et par Rareté
**En tant que** joueur, **je veux** filtrer le Bestiaire par Biome et par Rareté, **afin de** trouver vite ce qui m'intéresse.

- **Débloquée par** : US-1003
- **Critères d'acceptation** :
  - Des filtres gardent un ou plusieurs Biomes, une ou plusieurs Raretés, et se combinent.
  - Un bouton remet tous les filtres à zéro ; quand aucune Espèce ne correspond, un message le dit.
  - Les filtres choisis restent en mémoire d'une visite à l'autre, sur le même appareil.
  - Les compteurs suivent les filtres ou restent globaux (à décider).

### US-1017 · Filtrer par état
**En tant que** joueur, **je veux** ne voir que les Espèces dans un état donné, **afin de** préparer mes prochaines Expéditions.

- **Débloquée par** : US-1016, US-1007
- **Critères d'acceptation** :
  - Un filtre garde : toutes, jamais vues, croisées, apprivoisées, Couple réuni.
  - Un filtre « Couple incomplet » garde les Espèces apprivoisées dont le Couple n'est pas réuni, avec le sexe qui manque.
  - Ces filtres se combinent avec ceux de Biome et de Rareté.

### US-1018 · Chercher une Espèce par son nom
**En tant que** joueur, **je veux** retrouver une Espèce en tapant son nom, **afin de** ne pas parcourir tout le Bestiaire.

- **Débloquée par** : US-1005
- **Critères d'acceptation** :
  - Un champ de recherche trouve les Espèces connues dont le nom contient le texte tapé, sans tenir compte des accents ni des majuscules.
  - Chercher une Espèce jamais vue donne exactement le même résultat que chercher un nom qui n'existe pas : rien ne trahit son existence.
  - Sans résultat, un message le dit.

### US-1019 · Le Bestiaire sur mobile
**En tant que** joueur, **je veux** parcourir mon Bestiaire au pouce sur mon téléphone, **afin de** le consulter pendant une courte session.

- **Débloquée par** : US-1016
- **Critères d'acceptation** :
  - Les vignettes tiennent en largeur sans défilement de côté, avec un nombre par ligne adapté à l'écran (chiffre à régler).
  - Les filtres se rangent dans un panneau qu'on ouvre d'un bouton.
  - Un sommaire des Biomes permet de sauter d'un groupe à l'autre sans tout faire défiler.
  - Les compteurs restent lisibles en haut de la page.

## Étape 47 · Les 200 Espèces du lancement

### US-1020 · Charger la liste validée
**En tant que** développeur, **je veux** charger la liste validée des 200 Espèces avec toutes leurs données, **afin de** faire reposer le Monde et le Bestiaire sur les vraies Espèces.

- **Débloquée par** : Étape 4, US-1003
- **Critères d'acceptation** :
  - Chaque Espèce chargée a : nom, Rareté, Biome d'Habitat, régime, attaque, vie, vitesse, charge, taille en Places, Entretien par heure, Rôle éventuel, illustration.
  - Une Espèce à laquelle il manque une donnée est refusée avec un message qui dit laquelle, et rien n'est appliqué à moitié.
  - Recharger la même liste ne crée aucun doublon.
  - La page de contrôle interne liste les 200 Espèces avec leurs données.

### US-1021 · Vérifier la liste avant de la charger
**En tant que** développeur, **je veux** que le chargement vérifie la cohérence de la liste, **afin de** ne jamais mettre en ligne un Bestiaire bancal.

- **Débloquée par** : US-1020
- **Critères d'acceptation** :
  - Le chargement vérifie les nombres par Rareté : 100 communes, 50 peu communes, 26 rares, 16 épiques, 6 légendaires, 2 mythiques.
  - Il exige au moins une Espèce commune par Biome, pour que le tirage des apparitions puisse toujours retomber sur une commune.
  - Il signale, sans bloquer, les Biomes qui n'ont aucune Espèce d'une Rareté donnée.
  - Il signale une Espèce dont la force paraît trop grande ou trop petite pour sa Rareté, puisque plus une Espèce est forte, plus elle est rare (seuil : chiffre à régler).

### US-1022 · Une illustration pour chaque Espèce
**En tant que** joueur, **je veux** que chaque Espèce ait sa propre illustration, **afin de** reconnaître chaque animal au premier regard.

- **Débloquée par** : US-1020
- **Critères d'acceptation** :
  - Chaque Espèce s'affiche avec sa propre illustration, dans la direction artistique du prototype.
  - Les vignettes chargent une version réduite, la fiche la version en grand.
  - Une Espèce dont l'illustration n'est pas prête est chargée avec une image d'attente, ou tenue hors du Monde jusqu'à son arrivée (à décider).

### US-1023 · Les 200 Espèces apparaissent dans le Monde
**En tant que** joueur, **je veux** pouvoir croiser toutes les Espèces du lancement, **afin de** parcourir un vrai Monde, riche et varié.

- **Débloquée par** : US-1021, Étape 39
- **Critères d'acceptation** :
  - Les apparitions tirent désormais parmi les 198 Espèces non mythiques, selon leur Biome et leur Rareté.
  - Les Espèces d'essai du jalon 9 n'apparaissent plus nulle part.
  - Une simulation montre que chaque Espèce non mythique finit par apparaître quelque part dans le Monde.
  - Les deux Espèces mythiques restent réservées aux Apparitions (étape 63).

### US-1024 · Les 200 Espèces au Bestiaire
**En tant que** joueur, **je veux** que mon Bestiaire montre les 200 Espèces du lancement, **afin de** voir l'ampleur de ce qu'il reste à découvrir.

- **Débloquée par** : US-1020, US-1005
- **Critères d'acceptation** :
  - Le Bestiaire montre les 200 Espèces, connues ou en silhouette, chacune à son emplacement.
  - Les totaux des compteurs passent à 200, et à 198 pour les Couples.
  - Chaque Biome compte au moins une Espèce, aucun groupe n'est vide.

### US-1025 · Garder ce que les joueurs ont déjà
**En tant que** joueur, **je veux** que l'arrivée des 200 Espèces ne me fasse rien perdre, **afin de** continuer ma partie là où je l'avais laissée.

- **Débloquée par** : US-1020
- **Critères d'acceptation** :
  - La souris, la poule et le pigeon restent les mêmes Espèces : Couples réunis, effectifs, Élevages et états au Bestiaire sont intacts.
  - Ce que deviennent des Bêtes ou des inscriptions d'Espèces d'essai qui existeraient en ligne (à décider).
  - Aucun Couple réuni, aucun Élevage ouvert n'est perdu.

### US-1026 · Ajouter des Espèces plus tard
**En tant que** développeur, **je veux** ajouter de nouvelles Espèces sans rien casser, **afin de** faire grandir le Bestiaire jusqu'à 2000 Espèces.

- **Débloquée par** : US-1020
- **Critères d'acceptation** :
  - Charger une liste plus longue ajoute les nouvelles Espèces sans toucher aux anciennes ni aux progrès des joueurs.
  - Les nouvelles Espèces apparaissent en silhouette chez tous les joueurs, et les totaux des compteurs grandissent d'autant.
  - Corriger une caractéristique d'une Espèce existante s'applique à toutes ses Bêtes, chez tous les joueurs.

### US-1027 · Un Bestiaire qui reste rapide
**En tant que** joueur, **je veux** que le Bestiaire s'ouvre vite même avec des centaines d'Espèces, **afin de** le consulter sans attendre.

- **Débloquée par** : US-1024
- **Critères d'acceptation** :
  - Les illustrations ne se chargent qu'à l'approche de l'écran.
  - Sur un téléphone ordinaire, la page est utilisable en moins de (chiffre à régler) secondes avec 200 Espèces.
  - Ouvrir ou fermer une fiche ne recharge pas la page.
  - La page reste utilisable avec 2000 Espèces d'essai (vérifié en développement).

## Étape 48 · Les récompenses du Bestiaire

### US-1028 · Ce que « compléter » veut dire
**En tant que** joueur, **je veux** savoir précisément ce qu'il faut pour compléter un Biome ou une Rareté, **afin de** viser la récompense en connaissance de cause.

- **Débloquée par** : US-1015
- **Critères d'acceptation** :
  - Un Biome est complet quand chacune de ses Espèces a atteint l'état demandé ; de même pour une Rareté.
  - L'état demandé : « Couple réuni » (« apprivoisée » pour une mythique), ou une récompense à chaque étape, croiser toutes, apprivoiser toutes, réunir tous les Couples (à décider).
  - La règle est écrite sur la page du Bestiaire, près des compteurs.

### US-1029 · La nature des récompenses
**En tant que** joueur, **je veux** connaître d'avance ce que rapporte chaque complétion, **afin de** choisir quel Biome ou quelle Rareté viser.

- **Débloquée par** : US-1028
- **Critères d'acceptation** :
  - Chaque Biome et chaque Rareté a sa récompense, annoncée à l'avance ; sa nature, ressources, Voyageurs, embellissement du Foyer ou autre (à décider) ; son montant (chiffre à régler).
  - Aucune récompense ne rend une Bête plus forte.
  - La récompense d'une Rareté est d'autant plus belle que la Rareté est haute.

### US-1030 · Voir sa progression vers une récompense
**En tant que** joueur, **je veux** voir où j'en suis pour chaque récompense, **afin de** savoir ce qu'il me reste à faire.

- **Débloquée par** : US-1029
- **Critères d'acceptation** :
  - Chaque Biome et chaque Rareté montre une barre de progression et la récompense qui l'attend.
  - Toucher la barre montre les Espèces qui manquent, en silhouette pour celles jamais vues, sans rien trahir.
  - Une récompense déjà reçue est marquée comme telle.

### US-1031 · Compléter un Biome
**En tant que** joueur, **je veux** être récompensé quand je complète un Biome, **afin de** sentir que mes efforts dans ce milieu ont payé.

- **Débloquée par** : US-1030
- **Critères d'acceptation** :
  - Quand la dernière Espèce d'un Biome atteint l'état demandé, la récompense du Biome tombe aussitôt.
  - Une annonce la célèbre avec l'illustration du Biome, et un récit l'inscrit dans la page Récits.
  - La récompense s'ajoute bien aux stocks ou au Territoire, selon sa nature.

### US-1032 · Compléter une Rareté
**En tant que** joueur, **je veux** être récompensé quand je complète une Rareté, **afin de** poursuivre un but à long terme au-delà des Biomes.

- **Débloquée par** : US-1030
- **Critères d'acceptation** :
  - Quand la dernière Espèce d'une Rareté atteint l'état demandé, la récompense de la Rareté tombe aussitôt.
  - Une même Espèce peut compléter à la fois un Biome et une Rareté : les deux récompenses tombent, chacune annoncée.
  - Un récit l'inscrit dans la page Récits.

### US-1033 · Une récompense qui ne tombe qu'une fois
**En tant que** joueur, **je veux** que chaque récompense me soit donnée une seule fois, **afin de** garder un jeu juste pour tous.

- **Débloquée par** : US-1031, US-1032
- **Critères d'acceptation** :
  - Une récompense reçue ne retombe jamais, même si le joueur recharge la page ou si l'Espèce repasse par le même état.
  - Deux Expéditions qui rentrent au même instant et complètent le même Biome ne donnent qu'une récompense.
  - Perdre toutes les Bêtes d'une Espèce ne reprend rien : l'état au Bestiaire ne recule pas et la récompense reste acquise.

### US-1034 · Une récompense gagnée en mon absence
**En tant que** joueur, **je veux** recevoir ma récompense même si la complétion a lieu pendant que je ne suis pas là, **afin de** ne rien perdre entre deux sessions.

- **Débloquée par** : US-1033, Étape 3
- **Critères d'acceptation** :
  - Si le retour qui complète un Biome ou une Rareté a lieu pendant une absence, la récompense est versée au moment de ce retour.
  - L'annonce attend la prochaine visite pour s'afficher.

### US-1035 · Une récompense quand les stocks sont pleins
**En tant que** joueur, **je veux** savoir ce que devient une récompense quand mes stocks sont pleins, **afin de** ne pas la gâcher sans le savoir.

- **Débloquée par** : US-1031, Étape 12
- **Critères d'acceptation** :
  - Si la récompense contient des ressources et que le stock est plein, le surplus est perdu, gardé au-delà de la limite, ou mis de côté à réclamer plus tard (à décider).
  - L'annonce dit exactement ce qui a été reçu.

### US-1036 · La Rareté mythique
**En tant que** joueur, **je veux** savoir comment compléter la Rareté mythique, **afin de** viser tout en haut de la Rareté.

- **Débloquée par** : US-1028
- **Critères d'acceptation** :
  - La Rareté mythique se complète en possédant une Bête de chacune de ses Espèces (à décider).
  - Un Biome qui compte une Espèce mythique exige-t-il de l'avoir pour être complet (à décider).
  - Ces Espèces ne s'obtenant que lors des Apparitions (étape 63), la récompense ne peut pas tomber avant.

### US-1037 · Une nouvelle Espèce dans un Biome déjà complet
**En tant que** joueur, **je veux** savoir ce qu'il advient de ma récompense quand de nouvelles Espèces arrivent, **afin de** ne pas me sentir dépossédé.

- **Débloquée par** : US-1033, US-1026
- **Critères d'acceptation** :
  - Quand une Espèce est ajoutée à un Biome qu'un joueur a déjà complété, la récompense reçue reste acquise.
  - Le Biome redevient incomplet dans les compteurs.
  - Le compléter à nouveau donne une nouvelle récompense ou non (à décider).

## Étape 49 · Les autres Rôles

### US-1038 · Les Rôles et la Recherche
**En tant que** joueur, **je veux** savoir ce qu'il me faut pour affecter une Bête à son Rôle, **afin de** tirer de mes Bêtes autre chose que leur force.

- **Débloquée par** : Étape 32, Étape 37
- **Critères d'acceptation** :
  - Qu'une Recherche soit demandée avant d'affecter une Bête à son Rôle, pour chacun des quatre Rôles (Porteur, Éclaireur, Nourricier, Bâtisseur) ou pour certains seulement, et dans quelle branche (à décider).
  - Sans Recherche demandée, toute Bête à Rôle s'affecte dès qu'on l'a, comme les poules et les pigeons (étapes 37 et 45).
  - Si une Recherche est demandée, l'affectation la nomme, avec un lien vers elle ; une fois faite, elle vaut pour toutes les Espèces qui ont ce Rôle, présentes et futures.
  - La règle est la même pour tous les chefs : aucun n'a de Rôle acquis d'avance.

### US-1039 · Le Rôle sur la fiche d'Espèce
**En tant que** joueur, **je veux** voir le Rôle d'une Espèce sur sa fiche, **afin de** savoir à quoi elle me servira en dehors du combat.

- **Débloquée par** : US-1038, US-1010
- **Critères d'acceptation** :
  - La fiche d'une Espèce à Rôle montre son Rôle, avec une phrase qui dit ce qu'il fait.
  - Si ce Rôle demande une Recherche pas encore faite (US-1038), il apparaît grisé avec un lien vers elle.
  - Le Rôle d'une Espèce en silhouette n'est jamais révélé.

### US-1040 · Filtrer le Bestiaire par Rôle
**En tant que** joueur, **je veux** filtrer mon Bestiaire par Rôle, **afin de** trouver vite mes Porteurs ou mes Bâtisseurs.

- **Débloquée par** : US-1039, US-1016
- **Critères d'acceptation** :
  - Un filtre garde les Espèces connues d'un Rôle donné.
  - Les silhouettes sont toujours écartées de ce filtre, pour ne rien trahir.

### US-1041 · Proposer des Porteurs quand la charge limite une Récolte
**En tant que** joueur, **je veux** qu'on me propose mes Porteurs quand mes Habitants ne pourront pas tout rapporter, **afin de** ne plus laisser de ressources sur place.

- **Débloquée par** : US-1038, Étape 21
- **Critères d'acceptation** :
  - Quand la durée choisie pour une Récolte dépasse ce que ses Habitants peuvent porter (charge de l'étape 21), l'avertissement existant mentionne les Porteurs.
  - Si l'effectif compte des Porteurs, l'avertissement propose de les ajouter d'un toucher.
  - Si le Rôle Porteur demande une Recherche pas encore faite (US-1038), il la nomme, avec un lien vers elle.

### US-1042 · Emmener des Porteurs dans une Récolte
**En tant que** joueur, **je veux** ajouter des Bêtes Porteuses à une Récolte, **afin de** rapporter bien plus à chaque sortie.

- **Débloquée par** : US-1041, US-1038
- **Critères d'acceptation** :
  - L'écran de Récolte propose d'ajouter des Porteurs de l'effectif (chameau…), selon le rattachement des Rôles aux Métiers : c'est les affecter à leur Rôle le temps de la Récolte, comme les Éclaireurs d'une Expédition (US-0976).
  - Chaque Porteur ajoute la charge de son Espèce à celle de la Récolte ; l'écran montre la charge avec et sans eux.
  - Un chameau augmente bien ce que rapporte une Récolte limitée par la charge.
  - Les Porteurs partis ne sont disponibles pour rien d'autre, et rentrent avec la Récolte, même rappelée.
  - Le trajet se fait au pas du Porteur le plus lent s'il est plus lent que les Habitants (à décider).

### US-1043 · Tous les Éclaireurs
**En tant que** joueur, **je veux** que toutes mes Espèces Éclaireuses éclairent mes Expéditions, **afin de** ne pas dépendre des seuls pigeons.

- **Débloquée par** : US-1038, Étape 45
- **Critères d'acceptation** :
  - Toute Espèce Éclaireuse peut partir comme Éclaireur (US-0976) : elle lève plus de brouillard et garde les Bêtes en vue plus longtemps, comme les pigeons, sans combattre.
  - La force de l'effet, la même pour toutes ou propre à chaque Espèce (un aigle voit plus loin qu'un pigeon) (à décider).
  - Plusieurs Espèces Éclaireuses dans une même Expédition cumulent leurs effets jusqu'au plafond (chiffre à régler).

### US-1044 · Tous les Nourriciers
**En tant que** joueur, **je veux** que mes Espèces Nourricières produisent de la Nourriture, **afin de** nourrir mon Territoire sans tout chasser.

- **Débloquée par** : US-1038, Étape 37
- **Critères d'acceptation** :
  - Chaque Bête d'une Espèce Nourricière affectée à son Rôle produit de la Nourriture en continu, comme les poules (chiffre à régler par Espèce), sans Poste : l'affectation suffit (étape 37).
  - Viande ou Végétaux selon l'Espèce (à décider).
  - Cette production s'ajoute à la production horaire affichée et respecte les limites de stock.

### US-1045 · Le Bâtisseur rend une construction possible
**En tant que** joueur, **je veux** qu'une Espèce Bâtisseuse m'ouvre sa construction, **afin de** bâtir ce qu'aucun Habitant ne peut bâtir seul.

- **Débloquée par** : US-1038, Étape 32
- **Critères d'acceptation** :
  - Une construction qui exige un Bâtisseur (le barrage exige des castors) reste verrouillée tant que le joueur ne peut pas affecter assez de Bêtes de cette Espèce à leur Rôle (nombre : chiffre à régler).
  - La construction verrouillée dit ce qui manque : l'Espèce, et la Recherche si le Rôle en demande une (US-1038).
  - Avec assez de castors, le barrage peut être lancé.

### US-1046 · Les Bâtisseurs pendant et après le chantier
**En tant que** joueur, **je veux** savoir ce que deviennent mes Bâtisseurs pendant et après le chantier, **afin de** ne pas bloquer mes Expéditions par surprise.

- **Débloquée par** : US-1045
- **Critères d'acceptation** :
  - Pendant le chantier, les castors sont affectés à leur Rôle : ils ne combattent pas et ne partent pas en escorte (US-0842).
  - Si les castors meurent ensuite, la construction terminée continue de fonctionner ou s'arrête (à décider).
  - L'écran de la construction dit clairement lesquelles des Bêtes sont occupées.

### US-1047 · Une Bête à Rôle ne fait qu'une chose à la fois
**En tant que** joueur, **je veux** voir où se trouve chacune de mes Bêtes à Rôle, **afin de** ne pas compter sur une Bête déjà occupée.

- **Débloquée par** : US-1042, US-1044
- **Critères d'acceptation** :
  - Une Bête partie en Récolte comme Porteur ne peut être ni en Expédition, ni affectée ailleurs en même temps, et inversement.
  - L'effectif indique pour chaque Espèce à Rôle combien de Bêtes sont libres au Foyer, affectées au Foyer, en Expédition ou en Récolte.
  - Les Bêtes à Rôle occupées continuent de coûter leur Entretien.
