# Jalon 16 · Le confort

Le jeu devient agréable à vivre au quotidien : il prévient le chef des seuls événements qui comptent, le laisse partir au Repos sans rien perdre, et se joue entièrement au pouce sur un téléphone. Étapes couvertes : 64 à 66 de l'ordre d'attaque.

## Étape 64 · Les notifications

### US-1601 · Proposer les notifications au bon moment
**En tant que** joueur, **je veux** que le jeu me propose d'activer les notifications en m'expliquant à quoi elles servent, **afin de** choisir en connaissance de cause.

- **Débloquée par** : Étape 63
- **Critères d'acceptation** :
  - La proposition n'apparaît jamais à la première visite, mais à un moment où elle a du sens, par exemple à l'approche de la fin du Bouclier des débutants (à décider).
  - Un écran du jeu présente d'abord les quatre événements notifiés (Attaque, Incursion, famine imminente, Apparition), puis déclenche la demande du navigateur.
  - Un refus n'est pas redemandé à chaque visite.
  - La proposition reste accessible à tout moment depuis les réglages.

### US-1602 · Recevoir une notification quand le jeu est fermé
**En tant que** joueur, **je veux** recevoir les notifications même quand aucun onglet du jeu n'est ouvert, **afin de** ne rien manquer quand je suis loin de mon écran.

- **Débloquée par** : US-1601
- **Critères d'acceptation** :
  - Une notification arrive alors qu'aucun onglet du jeu n'est ouvert sur l'appareil.
  - L'événement est détecté par le passage régulier du temps, même si le joueur est absent ; le retard maximal entre l'événement et la notification (chiffre à régler).
  - Un abonnement devenu invalide est retiré sans erreur visible pour le joueur.

### US-1603 · Recevoir les notifications sur téléphone
**En tant que** joueur, **je veux** recevoir les notifications sur mon téléphone, **afin de** ne rien manquer quand je suis loin de mon ordinateur.

- **Débloquée par** : US-1602
- **Critères d'acceptation** :
  - Les notifications arrivent sur un téléphone Android depuis le navigateur.
  - Sur iPhone, où il faut d'abord ajouter le jeu à l'écran d'accueil, un écran explique comment faire, pas à pas.
  - Le texte d'une notification tient sur l'écran verrouillé sans être coupé au milieu de l'information utile.

### US-1604 · Toucher une notification ouvre le bon écran
**En tant que** joueur, **je veux** qu'une notification m'amène directement à ce qu'elle annonce, **afin de** réagir en un geste.

- **Débloquée par** : US-1602
- **Critères d'acceptation** :
  - Toucher une notification ouvre le jeu sur l'annonce ou l'écran concerné.
  - Si le jeu est déjà ouvert dans un onglet, cet onglet passe au premier plan au lieu d'en ouvrir un autre.
  - Si le joueur n'est plus connecté, il retrouve le bon écran juste après sa connexion.

### US-1605 · Être notifié d'une Attaque
**En tant que** chef attaqué, **je veux** une notification dès qu'une Attaque est annoncée contre moi, **afin de** rappeler mes Bêtes ou renforcer mes défenses à temps.

- **Débloquée par** : US-1604, Étape 58
- **Critères d'acceptation** :
  - La notification part au moment de l'annonce, pas au moment du combat.
  - Elle donne le nom du chef attaquant et le temps avant l'arrivée.
  - Une seule notification par Attaque.
  - Aucune notification ne part pour une Attaque déjà rappelée avant l'annonce.

### US-1606 · Être notifié d'une Incursion
**En tant que** chef attaqué, **je veux** une notification dès qu'une Incursion est annoncée, **afin de** préparer ma défense même loin du jeu.

- **Débloquée par** : US-1604, Étape 54
- **Critères d'acceptation** :
  - La notification part au moment de l'annonce de l'Incursion.
  - Elle donne le temps avant l'arrivée.
  - Une seule notification par Incursion.

### US-1607 · Être notifié d'une famine imminente
**En tant que** joueur, **je veux** une notification quand l'avertissement « famine imminente » apparaît, **afin de** sauver mes Bêtes et mes Habitants à temps.

- **Débloquée par** : US-1604, Étape 36
- **Critères d'acceptation** :
  - La notification part au moment où l'avertissement apparaît, pour les Habitants comme pour les Bêtes.
  - Elle indique le temps restant avant la Famine.
  - Elle n'est pas répétée à chaque heure ; un rappel unique plus proche de la Famine s'ajoute ou non (à décider).

### US-1608 · Être notifié d'une Apparition
**En tant que** joueur, **je veux** une notification quand une Apparition surgit, **afin de** tenter ma chance parmi les premiers.

- **Débloquée par** : US-1604, Étape 63
- **Critères d'acceptation** :
  - La notification part à chaque chef qui reçoit l'annonce de l'Apparition dans le jeu.
  - Elle nomme l'Espèce mythique et le temps que durera l'Apparition.
  - Une seule notification par Apparition.

### US-1609 · Régler chaque notification séparément
**En tant que** joueur, **je veux** couper ou rétablir chaque type de notification séparément, **afin de** ne recevoir que ce qui m'intéresse.

- **Débloquée par** : US-1605, US-1606, US-1607, US-1608
- **Critères d'acceptation** :
  - Les réglages listent les quatre types (Attaque, Incursion, famine imminente, Apparition), chacun avec son interrupteur.
  - Couper un type n'empêche pas les autres d'arriver.
  - Le choix est gardé d'une visite à l'autre, pour tout le compte ou pour chaque appareil (à décider).
  - Les quatre types sont activés par défaut après l'accord du navigateur.

### US-1610 · Rien d'autre n'est envoyé
**En tant que** développeur, **je veux** vérifier que seuls ces quatre événements déclenchent une notification, **afin de** garantir que le jeu ne devienne jamais envahissant.

- **Débloquée par** : US-1609
- **Critères d'acceptation** :
  - Un retour de Récolte ou d'Expédition, une construction finie, un Voyageur ou une Rencontre n'envoient aucune notification.
  - Un test fait passer plusieurs jours de jeu en temps accéléré et vérifie que seules des notifications des quatre types sont parties.
  - Un même événement ne produit jamais deux notifications sur le même appareil.

### US-1611 · Recevoir sur tous ses appareils
**En tant que** joueur, **je veux** recevoir les notifications sur chacun des appareils où je les ai acceptées, **afin de** rester informé où que je sois.

- **Débloquée par** : US-1603
- **Critères d'acceptation** :
  - Un ordinateur et un téléphone abonnés reçoivent tous deux la notification.
  - Un appareil sur lequel le joueur s'est déconnecté ne reçoit plus rien.
  - Les réglages listent les appareils abonnés, et chacun peut être retiré.

### US-1612 · Voir l'état des notifications
**En tant que** joueur, **je veux** voir si les notifications fonctionnent sur mon appareil, **afin de** comprendre pourquoi je ne reçois rien.

- **Débloquée par** : US-1609
- **Critères d'acceptation** :
  - Les réglages indiquent si l'accord du navigateur est donné, refusé ou pas encore demandé.
  - En cas de refus, un texte explique comment le rétablir dans le navigateur.
  - Un bouton envoie une notification d'essai sur l'appareil.

## Étape 65 · Le Repos

### US-1613 · Activer le Repos
**En tant que** joueur, **je veux** mettre mon Territoire au Repos, **afin de** m'absenter sans rien perdre.

- **Débloquée par** : Étape 54, Étape 58
- **Critères d'acceptation** :
  - Un bouton des réglages ouvre l'activation du Repos, qui rappelle sa durée minimale (chiffre à régler).
  - Une confirmation explique ce qui change : plus de production, plus d'Entretien, plus d'Attaque ni d'Incursion.
  - Le Repos commence dès la confirmation.
  - Une marque « au Repos » s'affiche sur le Foyer, avec la date à partir de laquelle on peut en sortir.

### US-1614 · Quand le Repos est refusé
**En tant que** joueur, **je veux** savoir pourquoi je ne peux pas passer au Repos, **afin de** savoir quand ce sera possible.

- **Débloquée par** : US-1613
- **Critères d'acceptation** :
  - Le Repos est impossible pendant qu'une Attaque ou une Incursion est annoncée contre moi (à décider).
  - Le Repos est impossible tant qu'une de mes Attaques est en chemin (à décider).
  - Un délai minimal sépare deux Repos (chiffre à régler) (à décider).
  - Le message de refus dit pourquoi, et à partir de quand ce sera possible.

### US-1615 · Les sorties en cours au moment du Repos
**En tant que** joueur, **je veux** savoir ce que deviennent mes Récoltes et mes Expéditions quand je passe au Repos, **afin de** ne pas les perdre.

- **Débloquée par** : US-1613
- **Critères d'acceptation** :
  - Au moment du Repos, les sorties en cours doivent être rentrées, sont rappelées d'office, ou restent figées là où elles sont (à décider).
  - Quelle que soit la règle, aucune Bête et aucun Habitant n'est perdu du fait du Repos.
  - La confirmation du Repos liste les sorties concernées et ce qui va leur arriver.

### US-1616 · Plus de production pendant le Repos
**En tant que** joueur, **je veux** que mes stocks ne bougent plus pendant le Repos, **afin de** les retrouver tels que je les ai laissés.

- **Débloquée par** : US-1613
- **Critères d'acceptation** :
  - La production continue des Cases s'arrête pendant le Repos.
  - Les Bêtes au Rôle de Nourricier ne produisent plus rien non plus.
  - La barre du haut affiche une production horaire nulle et la marque du Repos.

### US-1617 · Plus d'Entretien pendant le Repos
**En tant que** joueur, **je veux** que mes Bêtes et mes Habitants ne mangent plus pendant le Repos, **afin de** ne pas revenir à une Famine.

- **Débloquée par** : US-1613
- **Critères d'acceptation** :
  - L'Entretien des Bêtes et la Nourriture des Habitants ne sont plus prélevés pendant le Repos.
  - Aucun avertissement « famine imminente » et aucune Famine ne peuvent survenir pendant le Repos.
  - Un avertissement déjà affiché au moment du Repos reprend à la sortie, avec le même temps restant.

### US-1618 · Inattaquable pendant le Repos
**En tant que** joueur, **je veux** que personne ne puisse m'attaquer pendant mon Repos, **afin de** partir l'esprit tranquille.

- **Débloquée par** : US-1613, Étape 59
- **Critères d'acceptation** :
  - Aucune Attaque ne peut viser un chef au Repos : le bouton « Attaquer » est grisé avec la mention « au Repos ».
  - Aucune Incursion ne vise un Territoire au Repos.
  - La fiche du chef et ses Cases portent la marque du Repos pour les autres chefs.
  - Aucune de ses Cases de Marche ne peut être prise.

### US-1619 · Tout reste figé pendant le Repos
**En tant que** joueur, **je veux** que mes chantiers, mes Recherches, mon Élevage et mes Blessés restent figés pendant le Repos, **afin de** tout retrouver au même point.

- **Débloquée par** : US-1616, US-1617
- **Critères d'acceptation** :
  - Un chantier, une Recherche ou un Élevage en cours reprend à la sortie avec exactement le même temps restant.
  - Les Blessés ne guérissent pas pendant le Repos et reprennent leur guérison à la sortie.
  - Aucun Voyageur n'arrive pendant le Repos ; un Voyageur qui attendait aux portes attend toujours à la sortie, avec le même temps restant.

### US-1620 · Ce que le chef peut faire pendant le Repos
**En tant que** joueur, **je veux** savoir ce que je peux encore faire pendant mon Repos, **afin de** ne pas le rompre sans le vouloir.

- **Débloquée par** : US-1619
- **Critères d'acceptation** :
  - Le chef peut consulter tous les écrans, ses récits, son Bestiaire et les classements.
  - Toute action qui ferait bouger le Territoire (lancer une sortie, construire, élever, changer un Métier) est interdite, ou met fin au Repos après confirmation (à décider).
  - Un bouton interdit explique qu'il est bloqué par le Repos.

### US-1621 · Sortir du Repos
**En tant que** joueur, **je veux** sortir du Repos quand je le décide, une fois la durée minimale passée, **afin de** reprendre la partie à mon retour.

- **Débloquée par** : US-1619
- **Critères d'acceptation** :
  - Le bouton « Sortir du Repos » n'est actif qu'après la durée minimale ; avant, il affiche le temps restant.
  - La sortie remet tout en marche à l'instant même.
  - Un message confirme le retour et rappelle ce qui reprend (chantiers, Recherche, sorties).
  - Le Repos a une durée maximale, au-delà de laquelle il s'arrête de lui-même, ou n'en a pas (à décider).

### US-1622 · Retrouver tout exactement comme avant
**En tant que** développeur, **je veux** vérifier qu'une semaine de Repos laisse le Territoire exactement dans son état de départ, **afin de** tenir la promesse du Repos.

- **Débloquée par** : US-1621
- **Critères d'acceptation** :
  - Un test en temps accéléré compare le Territoire juste avant et juste après une semaine de Repos : stocks, Bêtes, Blessés, Habitants, chantiers, Recherche et Voyageurs sont identiques.
  - Le rattrapage du temps à l'ouverture de page ne fait rien avancer pendant la période de Repos.
  - Le même test passe page ouverte et page fermée.

### US-1623 · Le Monde continue pendant le Repos
**En tant que** joueur, **je veux** savoir que le Monde continue de vivre pendant mon Repos, **afin de** comprendre ce que j'ai manqué.

- **Débloquée par** : US-1621, Étape 63
- **Critères d'acceptation** :
  - Les Saisons, les Migrations et les Apparitions continuent pendant mon Repos ; les Bêtes sauvages apparaissent et disparaissent comme d'habitude.
  - Mes chiffres ne changent pas dans les classements, mais les autres chefs peuvent me dépasser.
  - Les notifications d'Apparition continuent d'arriver pendant le Repos, ou non (à décider).
  - À la sortie, un résumé liste les événements du Monde survenus pendant le Repos.

## Étape 66 · Le tour complet sur mobile

### US-1624 · Choisir les téléphones de référence
**En tant que** développeur, **je veux** une liste de vrais téléphones de référence et une grille de vérification par écran, **afin de** tester chaque écran de la même façon.

- **Débloquée par** : US-1612, US-1621
- **Critères d'acceptation** :
  - La liste comprend au moins un petit téléphone Android et un iPhone récent ; la largeur d'écran minimale visée (chiffre à régler).
  - La grille vérifie, pour chaque écran : lisibilité, boutons atteignables au pouce, absence de zoom et de défilement de côté.
  - Chaque passage de la grille est noté, écran par écran, avec ce qui reste à corriger.

### US-1625 · La barre du haut sur téléphone
**En tant que** joueur, **je veux** lire mes quatre ressources et le nom de mon chef d'un coup d'œil sur mon téléphone, **afin de** savoir où j'en suis dès l'ouverture.

- **Débloquée par** : US-1624
- **Critères d'acceptation** :
  - La Viande, les Végétaux, le Bois et la Pierre restent lisibles à la largeur minimale visée.
  - Un stock plein reste signalé.
  - La production horaire et la limite de chaque stock s'affichent d'un toucher sur la ressource.
  - Les bandeaux d'Incursion, d'Attaque et de famine imminente s'empilent sous la barre sans la cacher.

### US-1626 · Naviguer au pouce entre les écrans
**En tant que** joueur, **je veux** passer d'un écran à l'autre d'une seule main, **afin de** jouer confortablement dans les transports.

- **Débloquée par** : US-1624
- **Critères d'acceptation** :
  - Le menu est atteignable avec le pouce, en tenant le téléphone d'une main ; sa forme exacte (à décider).
  - Chaque écran s'atteint en deux touchers au plus depuis n'importe quel autre.
  - L'écran en cours est signalé dans le menu.

### US-1627 · Des boutons faciles à toucher
**En tant que** joueur, **je veux** des boutons assez grands et assez espacés, **afin de** ne jamais toucher le mauvais.

- **Débloquée par** : US-1624
- **Critères d'acceptation** :
  - Chaque bouton et chaque élément à toucher a une taille minimale adaptée au doigt (chiffre à régler).
  - Aucune information n'est accessible seulement au survol de la souris : elle s'obtient aussi d'un toucher.
  - Les actions irréversibles (lancer une Attaque, passer au Repos) demandent une confirmation.

### US-1628 · Choisir des nombres au pouce
**En tant que** joueur, **je veux** choisir un nombre de Bêtes ou d'Habitants sans taper au clavier, **afin de** préparer une sortie en quelques gestes.

- **Débloquée par** : US-1624
- **Critères d'acceptation** :
  - Chaque choix de nombre propose des boutons « moins » et « plus », et des raccourcis « aucun » et « tout ».
  - Toucher le nombre ouvre un clavier numérique, pas un clavier complet.
  - Un nombre impossible (plus que le disponible) est ramené au maximum possible, avec un message.

### US-1629 · La carte au doigt
**En tant que** joueur, **je veux** parcourir la carte au doigt sur mon téléphone, **afin de** trouver une Case sans effort.

- **Débloquée par** : US-1624
- **Critères d'acceptation** :
  - Un doigt fait glisser la carte, deux doigts zooment.
  - Toucher une Case ouvre sa fiche dans un panneau en bas de l'écran, qui ne cache pas la Case touchée.
  - Un bouton ramène la carte sur le Foyer.
  - La carte reste fluide sur le petit téléphone de référence.

### US-1630 · Préparer une sortie sur téléphone
**En tant que** joueur, **je veux** préparer une Récolte, une Expédition ou une Attaque entièrement sur mon téléphone, **afin de** ne jamais avoir besoin d'un ordinateur.

- **Débloquée par** : US-1628, US-1629
- **Critères d'acceptation** :
  - La préparation tient dans la largeur de l'écran, sans défilement de côté.
  - Le résumé (force, charge, durée du trajet, heure d'arrivée) et le bouton d'envoi restent visibles pendant qu'on choisit les Bêtes et les Habitants.
  - La liste des sorties en cours, avec leurs comptes à rebours et le bouton « Rappeler », tient elle aussi dans l'écran.

### US-1631 · Les écrans de gestion sur téléphone
**En tant que** joueur, **je veux** que les écrans Habitants, constructions, Recherche, Réserve et Bestiaire soient confortables sur téléphone, **afin de** gérer mon Territoire partout.

- **Débloquée par** : US-1627
- **Critères d'acceptation** :
  - Les blocs Bento s'empilent sur une seule colonne, dans un ordre qui garde en tête le plus utile.
  - Les illustrations des Espèces et des constructions s'adaptent à la largeur sans être coupées.
  - Chaque écran passe la grille de vérification sur les téléphones de référence.

### US-1632 · Les récits sur téléphone
**En tant que** joueur, **je veux** lire mes récits confortablement sur téléphone, **afin de** comprendre un combat ou une Rencontre sans zoomer.

- **Débloquée par** : US-1627
- **Critères d'acceptation** :
  - La liste des récits montre pour chacun un titre, l'heure et une marque « non lu ».
  - Dans un récit de combat, les Bêtes des deux camps s'affichent l'une sous l'autre plutôt qu'en tableau trop large.
  - Aucun récit ne demande de zoom ni de défilement de côté.

### US-1633 · Tenir le téléphone en largeur
**En tant que** joueur, **je veux** savoir si le jeu se joue aussi en tenant le téléphone en largeur, **afin de** ne pas être gêné en le tournant.

- **Débloquée par** : US-1631
- **Critères d'acceptation** :
  - Le jeu est pensé d'abord pour le téléphone tenu en hauteur.
  - La tenue en largeur est adaptée, ou simplement tolérée sans casser l'affichage (à décider).
  - Tourner le téléphone ne perd jamais une saisie en cours.

### US-1634 · Ajouter le jeu à l'écran d'accueil
**En tant que** joueur, **je veux** ajouter Bestia à l'écran d'accueil de mon téléphone, **afin de** l'ouvrir comme une application.

- **Débloquée par** : US-1603
- **Critères d'acceptation** :
  - Le jeu s'ajoute à l'écran d'accueil avec l'icône du loup et le nom « Bestia ».
  - Ouvert depuis l'écran d'accueil, il occupe tout l'écran, sans la barre d'adresse du navigateur.
  - La connexion est gardée entre le navigateur et le jeu ajouté à l'écran d'accueil, ou l'écran explique qu'il faut se reconnecter une fois.

### US-1635 · Jouer avec une connexion lente
**En tant que** joueur, **je veux** que le jeu reste utilisable avec une connexion faible, **afin de** jouer même dans le métro.

- **Débloquée par** : US-1630
- **Critères d'acceptation** :
  - Pendant le rattrapage du temps à l'ouverture, un indicateur montre que le jeu se met à jour.
  - Un bouton touché deux fois de suite, faute de réponse, ne lance jamais deux fois la même action.
  - Une action qui échoue faute de connexion l'annonce clairement et peut être relancée.

### US-1636 · Une session entière au pouce
**En tant que** joueur, **je veux** jouer une session complète sur mon téléphone sans jamais zoomer ni défiler de côté, **afin de** profiter de Bestia partout, plusieurs fois par jour.

- **Débloquée par** : US-1625, US-1626, US-1630, US-1631, US-1632
- **Critères d'acceptation** :
  - Le scénario se joue sur chaque téléphone de référence : se connecter, lire ses récits, réclamer une récompense d'Épreuve, relancer une Récolte, lancer une Expédition, élever des Bêtes, lancer un chantier, répondre à une annonce d'Attaque.
  - Tout le scénario se joue au pouce, téléphone tenu en hauteur, sans zoom ni défilement de côté.
  - Chaque accroc relevé devient une correction avant de déclarer le jalon terminé.
