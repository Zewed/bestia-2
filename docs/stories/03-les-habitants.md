# Jalon 3 · Les Habitants

Le Territoire se peuple : le joueur voit ses premiers Habitants, leur donne un Métier, les nourrit chaque heure, et accueille les Voyageurs qui se présentent à ses portes. Étapes couvertes : 13 à 17 de l'ordre d'attaque.

## Étape 13 · Les premiers Habitants

### US-0301 · Recevoir trois Habitants en naissant
**En tant que** nouveau joueur, **je veux** commencer avec trois Habitants, **afin de** pouvoir faire tourner mon Territoire dès le premier jour.

- **Statut** : Livrée le 2026-10-07 (autopilot). Un Habitant est une ligne de la table `habitant`, rattachée à son Territoire, avec son Métier (vide pour l'instant) et son heure d'arrivée. La base en donne trois à chaque naissance, quel que soit le chemin ; les Territoires déjà nés ont reçu les leurs avec la migration, une seule fois. Rien de visible encore : la page Habitants vient avec US-0302.
- **Débloquée par** : Étape 9
- **Critères d'acceptation** :
  - Un joueur qui vient de naître sur la carte possède exactement trois Habitants.
  - Les trois Habitants sont sans Métier.
  - Un joueur né avant cette étape reçoit lui aussi ses trois Habitants, une seule fois.
  - Les Habitants d'un joueur n'apparaissent chez aucun autre joueur.

### US-0302 · Ouvrir la page Habitants
**En tant que** joueur, **je veux** ouvrir une page Habitants depuis la navigation, **afin de** voir qui vit sur mon Territoire.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). La navigation du jeu a deux entrées, « Foyer » et « Habitants » : dans la barre du haut à droite du logo sur ordinateur (l'entrée affichée en clair et soulignée de citron), en onglets fixés en bas de l'écran sur téléphone, au pouce, au-dessus de l'encoche ; la page s'arrête au-dessus des onglets. Elle n'apparaît qu'une fois le joueur entré dans son Foyer. Entre 821 et 960 px, pour laisser la place à la navigation, le mot « BESTIA » s'efface et la tête du loup reste. La page `/jeu/habitants` montre pour l'instant le nombre d'Habitants (« 3 Habitants ») ; la liste vient avec US-0303. Vérifié en vrai de 320 à 1 440 px et en paysage : aucun défilement de côté, rechargement sur place, connexion puis retour sur la page sans session.
- **Débloquée par** : US-0301
- **Critères d'acceptation** :
  - Une entrée « Habitants » figure dans la navigation, sur ordinateur comme sur mobile.
  - La page reprend l'habillage Bento, avec la barre du haut et ses ressources.
  - Recharger la page ramène sur la page Habitants.
  - Un visiteur non connecté qui ouvre l'adresse de la page est renvoyé vers la connexion.

### US-0303 · Lister chaque Habitant avec son état
**En tant que** joueur, **je veux** voir chaque Habitant avec son Métier et son état, **afin de** comprendre d'un coup d'œil qui fait quoi.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Sous le nombre d'Habitants, une ligne par Habitant : son prénom, son Métier ou « sans Métier », et une pastille « libre ». Les prénoms viennent de `donnees/prenoms.yaml` (soixante prénoms courts, sans accent), semés aussi par la migration ; une naissance en donne trois différents, et les Habitants déjà là ont reçu le leur. Vérifié en vrai sur ordinateur et à 320 px, sans défilement de côté.
- **Débloquée par** : US-0302
- **Critères d'acceptation** :
  - Chaque Habitant occupe une ligne qui montre son Métier, ou « sans Métier ».
  - Chaque ligne montre l'état de l'Habitant ; à ce stade, le seul état possible est « libre » (au Foyer et disponible), les autres arriveront avec les Expéditions, les Élevages, les Récoltes et les chantiers.
  - Les lignes sont rangées par Métier, les Habitants sans Métier en premier.
  - Chaque Habitant porte un prénom tiré au hasard (décidé le 2026-10-07), différent des autres prénoms de son Territoire à la naissance.

### US-0304 · Compter ses Habitants dans la barre du haut
**En tant que** joueur, **je veux** voir mon nombre d'Habitants dans la barre du haut, **afin de** suivre mon Territoire depuis n'importe quelle page.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Le compteur suit les ressources, séparé d'elles par le même fin trait : l'icône des Habitants puis le nombre ; c'est un lien vers la page Habitants (« 3 Habitants » pour un lecteur d'écran). Sur mobile, la bande passe à cinq colonnes égales (64 px à 320 px, où « 99 999 PLEIN » tient encore). Il est relu à chaque affichage et à chaque recalage de la barre. Pour laisser sa place au nom du chef, le « +8/h » des ressources ne s'affiche plus qu'à partir de 1 180 px (au lieu de 1 100). Vérifié en vrai de 320 à 1 440 px.
- **Débloquée par** : US-0301, Étape 10
- **Critères d'acceptation** :
  - Le nombre total d'Habitants s'affiche dans la barre du haut, à côté des ressources.
  - Toucher ce compteur ouvre la page Habitants.
  - Le compteur suit chaque arrivée et chaque départ d'Habitant.
  - Sur mobile, il reste lisible sans défilement de côté.

### US-0305 · Voir la place pour de nouveaux Habitants
**En tant que** joueur, **je veux** voir combien d'Habitants mon Territoire peut encore accueillir, **afin de** prévoir l'arrivée de nouveaux bras.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). En tête de la page Habitants : « 3 Habitants sur 5 places », et une pastille sable « Plus de place » dès que toute la place est prise. La place totale est la somme de ses sources, pour l'instant le seul Foyer ; les huttes s'y ajouteront d'une ligne. Vérifié en vrai sur ordinateur et à 320 px.
- **Débloquée par** : US-0303
- **Critères d'acceptation** :
  - La page Habitants affiche « X Habitants sur Y places », Y étant la place totale du Territoire.
  - Au départ, le Foyer offre 5 places (provisoire, `PLACES_DU_FOYER`).
  - Quand toute la place est prise, la page affiche « Plus de place ».
  - La place totale additionne toutes ses sources, pour l'instant le seul Foyer ; les huttes s'y ajouteront à l'étape 25.

### US-0306 · Utiliser la page Habitants au pouce
**En tant que** joueur, **je veux** gérer mes Habitants d'une seule main sur mon téléphone, **afin de** jouer en quelques secondes où que je sois.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Une seule colonne sur mobile, sans défilement de côté ; chaque bouton de la page fait au moins 44 px de côté ; le nombre d'Habitants et la place restent collés sous la barre du haut quand la liste défile. Vérifié en vrai à 320 px.
- **Débloquée par** : US-0303
- **Critères d'acceptation** :
  - Sur mobile, la page tient sur une seule colonne, sans défilement de côté.
  - Chaque bouton offre une surface de toucher d'au moins 44 pixels (provisoire, dans le CSS de la page) de côté.
  - Le nombre d'Habitants et la place restent visibles en haut de la page quand on fait défiler la liste.

## Étape 14 · Donner un Métier

### US-0307 · Découvrir les huit Métiers
**En tant que** joueur, **je veux** voir les huit Métiers avec une phrase qui dit à quoi chacun sert, **afin de** choisir en connaissance de cause.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Sur la page Habitants, un bloc « Métiers » sous l'Entretien (à droite sur ordinateur, dessous sur mobile) : une ligne par Métier, son icône peinte, son nom en gras suivi de sa phrase (« Bûcheron rapporte du Bois des forêts »), puis ce qu'il attend (« Servira avec les Récoltes. ») ; aujourd'hui aucun ne sert encore. Les Métiers sont des données de référence (`donnees/metiers.yaml`, table `metier`) et le Métier d'un Habitant doit en être un. Vérifié en vrai de 320 à 1 440 px.
- **Débloquée par** : US-0303
- **Critères d'acceptation** :
  - Les huit Métiers sont listés : explorateur, chasseur, cueilleur, bûcheron, mineur, chercheur, bâtisseur, éleveur ; l'éleveur servira avec l'Élevage (étape 34).
  - Chaque Métier a son icône et une phrase courte (par exemple « bûcheron : rapporte du Bois des forêts »).
  - Un Métier qui ne sert à rien pour l'instant le dit (« servira quand le cercle des sages sera bâti »).
  - Un Métier qui ne sert à rien pour l'instant est montré quand même (décidé le 2026-10-07).
  - Les Postes ne figurent pas dans cette liste : ils arriveront avec les constructions (étape 29).

### US-0308 · Donner un Métier à un Habitant
**En tant que** joueur, **je veux** donner un Métier à un Habitant sans Métier, **afin de** le mettre au travail.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Sur la ligne d'un Habitant sans Métier, « Choisir un Métier » déplie dessous les huit Métiers en boutons (icône et nom, quatre colonnes, deux sur téléphone) ; en toucher un le donne, gratuitement : la ligne le montre aussitôt, puis l'Habitant se range à la place de son Métier. Le Métier est enregistré en base, sous son nom à l'affichage ; un Habitant qui a déjà un Métier, celui d'un autre Territoire ou un Métier inconnu ne bougent pas. Vérifié en vrai de 320 à 1 440 px.
- **Débloquée par** : US-0307
- **Critères d'acceptation** :
  - Depuis la ligne d'un Habitant sans Métier, on choisit l'un des huit Métiers.
  - L'Habitant affiche aussitôt son nouveau Métier.
  - Le Métier est enregistré : il est toujours là après rechargement et sur un autre appareil.
  - Donner un Métier est gratuit et immédiat (décidé le 2026-10-07).

### US-0309 · Compter les effectifs par Métier
**En tant que** joueur, **je veux** voir combien d'Habitants exercent chaque Métier, **afin de** vérifier ma répartition d'un coup d'œil.

- **Débloquée par** : US-0308
- **Critères d'acceptation** :
  - En tête de la page Habitants, un compteur par Métier, plus un compteur « sans Métier ».
  - La somme des compteurs égale toujours le nombre total d'Habitants.
  - Un Métier que personne n'exerce affiche 0 au lieu de disparaître.
  - Les compteurs changent dès qu'un Métier est donné.

### US-0310 · Changer le Métier d'un Habitant
**En tant que** joueur, **je veux** changer le Métier d'un Habitant, **afin de** suivre les besoins du moment.

- **Débloquée par** : US-0309
- **Critères d'acceptation** :
  - Depuis la ligne d'un Habitant qui a un Métier, on peut en choisir un autre.
  - Le compteur de l'ancien Métier baisse de un, celui du nouveau monte de un.
  - Changer de Métier est gratuit et immédiat, sans temps d'apprentissage (à décider).
  - Le nouveau Métier est enregistré comme le premier.

### US-0311 · Retirer son Métier à un Habitant
**En tant que** joueur, **je veux** remettre un Habitant sans Métier, **afin de** le garder disponible pour plus tard.

- **Débloquée par** : US-0310
- **Critères d'acceptation** :
  - Le choix « sans Métier » est proposé pour tout Habitant qui a un Métier.
  - L'Habitant rejoint le compteur « sans Métier » et remonte en tête de liste.
  - Retirer un Métier suit la même règle de coût et de délai que le changer.

### US-0312 · Répartir les Habitants avec plus et moins
**En tant que** joueur, **je veux** ajouter ou retirer des Habitants d'un Métier avec des boutons plus et moins, **afin de** répartir mes Habitants en quelques touches.

- **Débloquée par** : US-0311
- **Critères d'acceptation** :
  - Chaque compteur de Métier a un bouton « + » et un bouton « − ».
  - « + » donne ce Métier à un Habitant sans Métier ; il est grisé quand il n'en reste aucun.
  - « − » remet sans Métier un Habitant de ce Métier ; il est grisé quand le compteur est à 0.
  - Les deux boutons se touchent facilement au pouce sur mobile.

### US-0313 · Signaler les Habitants sans Métier
**En tant que** joueur, **je veux** être prévenu quand des Habitants n'ont pas de Métier, **afin de** ne pas laisser de bras sans emploi.

- **Débloquée par** : US-0309
- **Critères d'acceptation** :
  - Quand au moins un Habitant est sans Métier, un bandeau « N Habitants sans Métier » s'affiche en haut de la page Habitants.
  - Le bandeau propose un raccourci qui mène aux Habitants concernés.
  - Un petit repère sur l'entrée « Habitants » de la navigation signale leur présence.
  - Le bandeau et le repère disparaissent dès que tous les Habitants ont un Métier.

### US-0314 · Filtrer la liste par Métier
**En tant que** joueur, **je veux** n'afficher que les Habitants d'un Métier, **afin de** retrouver vite ceux qui m'intéressent.

- **Débloquée par** : US-0309
- **Critères d'acceptation** :
  - Toucher un compteur de Métier filtre la liste sur ce Métier.
  - Un bouton « Tous » retire le filtre.
  - Le filtre ne change ni les compteurs ni les Métiers.
  - Un filtre sans résultat affiche « Personne n'exerce ce Métier. »

### US-0315 · Garder des effectifs justes sur deux appareils
**En tant que** joueur, **je veux** que mes effectifs restent justes même si je joue sur deux appareils à la fois, **afin de** toujours pouvoir me fier aux compteurs.

- **Débloquée par** : US-0312
- **Critères d'acceptation** :
  - Deux changements faits en même temps sur le même Habitant ne créent jamais de doublon : le dernier enregistré l'emporte.
  - Des « + » répétés très vite, ou depuis deux onglets, ne donnent jamais un Métier à plus d'Habitants qu'il n'y en a sans Métier.
  - Après rechargement, les deux appareils affichent les mêmes effectifs.

## Étape 15 · Nourrir les Habitants

### US-0316 · Faire manger les Habitants chaque heure
**En tant que** joueur, **je veux** que chaque Habitant prenne son Entretien dans mes stocks chaque heure, **afin de** sentir ce que coûte chaque bouche en plus.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Production et Entretien se calculent ensemble, dans la même mise à l'heure, en entiers exacts au pas d'une microseconde : un calcul ou mille donnent exactement les mêmes Stocks, même quand un Stock se vide, se remplit ou que le partage bascule (prouvé aussi contre un déroulement microseconde par microseconde). Un Stock de Nourriture vide continue de donner sa production à mesure, et l'autre paie le reste ; quand les deux sont vides, l'Entretien qui manque n'est pas payé (la Famine viendra avec US-0325). L'Entretien mange aussi le surplus d'un Stock au-dessus de sa limite, comme une dépense. Le nombre d'Habitants est celui du moment du calcul : une arrivée ou un départ devra d'abord mettre le Territoire à l'heure. La barre monte ou descend au rythme net entre deux recalages. Vérifié en vrai : avec trois Habitants, une heure donne +5 Viande et +11 Végétaux (8 − 3 et 14 − 3), le Bois et la Pierre gardent leurs +4.
- **Débloquée par** : US-0301, Étape 11, Étape 12
- **Critères d'acceptation** :
  - Chaque Habitant a un Entretien de 2 Nourriture par heure (provisoire, `ENTRETIEN_HABITANT_PAR_HEURE`), qu'il ait un Métier ou non.
  - L'Entretien est pris sur la Viande et les Végétaux à parts égales ; quand l'un est vide, tout est pris sur l'autre (décidé le 2026-10-07).
  - Les stocks de Nourriture baissent de l'Entretien total pendant que la production continue les fait monter.
  - Un stock ne descend jamais sous zéro.

### US-0317 · Rattraper l'Entretien après une absence
**En tant que** joueur, **je veux** retrouver des stocks justes quand je reviens après plusieurs heures, **afin de** pouvoir me fier aux chiffres affichés.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Le calcul d'US-0316 tenait déjà ces critères : la story ajoute la preuve, sans toucher au jeu. Trois absences (12 Habitants sur 20 h, 20 sur 12 h, 15 sur 24 h) qui vident la Nourriture, la remplissent jusqu'à sa limite puis l'en font redescendre, ou mangent le surplus au-dessus d'elle, donnent exactement les Stocks d'un déroulement heure par heure, que la page soit restée fermée, ouverte (trois mises à l'heure par heure) ou que la tâche planifiée soit passée entre-temps. À ×100, 864 secondes réelles donnent exactement la journée réelle d'un Territoire jumeau. Rien de visible.
- **Débloquée par** : US-0316
- **Critères d'acceptation** :
  - Après une absence, chaque stock vaut exactement le stock de départ, plus la production, moins l'Entretien, heure par heure.
  - La limite de stock s'applique heure par heure, pas seulement à la fin du rattrapage.
  - Le résultat est le même que la page soit restée ouverte ou fermée, et que la tâche planifiée soit passée ou non entre-temps.
  - En vitesse accélérée (×100), une journée de jeu donne les mêmes stocks qu'une journée réelle.

### US-0318 · Voir l'Entretien des Habitants
**En tant que** joueur, **je veux** voir combien de Nourriture mes Habitants mangent par heure, **afin de** connaître ce que mon Territoire doit produire.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Un bloc « Entretien » à côté de la liste (dessous sur mobile) : « 3 Habitants × 2 Nourriture = **6 Nourriture par heure** ». Le total vient de la requête même où le calcul du jeu le prélève, relue à chaque affichage. Vérifié en vrai sur ordinateur et à 320 px.
- **Débloquée par** : US-0316
- **Critères d'acceptation** :
  - La page Habitants affiche l'Entretien total par heure.
  - Le détail se lit en une ligne : nombre d'Habitants, Entretien de chacun, total.
  - La valeur change dès qu'un Habitant arrive ou part.

### US-0319 · Voir le solde horaire de Nourriture
**En tant que** joueur, **je veux** voir si ma Nourriture monte ou baisse chaque heure, **afin de** réagir avant qu'il ne soit trop tard.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Dans la barre, chaque ressource montre désormais son solde horaire, production moins Entretien (« +5/h », « −4/h » en rose, « 0/h » discret), là où s'affichait sa production : dès 821 px à côté de la quantité, sur mobile sur une troisième petite ligne (la bande passe de 44 à 56 px). Le détail de la Viande et des Végétaux met côte à côte « Production +8/h », « Entretien −12/h » et « Solde −4/h ». Un Stock plein dont l'Entretien dépasse la production montre son solde négatif au lieu de « production perdue ». Sur mobile, le détail s'ouvre dans un panneau en bas de l'écran, au-dessus des onglets, avec un bouton « Fermer ». Vérifié en vrai avec 3 puis 12 Habitants, de 320 à 1 440 px.
- **Débloquée par** : US-0318, Étape 11
- **Critères d'acceptation** :
  - Dans la barre du haut, la Viande et les Végétaux affichent leur variation horaire nette : production moins Entretien.
  - Un solde négatif s'affiche avec un signe moins, dans la couleur d'alerte.
  - Toucher la valeur ouvre le détail : production d'un côté, Entretien de l'autre.
  - Sur mobile, ce détail s'ouvre dans un panneau en bas de l'écran.

### US-0320 · Voir combien de temps tiendra la Nourriture
**En tant que** joueur, **je veux** voir pendant combien d'heures ma Nourriture peut encore payer l'Entretien, **afin de** planifier ma prochaine visite.

- **Débloquée par** : US-0319
- **Critères d'acceptation** :
  - Quand le solde de Nourriture est négatif, la page Habitants affiche « Nourriture pour encore X h ».
  - Le calcul tient compte des stocks, de la production et de l'Entretien du moment.
  - Quand le solde est positif ou nul, la page affiche « Nourriture assurée ».

### US-0321 · Recevoir l'avertissement « famine imminente »
**En tant que** joueur, **je veux** être prévenu à l'avance qu'une Famine approche, **afin de** garder le temps de réagir.

- **Débloquée par** : US-0320
- **Critères d'acceptation** :
  - L'avertissement « famine imminente » apparaît quand la Nourriture ne couvre plus que (chiffre à régler) heures d'Entretien.
  - Il s'affiche dans la barre du haut, sur toutes les pages, sur ordinateur comme sur mobile.
  - Il dit combien de temps il reste et mène à la page Habitants.
  - En vitesse accélérée, il apparaît exactement au moment prévu.

### US-0322 · Trouver l'avertissement en revenant
**En tant que** joueur, **je veux** voir l'avertissement dès mon retour s'il s'est déclenché pendant mon absence, **afin de** ne pas le découvrir trop tard.

- **Débloquée par** : US-0321
- **Critères d'acceptation** :
  - Si le seuil a été franchi pendant l'absence, l'avertissement est affiché dès l'ouverture de la page, une fois le rattrapage fait.
  - Il indique depuis quand il est actif.
  - Rien n'est envoyé hors de la page pour l'instant : les notifications du navigateur viendront à l'étape 64.

### US-0323 · Retirer l'avertissement quand le danger est passé
**En tant que** joueur, **je veux** que l'avertissement disparaisse dès que ma Nourriture suffit de nouveau, **afin de** ne pas m'inquiéter pour rien.

- **Débloquée par** : US-0321
- **Critères d'acceptation** :
  - L'avertissement disparaît dès que le solde redevient positif, ou que la Nourriture couvre de nouveau plus que le seuil.
  - Une marge de (chiffre à régler) heures évite qu'il apparaisse et disparaisse sans cesse autour du seuil.
  - Tant que le danger est là, le joueur ne peut pas le masquer (à décider).

## Étape 16 · La Famine

### US-0324 · Lire les récits du Territoire
**En tant que** joueur, **je veux** retrouver dans une liste ce qui est arrivé sur mon Territoire, **afin de** ne rien manquer de ce qui s'est passé en mon absence.

- **Statut** : Livrée le 2026-10-07 (autopilot, par un agent en parallèle). Un Récit est une ligne de la table `recit` : titre, texte, heure du jeu où il est survenu, heure où il a été lu. Les événements à venir (Famine, retours de Récolte, Attaques…) l'écrivent par `ecrireUnRecit`, dans leur propre transaction ; aucun n'en écrit encore. La navigation gagne une troisième entrée, « Récits », avec une pastille citron qui compte les non lus (« 99+ » au-delà) ; un récit non lu a son titre en gras et la marque « nouveau » ; le toucher déplie son texte sur place et le marque lu, et la pastille baisse aussitôt. Dates en heure de Paris, en attendant le fuseau du joueur. Pour faire place à la troisième entrée, sous 1 280 px sur ordinateur, les ressources passent en bande sous la barre, comme sur mobile : la ligne ne tenait plus avec quatre Stocks pleins ou de grands nombres. Vérifié en vrai de 320 à 1 440 px, avec des récits écrits à la main sur un compte d'essai : aucun défilement de côté.
- **Débloquée par** : US-0302
- **Critères d'acceptation** :
  - Une page Récits liste les récits du plus récent au plus ancien, chacun avec sa date et son heure.
  - Les récits non lus sont marqués, et leur nombre s'affiche sur l'entrée « Récits » de la navigation.
  - Ouvrir un récit le marque comme lu.
  - Sans aucun récit, la page affiche « Rien à raconter pour l'instant. »
  - Sur mobile, la liste tient sur une colonne, sans défilement de côté.

### US-0325 · Entrer en Famine
**En tant que** joueur, **je veux** voir clairement quand mon Territoire entre en Famine, **afin de** réagir au plus vite.

- **Débloquée par** : US-0321
- **Critères d'acceptation** :
  - La Famine commence à l'heure où la Nourriture ne suffit plus à payer l'Entretien.
  - Un Habitant mange indifféremment de la Viande ou des Végétaux : la Famine ne commence que quand les deux ensemble ne suffisent plus (à décider).
  - Dans la barre du haut, « famine imminente » laisse la place à « Famine ».
  - En vitesse accélérée, la Famine commence exactement au moment prévu.

### US-0326 · Voir des Habitants s'en aller
**En tant que** joueur, **je veux** que la Famine fasse partir des Habitants selon une règle claire, **afin de** comprendre ce que me coûte le manque de Nourriture.

- **Débloquée par** : US-0325
- **Critères d'acceptation** :
  - Le nombre de départs suit une seule règle : autant qu'il faut pour que l'Entretien restant soit payé, ou (chiffre à régler) Habitants par heure de Famine (à décider).
  - L'ordre des départs suit une seule règle : les Habitants sans Métier d'abord, ou au hasard (à décider).
  - Le nombre d'Habitants et les effectifs par Métier baissent aussitôt.
  - En vitesse accélérée, une Famine provoquée fait partir exactement le nombre d'Habitants prévu.

### US-0327 · Être informé des départs par un récit
**En tant que** joueur, **je veux** un récit qui dit qui est parti à cause de la Famine, **afin de** mesurer les dégâts.

- **Débloquée par** : US-0324, US-0326
- **Critères d'acceptation** :
  - Les départs donnent un récit : combien d'Habitants sont partis, avec quels Métiers, et à quelle heure.
  - Plusieurs heures de Famine pendant une absence donnent un seul récit récapitulatif, pas un récit par heure.
  - Si des départs ont eu lieu en mon absence, un bandeau le signale dès l'ouverture de la page.
  - Le récit rappelle comment sortir de la Famine : produire plus de Nourriture ou nourrir moins de bouches.

### US-0328 · Sortir de la Famine
**En tant que** joueur, **je veux** voir ma Famine s'arrêter dès que ma Nourriture suffit de nouveau, **afin de** reprendre le cours normal de mon Territoire.

- **Débloquée par** : US-0326
- **Critères d'acceptation** :
  - Dès que l'Entretien peut de nouveau être payé, les départs cessent.
  - L'indication « Famine » quitte la barre du haut.
  - Les Habitants partis ne reviennent pas.
  - Un récit signale la fin de la Famine et le total des départs.

### US-0329 · Afficher un Territoire sans Habitant
**En tant que** joueur, **je veux** comprendre quoi faire si je n'ai plus aucun Habitant, **afin de** pouvoir toujours relancer mon Territoire.

- **Débloquée par** : US-0326
- **Critères d'acceptation** :
  - La Famine peut faire partir le dernier Habitant, ou elle en garde toujours au moins un (à décider).
  - Sans Habitant, la page Habitants affiche un état vide qui explique que des Voyageurs finiront par passer.
  - La production continue du Foyer se poursuit même sans Habitant.

### US-0330 · Laisser partir un Habitant
**En tant que** joueur, **je veux** pouvoir renvoyer un Habitant de moi-même, **afin de** réduire l'Entretien avant qu'une Famine ne s'installe.

- **Débloquée par** : US-0326
- **Critères d'acceptation** :
  - Le joueur peut renvoyer un Habitant de lui-même (à décider).
  - Si c'est possible, une confirmation est demandée et le départ est définitif.
  - Le nombre d'Habitants, les effectifs et l'Entretien baissent aussitôt.
  - Un récit garde la trace du départ.

## Étape 17 · Les Voyageurs

### US-0331 · Voir arriver des Voyageurs de temps en temps
**En tant que** joueur, **je veux** qu'un Voyageur se présente de temps en temps à mes portes, **afin de** voir mon Territoire grandir.

- **Débloquée par** : US-0305
- **Critères d'acceptation** :
  - Un Voyageur arrive en moyenne toutes les (chiffre à régler) heures, à des moments irréguliers.
  - Les arrivées sont calculées aussi pendant l'absence du joueur, sans en perdre ni en inventer au rattrapage.
  - Au plus (chiffre à régler) Voyageurs attendent en même temps ; au-delà, aucun nouveau ne se présente.
  - En vitesse accélérée, les arrivées suivent le même rythme, cent fois plus vite.

### US-0332 · Voir les Voyageurs qui attendent aux portes
**En tant que** joueur, **je veux** voir les Voyageurs qui attendent aux portes, **afin de** décider de leur sort.

- **Débloquée par** : US-0331
- **Critères d'acceptation** :
  - Une partie « Aux portes » de la page Habitants montre chaque Voyageur qui attend.
  - Quand personne n'attend, elle affiche « Personne aux portes pour l'instant. »
  - Un repère sur l'entrée « Habitants » de la navigation signale qu'un Voyageur attend.

### US-0333 · Suivre le compte à rebours d'un Voyageur
**En tant que** joueur, **je veux** voir combien de temps un Voyageur va encore attendre, **afin de** revenir avant qu'il ne reparte.

- **Débloquée par** : US-0332
- **Critères d'acceptation** :
  - Chaque Voyageur attend (chiffre à régler) heures ; la tour de guet et la taverne changeront ces durées à l'étape 30.
  - Le temps restant s'affiche et diminue en direct, sans recharger la page.
  - Sous (chiffre à régler) minutes, le compte à rebours passe dans la couleur d'alerte.

### US-0334 · Accueillir un Voyageur
**En tant que** joueur, **je veux** accueillir un Voyageur, **afin de** gagner un nouvel Habitant.

- **Débloquée par** : US-0332
- **Critères d'acceptation** :
  - Le bouton « Accueillir » fait du Voyageur un Habitant sans Métier, et le retire des portes.
  - Le nombre d'Habitants, les effectifs et l'Entretien montent aussitôt.
  - Un récit court signale l'arrivée du nouvel Habitant.
  - Accueillir un Voyageur ne coûte rien (à décider).

### US-0335 · Donner un Métier dès l'accueil
**En tant que** joueur, **je veux** choisir le Métier d'un Voyageur au moment où je l'accueille, **afin de** mettre le nouvel Habitant au travail tout de suite.

- **Débloquée par** : US-0334, US-0308
- **Critères d'acceptation** :
  - Au moment d'accueillir, on peut choisir l'un des huit Métiers.
  - Sans choix, le nouvel Habitant arrive sans Métier.
  - Les compteurs par Métier en tiennent compte aussitôt.

### US-0336 · Refuser un Voyageur
**En tant que** joueur, **je veux** refuser un Voyageur, **afin de** garder ma place et ma Nourriture pour plus tard.

- **Débloquée par** : US-0332
- **Critères d'acceptation** :
  - Le bouton « Refuser » fait repartir le Voyageur aussitôt.
  - Il disparaît des portes et ne revient pas.
  - Sa place aux portes se libère pour un prochain Voyageur.

### US-0337 · Laisser repartir un Voyageur ignoré
**En tant que** joueur, **je veux** qu'un Voyageur que je n'ai pas accueilli reparte à la fin de son attente, **afin de** ne pas garder à mes portes des Voyageurs oubliés.

- **Débloquée par** : US-0333
- **Critères d'acceptation** :
  - À la fin du compte à rebours, le Voyageur repart seul.
  - Cela arrive aussi pendant l'absence du joueur, au bon moment lors du rattrapage.
  - Un récit signale les Voyageurs repartis sans avoir été accueillis, regroupés s'il y en a eu plusieurs pendant une absence.
  - Tenter d'accueillir un Voyageur déjà reparti affiche « Ce Voyageur est déjà reparti. »

### US-0338 · Bloquer l'accueil quand la place manque
**En tant que** joueur, **je veux** qu'on m'explique pourquoi je ne peux pas accueillir un Voyageur quand la place manque, **afin de** comprendre ce qu'il me faut.

- **Débloquée par** : US-0334, US-0305
- **Critères d'acceptation** :
  - Quand toute la place est prise, le bouton « Accueillir » est grisé.
  - Un message explique qu'il n'y a plus de place, et que des huttes en ajouteront quand les constructions seront là.
  - Le Voyageur continue d'attendre : si de la place se libère avant la fin de son attente, on peut l'accueillir.
  - Le jeu refuse l'accueil même si la demande arrive par un autre chemin que le bouton.

### US-0339 · Empêcher un double accueil
**En tant que** joueur, **je veux** qu'un Voyageur ne devienne jamais deux Habitants, **afin de** garder des comptes justes.

- **Débloquée par** : US-0338
- **Critères d'acceptation** :
  - Un double clic sur « Accueillir » ne crée qu'un seul Habitant.
  - Un Voyageur refusé sur un appareil ne peut plus être accueilli sur un autre.
  - Deux Voyageurs accueillis en même temps pour une seule place libre : un seul entre, l'autre reste aux portes avec le message de place manquante.

### US-0340 · Mesurer l'Entretien en plus avant d'accueillir
**En tant que** joueur, **je veux** voir ce que mangera un Voyageur avant de l'accueillir, **afin de** ne pas précipiter une Famine.

- **Débloquée par** : US-0334, US-0321
- **Critères d'acceptation** :
  - Près du bouton « Accueillir », une ligne rappelle l'Entretien en plus : (chiffre à régler) Nourriture par heure.
  - Quand l'avertissement « famine imminente » est actif, l'accueil demande une confirmation.
  - Pendant une Famine, l'accueil reste possible (à décider).

### US-0341 · Fermer les portes aux Voyageurs pendant une Famine
**En tant que** joueur, **je veux** comprendre pourquoi personne ne vient pendant une Famine, **afin de** ne pas croire que le jeu s'est arrêté.

- **Débloquée par** : US-0331, US-0325
- **Critères d'acceptation** :
  - Aucun nouveau Voyageur ne se présente pendant une Famine (à décider).
  - Les Voyageurs qui attendaient déjà restent jusqu'à la fin de leur attente.
  - La partie « Aux portes » explique que les Voyageurs évitent un Territoire en Famine.

### US-0342 · Consulter l'historique des Voyageurs
**En tant que** joueur, **je veux** voir les Voyageurs passés et ce qu'ils sont devenus, **afin de** voir si j'en laisse trop repartir.

- **Débloquée par** : US-0336, US-0337
- **Critères d'acceptation** :
  - Un historique liste les Voyageurs passés, avec leur heure d'arrivée et leur sort : accueilli, refusé ou reparti.
  - Les plus récents viennent en premier, sur les (chiffre à régler) derniers jours.
  - En tête, deux compteurs : Voyageurs accueillis et Voyageurs perdus.
  - Sans historique, il affiche « Aucun Voyageur n'est encore passé. »

### US-0343 · Accueillir les Voyageurs sur mobile
**En tant que** joueur, **je veux** accueillir ou refuser un Voyageur au pouce, **afin de** régler cela en quelques secondes sur mon téléphone.

- **Débloquée par** : US-0334, US-0336
- **Critères d'acceptation** :
  - Chaque Voyageur tient dans un bloc d'une colonne, avec son compte à rebours.
  - « Accueillir » et « Refuser » sont assez grands et assez écartés pour éviter une erreur de toucher.
  - Aucun défilement de côté.
