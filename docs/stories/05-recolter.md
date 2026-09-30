# Jalon 5 · Récolter

Le joueur envoie ses Habitants sur les Cases du Monde et en rapporte bien plus que ce que son Territoire produit seul : du Bois, de la Pierre, de la Viande et des Végétaux, au prix d'un trajet et d'un temps de travail, avec une abondance qui change chaque jour. Étapes couvertes : 21 à 24 de l'ordre d'attaque.

## Étape 21 · Une première Récolte

### US-0501 · Proposer une Récolte sur la fiche d'une forêt
**En tant que** joueur, **je veux** un bouton « Récolter » sur la fiche d'une Case de forêt, **afin de** pouvoir y envoyer mes bûcherons.

- **Débloquée par** : Étape 14, Étape 20
- **Critères d'acceptation** :
  - Sur la fiche d'une Case de forêt découverte, un bouton « Récolter » ouvre le formulaire de Récolte.
  - Les autres Biomes n'ont pas encore ce bouton : leurs Récoltes arrivent à l'étape 22.
  - Le bouton n'apparaît jamais sur une Case sous le brouillard.

### US-0502 · Choisir le nombre de bûcherons
**En tant que** joueur, **je veux** choisir combien de bûcherons partent, **afin de** garder des bras au Foyer si je le souhaite.

- **Débloquée par** : US-0501
- **Critères d'acceptation** :
  - Le formulaire affiche le nombre de bûcherons libres.
  - On choisit un nombre entre 1 et ce nombre, avec « + » et « − ».
  - Par défaut, tous les bûcherons libres sont choisis (à décider).

### US-0503 · Choisir la durée de travail
**En tant que** joueur, **je veux** choisir combien de temps mes bûcherons travaillent sur place, **afin de** caler leur retour sur ma prochaine visite.

- **Débloquée par** : US-0501
- **Critères d'acceptation** :
  - Plusieurs durées sont proposées en boutons, de (chiffre à régler) à (chiffre à régler).
  - La durée choisie ne compte que le travail sur place, sans le trajet.
  - La dernière durée utilisée est proposée par défaut la fois suivante.

### US-0504 · Calculer le trajet selon la distance
**En tant que** joueur, **je veux** que le trajet dure plus longtemps quand la Case est loin, **afin de** peser l'intérêt d'une Case lointaine.

- **Débloquée par** : US-0501, Étape 18
- **Critères d'acceptation** :
  - L'aller dure la distance en Cases entre le Foyer et la Case, multipliée par (chiffre à régler) minutes par Case.
  - Le retour dure autant que l'aller.
  - La distance est celle de la carte, en Cases à vol d'oiseau, en traversant l'eau plutôt qu'en la contournant (à décider).
  - Le Biome des Cases traversées ne change pas la vitesse (à décider).

### US-0505 · Voir le déroulé prévu avant de partir
**En tant que** joueur, **je veux** voir la durée de chaque phase et l'heure de retour avant de confirmer, **afin de** connaître le moment où revenir.

- **Débloquée par** : US-0502, US-0503, US-0504
- **Critères d'acceptation** :
  - Avant de partir, le formulaire affiche la durée de l'aller, du travail et du retour, et l'heure de retour prévue, à l'heure du joueur.
  - Tout se recalcule dès qu'on change le nombre de bûcherons ou la durée.
  - Une estimation du Bois rapporté s'affiche, en valeur moyenne ou en fourchette (à décider).

### US-0506 · Faire partir les bûcherons
**En tant que** joueur, **je veux** confirmer le départ de mes bûcherons, **afin de** lancer ma Récolte.

- **Débloquée par** : US-0505
- **Critères d'acceptation** :
  - « Partir » enregistre la Récolte et son heure de départ.
  - Les bûcherons choisis ne sont plus libres.
  - Si, entre-temps, il n'y a plus assez de bûcherons libres (double clic, deux onglets), le départ est refusé et personne ne part.
  - Un message confirme le départ et donne l'heure de retour.

### US-0507 · Enchaîner l'aller, le travail et le retour
**En tant que** joueur, **je veux** que ma Récolte passe par l'aller, le travail puis le retour, **afin de** suivre où en sont mes bûcherons.

- **Débloquée par** : US-0506
- **Critères d'acceptation** :
  - La Récolte passe par trois phases, chacune avec son heure de fin : aller, travail, retour.
  - La phase en cours et son temps restant se lisent sur la Récolte.
  - Les phases avancent même page fermée, grâce au rattrapage et à la tâche planifiée.

### US-0508 · Calculer le Bois rapporté
**En tant que** joueur, **je veux** que le Bois rapporté dépende du nombre de bûcherons et du temps de travail, **afin de** voir l'effet de mes choix.

- **Débloquée par** : US-0507
- **Critères d'acceptation** :
  - Le Bois rapporté vaut le nombre de bûcherons, multiplié par les heures de travail, multiplié par (chiffre à régler) Bois par bûcheron et par heure.
  - Deux fois plus de bûcherons, ou deux fois plus de temps, rapportent deux fois plus, tant que la charge n'est pas atteinte.
  - Ni l'aller ni le retour ne rapportent quoi que ce soit.

### US-0509 · Limiter le Bois à ce que les bûcherons peuvent porter
**En tant que** joueur, **je veux** connaître la charge de mes bûcherons, **afin de** ne pas les faire travailler pour rien.

- **Débloquée par** : US-0508
- **Critères d'acceptation** :
  - Chaque bûcheron porte au plus (chiffre à régler) Bois ; le total rapporté ne dépasse jamais la charge de l'équipe.
  - Un travail plus long que nécessaire ne rapporte rien de plus.
  - Le formulaire prévient quand la durée choisie dépasse ce que l'équipe peut porter, et donne la durée utile.
  - Les Bêtes Porteuses augmenteront cette charge à l'étape 49.

### US-0510 · Déposer le Bois dans les stocks au retour
**En tant que** joueur, **je veux** que le Bois rapporté entre dans mes stocks au retour, **afin de** pouvoir m'en servir.

- **Débloquée par** : US-0509, Étape 12
- **Critères d'acceptation** :
  - Au retour, le Bois rapporté s'ajoute au stock de Bois.
  - La limite de stock s'applique : ce qui dépasse est perdu plutôt que gardé en attente au Foyer (à décider).
  - Les bûcherons redeviennent libres au moment même du retour.

### US-0511 · Lire le récit de retour
**En tant que** joueur, **je veux** un récit au retour de ma Récolte, **afin de** voir ce qu'elle a rapporté.

- **Débloquée par** : US-0510, Étape 16
- **Critères d'acceptation** :
  - Au retour, un récit donne la Case (Biome et distance), le nombre de bûcherons, la durée de travail et le Bois rapporté.
  - Il signale quand la charge était pleine, ou quand du Bois a été perdu faute de place dans les stocks.
  - Un retour survenu pendant l'absence laisse un récit non lu.
  - Toucher la Case dans le récit ouvre sa fiche sur la carte.

### US-0512 · Voir l'état « en Récolte » sur la page Habitants
**En tant que** joueur, **je veux** voir sur la page Habitants qui est parti en Récolte, **afin de** connaître les bras qui me restent.

- **Débloquée par** : US-0506, Étape 13
- **Critères d'acceptation** :
  - Chaque Habitant parti affiche l'état « en Récolte », avec la phase en cours et l'heure de retour.
  - Les compteurs par Métier distinguent les libres du total (« bûcherons : 1 libre sur 4 »).
  - L'Habitant redevient « libre » dès son retour.

### US-0513 · Garder son Métier pendant une Récolte
**En tant que** joueur, **je veux** qu'un Habitant parti garde son Métier jusqu'à son retour, **afin de** ne pas désorganiser une Récolte en cours.

- **Débloquée par** : US-0512, Étape 14
- **Critères d'acceptation** :
  - On ne peut pas changer le Métier d'un Habitant parti en Récolte.
  - Le choix est grisé, avec l'heure de son retour.
  - Les boutons « + » et « − » des Métiers ne touchent que les Habitants libres.

### US-0514 · Suivre ses sorties en cours
**En tant que** joueur, **je veux** une liste de toutes mes sorties en cours, **afin de** voir d'un coup d'œil qui revient et quand.

- **Débloquée par** : US-0507
- **Critères d'acceptation** :
  - Une liste « Sorties en cours » montre chaque Récolte : Case, Métier, nombre d'Habitants, phase et temps restant.
  - Elle s'ouvre depuis la navigation, où s'affiche le nombre de sorties en cours.
  - Elle est triée par heure de retour, la plus proche en premier, et ses comptes à rebours avancent sans recharger la page.
  - Sans sortie, elle affiche « Aucune sortie en cours. » avec un lien vers la carte.
  - Sur mobile, chaque sortie tient dans un bloc d'une colonne.

### US-0515 · Repérer ses Récoltes sur la carte
**En tant que** joueur, **je veux** voir sur la carte les Cases où travaillent mes Habitants, **afin de** situer mes sorties dans le Monde.

- **Débloquée par** : US-0514, Étape 19
- **Critères d'acceptation** :
  - La Case visée par une Récolte porte un repère avec l'icône du Métier.
  - Toucher le repère ouvre cette Récolte dans la liste des sorties.
  - Le repère disparaît au retour des Habitants.
  - Les autres joueurs ne voient pas ce repère.

### US-0516 · Mener plusieurs Récoltes à la fois
**En tant que** joueur, **je veux** lancer plusieurs Récoltes en même temps, **afin de** faire travailler tous mes Habitants.

- **Débloquée par** : US-0514
- **Critères d'acceptation** :
  - On peut lancer une nouvelle Récolte tant qu'il reste des Habitants libres du bon Métier.
  - Chaque Récolte suit ses propres heures et rapporte séparément.
  - Deux Récoltes du même joueur peuvent viser la même Case en même temps (à décider).

### US-0517 · Lancer une Récolte sur mobile
**En tant que** joueur, **je veux** lancer une Récolte au pouce sur mon téléphone, **afin de** la régler en quelques secondes.

- **Débloquée par** : US-0506, Étape 19
- **Critères d'acceptation** :
  - Le formulaire s'ouvre dans le panneau en bas de l'écran, depuis la fiche de la Case.
  - Tout se règle au pouce, sans clavier : « + » et « − », durées en boutons.
  - « Partir » reste visible sans faire défiler le panneau.
  - Aucun défilement de côté.

### US-0518 · Refuser une Récolte sans bûcheron libre
**En tant que** joueur, **je veux** qu'on m'explique pourquoi je ne peux pas lancer de Récolte quand aucun bûcheron n'est libre, **afin de** voir quoi faire.

- **Débloquée par** : US-0506
- **Critères d'acceptation** :
  - Sans bûcheron libre, le formulaire dit « Aucun bûcheron libre » et donne l'heure du prochain retour s'il y en a un.
  - Sans aucun bûcheron, il propose d'aller donner ce Métier sur la page Habitants.
  - Aucune Récolte ne part avec zéro Habitant, même si la demande arrive par un autre chemin que le bouton.

### US-0519 · Refuser une Case trop loin
**En tant que** joueur, **je veux** être prévenu quand une Case est trop loin pour une Récolte, **afin de** ne pas perdre de temps à préparer un départ impossible.

- **Débloquée par** : US-0504
- **Critères d'acceptation** :
  - Au-delà de (chiffre à régler) Cases du Foyer, la Récolte est refusée.
  - La fiche le dit avant même d'ouvrir le formulaire : « Trop loin pour une Récolte ».
  - Le refus tient même si la demande arrive par un autre chemin que le bouton.
  - Une Recherche pourra allonger cette portée (à décider).

### US-0520 · Refuser une Case sous le brouillard
**En tant que** joueur, **je veux** ne pouvoir récolter que sur des Cases découvertes, **afin de** garder au brouillard tout son sens.

- **Débloquée par** : US-0506, Étape 20
- **Critères d'acceptation** :
  - Une Récolte vers une Case sous le brouillard est refusée, même si la demande arrive par un autre chemin que le bouton.
  - Une Récolte ne lève pas le brouillard sur son chemin, ce rôle restant aux Expéditions (à décider).

### US-0521 · Récolter sur la Case de son Foyer
**En tant que** joueur, **je veux** pouvoir récolter sur la Case même de mon Foyer, **afin de** profiter de ce que j'ai sous la main.

- **Débloquée par** : US-0506
- **Critères d'acceptation** :
  - Récolter sur la Case de son propre Foyer est permis (à décider).
  - Si c'est permis, l'aller et le retour durent chacun (chiffre à régler) minutes.
  - La Récolte s'ajoute à la production continue du Foyer, sans la remplacer.

### US-0522 · Récolter sur une Case d'un autre joueur
**En tant que** joueur, **je veux** connaître la règle pour récolter sur une Case qui appartient à un autre joueur, **afin de** choisir mes Cases sans mauvaise surprise.

- **Débloquée par** : US-0506
- **Critères d'acceptation** :
  - Récolter sur une Case qui appartient à un autre joueur est refusé (à décider).
  - Si c'est refusé, la fiche l'explique et aucun Habitant ne part.
  - Une Récolte ne déclenche jamais de combat : les Habitants ne combattent jamais.

### US-0523 · Partager une Case libre avec d'autres joueurs
**En tant que** joueur, **je veux** pouvoir récolter une Case libre même si d'autres joueurs y récoltent, **afin de** ne pas être bloqué par mes voisins.

- **Débloquée par** : US-0506
- **Critères d'acceptation** :
  - Plusieurs joueurs peuvent récolter en même temps sur la même Case libre.
  - Chacun rapporte comme s'il était seul : une Case ne s'épuise pas (à décider).
  - Aucun joueur ne voit les Récoltes des autres (à décider).

### US-0524 · Rattraper une Récolte revenue pendant l'absence
**En tant que** joueur, **je veux** retrouver le fruit d'une Récolte revenue pendant mon absence, **afin de** pouvoir partir l'esprit tranquille.

- **Débloquée par** : US-0510, Étape 15
- **Critères d'acceptation** :
  - Le Bois est déposé à l'heure réelle du retour, avec la limite de stock de ce moment-là.
  - Production, Entretien et retours s'enchaînent heure par heure, dans l'ordre où ils ont eu lieu.
  - Le résultat est le même que la page soit restée ouverte ou fermée.
  - Le récit porte l'heure réelle du retour.

### US-0525 · Traverser une Famine pendant une Récolte
**En tant que** joueur, **je veux** comprendre ce que deviennent mes Habitants partis quand une Famine éclate, **afin de** mesurer mes pertes.

- **Débloquée par** : US-0506, Étape 16
- **Critères d'acceptation** :
  - Les Habitants partis en Récolte peuvent s'en aller pendant une Famine, au même titre que ceux restés au Foyer (à décider).
  - Si un Habitant en Récolte s'en va, la Récolte continue avec ceux qui restent et rapporte d'autant moins.
  - Le récit de Famine dit si des Habitants en Récolte sont partis.

### US-0526 · Rapporter bien plus que la production continue
**En tant que** joueur, **je veux** qu'une Récolte rapporte nettement plus que ce qu'une Case produit seule, **afin de** voir l'intérêt de sortir.

- **Débloquée par** : US-0508, Étape 11
- **Critères d'acceptation** :
  - Une heure de travail d'un bûcheron rapporte (chiffre à régler) fois la production horaire de Bois d'une Case de forêt possédée.
  - Un test automatique vérifie ce rapport, pour qu'un réglage de chiffres ne le casse pas sans qu'on le voie.

### US-0527 · Vérifier une Récolte en vitesse accélérée
**En tant que** développeur, **je veux** dérouler une Récolte en vitesse accélérée, **afin de** tester trajets et rendements sans attendre des heures.

- **Débloquée par** : US-0524
- **Critères d'acceptation** :
  - En vitesse accélérée (×100), une Récolte se déroule cent fois plus vite et rapporte autant de Bois qu'en temps réel.
  - La durée du trajet est vérifiée pour au moins trois distances, et reste proportionnelle à la distance.
  - Un test automatique couvre le départ, les trois phases et le dépôt dans les stocks.

## Étape 22 · Les quatre Récoltes

### US-0528 · Rattacher chaque Métier à ses Biomes
**En tant que** joueur, **je veux** connaître les Biomes où chaque Métier peut récolter, **afin de** choisir où envoyer qui.

- **Débloquée par** : US-0501
- **Critères d'acceptation** :
  - Un seul tableau, dans les données du jeu, dit sur quels Biomes chaque Métier récolte.
  - Bûcheron : forêt, et peut-être jungle (à décider) ; mineur : montagne, et peut-être d'autres Biomes (à décider) ; chasseur et cueilleur : liste de Biomes (à décider).
  - Les chasseurs peuvent aussi pêcher sur la côte, les lacs et les rivières (à décider).
  - La description de chaque Métier, sur la page Habitants, cite ses Biomes.

### US-0529 · Récolter de la Pierre avec des mineurs
**En tant que** joueur, **je veux** envoyer des mineurs en montagne, **afin de** rapporter de la Pierre.

- **Débloquée par** : US-0528
- **Critères d'acceptation** :
  - Sur une Case de montagne, le formulaire propose d'envoyer des mineurs.
  - La Pierre rapportée vaut mineurs × heures de travail × (chiffre à régler), dans la limite de (chiffre à régler) Pierre par mineur.
  - Au retour, la Pierre entre dans le stock et un récit propre aux mineurs s'affiche.

### US-0530 · Récolter de la Viande avec des chasseurs
**En tant que** joueur, **je veux** envoyer des chasseurs sur les Biomes giboyeux, **afin de** rapporter de la Viande.

- **Débloquée par** : US-0528
- **Critères d'acceptation** :
  - Sur les Biomes du chasseur, le formulaire propose d'envoyer des chasseurs.
  - La Viande rapportée vaut chasseurs × heures de travail × (chiffre à régler), dans la limite de (chiffre à régler) Viande par chasseur.
  - Au retour, la Viande entre dans le stock et un récit propre aux chasseurs s'affiche.
  - Une chasse ne fait ni apparaître ni apprivoiser de Bête : cela reste le rôle des Expéditions.

### US-0531 · Récolter des Végétaux avec des cueilleurs
**En tant que** joueur, **je veux** envoyer des cueilleurs sur les Biomes riches en plantes, **afin de** rapporter des Végétaux.

- **Débloquée par** : US-0528
- **Critères d'acceptation** :
  - Sur les Biomes du cueilleur, le formulaire propose d'envoyer des cueilleurs.
  - Les Végétaux rapportés valent cueilleurs × heures de travail × (chiffre à régler), dans la limite de (chiffre à régler) Végétaux par cueilleur.
  - Au retour, les Végétaux entrent dans le stock et un récit propre aux cueilleurs s'affiche.

### US-0532 · Choisir le Métier selon la Case
**En tant que** joueur, **je veux** choisir quel Métier envoyer quand une Case en accepte plusieurs, **afin de** rapporter ce dont j'ai besoin.

- **Débloquée par** : US-0529, US-0530, US-0531
- **Critères d'acceptation** :
  - Le formulaire ne propose que les Métiers qui peuvent travailler sur le Biome de la Case.
  - Quand plusieurs Métiers conviennent, on choisit lequel ; le nombre d'Habitants libres suit le Métier choisi.
  - Une Récolte n'emploie qu'un seul Métier.

### US-0533 · Voir sur la fiche ce qu'une Case peut donner
**En tant que** joueur, **je veux** lire sur la fiche d'une Case ce qu'on peut y récolter, **afin de** repérer les bonnes Cases en parcourant la carte.

- **Débloquée par** : US-0532
- **Critères d'acceptation** :
  - La fiche d'une Case découverte liste ses Récoltes possibles, avec la ressource et le Métier (« Bois, bûcherons »).
  - Une Case où rien ne se récolte le dit : « Rien à récolter ici ».
  - Un Métier sans Habitant libre reste listé, grisé, avec la raison.

### US-0534 · Refuser un Métier sur un mauvais Biome
**En tant que** joueur, **je veux** qu'on m'empêche d'envoyer un Métier là où il ne peut pas travailler, **afin de** ne jamais gâcher une sortie.

- **Débloquée par** : US-0532
- **Critères d'acceptation** :
  - Envoyer un Métier sur un Biome qui n'est pas le sien est refusé, même si la demande arrive par un autre chemin que le bouton.
  - Le message dit sur quels Biomes ce Métier travaille.
  - En cas de refus, aucun Habitant ne quitte le Foyer.

### US-0535 · Nourrir ses Habitants grâce aux Récoltes
**En tant que** joueur, **je veux** que la Viande et les Végétaux rapportés nourrissent mes Habitants, **afin de** pouvoir éloigner une Famine en sortant récolter.

- **Débloquée par** : US-0530, US-0531, Étape 16
- **Critères d'acceptation** :
  - La Viande et les Végétaux rapportés s'ajoutent aux stocks de Nourriture et servent à l'Entretien.
  - Au retour, l'avertissement « famine imminente » est recalculé, et disparaît si le danger est passé.
  - Une Récolte de Nourriture qui revient pendant une Famine arrête les départs dès son arrivée.
  - Le formulaire prévient quand le retour prévu tombe après le début prévu de la Famine (à décider).

## Étape 23 · Rappeler et relancer

### US-0536 · Rappeler une Récolte pendant l'aller
**En tant que** joueur, **je veux** rappeler une Récolte encore en chemin, **afin de** récupérer mes Habitants si j'ai changé d'avis.

- **Débloquée par** : US-0507
- **Critères d'acceptation** :
  - Pendant l'aller, un bouton « Rappeler » est proposé sur la Récolte, dans la liste des sorties comme sur la carte.
  - Les Habitants font demi-tour : leur retour dure le temps déjà passé en chemin.
  - Ils redeviennent libres à leur arrivée au Foyer, pas avant.

### US-0537 · Ne rien rapporter d'une Récolte rappelée
**En tant que** joueur, **je veux** qu'une Récolte rappelée revienne les mains vides, **afin de** peser le coût d'un rappel.

- **Débloquée par** : US-0536
- **Critères d'acceptation** :
  - Une Récolte rappelée ne rapporte rien.
  - Un récit dit que les Habitants ont été rappelés avant d'arriver et n'ont rien rapporté.
  - La Récolte quitte la liste des sorties à l'arrivée des Habitants.

### US-0538 · Ne plus pouvoir rappeler une fois arrivé
**En tant que** joueur, **je veux** comprendre qu'une Récolte arrivée sur place ne se rappelle plus, **afin de** décider au bon moment.

- **Débloquée par** : US-0536
- **Critères d'acceptation** :
  - Pendant le travail et le retour, le bouton « Rappeler » n'est plus proposé.
  - Un rappel demandé juste après la fin de l'aller est refusé avec un message.
  - Écourter un travail déjà commencé n'est pas possible (à décider).

### US-0539 · Relancer une Récolte depuis son récit
**En tant que** joueur, **je veux** relancer d'un geste la même Récolte depuis son récit, **afin de** repartir sans tout régler de nouveau.

- **Débloquée par** : US-0511, US-0506
- **Critères d'acceptation** :
  - Le récit de retour propose « Relancer » : même Case, même Métier, même nombre d'Habitants, même durée.
  - Si les Habitants libres sont moins nombreux, le formulaire s'ouvre avec le plus grand nombre possible.
  - Ce départ passe par les mêmes vérifications qu'un départ normal.

### US-0540 · Lancer une Récolte en boucle
**En tant que** joueur, **je veux** qu'une Récolte reparte toute seule à chaque retour, **afin de** faire travailler mes Habitants même quand je ne suis pas là.

- **Débloquée par** : US-0539
- **Critères d'acceptation** :
  - Le formulaire propose l'option « En boucle ».
  - À chaque retour, le chargement est déposé dans les stocks, puis la même Récolte repart aussitôt avec les mêmes Habitants.
  - La liste des sorties marque les Récoltes en boucle et compte les tours faits.
  - En vitesse accélérée, une boucle repart toute seule.

### US-0541 · Arrêter une boucle
**En tant que** joueur, **je veux** arrêter une boucle sans perdre le tour en cours, **afin de** récupérer mes Habitants pour autre chose.

- **Débloquée par** : US-0540
- **Critères d'acceptation** :
  - « Arrêter la boucle » laisse la sortie en cours aller à son terme, puis les Habitants restent au Foyer, libres.
  - Pendant l'aller, on peut toujours rappeler : la boucle s'arrête alors aussi.
  - L'arrêt se voit aussitôt dans la liste des sorties.

### US-0542 · Relancer la boucle avec les Habitants encore là
**En tant que** joueur, **je veux** qu'une boucle tienne compte des Habitants qui manquent, **afin de** ne jamais voir partir des Habitants que je n'ai plus.

- **Débloquée par** : US-0540, US-0525
- **Critères d'acceptation** :
  - Au retour, la boucle ne repart qu'avec les Habitants encore présents.
  - S'il en manque (partis pendant une Famine, par exemple), elle repart avec ceux qui restent plutôt que de s'arrêter (à décider).
  - S'il n'en reste aucun, la boucle s'arrête, et un récit dit pourquoi.

### US-0543 · Arrêter la boucle quand la Case ne convient plus
**En tant que** joueur, **je veux** qu'une boucle s'arrête d'elle-même quand sa Case n'accepte plus la Récolte, **afin de** ne pas envoyer mes Habitants pour rien.

- **Débloquée par** : US-0540
- **Critères d'acceptation** :
  - Si la Case n'accepte plus la Récolte au moment de repartir (elle appartient désormais à un autre joueur, par exemple), la boucle s'arrête.
  - Les Habitants restent au Foyer, libres.
  - Un récit dit pourquoi la boucle s'est arrêtée.

### US-0544 · Gérer une boucle quand le stock est plein
**En tant que** joueur, **je veux** voir ce que fait une boucle quand mon stock est plein, **afin de** ne pas gaspiller le travail de mes Habitants sans le voir.

- **Débloquée par** : US-0540, Étape 12
- **Critères d'acceptation** :
  - Quand le stock de la ressource rapportée est plein, la boucle s'arrête plutôt que de continuer en perdant ce qui dépasse (à décider).
  - Dans les deux cas, le récit dit ce qui a été perdu ou pourquoi la boucle s'est arrêtée.

### US-0545 · Rattraper une boucle pendant l'absence
**En tant que** joueur, **je veux** qu'une boucle tourne aussi pendant mon absence, **afin de** retrouver mes stocks remplis à mon retour.

- **Débloquée par** : US-0540, US-0524
- **Critères d'acceptation** :
  - Pendant l'absence, les tours s'enchaînent exactement comme si la page était restée ouverte.
  - Chaque retour dépose son chargement avec la limite de stock du moment.
  - La tâche planifiée fait avancer les boucles des joueurs qui ne reviennent pas.

### US-0546 · Regrouper les récits d'une boucle
**En tant que** joueur, **je veux** un seul récit pour tous les tours d'une boucle faits en mon absence, **afin de** ne pas crouler sous les récits.

- **Débloquée par** : US-0545
- **Critères d'acceptation** :
  - Plusieurs tours faits pendant une absence donnent un seul récit : nombre de tours, total rapporté et pertes éventuelles.
  - Le détail de chaque tour reste consultable depuis ce récit.
  - Le compteur de récits non lus ne compte ce récit qu'une fois.

## Étape 24 · La Densité du jour

### US-0547 · Tirer une Densité du jour pour chaque Case
**En tant que** développeur, **je veux** que chaque Case ait chaque jour une Densité cachée, **afin de** faire varier l'abondance du Monde d'un jour à l'autre.

- **Débloquée par** : US-0508, Étape 18
- **Critères d'acceptation** :
  - Chaque Case a, chaque jour, une Densité comprise entre (chiffre à régler) et (chiffre à régler).
  - Elle change une fois par jour, au même instant sur tout le Monde, à une heure fixe (à décider).
  - Elle se déduit de la graine du Monde, de la Case et du jour : recalculée, elle donne toujours la même valeur.
  - Une seule Densité par Case sert aux Récoltes et, plus tard, aux Bêtes sauvages, plutôt qu'une Densité par ressource (à décider).

### US-0548 · Moduler les Récoltes par la Densité
**En tant que** joueur, **je veux** que l'abondance du jour change ce que rapporte une Case, **afin de** vivre des jours fastes et des jours maigres.

- **Débloquée par** : US-0547
- **Critères d'acceptation** :
  - Le rendement horaire d'une Récolte est multiplié par la Densité du jour de la Case.
  - Même Case, même équipe, même durée : ce qui est rapporté change d'un jour à l'autre.
  - La charge ne dépend pas de la Densité.
  - Tous les joueurs qui récoltent la même Case le même jour ont la même Densité.
  - La production continue des Cases possédées n'est pas touchée par la Densité (à décider).

### US-0549 · Compter la Densité du bon jour
**En tant que** joueur, **je veux** que la Densité appliquée soit celle du jour où mes Habitants travaillent, **afin de** comprendre pourquoi une Récolte rapporte plus qu'une autre.

- **Débloquée par** : US-0548
- **Critères d'acceptation** :
  - La Densité appliquée est celle du jour où le travail a lieu ; un travail à cheval sur deux jours compte chaque heure au jour où elle tombe, plutôt que tout au jour où il commence (à décider).
  - Le résultat est le même que la Récolte ait été suivie en direct ou rattrapée.

### US-0550 · Garder la Densité cachée
**En tant que** joueur, **je veux** que la Densité reste un secret du Monde, **afin de** garder le plaisir de la surprise à chaque retour.

- **Débloquée par** : US-0548
- **Critères d'acceptation** :
  - Aucun chiffre de Densité n'est affiché, ni envoyé au navigateur.
  - L'estimation avant départ repose sur une Densité moyenne et le dit : « selon l'abondance du jour ».
  - Aucun récit ne donne de chiffre de Densité.

### US-0551 · Deviner l'abondance dans le récit
**En tant que** joueur, **je veux** que le récit me donne une idée de l'abondance du jour, **afin de** repérer les Cases qui me réussissent.

- **Débloquée par** : US-0550
- **Critères d'acceptation** :
  - Le récit qualifie l'abondance du jour en quelques mots, comme « la forêt était généreuse » ou « la forêt était maigre » (à décider).
  - Il existe (chiffre à régler) façons de la qualifier, sans aucun chiffre.
  - Deux récits de la même Case, à des jours différents, peuvent employer des mots différents.

### US-0552 · Vérifier la Densité sur la durée
**En tant que** développeur, **je veux** contrôler la Densité d'une Case sur plusieurs jours, **afin de** régler son effet sans le deviner.

- **Débloquée par** : US-0548
- **Critères d'acceptation** :
  - Une page de contrôle interne montre la Densité d'une Case choisie sur les (chiffre à régler) derniers jours.
  - Sur une simulation de (chiffre à régler) jours, les valeurs restent dans leurs bornes et leur moyenne reste proche de la valeur visée (chiffre à régler).
  - En vitesse accélérée, la même Case rapporte mesurablement plus certains jours que d'autres.
  - La page est inaccessible aux joueurs.
