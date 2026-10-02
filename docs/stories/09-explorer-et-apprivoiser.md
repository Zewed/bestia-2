# Jalon 9 · Explorer et apprivoiser

Le joueur envoie ses explorateurs, avec ou sans escorte de Bêtes, vers des Cases lointaines où le Monde fait apparaître des Bêtes sauvages ; il les apprivoise une à une quand son escorte est assez forte, perd des Bêtes face à plus fort que lui, et réunit ses premiers Couples pour ouvrir de nouveaux Élevages. Étapes couvertes : 38 à 45 de l'ordre d'attaque.

## Étape 38 · La première Expédition

### US-0901 · Ouvrir l'écran d'Expédition
**En tant que** joueur, **je veux** préparer une Expédition depuis la carte ou depuis le menu, **afin de** partir chercher des Bêtes sauvages là où je le décide.

- **Débloquée par** : Étape 14, Étape 19
- **Critères d'acceptation** :
  - Toucher une Case de la carte propose « Envoyer une Expédition », qui ouvre l'écran d'Expédition avec cette Case déjà choisie comme destination.
  - Le menu ouvre le même écran, sans destination choisie.
  - L'écran tient sur un téléphone sans défilement de côté, et chaque choix se fait au pouce.

### US-0902 · Choisir les explorateurs
**En tant que** joueur, **je veux** choisir combien de mes explorateurs partent, **afin de** garder les autres pour d'autres Expéditions.

- **Débloquée par** : US-0901
- **Critères d'acceptation** :
  - Seuls les Habitants au Métier d'explorateur qui ne sont pas déjà partis sont proposés, avec un compteur « libres / total ».
  - Il faut au moins un explorateur : à zéro, le bouton de départ reste grisé et dit pourquoi.
  - On ne peut pas choisir plus d'explorateurs qu'il n'y en a de libres.
  - Ce qu'apporte un explorateur de plus dans une même Expédition (à décider).

### US-0903 · Aucun explorateur libre
**En tant que** nouveau joueur, **je veux** comprendre pourquoi je ne peux pas encore partir, **afin de** trouver comment lancer ma première Expédition.

- **Débloquée par** : US-0902
- **Critères d'acceptation** :
  - Sans aucun explorateur, l'écran affiche un message clair à la place du formulaire, avec un lien vers la page Habitants pour donner ce Métier.
  - Si tous les explorateurs sont déjà partis, le message indique l'heure du prochain retour.
  - Le lien mène directement à la page Habitants, sur ordinateur comme sur mobile.

### US-0904 · Choisir l'escorte
**En tant que** joueur, **je veux** choisir, Espèce par Espèce, combien de Bêtes accompagnent mes explorateurs, **afin de** leur donner assez de force pour qu'une Bête sauvage les suive.

- **Débloquée par** : US-0902, Étape 34
- **Critères d'acceptation** :
  - Chaque Espèce de l'effectif apparaît avec son illustration et le nombre de Bêtes disponibles.
  - Les Bêtes d'un Couple en Réserve et les Bêtes déjà sorties ne sont jamais proposées.
  - On ne peut pas dépasser le nombre disponible ; un bouton « toutes » prend le maximum d'une Espèce, un autre remet à zéro.
  - Rien n'est retenu tant que le départ n'est pas confirmé : les Bêtes choisies restent disponibles ailleurs jusque-là.

### US-0905 · La force de l'escorte
**En tant que** joueur, **je veux** voir la force de mon escorte pendant que je la compose, **afin de** juger ce qu'elle pourra apprivoiser.

- **Débloquée par** : US-0904
- **Critères d'acceptation** :
  - La force de l'escorte est la simple somme des forces de ses Bêtes, sans bonus de groupe ni règle de taille.
  - La force d'une Bête vient des caractéristiques de son Espèce, la même pour toutes les Bêtes de l'Espèce et chez tous les joueurs ; la formule à partir de l'attaque et de la vie (à décider).
  - Aucune Recherche ne change cette force.
  - Le total se met à jour à chaque Bête ajoutée ou retirée ; sans escorte, il vaut zéro.

### US-0906 · Choisir la durée du séjour
**En tant que** joueur, **je veux** choisir combien de temps l'Expédition reste sur la Case, **afin de** l'accorder au moment où je reviendrai jouer.

- **Débloquée par** : US-0901
- **Critères d'acceptation** :
  - La durée se choisit entre un minimum et un maximum (chiffre à régler), par pas réguliers (chiffre à régler).
  - Quelques durées toutes prêtes se choisissent d'un doigt sur mobile ; lesquelles (à décider).
  - Le séjour ne commence qu'à l'arrivée : le temps du trajet ne le raccourcit pas.

### US-0907 · Choisir la destination
**En tant que** joueur, **je veux** choisir la Case où se rend l'Expédition, même si elle est encore dans le brouillard, **afin de** partir à la découverte du Monde.

- **Débloquée par** : US-0901, Étape 20
- **Critères d'acceptation** :
  - Toucher une Case depuis l'écran d'Expédition la choisit ; sa distance en Cases depuis le Foyer s'affiche.
  - Une Case dans le brouillard peut être choisie ; son Biome s'affiche « inconnu ».
  - Le Foyer lui-même ne peut pas être choisi.
  - Une Case qui appartient à un Territoire, le sien ou celui d'un autre joueur, est refusée avec un message (à décider).

### US-0908 · La portée d'exploration
**En tant que** joueur, **je veux** voir jusqu'où mes Expéditions peuvent aller, et aller plus loin grâce à la Recherche, **afin de** viser un jour les Cases proches du Cœur sauvage.

- **Débloquée par** : US-0907, Étape 32
- **Critères d'acceptation** :
  - Une portée d'exploration de départ limite la distance d'une destination, comptée en Cases depuis le Foyer (chiffre à régler).
  - Pendant le choix de la destination, les Cases hors de portée sont grisées et ne peuvent pas être choisies.
  - Des Recherches de la branche Explorer agrandissent cette portée (chiffre à régler par Recherche).
  - Toucher une Case hors de portée nomme la Recherche qui permettrait de l'atteindre, avec un lien vers elle.

### US-0909 · Partir sans escorte
**En tant que** joueur, **je veux** envoyer des explorateurs seuls, **afin de** lever le brouillard et repérer des Bêtes sans risquer les miennes.

- **Débloquée par** : US-0902, US-0906, US-0907
- **Critères d'acceptation** :
  - Une Expédition avec au moins un explorateur et aucune Bête peut partir.
  - Avant le départ, un avertissement rappelle qu'une Expédition sans escorte a une force nulle et ne pourra sans doute rien apprivoiser (règle à l'étape 40).
  - Sans escorte, l'Expédition avance au pas des explorateurs (chiffre à régler).

### US-0910 · Le récapitulatif avant le départ
**En tant que** joueur, **je veux** relire tout ce que j'ai choisi avant de confirmer, **afin de** ne pas partir avec une erreur.

- **Débloquée par** : US-0905, US-0906, US-0908
- **Critères d'acceptation** :
  - Le récapitulatif montre les explorateurs, l'escorte par Espèce, sa force, la destination et son Biome (ou « inconnu »), les durées de l'aller, du séjour et du retour, et l'heure de retour prévue.
  - Il rappelle que l'escorte continue de coûter son Entretien, et les explorateurs leur Nourriture, pendant toute l'absence.
  - Tant qu'un choix manque, le bouton « Partir » reste grisé et nomme ce qui manque.
  - Sur mobile, le récapitulatif reste visible en bas de l'écran pendant qu'on compose l'Expédition.

### US-0911 · Lancer l'Expédition
**En tant que** joueur, **je veux** confirmer le départ, **afin de** mettre en route mes explorateurs et mon escorte.

- **Débloquée par** : US-0910
- **Critères d'acceptation** :
  - « Partir » fait passer les explorateurs et les Bêtes à l'état « en Expédition » : ils ne sont plus proposés ailleurs, et le Métier d'un explorateur parti ne peut pas être changé avant son retour.
  - L'Expédition apparaît aussitôt dans la liste des Expéditions en cours, en phase « aller ».
  - Deux départs envoyés au même instant n'emmènent jamais deux fois le même explorateur ni la même Bête.
  - Si une Bête ou un explorateur n'est plus disponible au moment de confirmer, le départ est refusé avec un message, et rien n'est retenu.

### US-0912 · La durée du trajet
**En tant que** joueur, **je veux** que le trajet dure selon la distance et l'allure de mon escorte, **afin de** choisir entre aller loin et revenir vite.

- **Débloquée par** : US-0911
- **Critères d'acceptation** :
  - La durée de l'aller dépend de la distance en Cases (chiffre à régler par Case).
  - L'Expédition avance au pas de la Bête la plus lente de l'escorte, d'après la vitesse de son Espèce ; que le pas des explorateurs soit aussi une limite (à décider).
  - Le retour dure autant que l'aller.
  - Le chemin passe de Case en Case ; la traversée de la mer, des lacs et des rivières (plus lente, contournée ou interdite) (à décider).
  - En vitesse accélérée de développement, toutes ces durées sont raccourcies d'autant.

### US-0913 · Suivre l'Expédition sur la carte
**En tant que** joueur, **je veux** voir où en est mon Expédition sur la carte, **afin de** suivre sa progression d'un coup d'œil.

- **Débloquée par** : US-0911, Étape 19
- **Critères d'acceptation** :
  - Un repère montre l'endroit du chemin où se trouve l'Expédition, et la destination est marquée.
  - Seul le joueur qui l'a envoyée voit ce repère.
  - Toucher le repère ouvre le détail de l'Expédition : phase, temps restant, explorateurs et escorte.

### US-0914 · Le brouillard se lève sur le chemin
**En tant que** joueur, **je veux** que le brouillard se lève là où passe mon Expédition, **afin de** découvrir le Monde en l'explorant.

- **Débloquée par** : US-0912, Étape 20
- **Critères d'acceptation** :
  - Les Cases traversées, et leurs voisines dans un rayon (chiffre à régler), sortent du brouillard au fur et à mesure du passage, pas toutes au départ.
  - À l'arrivée, la destination et ses voisines sont révélées, Biome compris.
  - Le brouillard levé le reste pour toujours, et pour ce joueur seulement.
  - Après une absence, les Cases révélées sont exactement celles qu'on aurait vues en suivant l'Expédition en direct.

### US-0915 · Le séjour sur la Case
**En tant que** joueur, **je veux** que mon Expédition reste sur la Case le temps choisi, **afin de** lui laisser la chance d'y croiser des Bêtes sauvages.

- **Débloquée par** : US-0912
- **Critères d'acceptation** :
  - À l'arrivée, l'Expédition passe en phase « séjour », avec le compte à rebours de la durée choisie.
  - Pendant tout le séjour, elle est présente sur la Case : c'est là qu'auront lieu ses Rencontres (étape 40).
  - À la fin du séjour, elle repart seule vers le Foyer, sans action du joueur.

### US-0916 · Le retour au Foyer
**En tant que** joueur, **je veux** retrouver mes explorateurs et mes Bêtes à leur retour, **afin de** les renvoyer aussitôt.

- **Débloquée par** : US-0915
- **Critères d'acceptation** :
  - Au retour, les explorateurs redeviennent libres et les Bêtes de l'escorte rentrent dans l'effectif.
  - L'Expédition quitte la liste des Expéditions en cours.
  - Le retour a lieu à l'heure prévue même si le joueur n'est pas connecté (rattrapage à l'ouverture de page ou tâche planifiée).

### US-0917 · Le récit de retour
**En tant que** joueur, **je veux** lire un récit à chaque retour d'Expédition, **afin de** savoir ce que mes explorateurs ont vécu.

- **Débloquée par** : US-0916, Étape 21
- **Critères d'acceptation** :
  - Chaque retour ajoute un récit daté à la page Récits, comme pour les Récoltes.
  - Le récit donne la destination et son Biome désormais connu, les durées réelles de l'aller, du séjour et du retour, et le nombre de Cases sorties du brouillard.
  - Quand rien ne s'est passé, le récit le dit en une phrase (« aucune Bête ne s'est montrée ») : il n'est jamais vide.
  - Un compteur de récits non lus s'affiche dans la barre du haut, sur ordinateur comme sur mobile.

### US-0918 · La liste des Expéditions en cours
**En tant que** joueur, **je veux** voir toutes mes Expéditions en cours au même endroit, **afin de** savoir quand chacune revient.

- **Débloquée par** : US-0911
- **Critères d'acceptation** :
  - Chaque Expédition montre sa destination, sa phase (aller, séjour, retour), son temps restant, ses explorateurs et son escorte.
  - Les comptes à rebours avancent sans recharger la page.
  - Sans Expédition en cours, la liste affiche « Aucune Expédition en cours » et un bouton pour en préparer une.
  - Sur mobile, chaque Expédition tient sur une ligne qu'on déplie pour voir le détail.

### US-0919 · Plusieurs Expéditions à la fois
**En tant que** joueur, **je veux** lancer une nouvelle Expédition pendant qu'une autre est en route, **afin de** fouiller plusieurs directions en même temps.

- **Débloquée par** : US-0911
- **Critères d'acceptation** :
  - On peut lancer une nouvelle Expédition tant qu'il reste au moins un explorateur libre.
  - Chaque Expédition a sa destination, son escorte et ses horaires, sans effet sur les autres.
  - Un plafond d'Expéditions simultanées, en plus du nombre d'explorateurs (à décider).

### US-0920 · Rappeler une Expédition à l'aller
**En tant que** joueur, **je veux** rappeler une Expédition pendant son trajet aller, **afin de** récupérer mes Bêtes si j'en ai besoin ailleurs.

- **Débloquée par** : US-0912, Étape 23
- **Critères d'acceptation** :
  - Pendant l'aller, un bouton « Rappeler » fait faire demi-tour ; le retour dure le temps déjà parcouru.
  - Une Expédition rappelée ne séjourne pas, ne voit aucune Bête et ne rapporte rien ; les Cases déjà révélées le restent.
  - Pendant le retour, le bouton disparaît.
  - Le récit indique que l'Expédition a été rappelée, et à quel moment.
  - Rappeler une Expédition pendant son séjour, pour la faire rentrer plus tôt (à décider).

### US-0921 · Ceux qui sont partis mangent toujours
**En tant que** joueur, **je veux** que mes explorateurs et mon escorte continuent de manger pendant l'Expédition, **afin de** prévoir mes stocks de Nourriture avant un long départ.

- **Débloquée par** : US-0911, Étape 15, Étape 35
- **Critères d'acceptation** :
  - L'Entretien des Bêtes de l'escorte et la Nourriture des explorateurs continuent d'être pris sur les stocks pendant toute l'Expédition.
  - Les Bêtes parties gardent leurs Places dans l'Habitat du Foyer, pour pouvoir rentrer.
  - L'avertissement « famine imminente » tient compte des Expéditions en cours.
  - En cas de Famine pendant une Expédition, si des Bêtes de l'escorte peuvent retourner au sauvage sur place, et si un explorateur absent peut s'en aller (à décider).

### US-0922 · Une Expédition vécue en mon absence
**En tant que** joueur, **je veux** retrouver le résultat exact d'une Expédition qui s'est entièrement déroulée pendant que je n'étais pas là, **afin de** jouer par courtes sessions sans rien perdre.

- **Débloquée par** : US-0917, Étape 3
- **Critères d'acceptation** :
  - Une Expédition partie, arrivée et rentrée pendant une absence donne les mêmes Cases révélées, les mêmes Rencontres, les mêmes combats et le même récit que si la page était restée ouverte.
  - Les récits arrivent dans l'ordre des retours.
  - En vitesse accélérée, une Expédition complète se vérifie en quelques minutes.

## Étape 39 · Le Monde fait apparaître des Bêtes

### US-0923 · Les Anneaux, de la Couronne au Cœur sauvage
**En tant que** joueur, **je veux** que le Monde soit plus sauvage à mesure qu'on approche du Cœur sauvage, **afin de** trouver des Bêtes plus rares en m'aventurant plus loin.

- **Débloquée par** : Étape 18
- **Critères d'acceptation** :
  - Chaque Case appartient à un Anneau selon sa distance au Cœur sauvage ; le nombre d'Anneaux (chiffre à régler).
  - La Couronne forme l'Anneau le plus extérieur, le Cœur sauvage le plus intérieur.
  - La même graine donne toujours les mêmes Anneaux.
  - Afficher l'Anneau dans la fiche d'une Case révélée (à décider).

### US-0924 · Des Espèces d'essai pour chaque Rareté
**En tant que** développeur, **je veux** un petit jeu d'Espèces couvrant les Raretés de commune à légendaire, **afin de** tester les apparitions avant l'arrivée des 200 Espèces.

- **Débloquée par** : Étape 4
- **Critères d'acceptation** :
  - Un petit jeu d'Espèces couvre les Raretés de commune à légendaire dans plusieurs Biomes ; Espèces provisoires ou premières Espèces validées du chantier de contenu (à décider).
  - Ces Espèces ne servent qu'en développement et aux simulations ; en ligne, seules les Espèces déjà chargées apparaissent jusqu'à l'étape 47 (à décider).
  - Elles se retirent sans laisser de trace le jour où la liste validée arrive.

### US-0925 · Des Bêtes sauvages apparaissent de temps en temps
**En tant que** joueur, **je veux** que le Monde fasse apparaître des Bêtes sauvages sur ses Cases, **afin de** toujours avoir quelque chose à aller chercher.

- **Débloquée par** : US-0923, US-0924, Étape 3
- **Critères d'acceptation** :
  - Chaque Case hors des Territoires voit apparaître des Bêtes sauvages de temps en temps, selon une fréquence moyenne (chiffre à régler) ; les Cases des Territoires (à décider).
  - Chaque apparition amène une seule Bête, jamais un groupe.
  - Les apparitions ont lieu que les joueurs soient connectés ou non.
  - Plusieurs Bêtes présentes en même temps sur une même Case (à décider).
  - Aucune Bête sauvage ne se voit sur la carte : seules les Expéditions présentes sur la Case la voient.

### US-0926 · Une présence limitée dans le temps
**En tant que** joueur, **je veux** que chaque Bête sauvage ne reste qu'un temps sur sa Case, **afin de** sentir qu'il faut être là au bon moment.

- **Débloquée par** : US-0925
- **Critères d'acceptation** :
  - Chaque Bête apparue reste sur sa Case pendant une durée limitée (chiffre à régler), puis disparaît.
  - Une durée qui change selon la Rareté (à décider).
  - Une Bête qui suit une Expédition quitte aussitôt sa Case.
  - Une Bête disparue ne revient jamais sur cette Case.

### US-0927 · La Rareté tirée selon l'Anneau
**En tant que** joueur, **je veux** que la Rareté des Bêtes dépende de l'Anneau, **afin de** trouver partout des communes, mais plus de raretés vers le Cœur sauvage.

- **Débloquée par** : US-0925
- **Critères d'acceptation** :
  - À chaque apparition, la Rareté est tirée selon les pourcentages de l'Anneau de la Case (chiffre à régler).
  - Dans tous les Anneaux, toutes les Raretés de commune à légendaire peuvent apparaître, et les communes restent les plus nombreuses.
  - Plus l'Anneau est proche du Cœur sauvage, plus les Raretés élevées y sont fréquentes.
  - Les Espèces mythiques n'apparaissent jamais ainsi : elles ne viennent que des Apparitions (étape 63).

### US-0928 · L'Espèce tirée selon le Biome
**En tant que** joueur, **je veux** croiser sur chaque Case des Espèces qui vivent dans son Biome, **afin de** savoir où chercher l'animal que je veux.

- **Débloquée par** : US-0927
- **Critères d'acceptation** :
  - L'Espèce est tirée parmi celles de la Rareté tirée dont le Biome d'Habitat est celui de la Case.
  - Côte, lac, rivière et mer sont des variantes d'un même Biome, l'eau : elles comptent ensemble pour ce tirage.
  - À Rareté égale, chaque Espèce a la même chance ; une pondération par Espèce (à décider).
  - Si aucune Espèce de la Rareté tirée n'existe pour ce Biome, le tirage retombe sur la Rareté inférieure, jusqu'aux communes (à décider).

### US-0929 · La Densité change la fréquence
**En tant que** joueur, **je veux** que certaines Cases soient plus giboyeuses certains jours, **afin de** ne pas toujours viser les mêmes Cases.

- **Débloquée par** : US-0925, Étape 24
- **Critères d'acceptation** :
  - La Densité de faune de la Case, cachée et changeante chaque jour, augmente ou diminue la fréquence des apparitions (effet : chiffre à régler).
  - La Densité ne change pas les pourcentages de Rareté (à décider).
  - Elle n'est jamais affichée en chiffre ; que le récit en donne une impression, comme « la faune semblait abondante » (à décider).
  - Sur une simulation, une même Case voit plus d'apparitions certains jours que d'autres.

### US-0930 · Des apparitions identiques en direct et au rattrapage
**En tant que** développeur, **je veux** que les apparitions d'une Case se calculent toujours de la même façon, **afin de** garder un Monde juste, qu'on le regarde en direct, au rattrapage ou par la tâche planifiée.

- **Débloquée par** : US-0925, Étape 3
- **Critères d'acceptation** :
  - Pour une Case et une période données, les Bêtes apparues (Espèce, moment, durée) sont les mêmes quelle que soit la façon dont le temps a été rattrapé.
  - Les apparitions ne sont calculées que pour les Cases où elles comptent (Expédition présente, Bête restée repérée), sans que le résultat change.
  - La vitesse accélérée accélère aussi les apparitions et leurs durées.

### US-0931 · La simulation des Raretés par Anneau
**En tant que** développeur, **je veux** simuler les apparitions sur une longue période, **afin de** vérifier que les Raretés suivent les pourcentages de chaque Anneau.

- **Débloquée par** : US-0927, US-0928, US-0929
- **Critères d'acceptation** :
  - Un outil de la page de contrôle interne simule les apparitions sur une longue période (chiffre à régler), Anneau par Anneau.
  - Il affiche, pour chaque Anneau, la part obtenue de chaque Rareté à côté de la part attendue.
  - Le contrôle échoue si un écart dépasse la tolérance (chiffre à régler), ou si les communes ne sont pas majoritaires dans un Anneau.
  - Il donne le nombre moyen d'apparitions par Case et par jour, pour régler le rythme (première peu commune en 3 à 4 jours, rare en un mois).

## Étape 40 · La Rencontre

### US-0932 · La Rencontre
**En tant que** joueur, **je veux** que mon Expédition voie les Bêtes qui se montrent sur sa Case, **afin de** tenter de les apprivoiser.

- **Débloquée par** : US-0915, US-0925
- **Critères d'acceptation** :
  - Quand une Bête apparaît sur une Case où une Expédition séjourne, c'est une Rencontre pour cette Expédition.
  - Une Expédition qui arrive sur une Case où une Bête est encore présente la rencontre dès son arrivée.
  - Une Expédition qui ne fait que traverser une Case pendant son trajet ne voit pas ses Bêtes (à décider).
  - Un joueur sans Expédition sur la Case n'apprend rien de la Bête.

### US-0933 · L'Espèce croisée entre au Bestiaire
**En tant que** joueur, **je veux** que chaque Espèce croisée s'inscrive dans mon Bestiaire, **afin de** garder la trace de tout ce que j'ai vu.

- **Débloquée par** : US-0932
- **Critères d'acceptation** :
  - Toute Espèce vue lors d'une Rencontre s'inscrit au Bestiaire du joueur à l'état « croisée », qu'elle suive l'Expédition ou non.
  - L'inscription se fait une seule fois par Espèce ; la revoir ne change rien.
  - L'état d'une Espèce au Bestiaire ne recule jamais, même si toutes ses Bêtes meurent.
  - Le récit signale « Nouvelle Espèce au Bestiaire » la première fois (la page Bestiaire arrive au jalon 10).

### US-0934 · La Bête à portée suit l'Expédition
**En tant que** joueur, **je veux** qu'une Bête sauvage suive mon Expédition quand mon escorte est assez forte, **afin de** l'apprivoiser.

- **Débloquée par** : US-0932, US-0905
- **Critères d'acceptation** :
  - Une Bête est à portée quand la force de l'escorte est au moins égale à la sienne, qui est celle de son Espèce.
  - À portée, elle suit l'Expédition sans combat : c'est l'Apprivoisement.
  - Aucune Bête de l'escorte n'est blessée ni tuée lors d'un Apprivoisement.
  - Dès qu'elle suit l'Expédition, la Bête quitte sa Case : personne d'autre ne peut plus la rencontrer.

### US-0935 · Sans escorte, voir sans apprivoiser
**En tant que** joueur, **je veux** savoir ce que rapporte une Expédition sans escorte, **afin de** choisir en connaissance de cause entre explorer et apprivoiser.

- **Débloquée par** : US-0934, US-0909
- **Critères d'acceptation** :
  - La force d'une Expédition sans escorte étant nulle, aucune Bête n'est à sa portée ; une exception pour les Bêtes les plus faibles (à décider).
  - Elle inscrit quand même au Bestiaire les Espèces qu'elle croise.
  - Le récit le dit clairement : « vos explorateurs ont vu … mais aucune Bête ne les a suivis ».

### US-0936 · Une Bête à la fois
**En tant que** joueur, **je veux** que les Bêtes me rejoignent une par une, **afin de** faire de chaque Apprivoisement un événement.

- **Débloquée par** : US-0934
- **Critères d'acceptation** :
  - Un Apprivoisement n'amène jamais qu'une seule Bête.
  - Quand plusieurs Bêtes se montrent pendant un même séjour, chaque Rencontre est jugée à part, dans l'ordre des apparitions.
  - Après un Apprivoisement, l'Expédition poursuit son séjour et peut en apprivoiser d'autres, ou rentre aussitôt avec sa Bête (à décider).

### US-0937 · Le sexe tiré au hasard
**En tant que** joueur, **je veux** connaître le sexe de chaque Bête apprivoisée, **afin de** savoir s'il me manque un mâle ou une femelle pour réunir le Couple.

- **Débloquée par** : US-0934
- **Critères d'acceptation** :
  - Au moment de l'Apprivoisement, la Bête est mâle ou femelle au hasard, à chances égales, et ne change plus.
  - Tant que le Couple de son Espèce n'est pas réuni, l'effectif de l'Espèce indique combien de mâles et de femelles on possède.
  - Sur une longue simulation, mâles et femelles sont à parts égales, à la tolérance près (chiffre à régler).

### US-0938 · La Bête apprivoisée arrive au Foyer
**En tant que** joueur, **je veux** voir ma nouvelle Bête rejoindre mon effectif au retour de l'Expédition, **afin de** pouvoir m'en servir.

- **Débloquée par** : US-0934, US-0916
- **Critères d'acceptation** :
  - La Bête suit l'Expédition et arrive au Foyer avec elle, à son retour.
  - Elle entre alors dans l'effectif de son Espèce, et l'Espèce passe à l'état « apprivoisée » au Bestiaire si elle n'avait pas mieux.
  - Jusqu'au retour, la Bête qui suit ne fait pas partie de l'escorte : elle n'en change pas la force et ne peut pas être perdue dans un combat (à décider).
  - Elle peut partir en escorte dès l'Expédition suivante.

### US-0939 · Une Bête apprivoisée sans Place libre
**En tant que** joueur, **je veux** savoir ce que devient une Bête apprivoisée quand mon Habitat est plein, **afin de** ne pas la perdre sans comprendre.

- **Débloquée par** : US-0938, Étape 35
- **Critères d'acceptation** :
  - Quand l'Habitat du Foyer n'a plus de Place libre pour elle, la Bête rejoint quand même le joueur en surnombre, attend une Place, ou repart au sauvage (à décider).
  - Le récapitulatif avant le départ prévient quand il ne reste aucune Place libre.
  - Le récit dit clairement ce qu'est devenue la Bête.

### US-0940 · Le récit de Rencontre
**En tant que** joueur, **je veux** un récit détaillé de chaque Rencontre, **afin de** revivre ce qui s'est passé sur la Case.

- **Débloquée par** : US-0933, US-0938, US-0917
- **Critères d'acceptation** :
  - Le récit liste chaque Bête vue, à son heure : illustration, Espèce, Rareté.
  - Pour chacune, il dit ce qui s'est passé : apprivoisée (avec son sexe), trop forte et restée, ou repartie à la fin de sa durée.
  - Une Bête apprivoisée ou une nouvelle Espèce est mise en avant.
  - Sur mobile, les illustrations se réduisent sans que le texte déborde.

### US-0941 · Un résumé en tête du récit
**En tant que** joueur, **je veux** lire l'essentiel d'un récit en une ligne, **afin de** faire le point vite pendant une courte session.

- **Débloquée par** : US-0940
- **Critères d'acceptation** :
  - En tête du récit, une ligne résume l'essentiel : Bêtes ramenées, nouvelles Espèces au Bestiaire, pertes.
  - Le détail heure par heure se déplie sous le résumé.
  - La page Récits affiche ce résumé sans qu'il faille ouvrir le récit.

## Étape 41 · La Bête trop forte

### US-0942 · La Bête trop forte reste sur sa Case
**En tant que** joueur, **je veux** qu'une Bête trop forte pour mon escorte reste où elle est, **afin de** pouvoir revenir la chercher.

- **Débloquée par** : US-0934
- **Critères d'acceptation** :
  - Quand la force de l'escorte est inférieure à la sienne, la Bête ne suit pas et reste sur sa Case jusqu'à la fin de sa durée.
  - L'Expédition la voit pendant tout son séjour, et son Espèce s'inscrit « croisée ».
  - Le récit dit « trop forte pour votre escorte » ; dire aussi de combien (à décider).

### US-0943 · La Bête trop forte peut attaquer
**En tant que** joueur, **je veux** qu'une Bête trop forte puisse s'en prendre à mon Expédition, **afin de** sentir le risque d'aller chercher plus fort que soi.

- **Débloquée par** : US-0942
- **Critères d'acceptation** :
  - Tant que la Bête et l'Expédition sont sur la même Case, la Bête peut attaquer, avec une chance par heure passée ensemble (chiffre à régler).
  - Une Bête qui n'attaque pas laisse l'Expédition finir son séjour normalement.
  - Une chance d'attaque qui dépend de la Rareté ou du régime, un carnivore étant plus agressif (à décider).

### US-0944 · Le combat par la somme des forces
**En tant que** joueur, **je veux** que le combat se règle par la simple somme des forces, **afin de** comprendre d'avance ce que je risque.

- **Débloquée par** : US-0943
- **Critères d'acceptation** :
  - Le combat oppose la force de la Bête à la somme des forces de l'escorte, sans règle de taille.
  - Plus forte que l'escorte, la Bête l'emporte toujours ; la part de l'escorte perdue grandit avec l'écart des forces (chiffre à régler).
  - Seules les Bêtes de l'escorte subissent des pertes : jamais les explorateurs, ni les Bêtes restées au Foyer, ni les Couples.
  - La répartition des pertes entre les Espèces de l'escorte, au prorata des effectifs ou des forces (à décider).
  - La Bête sauvage ne subit aucune perte et reste sur sa Case (à décider).

### US-0945 · Les explorateurs fuient
**En tant que** joueur, **je veux** que mes explorateurs s'enfuient après un combat, **afin de** ne jamais perdre d'Habitants en Expédition.

- **Débloquée par** : US-0944
- **Critères d'acceptation** :
  - Après un combat, l'Expédition abandonne son séjour et rentre aussitôt au Foyer avec les Bêtes survivantes.
  - Les explorateurs reviennent tous, sans jamais être blessés ni tués.
  - Attaquée sans escorte, l'Expédition fuit sans aucune perte.
  - Sur la carte et dans la liste, l'Expédition passe en phase « retour » avec la mention « en fuite ».

### US-0946 · Toute l'escorte perdue
**En tant que** joueur, **je veux** savoir clairement quand toute mon escorte a péri, **afin de** mesurer la leçon.

- **Débloquée par** : US-0945
- **Critères d'acceptation** :
  - Si toutes les Bêtes de l'escorte sont perdues, les explorateurs rentrent seuls et l'Expédition se termine normalement.
  - L'effectif de chaque Espèce concernée baisse du bon nombre, jusqu'à zéro s'il le faut.
  - Le récit l'annonce sans ambiguïté, Espèce par Espèce.

### US-0947 · Le récit du combat
**En tant que** joueur, **je veux** un récit précis du combat, **afin de** savoir quelle force il m'aurait fallu.

- **Débloquée par** : US-0944, US-0940
- **Critères d'acceptation** :
  - Le récit donne l'heure du combat, l'Espèce de la Bête et la force de l'escorte ; afficher aussi la force exacte de la Bête (à décider).
  - Il liste les pertes Espèce par Espèce.
  - Il se termine par la fuite et le retour des explorateurs.

### US-0948 · Repérer la Bête restée sur la carte
**En tant que** joueur, **je veux** voir sur ma carte où une Bête trop forte est restée, **afin de** ne pas oublier de revenir la chercher.

- **Débloquée par** : US-0942, US-0917
- **Critères d'acceptation** :
  - Au retour, la Case où la Bête est restée porte un repère « Bête repérée » avec son Espèce, visible du seul joueur dont l'Expédition l'a vue.
  - Le repère indique jusqu'à quand elle devrait rester ; heure exacte ou approximative (à décider).
  - Le repère disparaît à la fin de sa durée, ou dès qu'elle a suivi une autre Expédition ; le joueur l'apprend-il (à décider).

### US-0949 · Revenir la chercher
**En tant que** joueur, **je veux** renvoyer une escorte plus forte vers une Bête repérée, **afin de** l'apprivoiser tant qu'elle est là.

- **Débloquée par** : US-0948, US-0932
- **Critères d'acceptation** :
  - Depuis le repère ou le récit, « Revenir la chercher » ouvre l'écran d'Expédition avec cette Case comme destination.
  - Le récapitulatif compare la force de la nouvelle escorte à celle de la Bête, et prévient si la Bête sera partie avant l'arrivée prévue.
  - Si la Bête est encore là à l'arrivée et que l'escorte est assez forte, elle suit l'Expédition dès son arrivée.
  - Si elle est partie entre-temps, le récit le dit.

### US-0950 · La Bête s'en va pendant le séjour
**En tant que** joueur, **je veux** que la menace cesse quand la Bête trop forte s'en va, **afin de** laisser mon Expédition finir son séjour tranquille.

- **Débloquée par** : US-0942
- **Critères d'acceptation** :
  - Quand la durée d'une Bête trop forte s'achève pendant le séjour, elle quitte la Case et ne peut plus attaquer.
  - L'Expédition finit son séjour normalement.
  - Le récit mentionne l'heure à laquelle la Bête est repartie.

## Étape 42 · Blessés et morts

### US-0951 · Des Blessés parmi les pertes
**En tant que** joueur, **je veux** qu'une partie de mes pertes soient seulement blessées, **afin de** ne pas tout perdre après un combat malheureux.

- **Débloquée par** : US-0944
- **Critères d'acceptation** :
  - Parmi les pertes d'un combat, une part sont des Blessés (chiffre à régler), les autres meurent.
  - Les morts quittent définitivement l'effectif ; les Blessés rentrent au Foyer avec l'Expédition.
  - Le récit donne, Espèce par Espèce, le nombre de morts et de Blessés.
  - Avec de petits nombres (une seule Bête perdue), arrondi ou tirage au sort (à décider).

### US-0952 · Voir ses Blessés
**En tant que** joueur, **je veux** voir mes Blessés à part dans l'effectif, **afin de** savoir sur quelles Bêtes je peux compter.

- **Débloquée par** : US-0951
- **Critères d'acceptation** :
  - L'effectif de chaque Espèce distingue les Bêtes valides et les Blessés.
  - Chaque groupe de Blessés affiche le temps restant avant sa guérison.
  - Sans Blessé, rien de plus ne s'affiche, pas même une ligne vide.

### US-0953 · Les Blessés restent au Foyer
**En tant que** joueur, **je veux** que mes Blessés ne puissent pas repartir, **afin de** ne pas les exposer par erreur.

- **Débloquée par** : US-0951, US-0904
- **Critères d'acceptation** :
  - Les Blessés ne sont jamais proposés dans une escorte (ni, plus tard, dans une Attaque).
  - Ils continuent de coûter leur Entretien et d'occuper leurs Places.
  - Leur part dans la défense du Foyer, à l'étape 54 (à décider).

### US-0954 · La guérison avec le temps
**En tant que** joueur, **je veux** que mes Blessés guérissent seuls avec le temps, **afin de** retrouver mon effectif sans rien faire.

- **Débloquée par** : US-0952
- **Critères d'acceptation** :
  - Un Blessé guérit après une durée (chiffre à régler) ; la même pour toutes les Espèces ou selon l'Espèce (à décider).
  - Guéri, il redevient une Bête valide de l'effectif, même si le joueur est absent.
  - La page Récits signale les guérisons ; note à part ou simple compteur (à décider).

### US-0955 · Soigner plus vite
**En tant que** joueur, **je veux** m'occuper de mes Blessés pour qu'ils guérissent plus vite, **afin de** repartir plus tôt en Expédition.

- **Débloquée par** : US-0954
- **Critères d'acceptation** :
  - Un Blessé dont on s'occupe guérit plus vite ; le moyen, construction, Poste ou Bête à Rôle (à décider).
  - Le gain sur la durée de guérison (chiffre à régler).
  - Le temps restant affiché tient compte des soins.

## Étape 43 · Le Couple réuni

### US-0956 · Réunir le Couple
**En tant que** joueur, **je veux** que mon mâle et ma femelle d'une même Espèce forment un Couple, **afin de** pouvoir enfin élever cette Espèce.

- **Débloquée par** : US-0937, US-0938, Étape 33
- **Critères d'acceptation** :
  - Dès que l'effectif d'une Espèce sans Couple compte un mâle et une femelle au Foyer, ils forment son Couple, sans action du joueur.
  - Les deux Bêtes quittent l'effectif et partent à l'abri en Réserve ; elles ne combattent plus et ne peuvent plus sortir.
  - Les autres Bêtes de l'Espèce, s'il y en a, restent dans l'effectif.
  - L'Espèce passe à l'état « Couple réuni » au Bestiaire, et le Couple apparaît dans la Réserve avec sa fiche.

### US-0957 · L'Élevage s'ouvre pour toujours
**En tant que** joueur, **je veux** que l'Élevage d'une Espèce me reste acquis dès son Couple réuni, **afin de** ne jamais perdre ce que j'ai gagné.

- **Débloquée par** : US-0956, Étape 34
- **Critères d'acceptation** :
  - Dès le Couple réuni, l'Espèce apparaît dans l'Élevage, avec son coût en Nourriture et son temps (chiffre à régler par Espèce).
  - On y élève ses Bêtes comme celles du Couple de départ, dans la limite des Places et avec leur Entretien.
  - L'Élevage reste ouvert même si toutes les Bêtes de l'Espèce dans l'effectif meurent.
  - Le sexe des Bêtes élevées ne compte plus : seul le Couple importe.

### US-0958 · Annoncer le Couple réuni
**En tant que** joueur, **je veux** que la réunion d'un Couple soit fêtée, **afin de** savourer le moment le plus important du jeu.

- **Débloquée par** : US-0956
- **Critères d'acceptation** :
  - Le récit du retour qui réunit le Couple l'annonce en tête, avec l'illustration de l'Espèce et un bouton vers son Élevage.
  - Le nombre de Couples réunis du joueur s'affiche et augmente d'un ; il servira au classement principal (étape 60).
  - Sur mobile, l'annonce tient sur un seul écran.

### US-0959 · Après le Couple, les Bêtes rejoignent l'effectif
**En tant que** joueur, **je veux** que les Bêtes apprivoisées après la réunion du Couple renforcent mon effectif, **afin de** ne rien perdre à continuer d'en apprivoiser.

- **Débloquée par** : US-0956
- **Critères d'acceptation** :
  - Une fois le Couple réuni, toute nouvelle Bête apprivoisée de l'Espèce rejoint l'effectif, quel que soit son sexe.
  - Aucun second Couple de la même Espèce ne se forme.
  - L'Espèce du Couple de départ est dans ce cas dès le début du jeu.

### US-0960 · Le mâle ou la femelle n'est pas au Foyer
**En tant que** joueur, **je veux** que le Couple se forme correctement même quand l'une des deux Bêtes est absente ou blessée, **afin de** ne pas être pénalisé par un mauvais moment.

- **Débloquée par** : US-0956, US-0953
- **Critères d'acceptation** :
  - Si l'une des deux Bêtes est en Expédition, le Couple se forme à son retour, si elle revient vivante.
  - Si l'une est Blessée, le Couple se forme aussitôt et elle guérit en Réserve, ou il attend sa guérison (à décider).
  - Si la seule Bête d'un sexe meurt avant l'arrivée de l'autre, aucun Couple ne se forme ; l'Espèce reste « apprivoisée » au Bestiaire.

### US-0961 · Prévenir avant de risquer une Bête précieuse
**En tant que** joueur, **je veux** être prévenu quand j'envoie en escorte ma seule Bête d'un sexe, **afin de** ne pas perdre bêtement la moitié d'un futur Couple.

- **Débloquée par** : US-0960, US-0910
- **Critères d'acceptation** :
  - Si l'escorte emmène la seule Bête d'un sexe d'une Espèce sans Couple, le récapitulatif le signale ; simple avertissement ou confirmation demandée (à décider).
  - L'avertissement nomme l'Espèce et le sexe concernés.
  - Il ne s'affiche pas pour les Espèces dont le Couple est déjà réuni.

## Étape 44 · Plusieurs Expéditions sur une Case

### US-0962 · Chaque Expédition présente voit la Bête
**En tant que** joueur, **je veux** voir une Bête même si d'autres joueurs ont une Expédition sur la même Case, **afin de** ne pas être privé de la Rencontre.

- **Débloquée par** : US-0932
- **Critères d'acceptation** :
  - Quand une Bête apparaît sur une Case où séjournent les Expéditions de plusieurs joueurs, toutes la voient, et son Espèce entre au Bestiaire de chacun.
  - Les Expéditions de joueurs différents ne se combattent jamais.
  - Un joueur n'apprend la présence des autres Expéditions que par le récit du retour (à décider).

### US-0963 · Des chances proportionnelles à la force
**En tant que** joueur, **je veux** que mes chances d'emporter une Bête disputée dépendent de la force de mon escorte, **afin de** tirer profit d'une escorte plus forte.

- **Débloquée par** : US-0962, US-0934
- **Critères d'acceptation** :
  - Si la Bête est à portée de plusieurs Expéditions, une seule l'emporte, tirée au sort avec des chances proportionnelles à la force de chaque escorte.
  - Une Expédition pour qui la Bête est trop forte ne participe pas au tirage ; ou la portée se juge sur la somme des escortes présentes (à décider).
  - Le tirage a lieu une seule fois, au moment de la Rencontre, et son résultat ne change plus.

### US-0964 · Le récit du perdant
**En tant que** joueur, **je veux** apprendre qu'une Bête m'a échappé au profit d'une autre Expédition, **afin de** comprendre pourquoi je rentre les mains vides.

- **Débloquée par** : US-0963, US-0940
- **Critères d'acceptation** :
  - Au retour, le perdant reçoit un récit qui dit que la Bête a suivi une autre Expédition.
  - Nommer le chef qui l'a emportée (à décider).
  - Le perdant ne subit aucune perte, garde l'Espèce « croisée » au Bestiaire, et son Expédition a poursuivi son séjour normalement.

### US-0965 · Une Bête trop forte pour toutes
**En tant que** joueur, **je veux** savoir ce qui arrive quand une Bête est trop forte pour toutes les Expéditions présentes, **afin de** mesurer le risque d'une Case disputée.

- **Débloquée par** : US-0962, US-0943
- **Critères d'acceptation** :
  - Si la Bête est trop forte pour chacune des Expéditions présentes, elle reste sur sa Case et peut attaquer.
  - Laquelle elle attaque (au hasard, la plus faible…), et si elle peut en attaquer plusieurs (à décider).
  - Une Expédition attaquée fuit ; les autres poursuivent leur séjour.

### US-0966 · Une Expédition assez forte arrive ensuite
**En tant que** joueur, **je veux** qu'une Bête restée sur une Case puisse suivre une Expédition plus forte arrivée après, **afin de** récompenser celui qui revient mieux préparé.

- **Débloquée par** : US-0963, US-0949
- **Critères d'acceptation** :
  - Si une Bête restée trop forte voit arriver une Expédition assez forte, du même joueur ou d'un autre, elle la suit dès son arrivée.
  - Si plusieurs Expéditions présentes à ce moment sont assez fortes, le tirage proportionnel à la force s'applique.
  - Une Expédition déjà présente qui la perd ainsi l'apprend dans son récit.

### US-0967 · Deux Expéditions du même joueur sur une Case
**En tant que** joueur, **je veux** savoir si je peux envoyer deux Expéditions sur la même Case, **afin de** ne pas gaspiller mes explorateurs.

- **Débloquée par** : US-0963
- **Critères d'acceptation** :
  - Envoyer une seconde Expédition vers une Case où l'on en a déjà une : autorisé ou refusé avec un message (à décider).
  - Si c'est autorisé, chacune a sa propre chance au tirage selon sa force, et une Bête ne suit jamais qu'une seule d'entre elles.

### US-0968 · La simulation des chances
**En tant que** développeur, **je veux** simuler un grand nombre de Rencontres disputées, **afin de** vérifier que les chances suivent bien les forces.

- **Débloquée par** : US-0963
- **Critères d'acceptation** :
  - Un outil de la page de contrôle interne simule un grand nombre de Rencontres entre plusieurs Expéditions de forces différentes.
  - Avec deux escortes de forces 1 et 3, la plus faible l'emporte environ une fois sur quatre, à la tolérance près (chiffre à régler).
  - Le contrôle couvre aussi le cas de trois Expéditions ou plus.

## Étape 45 · Les pigeons éclaireurs

### US-0969 · Les pigeons lèvent plus de brouillard
**En tant que** joueur, **je veux** que les pigeons de mon Couple de départ révèlent plus de carte pendant une Expédition, **afin de** découvrir le Monde plus vite que les autres.

- **Débloquée par** : US-0914, Étape 37
- **Critères d'acceptation** :
  - Quand l'escorte compte des pigeons et que le joueur a le Rôle Éclaireur, le rayon de brouillard levé le long du chemin et autour de la destination s'agrandit (chiffre à régler).
  - L'effet grandit avec le nombre de pigeons, jusqu'à un plafond (chiffre à régler).
  - Les Cases révélées en plus restent visibles pour toujours.

### US-0970 · Les pigeons gardent les Bêtes en vue
**En tant que** joueur, **je veux** que les pigeons de mon Couple de départ gardent plus longtemps en vue les Bêtes apparues, **afin de** faire plus de Rencontres.

- **Débloquée par** : US-0932, Étape 37
- **Critères d'acceptation** :
  - Avec des pigeons, une Bête apparue sur la Case de l'Expédition lui reste visible et atteignable plus longtemps que sa durée ordinaire (chiffre à régler, avec un plafond).
  - Une Expédition avec pigeons qui arrive peu après le départ d'une Bête peut encore la rencontrer.
  - Cet effet ne vaut que pour l'Expédition qui a les pigeons.
  - La forme exacte de l'effet, présence prolongée ou Bêtes repérées sur les Cases voisines (à décider).

### US-0971 · L'effet des pigeons avant le départ
**En tant que** joueur, **je veux** voir ce que mes pigeons apporteront avant de partir, **afin de** décider combien en emmener.

- **Débloquée par** : US-0969, US-0970, US-0910
- **Critères d'acceptation** :
  - Le récapitulatif indique ce qu'apportent les pigeons choisis : rayon de brouillard en plus, présence prolongée des Bêtes.
  - Les pigeons comptent dans la force de l'escorte et risquent les mêmes pertes que les autres Bêtes.
  - Sans pigeon dans l'escorte, rien ne s'affiche à ce sujet.

### US-0972 · Des pigeons sans le Rôle Éclaireur
**En tant que** joueur, **je veux** comprendre pourquoi mes pigeons apprivoisés n'éclairent pas alors que je ne les ai pas choisis au départ, **afin de** savoir comment débloquer leur Rôle.

- **Débloquée par** : US-0969
- **Critères d'acceptation** :
  - Les pigeons d'un joueur qui ne les a pas choisis comme Couple de départ n'ont pas l'effet Éclaireur tant que la Recherche correspondante n'est pas faite (étape 49).
  - Ces pigeons escortent comme toutes les Bêtes.
  - L'écran d'Expédition indique « Rôle Éclaireur : à débloquer par la Recherche ».

### US-0973 · Les pigeons dans le récit
**En tant que** joueur, **je veux** que le récit dise ce que mes pigeons ont apporté, **afin de** juger s'ils valent la peine.

- **Débloquée par** : US-0969, US-0970, US-0940
- **Critères d'acceptation** :
  - Le récit indique combien de Cases supplémentaires les pigeons ont révélées.
  - Il signale les Rencontres qui n'ont eu lieu que grâce à eux.

### US-0974 · La simulation des pigeons
**En tant que** développeur, **je veux** comparer des Expéditions avec et sans pigeons sur une longue période, **afin de** vérifier que leur effet se mesure.

- **Débloquée par** : US-0970
- **Critères d'acceptation** :
  - Un outil de la page de contrôle interne compare, sur une longue période, des Expéditions identiques avec et sans pigeons.
  - Celles avec pigeons font mesurablement plus de Rencontres (écart minimal : chiffre à régler).
  - Il mesure aussi le nombre de Cases révélées en plus.
