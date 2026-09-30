# Jalon 14 · Les autres joueurs

Le Monde se peuple : on voit ses voisins, on peut les attaquer pour piller leurs stocks et prendre leurs Marches, sous des protections qui évitent l'acharnement, et trois classements comparent les chefs. Étapes couvertes : 56 à 60 de l'ordre d'attaque.

## Étape 56 · Voir ses voisins

### US-1401 · Voir les Territoires voisins sur la carte
**En tant que** joueur, **je veux** voir sur la carte les Territoires des autres joueurs, **afin de** savoir qui vit autour de moi.

- **Débloquée par** : Étape 52
- **Critères d'acceptation** :
  - Chaque Case d'un autre joueur, hors de mon brouillard, porte une marque qui la distingue de mes Cases et des Cases libres.
  - Les Cases d'un même Territoire se reconnaissent comme un seul ensemble.
  - Une Case encore dans mon brouillard ne révèle jamais son propriétaire.
  - Quand un voisin gagne ou perd une Case visible, ma carte le montre à ma visite suivante.

### US-1402 · Lire le nom du chef voisin
**En tant que** joueur, **je veux** lire le nom du chef sur son Territoire, **afin de** reconnaître mes voisins d'un coup d'œil.

- **Débloquée par** : US-1401
- **Critères d'acceptation** :
  - Le nom du chef s'affiche sur son Territoire dès que le zoom le permet.
  - Toucher une de ses Cases ouvre sa fiche : Biome, nom du propriétaire.
  - Sur téléphone, les noms restent lisibles et ne se chevauchent pas.

### US-1403 · Distinguer le Foyer et les Marches d'un voisin
**En tant que** joueur, **je veux** voir quelles Cases d'un voisin forment son Foyer et lesquelles forment ses Marches, **afin de** savoir ce qui pourrait être pris.

- **Débloquée par** : US-1402
- **Critères d'acceptation** :
  - Le Foyer d'un voisin porte la même marque d'imprenable que mon propre Foyer.
  - Ses Cases de Marche portent la même marque que mes propres Marches.
  - La fiche d'une Case voisine précise « Foyer » ou « Marche ».

### US-1404 · La fiche d'un chef voisin
**En tant que** joueur, **je veux** ouvrir la fiche d'un chef voisin, **afin de** mieux le connaître sans rien voir de ses secrets.

- **Débloquée par** : US-1402
- **Critères d'acceptation** :
  - La fiche montre le nom du chef et le nombre de Cases de son Territoire.
  - Elle ne montre jamais ses Bêtes, ses Couples, ses Habitants ni ses stocks.
  - Elle s'ouvre depuis n'importe laquelle de ses Cases visibles.

### US-1405 · La liste des voisins connus
**En tant que** joueur, **je veux** une liste des chefs dont j'ai déjà vu une Case, **afin de** les retrouver sans parcourir la carte.

- **Débloquée par** : US-1404
- **Critères d'acceptation** :
  - La liste donne chaque chef connu avec la distance entre son Territoire et le mien.
  - Toucher un chef centre la carte sur la partie visible de son Territoire.
  - Tant qu'aucun voisin n'est en vue, la liste affiche « Aucun voisin en vue : envoyez une Expédition pour lever le brouillard ».

## Étape 57 · Attaquer

### US-1406 · Choisir la cible d'une Attaque
**En tant que** joueur, **je veux** lancer la préparation d'une Attaque depuis la fiche d'un voisin ou d'une de ses Cases, **afin de** viser le Territoire que j'ai choisi.

- **Débloquée par** : US-1404, Étape 55
- **Critères d'acceptation** :
  - Un bouton « Attaquer » apparaît sur la fiche d'un chef voisin et de ses Cases hors de mon brouillard.
  - On ne peut viser que le Territoire d'un autre joueur : ni une Case libre, ni une sortie en chemin, ni son propre Territoire.
  - Le bouton ouvre la préparation de l'Attaque, avec le nom du chef visé.

### US-1407 · Choisir les Bêtes de l'Attaque
**En tant que** joueur, **je veux** choisir combien de Bêtes de chaque Espèce partent à l'Attaque, **afin de** doser ma force et ce que je laisse au Foyer.

- **Débloquée par** : US-1406
- **Critères d'acceptation** :
  - La préparation liste chaque Espèce avec le nombre de Bêtes présentes et disponibles.
  - Les Couples en Réserve, les Blessés et les Bêtes déjà sorties n'y figurent pas.
  - On choisit un nombre par Espèce, avec un raccourci pour tout prendre ou tout retirer.
  - Une Attaque sans aucune Bête ne peut pas partir.

### US-1408 · Voir la force, la charge et le trajet avant de partir
**En tant que** joueur, **je veux** voir la force, la charge et la durée du trajet de mon Attaque avant de l'envoyer, **afin de** savoir ce que je risque et ce que je peux rapporter.

- **Débloquée par** : US-1407
- **Critères d'acceptation** :
  - La préparation affiche la force totale, la charge totale, la durée de l'aller et l'heure d'arrivée.
  - Ces valeurs se mettent à jour à chaque changement de sélection.
  - Elle rappelle la force qui restera au Foyer pour se défendre.
  - Les Bêtes au Rôle de Porteur augmentent la charge d'une Attaque comme celle d'une Récolte, ou non (à décider).

### US-1409 · Le trajet de l'Attaque
**En tant que** joueur, **je veux** que mes Bêtes mettent un temps de trajet réaliste pour atteindre la cible, **afin de** tenir compte de la distance dans mes choix.

- **Débloquée par** : US-1408
- **Critères d'acceptation** :
  - La durée de l'aller dépend de la distance et de la vitesse de l'Espèce la plus lente de l'Attaque (chiffre à régler).
  - Les Bêtes parties ne défendent plus le Foyer et continuent de payer leur Entretien.
  - L'Attaque apparaît dans la liste de mes sorties avec son compte à rebours.

### US-1410 · Voir son Attaque sur la carte
**En tant que** joueur, **je veux** voir le trajet de mon Attaque sur la carte, **afin de** suivre où en sont mes Bêtes.

- **Débloquée par** : US-1409
- **Critères d'acceptation** :
  - Un trait relie mon Territoire à la cible tant que l'Attaque est en chemin.
  - Une marque avance le long du trait selon le temps écoulé.
  - Toucher la marque ouvre le détail de l'Attaque (Bêtes engagées, heure d'arrivée, heure de retour prévue).

### US-1411 · Rappeler une Attaque en chemin
**En tant que** joueur, **je veux** pouvoir rappeler une Attaque pendant l'aller, **afin de** renoncer si la situation change.

- **Débloquée par** : US-1409
- **Critères d'acceptation** :
  - Le rappel d'une Attaque pendant l'aller est possible, comme pour une Récolte (à décider).
  - S'il est possible, les Bêtes font demi-tour et rentrent en autant de temps qu'elles ont déjà marché.
  - Une Attaque rappelée ne combat pas et ne rapporte rien.

### US-1412 · Le combat à l'arrivée
**En tant que** joueur, **je veux** qu'à l'arrivée mes Bêtes affrontent les Bêtes restées chez le chef visé et ses défenses, **afin de** régler l'Attaque par un vrai combat.

- **Débloquée par** : US-1409
- **Critères d'acceptation** :
  - Le combat oppose mes Bêtes aux Bêtes présentes chez le chef attaqué et à ses défenses construites.
  - Il suit la même règle de somme des forces que les Incursions.
  - Les Couples en Réserve, les Bêtes sorties et les Blessés du chef attaqué ne combattent pas.
  - Les Habitants des deux camps ne combattent jamais.
  - Le combat se résout à l'heure prévue, même si aucun des deux joueurs n'est connecté.

### US-1413 · Les pertes des deux camps
**En tant que** chef attaqué, **je veux** que chaque camp subisse des pertes selon l'issue du combat, **afin de** faire payer l'Attaque aussi à celui qui la lance.

- **Débloquée par** : US-1412, Étape 42
- **Critères d'acceptation** :
  - Chaque camp perd des Bêtes selon l'écart de force, une partie en Blessés, le reste en morts (chiffre à régler).
  - Les Blessés de l'attaquant rentrent avec les survivants et guérissent chez lui.
  - Les Blessés du chef attaqué guérissent chez lui.
  - Aucune perte ne touche un Habitant ou un Couple.

### US-1414 · Piller dans la limite de la charge
**En tant que** joueur, **je veux** que mes Bêtes victorieuses emportent de la Nourriture et des Matériaux, **afin de** rapporter un butin à la hauteur de ce qu'elles peuvent porter.

- **Débloquée par** : US-1413
- **Critères d'acceptation** :
  - Si l'attaquant l'emporte, ses Bêtes survivantes emportent de la Nourriture et des Matériaux du chef attaqué.
  - Le butin total ne dépasse jamais la charge totale des Bêtes survivantes ; la charge des Blessés compte ou non (à décider).
  - Le butin ne dépasse jamais ce que le chef attaqué possède.
  - Un test vérifie qu'une Attaque de Bêtes à faible charge rapporte peu, même contre des stocks pleins.

### US-1415 · Répartir le butin entre les ressources
**En tant que** joueur, **je veux** savoir comment le butin se partage entre Viande, Végétaux, Bois et Pierre, **afin de** prévoir ce que je rapporterai.

- **Débloquée par** : US-1414
- **Critères d'acceptation** :
  - Le butin se prend selon une règle fixe : à parts égales, en proportion des stocks du chef attaqué, ou au choix de l'attaquant (à décider).
  - La même situation donne toujours la même répartition.
  - La répartition apparaît, ressource par ressource, dans les deux récits.

### US-1416 · Une part des stocks à l'abri
**En tant que** chef attaqué, **je veux** qu'une part de mes stocks échappe toujours au pillage, **afin de** ne jamais tout perdre en une seule Attaque.

- **Débloquée par** : US-1414
- **Critères d'acceptation** :
  - Une part des stocks ne peut jamais être pillée (chiffre à régler) (à décider).
  - Une construction peut augmenter cette part (à décider).
  - La part à l'abri s'affiche sur l'écran des stocks.

### US-1417 · Jamais de vol de Bêtes
**En tant que** chef attaqué, **je veux** être certain qu'une Attaque ne me prend jamais de Bêtes, **afin de** garder ce que j'ai mis des jours à apprivoiser et élever.

- **Débloquée par** : US-1413
- **Critères d'acceptation** :
  - Aucune Attaque ne fait passer une Bête d'un joueur à l'autre, quelle que soit son issue.
  - Les Couples en Réserve ne sont ni tués, ni blessés, ni emportés.
  - L'Élevage du chef attaqué reste ouvert quoi qu'il arrive.
  - Un test automatique le vérifie sur une longue série d'Attaques simulées.

### US-1418 · Le retour avec le butin
**En tant que** joueur, **je veux** que mes Bêtes rentrent chez moi avec le butin, **afin de** profiter de ma victoire.

- **Débloquée par** : US-1414
- **Critères d'acceptation** :
  - Les survivants rentrent en autant de temps qu'à l'aller.
  - À leur arrivée, le butin s'ajoute à mes stocks dans la limite de stock ; ce qui dépasse est perdu (à décider).
  - Les Bêtes rentrées redeviennent disponibles pour défendre ou repartir.
  - Rien ne peut intercepter les Bêtes sur le chemin du retour.

### US-1419 · Une Attaque perdue
**En tant que** joueur, **je veux** savoir ce qu'il advient de mes Bêtes quand le chef attaqué l'emporte, **afin de** mesurer le prix d'une Attaque mal préparée.

- **Débloquée par** : US-1413
- **Critères d'acceptation** :
  - Si le chef attaqué l'emporte, l'attaquant ne rapporte rien.
  - Les survivants de l'attaquant, Blessés compris, rentrent chez lui.
  - Si aucune Bête ne survit, rien ne rentre et le récit le dit.

### US-1420 · Attaquer un Territoire sans défense
**En tant que** joueur, **je veux** qu'une Attaque contre un chef sans Bête présente ni défense se règle sans combat, **afin de** comprendre l'issue sans ambiguïté.

- **Débloquée par** : US-1414
- **Critères d'acceptation** :
  - Sans Bête présente ni défense chez le chef attaqué, l'attaquant l'emporte sans combat et sans perte.
  - Le butin suit la même règle de charge.
  - Les deux récits disent clairement qu'il n'y a pas eu de combat.

### US-1421 · Le récit de l'attaquant
**En tant que** joueur, **je veux** un récit de chaque Attaque que je lance, **afin de** savoir ce qu'elle m'a coûté et rapporté.

- **Débloquée par** : US-1418, US-1419
- **Critères d'acceptation** :
  - Il donne la cible, l'heure, les Bêtes engagées des deux côtés (Espèce et nombre), la force totale de chaque camp et le vainqueur.
  - Il liste mes Blessés et mes morts, puis le butin ressource par ressource.
  - Il s'affiche dès le combat, puis se complète au retour avec le butin réellement reçu.

### US-1422 · Le récit du chef attaqué
**En tant que** chef attaqué, **je veux** un récit de chaque Attaque subie, **afin de** comprendre qui m'a attaqué et ce que j'ai perdu.

- **Débloquée par** : US-1418, US-1419
- **Critères d'acceptation** :
  - Il donne le nom du chef attaquant, l'heure, les Bêtes engagées des deux côtés et le vainqueur.
  - Il liste mes Blessés, mes morts et ce qui m'a été pillé, ressource par ressource.
  - Il s'affiche dès ma visite suivante si je n'étais pas connecté.
  - L'Attaque subie révèle ou non sur ma carte le Territoire de l'attaquant (à décider).

### US-1423 · Deux récits qui disent la même chose
**En tant que** développeur, **je veux** vérifier que les deux récits d'une même Attaque donnent les mêmes chiffres, **afin de** ne tromper aucun des deux joueurs.

- **Débloquée par** : US-1421, US-1422
- **Critères d'acceptation** :
  - Les forces, les pertes et le butin sont identiques dans les deux récits.
  - Ce que perd le chef attaqué égale ce que l'attaquant emporte.
  - Un test compare les deux récits sur une longue série d'Attaques simulées.

### US-1424 · Pas de combat hors des Territoires
**En tant que** joueur, **je veux** que mes sorties en chemin ne puissent jamais être attaquées par un autre joueur, **afin de** ne risquer mes Bêtes que sur un Territoire.

- **Débloquée par** : US-1412
- **Critères d'acceptation** :
  - Aucune Attaque ne peut viser une Récolte, une Expédition ou une Attaque en chemin.
  - Deux Expéditions de joueurs différents sur la même Case ne se battent jamais entre elles : elles se disputent seulement la Bête sauvage.
  - Une Case libre n'est jamais le lieu d'un combat entre joueurs.

### US-1425 · Rien ne passe d'un chef à l'autre hors du butin
**En tant que** joueur, **je veux** qu'aucun moyen détourné ne permette d'envoyer des ressources ou des Bêtes à un autre chef, **afin de** ne devoir ma force qu'à moi-même, comme chaque chef.

- **Débloquée par** : US-1414
- **Critères d'acceptation** :
  - Aucun écran ne permet d'envoyer des ressources ou des Bêtes à un autre joueur.
  - Le butin ne va jamais qu'à l'attaquant.
  - Une Attaque repoussée ne laisse pas de Viande au chef attaqué, pour qu'on ne puisse pas nourrir un ami en l'attaquant (à décider).

## Étape 58 · Les protections

### US-1426 · Être prévenu d'une Attaque
**En tant que** chef attaqué, **je veux** être prévenu dès qu'une Attaque est en route vers moi, **afin de** rappeler mes Bêtes ou renforcer mes défenses à temps.

- **Débloquée par** : US-1412, Étape 54
- **Critères d'acceptation** :
  - L'annonce donne le nom du chef attaquant, l'heure d'arrivée et un compte à rebours.
  - Sans tour de guet, le préavis est court mais existe (chiffre à régler).
  - Un bandeau visible sur tous les écrans rappelle l'Attaque jusqu'à son arrivée, comme pour une Incursion.
  - L'annonce n'arrive jamais après le combat.

### US-1427 · Le préavis selon la tour de guet
**En tant que** chef attaqué, **je veux** que ma tour de guet repère les Attaques plus tôt, **afin de** gagner du temps pour réagir.

- **Débloquée par** : US-1426
- **Critères d'acceptation** :
  - Chaque niveau de la tour de guet, et chaque employé à son Poste, allonge le préavis (chiffre à régler).
  - Quand le trajet est plus court que le préavis, l'annonce arrive dès le départ de l'Attaque.
  - Un test en temps accéléré mesure le bon préavis pour chaque niveau.

### US-1428 · Ce que l'annonce révèle de l'Attaque
**En tant que** chef attaqué, **je veux** savoir ce que l'annonce me dit des Bêtes qui arrivent, **afin de** juger si je peux tenir.

- **Débloquée par** : US-1426
- **Critères d'acceptation** :
  - L'annonce montre le nombre de Bêtes, leurs Espèces ou une force estimée, selon la tour de guet ou non (à décider).
  - Une Espèce que je n'ai jamais croisée apparaît en silhouette.
  - Si l'Attaque est rappelée, l'annonce disparaît et je suis prévenu du demi-tour.

### US-1429 · Le Bouclier des débutants
**En tant que** nouveau joueur, **je veux** être protégé des Attaques pendant mes débuts, **afin de** bâtir mon Territoire sans être pillé dès le premier jour.

- **Débloquée par** : US-1406
- **Critères d'acceptation** :
  - Un chef qui vient de naître ne peut pas être attaqué pendant une durée (chiffre à régler).
  - Le Bouclier dure un temps fixe, ou s'arrête aussi selon la progression du chef (à décider).
  - Le Bouclier protège tout son Territoire, Marches comprises.
  - Le jeu refuse toute Attaque contre lui, même si la demande ne passe pas par le bouton.

### US-1430 · Voir le Bouclier d'un voisin
**En tant que** joueur, **je veux** voir qu'un voisin est sous Bouclier, **afin de** ne pas préparer une Attaque impossible.

- **Débloquée par** : US-1429
- **Critères d'acceptation** :
  - La fiche du chef et ses Cases portent la marque du Bouclier, avec sa date de fin.
  - Le bouton « Attaquer » est grisé et explique pourquoi.
  - La marque disparaît à la fin du Bouclier sans recharger la page.

### US-1431 · Savoir quand mon Bouclier se termine
**En tant que** nouveau joueur, **je veux** voir le temps restant de mon Bouclier et être prévenu avant sa fin, **afin de** préparer ma défense.

- **Débloquée par** : US-1429
- **Critères d'acceptation** :
  - Le temps restant s'affiche sur le Foyer.
  - Un message prévient avant la fin du Bouclier (chiffre à régler).
  - À la fin, un message annonce que le Territoire peut désormais être attaqué.

### US-1432 · Attaquer pendant son Bouclier
**En tant que** nouveau joueur, **je veux** savoir si je peux attaquer pendant mon Bouclier, **afin de** ne pas le perdre sans le vouloir.

- **Débloquée par** : US-1429
- **Critères d'acceptation** :
  - Un débutant sous Bouclier peut attaquer, ou non (à décider).
  - S'il le peut, lancer une Attaque met fin à son Bouclier, après une confirmation (à décider).
  - La règle retenue s'affiche dans la préparation de l'Attaque.

### US-1433 · Limiter les Attaques par cible et par jour
**En tant que** chef attaqué, **je veux** qu'un même chef ne puisse m'attaquer qu'un nombre limité de fois par jour, **afin de** ne pas être vidé par un voisin acharné.

- **Débloquée par** : US-1406
- **Critères d'acceptation** :
  - Un chef ne peut pas lancer plus d'un certain nombre d'Attaques contre la même cible par jour (chiffre à régler).
  - L'Attaque de trop est refusée avec un message qui dit quand une nouvelle Attaque sera possible.
  - Une Attaque compte dès son départ, même rappelée ou perdue (à décider).
  - Une limite sur le total des Attaques qu'un chef peut subir par jour, tous attaquants confondus, s'ajoute ou non (à décider).

### US-1434 · Voir combien d'Attaques il me reste contre une cible
**En tant que** joueur, **je veux** voir combien d'Attaques il me reste aujourd'hui contre un chef, **afin de** ne pas découvrir la limite au dernier moment.

- **Débloquée par** : US-1433
- **Critères d'acceptation** :
  - La préparation affiche « Attaques restantes aujourd'hui contre ce chef : N ».
  - À la limite, le compteur affiche zéro et le bouton se grise.
  - Un « jour » est une période glissante de 24 heures ou un jour du calendrier (à décider).

## Étape 59 · Prendre une Marche

### US-1435 · Viser une Case de Marche
**En tant que** joueur, **je veux** choisir, en préparant une Attaque, une Case de Marche du chef visé à prendre, **afin de** grandir à ses dépens.

- **Débloquée par** : US-1412, US-1403
- **Critères d'acceptation** :
  - La préparation propose « prendre cette Case » seulement pour une Case de Marche du chef visé.
  - La Case doit toucher mon Territoire, pour qu'il reste d'un seul tenant.
  - Une seule Case peut être visée par Attaque.
  - L'option n'existe jamais pour une Case de Foyer.

### US-1436 · La Case change de main après la victoire
**En tant que** joueur, **je veux** que la Case visée passe dans mon Territoire si mon Attaque l'emporte, **afin de** voir ma victoire agrandir mon Territoire.

- **Débloquée par** : US-1435
- **Critères d'acceptation** :
  - Si l'Attaque l'emporte, la Case visée entre dans mon Territoire ; si elle perd, rien ne change.
  - La Case produit aussitôt selon son Biome pour moi et plus pour l'ancien propriétaire.
  - Ses Places d'Habitat passent de l'un à l'autre.
  - D'autres conditions que la victoire (un nombre de survivants, un Habitant ou un Avant-poste) (à décider).

### US-1437 · Le Foyer ne tombe jamais
**En tant que** chef attaqué, **je veux** être certain que mon Foyer ne peut jamais être pris, **afin de** garder toujours un point de départ.

- **Débloquée par** : US-1436
- **Critères d'acceptation** :
  - Aucune Attaque, quelle que soit sa force, ne fait changer de main une Case de Foyer.
  - La prise d'une Case de Foyer est impossible dès la préparation, et refusée par le jeu si la demande arrive autrement.
  - Un test lance une longue série d'Attaques écrasantes contre un Foyer : il reste toujours à son chef.

### US-1438 · Un Territoire coupé en deux
**En tant que** chef attaqué, **je veux** savoir ce que deviennent mes Cases séparées de mon Foyer quand on me prend une Case de Marche, **afin de** comprendre ce que je risque.

- **Débloquée par** : US-1436
- **Critères d'acceptation** :
  - Si la prise coupe mon Territoire, la partie séparée du Foyer redevient libre ou passe à l'attaquant (à décider).
  - La carte signale les Cases dont la perte couperait mon Territoire (à décider).
  - Après la prise, chaque Territoire reste d'un seul tenant.

### US-1439 · Ce que devient la Case prise
**En tant que** chef attaqué, **je veux** savoir ce qui arrive aux constructions et aux Bêtes logées sur une Case qui change de main, **afin de** ne pas avoir de mauvaise surprise.

- **Débloquée par** : US-1436
- **Critères d'acceptation** :
  - Les constructions de la Case passent au vainqueur ou sont détruites (à décider).
  - Si l'ancien propriétaire a désormais plus de Bêtes que de Places, le sort des Bêtes en trop (à décider).
  - La Case prise est une Marche ou non pour son nouveau propriétaire selon sa distance à son Foyer.

### US-1440 · Le récit d'une Case prise ou perdue
**En tant que** chef attaqué, **je veux** que le récit de l'Attaque dise clairement quelle Case j'ai perdue, **afin de** réagir vite.

- **Débloquée par** : US-1436, US-1422
- **Critères d'acceptation** :
  - Le récit de l'attaquant indique « Case prise », avec son Biome et son emplacement sur la carte.
  - Le récit du chef attaqué indique « Case perdue », avec les mêmes informations.
  - La carte des deux joueurs montre le changement dès leur visite suivante.

### US-1441 · Reprendre une Case perdue
**En tant que** chef attaqué, **je veux** pouvoir reprendre une Case qu'on m'a prise, **afin de** ne pas la perdre pour toujours.

- **Débloquée par** : US-1436
- **Critères d'acceptation** :
  - Si la Case prise est une Marche pour son nouveau propriétaire, je peux la viser par une Attaque, selon les mêmes règles.
  - Si elle est trop proche de son Foyer, elle n'est plus prenable.
  - La limite d'Attaques par cible et par jour s'applique aussi à cette reprise.

## Étape 60 · Les classements

### US-1442 · Le classement des Couples réunis
**En tant que** joueur, **je veux** voir les chefs du Monde rangés par nombre de Couples réunis, **afin de** mesurer mon avancée de dresseur face aux autres.

- **Débloquée par** : Étape 43
- **Critères d'acceptation** :
  - C'est le classement principal : la page des classements s'ouvre sur lui.
  - Chaque ligne donne le rang, le nom du chef et le nombre de Couples réunis.
  - Le Couple de départ compte comme un Couple réuni.
  - Seuls les chefs du même Monde y figurent.

### US-1443 · Le classement de la taille du Territoire
**En tant que** joueur, **je veux** voir les chefs rangés par nombre de Cases possédées, **afin de** comparer l'étendue de mon Territoire.

- **Débloquée par** : US-1442
- **Critères d'acceptation** :
  - Chaque ligne donne le rang, le nom du chef et le nombre de Cases de son Territoire.
  - Une Case prise ou perdue modifie le classement des deux chefs.
  - On passe d'un classement à l'autre d'un seul toucher.

### US-1444 · Le classement de la puissance de l'armée
**En tant que** joueur, **je veux** voir les chefs rangés par puissance de leur armée, **afin de** savoir qui est redoutable.

- **Débloquée par** : US-1442
- **Critères d'acceptation** :
  - La puissance est la somme des forces des Bêtes du chef, Couples en Réserve exclus.
  - Les Blessés comptent ou non (à décider).
  - Le détail de l'armée n'est jamais dévoilé : seul le total s'affiche.

### US-1445 · Trouver son rang
**En tant que** joueur, **je veux** retrouver mon rang dans chaque classement sans faire défiler toute la liste, **afin de** voir tout de suite où j'en suis.

- **Débloquée par** : US-1442, US-1443, US-1444
- **Critères d'acceptation** :
  - Ma ligne est mise en avant dans chaque classement.
  - Un bouton « Mon rang » fait défiler la liste jusqu'à ma ligne.
  - Mon rang dans le classement principal s'affiche aussi sur le Foyer.

### US-1446 · La mise à jour des classements
**En tant que** joueur, **je veux** savoir quand les classements ont été mis à jour, **afin de** pouvoir leur faire confiance.

- **Débloquée par** : US-1442
- **Critères d'acceptation** :
  - Les classements se mettent à jour à intervalle régulier (chiffre à régler).
  - La page indique l'heure de la dernière mise à jour.
  - Un Couple réuni, une Case gagnée ou une Bête élevée apparaît au plus tard à la mise à jour suivante.

### US-1447 · Départager les égalités
**En tant que** joueur, **je veux** une règle claire quand deux chefs sont à égalité, **afin de** ne jamais trouver l'ordre du classement arbitraire.

- **Débloquée par** : US-1442
- **Critères d'acceptation** :
  - En cas d'égalité, les chefs partagent le même rang ou sont départagés, par exemple par le premier arrivé au total (à décider).
  - L'ordre ne change pas d'une mise à jour à l'autre si les totaux ne changent pas.

### US-1448 · Un classement qui ne trahit pas le brouillard
**En tant que** joueur, **je veux** que le classement ne révèle jamais où se trouve un chef que je n'ai pas découvert, **afin de** garder tout son sens à l'exploration.

- **Débloquée par** : US-1445
- **Critères d'acceptation** :
  - Toucher un chef dans le classement ouvre sa fiche, sans montrer son Territoire s'il est dans mon brouillard.
  - Si une partie de son Territoire est visible, un bouton centre la carte dessus.
  - La fiche ouverte depuis le classement ne montre ni ses Bêtes ni ses stocks.

### US-1449 · Les classements sur téléphone
**En tant que** joueur, **je veux** lire les classements confortablement sur mon téléphone, **afin de** vérifier mon rang entre deux sessions.

- **Débloquée par** : US-1445
- **Critères d'acceptation** :
  - Les trois classements s'ouvrent par des onglets atteignables au pouce.
  - Chaque ligne tient dans la largeur de l'écran, sans défilement de côté.
  - Les noms de chef trop longs sont raccourcis sans cacher le rang ni le total.
