# Jalon 6 · Construire

Le joueur bâtit ses premières constructions : des huttes pour accueillir plus d'Habitants, des stockages pour garder plus de ressources, des constructions à Postes qu'il faut faire tourner avec du personnel, puis la tour de guet et la taverne qui changent la venue des Voyageurs. Étapes couvertes : 25 à 30 de l'ordre d'attaque, attaquées après les jalons 9 et 8 (ADR 0008).

## Étape 25 · Les huttes

### US-0601 · Ouvrir la page des constructions
**En tant que** joueur, **je veux** ouvrir une page qui rassemble toutes les constructions de mon Foyer, **afin de** voir d'un coup d'œil ce que j'ai bâti et ce que je pourrai bâtir.

- **Débloquée par** : Étape 9, Étape 10
- **Critères d'acceptation** :
  - Une entrée « Constructions » de la navigation ouvre la page, sur ordinateur comme sur mobile.
  - Les constructions sont rangées par famille (Centre, Logement, Stockage, Recherche, Élevage, Habitats, Défense, Vie du village, Avant-poste, Spéciales), selon la liste des constructions.
  - Chaque construction montre son illustration, son nom, et son niveau ou la mention « Pas encore bâtie ».
  - La hutte du chef apparaît dans la famille Centre, déjà bâtie (ce qu'apportent ses niveaux : à décider).

### US-0602 · Voir les constructions verrouillées
**En tant que** joueur, **je veux** voir aussi les constructions que je ne peux pas encore bâtir, **afin de** savoir ce qui m'attend et ce qu'il me faudra débloquer.

- **Débloquée par** : US-0601
- **Critères d'acceptation** :
  - Une construction qui demande une Recherche s'affiche grisée, avec un cadenas et la mention « Demande une Recherche ».
  - Son nom, son illustration et son effet restent lisibles, mais elle n'a pas de bouton « Construire ».
  - Le jeu refuse son chantier même si la demande arrive par un autre chemin que le bouton.
  - Le nom de la Recherche et le lien vers elle arrivent avec l'arbre des Recherches (étape 32).

### US-0603 · Lire la fiche d'une construction
**En tant que** joueur, **je veux** ouvrir la fiche d'une construction, **afin de** comprendre à quoi elle sert avant d'y mettre mes Matériaux.

- **Débloquée par** : US-0601
- **Critères d'acceptation** :
  - Toucher une construction ouvre sa fiche : illustration, famille, description en une phrase, niveau actuel.
  - La fiche chiffre l'effet de la construction (par exemple « + N places pour les Habitants »), selon la liste des constructions (chiffre à régler).
  - Fermer la fiche ramène à la page des constructions, au même endroit de la liste.

### US-0604 · Voir le coût et la durée d'une hutte
**En tant que** joueur, **je veux** savoir ce que coûte une hutte et combien de temps dure son chantier, **afin de** décider si je la lance maintenant.

- **Débloquée par** : US-0603
- **Critères d'acceptation** :
  - La fiche de la hutte affiche son coût en Bois et en Pierre, et la durée de son chantier (chiffre à régler).
  - Chaque Matériau qui manque est signalé, avec la quantité manquante.
  - L'heure de fin prévue s'affiche à côté de la durée.
  - Les coûts et durées affichés sont ceux de la liste des constructions : la modifier change l'affichage sans autre retouche.

### US-0605 · Lancer le chantier d'une hutte
**En tant que** joueur, **je veux** lancer la construction d'une hutte, **afin de** pouvoir accueillir plus d'Habitants.

- **Débloquée par** : US-0604
- **Critères d'acceptation** :
  - Le bouton « Construire » retire aussitôt le coût des stocks de Bois et de Pierre, et la barre du haut se met à jour.
  - Le chantier démarre à l'heure du clic et affiche son heure de fin.
  - La hutte passe à l'état « En chantier » sur la page des constructions.
  - Un double clic ne lance qu'un chantier et ne fait payer qu'une fois.

### US-0606 · Refuser un chantier faute de Matériaux
**En tant que** joueur, **je veux** qu'on m'empêche de lancer un chantier que je ne peux pas payer, **afin de** ne jamais me retrouver avec des stocks négatifs.

- **Débloquée par** : US-0605
- **Critères d'acceptation** :
  - Tant qu'un Matériau manque, le bouton « Construire » est désactivé et dit lequel et combien.
  - Si les stocks ont baissé entre l'affichage et le clic (par exemple dans un autre onglet), le jeu refuse le chantier avec un message clair et ne retire rien.
  - Aucun stock ne descend jamais sous zéro.
  - Le bouton se réactive de lui-même quand la production continue a comblé ce qui manquait.

### US-0607 · Suivre un chantier en cours
**En tant que** joueur, **je veux** voir mon chantier avancer, **afin de** savoir quand ma construction sera prête.

- **Débloquée par** : US-0605
- **Critères d'acceptation** :
  - La construction en chantier affiche une barre d'avancement et le temps restant, qui avancent sans recharger la page.
  - L'heure de fin est donnée à l'heure locale du joueur.
  - Après un rechargement, ou depuis un autre appareil, l'avancement est exactement le même.
  - En vitesse accélérée, le chantier avance cent fois plus vite.

### US-0608 · Voir ses chantiers depuis l'accueil
**En tant que** joueur, **je veux** voir mes chantiers en cours dès l'accueil, **afin de** savoir en une seconde où en est mon Foyer lors d'une courte visite.

- **Débloquée par** : US-0607
- **Critères d'acceptation** :
  - Un bloc de l'accueil liste chaque chantier en cours avec son temps restant.
  - Sans chantier, le bloc affiche « Aucun chantier en cours » et un lien vers la page des constructions.
  - Toucher un chantier ouvre la fiche de sa construction.

### US-0609 · Gagner de la place avec une hutte terminée
**En tant que** joueur, **je veux** qu'une hutte terminée ajoute de la place pour les Habitants, **afin de** pouvoir accueillir plus de Voyageurs.

- **Débloquée par** : US-0607, Étape 17
- **Critères d'acceptation** :
  - À la fin du chantier, la place pour les Habitants augmente du montant prévu pour la hutte (chiffre à régler).
  - La page Habitants affiche le nouveau total, sous la forme « N Habitants sur M places » (étape 17).
  - La hutte quitte l'état « En chantier » et affiche son niveau.
  - Le gain ne tombe qu'une fois, même si deux visites ont lieu au moment exact de la fin.

### US-0610 · Accueillir un Voyageur grâce à la nouvelle hutte
**En tant que** joueur, **je veux** pouvoir accueillir le Voyageur qui attendait dès que ma hutte est finie, **afin de** ne pas le laisser repartir faute de place.

- **Débloquée par** : US-0609
- **Critères d'acceptation** :
  - Quand la place est pleine, un Voyageur aux portes affiche « Plus de place : bâtissez une hutte », avec un lien vers la fiche de la hutte.
  - Dès la fin du chantier, le bouton « Accueillir » de ce Voyageur devient actif, sans recharger la page.
  - Accueilli, le Voyageur devient un Habitant et occupe la nouvelle place.

### US-0611 · Retrouver un chantier fini pendant l'absence
**En tant que** joueur, **je veux** trouver terminés les chantiers qui ont fini pendant que j'étais parti, **afin de** ne pas avoir à rester connecté pour bâtir.

- **Débloquée par** : US-0609, Étape 3
- **Critères d'acceptation** :
  - Un chantier dont l'heure de fin est passée est terminé à la visite suivante, son effet appliqué.
  - Le chantier se termine à son heure même si le joueur ne revient pas : le passage régulier du Monde l'achève (étape 3).
  - L'effet compte depuis l'heure de fin réelle, pas depuis l'heure de la visite.

### US-0612 · Annuler un chantier
**En tant que** joueur, **je veux** annuler un chantier en cours, **afin de** récupérer une partie de mes Matériaux si j'ai changé d'avis.

- **Débloquée par** : US-0607
- **Critères d'acceptation** :
  - Un bouton « Annuler » sur le chantier demande une confirmation.
  - Avant de confirmer, le joueur voit ce qu'il récupère : une part des Matériaux payés (chiffre à régler).
  - Après confirmation, le chantier disparaît et la construction reste exactement à son niveau d'avant.
  - Ce qui dépasserait la limite de stock est perdu, et la confirmation le signale (à décider).
  - Un chantier terminé ne peut plus être annulé, même si la page n'a pas encore été rafraîchie.

### US-0613 · Être prévenu de la fin d'un chantier
**En tant que** joueur, **je veux** un récit quand un chantier se termine, **afin de** savoir tout de suite que je peux en relancer un.

- **Débloquée par** : US-0611
- **Critères d'acceptation** :
  - À la fin d'un chantier, un récit court annonce « <construction> terminée, niveau N » sur la page Récits (étape 16), avec l'heure réelle de fin, même si le chantier a fini pendant l'absence.
  - Le récit mène à la fiche de la construction.
  - Aucune notification du navigateur n'est envoyée pour une fin de chantier (elles sont réservées aux événements importants, étape 64).

### US-0614 · Gérer ses constructions sur mobile
**En tant que** joueur, **je veux** gérer mes constructions au pouce sur mon téléphone, **afin de** lancer un chantier en quelques secondes, où que je sois.

- **Débloquée par** : US-0607
- **Critères d'acceptation** :
  - Sur un écran de téléphone (375 pixels de large), les constructions tiennent sur une colonne, sans défilement de côté.
  - La fiche d'une construction s'ouvre en plein écran, avec un bouton « Fermer » bien visible.
  - Lancer ou annuler un chantier se fait au pouce, sans zoom.

## Étape 26 · Les bâtisseurs

### US-0615 · Voir les bâtisseurs d'un chantier
**En tant que** joueur, **je veux** voir combien de bâtisseurs travaillent sur un chantier, **afin de** comprendre pourquoi il avance à cette vitesse.

- **Débloquée par** : US-0607, Étape 14
- **Critères d'acceptation** :
  - La fiche d'un chantier affiche le nombre de bâtisseurs qui y travaillent.
  - Avec un seul chantier en cours, ce nombre est celui des Habitants dont le Métier est bâtisseur sur la page Habitants.
  - Sans bâtisseur, la fiche le dit et mène à la page Habitants.

### US-0616 · Bâtir plus vite avec plus de bâtisseurs
**En tant que** joueur, **je veux** que plus de bâtisseurs construisent plus vite, **afin de** choisir entre bâtir vite et envoyer mes Habitants récolter.

- **Débloquée par** : US-0615
- **Critères d'acceptation** :
  - La durée donnée par la liste des constructions est celle d'un seul bâtisseur ; avec N bâtisseurs, le chantier va N fois plus vite.
  - Avant le lancement, la fiche affiche la durée prévue avec les bâtisseurs présents.
  - (à décider) : un nombre maximum de bâtisseurs par chantier (chiffre à régler), au-delà duquel un bâtisseur de plus n'accélère plus rien.
  - En vitesse accélérée, un même chantier dure deux fois moins avec deux bâtisseurs qu'avec un seul.

### US-0617 · Renforcer un chantier en cours de route
**En tant que** joueur, **je veux** que mon chantier accélère ou ralentisse quand le nombre de bâtisseurs change, **afin de** pouvoir pousser un chantier urgent.

- **Débloquée par** : US-0616
- **Critères d'acceptation** :
  - Donner le Métier bâtisseur à un Habitant pendant un chantier raccourcit le temps restant, sans toucher au travail déjà fait.
  - Retirer un bâtisseur allonge le temps restant de la même façon.
  - L'heure de fin affichée se met à jour aussitôt.
  - Un bâtisseur qui s'en va pendant une Famine (étape 16) ralentit le chantier de la même façon.

### US-0618 · Savoir ce que devient un chantier sans bâtisseur
**En tant que** joueur, **je veux** savoir ce qui arrive à un chantier quand je n'ai aucun bâtisseur, **afin de** ne pas attendre une construction qui n'avance pas.

- **Débloquée par** : US-0616
- **Critères d'acceptation** :
  - (à décider) : sans aucun bâtisseur, le chantier avance à une vitesse réduite (chiffre à régler), ou il s'arrête.
  - S'il s'arrête, la construction affiche « À l'arrêt : aucun bâtisseur » et son temps restant ne décompte plus.
  - Le chantier reprend là où il en était dès qu'un bâtisseur revient.
  - Lancer un chantier sans bâtisseur demande, avant de payer, une confirmation qui explique la règle.

### US-0619 · Signaler des bâtisseurs sans chantier
**En tant que** joueur, **je veux** savoir quand mes bâtisseurs n'ont rien à construire, **afin de** ne pas laisser des Habitants sans rien faire.

- **Débloquée par** : US-0615
- **Critères d'acceptation** :
  - Quand aucun chantier n'est en cours, la page des constructions affiche « N bâtisseurs attendent un chantier ».
  - Le même signal apparaît sur la page Habitants, à côté du Métier bâtisseur.
  - Le signal disparaît dès qu'un chantier est lancé.

### US-0620 · Une seule construction par type à la fois
**En tant que** joueur, **je veux** qu'une construction n'ait jamais qu'un chantier à la fois, **afin de** savoir clairement ce que je peux lancer en parallèle.

- **Débloquée par** : US-0616
- **Critères d'acceptation** :
  - Pendant son chantier, une construction affiche le chantier en cours à la place de son bouton « Construire ».
  - Le jeu refuse un second chantier de la même construction, même demandé depuis un autre onglet.
  - Une construction d'un autre type peut être mise en chantier en même temps.

### US-0621 · Répartir les bâtisseurs entre plusieurs chantiers
**En tant que** joueur, **je veux** savoir comment mes bâtisseurs se partagent quand plusieurs chantiers tournent, **afin de** donner la priorité au plus urgent.

- **Débloquée par** : US-0617, US-0620
- **Critères d'acceptation** :
  - (à décider) : le joueur choisit combien de bâtisseurs vont sur chaque chantier, ou ils se partagent d'eux-mêmes à parts égales.
  - Chaque chantier affiche ses propres bâtisseurs, et leur total ne dépasse jamais le nombre de bâtisseurs du Territoire.
  - Le temps restant de chaque chantier suit son propre nombre de bâtisseurs.
  - Quand un chantier se termine, ses bâtisseurs redeviennent disponibles pour les autres chantiers, selon la règle retenue.

## Étape 27 · Les niveaux

### US-0622 · Améliorer une construction
**En tant que** joueur, **je veux** améliorer une construction déjà bâtie, **afin de** renforcer son effet.

- **Débloquée par** : US-0620
- **Critères d'acceptation** :
  - Une construction bâtie propose « Améliorer au niveau N+1 », avec le coût et la durée de ce niveau.
  - Le chantier d'amélioration se lance, se suit, s'annule et profite des bâtisseurs comme un premier chantier.
  - À la fin, la construction passe au niveau N+1 et l'effet de ce niveau s'applique.

### US-0623 · Payer plus cher chaque niveau
**En tant que** joueur, **je veux** que chaque niveau coûte et dure plus que le précédent, **afin de** faire de chaque amélioration un vrai choix.

- **Débloquée par** : US-0622
- **Critères d'acceptation** :
  - Le coût en Bois et en Pierre et la durée de chaque niveau suivent la table de progression de la construction (chiffre à régler).
  - Pour toute construction, le niveau N+1 coûte et dure plus que le niveau N.
  - Un contrôle automatique parcourt tous les niveaux de toutes les constructions et vérifie cette progression.

### US-0624 · Comparer le niveau actuel et le suivant
**En tant que** joueur, **je veux** voir côte à côte l'effet de mon niveau actuel et celui du suivant, **afin de** juger si l'amélioration vaut son prix.

- **Débloquée par** : US-0622
- **Critères d'acceptation** :
  - La fiche affiche l'effet du niveau actuel et celui du niveau suivant, côte à côte.
  - Le gain est mis en valeur (« + N »).
  - Une construction pas encore bâtie n'affiche que l'effet du niveau 1.

### US-0625 · Agrandir les huttes niveau par niveau
**En tant que** joueur, **je veux** que chaque niveau des huttes ajoute de la place, **afin de** faire grandir mon Territoire en Habitants.

- **Débloquée par** : US-0622, US-0609
- **Critères d'acceptation** :
  - Chaque niveau de huttes terminé ajoute la place prévue pour ce niveau (chiffre à régler).
  - La place pour les Habitants vaut la place de départ (étape 17) plus ce qu'apporte chaque niveau de huttes.
  - (à décider) : les huttes forment une seule construction qui monte en niveau, ou l'on peut en bâtir plusieurs.

### US-0626 · Savoir si une construction sert pendant son amélioration
**En tant que** joueur, **je veux** savoir si une construction continue de servir pendant son amélioration, **afin de** choisir le bon moment pour l'améliorer.

- **Débloquée par** : US-0622
- **Critères d'acceptation** :
  - (à décider) : pendant le chantier du niveau suivant, la construction garde l'effet de son niveau actuel, ou elle cesse de servir.
  - Pendant le chantier, la fiche dit clairement ce qu'il en est.
  - Annuler l'amélioration laisse la construction exactement comme avant, effet compris.

### US-0627 · Atteindre le niveau maximum
**En tant que** joueur, **je veux** savoir quand une construction ne peut plus monter, **afin de** porter mes efforts ailleurs.

- **Débloquée par** : US-0623
- **Critères d'acceptation** :
  - (à décider) : chaque construction a un niveau maximum (chiffre à régler), ou ses niveaux ne s'arrêtent pas.
  - Au niveau maximum, la construction affiche « Niveau maximum » et n'a plus de bouton « Améliorer ».
  - Le jeu refuse tout chantier au-delà du niveau maximum.

## Étape 28 · Les stockages

### US-0628 · Bâtir le grenier
**En tant que** joueur, **je veux** bâtir et agrandir un grenier, **afin de** garder plus de Végétaux.

- **Débloquée par** : US-0623, Étape 12
- **Critères d'acceptation** :
  - Le grenier apparaît dans la famille Stockage et se bâtit sans Recherche.
  - Chaque niveau terminé relève la limite du stock de Végétaux du montant prévu (chiffre à régler).
  - La barre du haut affiche la nouvelle limite dès la fin du chantier.
  - Les limites de Viande, de Bois et de Pierre ne bougent pas.

### US-0629 · Bâtir le fumoir
**En tant que** joueur, **je veux** bâtir et agrandir un fumoir, **afin de** garder plus de Viande.

- **Débloquée par** : US-0623, Étape 12
- **Critères d'acceptation** :
  - Le fumoir apparaît dans la famille Stockage et se bâtit sans Recherche.
  - Chaque niveau terminé relève la limite du stock de Viande du montant prévu (chiffre à régler).
  - La barre du haut affiche la nouvelle limite dès la fin du chantier.
  - Les limites de Végétaux, de Bois et de Pierre ne bougent pas.

### US-0630 · Bâtir le bûcher
**En tant que** joueur, **je veux** bâtir et agrandir un bûcher, **afin de** garder plus de Bois.

- **Débloquée par** : US-0623, Étape 12
- **Critères d'acceptation** :
  - Le bûcher apparaît dans la famille Stockage et se bâtit sans Recherche.
  - Chaque niveau terminé relève la limite du stock de Bois du montant prévu (chiffre à régler).
  - La barre du haut affiche la nouvelle limite dès la fin du chantier.
  - Les limites de Viande, de Végétaux et de Pierre ne bougent pas.

### US-0631 · Bâtir la taillerie
**En tant que** joueur, **je veux** bâtir et agrandir une taillerie, **afin de** garder plus de Pierre.

- **Débloquée par** : US-0623, Étape 12
- **Critères d'acceptation** :
  - La taillerie apparaît dans la famille Stockage et se bâtit sans Recherche.
  - Chaque niveau terminé relève la limite du stock de Pierre du montant prévu (chiffre à régler).
  - La barre du haut affiche la nouvelle limite dès la fin du chantier.
  - Les limites de Viande, de Végétaux et de Bois ne bougent pas.

### US-0632 · Relancer la production d'un stock plein
**En tant que** joueur, **je veux** qu'un stock plein se remette à monter dès que j'agrandis son stockage, **afin de** ne plus perdre de production.

- **Débloquée par** : US-0628, US-0629, US-0630, US-0631
- **Critères d'acceptation** :
  - Un stock arrêté à sa limite (étape 12) se remet à monter dès la fin du chantier qui relève cette limite.
  - Le signal de stock plein disparaît de la barre du haut.
  - Si le chantier finit pendant l'absence, la production reprend à l'heure de fin du chantier, pas à l'heure de la visite.

### US-0633 · Signaler un chantier plus cher que la limite de stock
**En tant que** joueur, **je veux** être prévenu quand un chantier coûte plus que ce que mes stocks peuvent contenir, **afin de** savoir qu'il me faut d'abord agrandir un stockage.

- **Débloquée par** : US-0606, US-0630, US-0631
- **Critères d'acceptation** :
  - Si un chantier coûte plus de Bois que la limite du stock de Bois, sa fiche affiche « Agrandissez d'abord votre bûcher », avec un lien vers lui ; de même pour la Pierre et la taillerie.
  - Le bouton « Construire » reste désactivé tant que la limite est trop basse.
  - Un contrôle automatique vérifie que le niveau suivant du bûcher et de la taillerie se paie toujours avec les limites déjà atteintes, pour qu'on ne soit jamais bloqué.

## Étape 29 · Les Postes

### US-0634 · Voir les Postes d'une construction
**En tant que** joueur, **je veux** voir combien de Postes offre une construction et combien sont occupés, **afin de** savoir s'il me faut des Habitants pour la faire tourner.

- **Débloquée par** : US-0622, Étape 14
- **Critères d'acceptation** :
  - La fiche d'une construction à Postes affiche « Postes : occupés / total ».
  - Le nombre de Postes vient de la liste des constructions (chiffre à régler) ; (à décider) il grandit avec le niveau.
  - Une construction sans Postes n'affiche pas ce bloc.
  - Au moins une construction de ce jalon a des Postes, pour que la règle se vérifie en jeu (laquelle : à décider).

### US-0635 · Placer un Habitant à un Poste
**En tant que** joueur, **je veux** placer un Habitant à un Poste libre, **afin de** faire tourner une construction.

- **Débloquée par** : US-0634
- **Critères d'acceptation** :
  - Depuis la fiche de la construction, le joueur choisit un Habitant et le place à un Poste libre.
  - L'Habitant quitte son Métier précédent : son Métier devient ce Poste, et les effectifs par Métier se mettent à jour.
  - On ne peut pas placer plus d'Habitants qu'il n'y a de Postes libres.
  - Un Habitant parti en Récolte ne peut être placé qu'à son retour.

### US-0636 · Retirer un Habitant d'un Poste
**En tant que** joueur, **je veux** retirer un employé de son Poste, **afin de** le remettre à un autre travail.

- **Débloquée par** : US-0635
- **Critères d'acceptation** :
  - Retirer un employé libère son Poste et rend l'Habitant sans Métier.
  - L'effet de la construction baisse aussitôt.
  - Donner un autre Métier à un employé libère son Poste de la même façon.

### US-0637 · Voir une construction inactive sans personnel
**En tant que** joueur, **je veux** voir clairement qu'une construction à Postes sans personnel ne fait rien, **afin de** ne pas croire qu'elle travaille pour moi.

- **Débloquée par** : US-0635
- **Critères d'acceptation** :
  - Une construction à Postes sans aucun employé n'a aucun effet, quel que soit son niveau.
  - Elle porte la marque « Inactive : aucun personnel » sur la page des constructions et sur sa fiche.
  - Une construction à Postes qui vient d'être bâtie reste inactive jusqu'à son premier employé.
  - La marque disparaît dès le premier employé.

### US-0638 · Mesurer ce qu'apporte chaque employé
**En tant que** joueur, **je veux** voir ce qu'apporte chaque employé de plus, **afin de** décider combien d'Habitants mettre dans une construction.

- **Débloquée par** : US-0637
- **Critères d'acceptation** :
  - Chaque employé augmente l'effet de la construction du montant prévu (chiffre à régler).
  - La fiche affiche l'effet actuel et celui qu'on aurait avec un employé de plus.
  - (à décider) : chaque employé apporte autant que le précédent, ou un peu moins.
  - En vitesse accélérée, l'effet mesuré avec un, deux puis trois employés correspond aux chiffres affichés.

### US-0639 · Retrouver les Postes sur la page Habitants
**En tant que** joueur, **je veux** retrouver les Habitants à un Poste sur la page Habitants, **afin de** voir en un seul endroit à quoi sert chacun.

- **Débloquée par** : US-0635
- **Critères d'acceptation** :
  - Pour chaque Habitant à un Poste, la page Habitants affiche le nom de la construction.
  - Les effectifs par Métier comptent les Postes à part, construction par construction.
  - On peut retirer un Habitant de son Poste depuis la page Habitants.

### US-0640 · Perdre un employé pendant une Famine
**En tant que** joueur, **je veux** savoir qu'une Famine peut vider mes Postes, **afin de** comprendre pourquoi une construction s'est arrêtée.

- **Débloquée par** : US-0637, Étape 16
- **Critères d'acceptation** :
  - Quand un Habitant employé à un Poste s'en va pendant une Famine, son Poste se libère et l'effet de la construction baisse aussitôt.
  - Les employés partent selon la même règle que les autres Habitants, celle de l'étape 16 (sans Métier d'abord, ou au hasard : à décider).
  - Le récit de la Famine nomme les Postes qui se sont vidés.

## Étape 30 · La tour de guet et la taverne

### US-0641 · Bâtir la tour de guet
**En tant que** joueur, **je veux** bâtir une tour de guet, **afin de** voir venir les Voyageurs de plus loin.

- **Débloquée par** : US-0623
- **Critères d'acceptation** :
  - La tour de guet apparaît sur la page des constructions et se bâtit sans Recherche.
  - Sa fiche annonce son effet : repérer les Voyageurs plus tôt ; ses préavis pour les Incursions et les Attaques viendront plus tard (étapes 54 et 58).
  - (à décider) : la tour de guet a des Postes, et ne repère alors rien sans personnel.

### US-0642 · Voir un Voyageur approcher
**En tant que** joueur, **je veux** être prévenu qu'un Voyageur approche avant qu'il n'arrive aux portes, **afin de** lui préparer de la place à temps.

- **Débloquée par** : US-0641, Étape 17
- **Critères d'acceptation** :
  - Avec une tour de guet qui fonctionne, un Voyageur est annoncé « en approche » un certain temps avant d'arriver aux portes (chiffre à régler).
  - L'annonce donne son heure d'arrivée prévue, sur la page Habitants et à l'accueil.
  - (à décider) : on peut accueillir un Voyageur encore en approche, ou seulement une fois arrivé aux portes.
  - Sans tour de guet, rien ne change : le Voyageur apparaît à son arrivée, comme à l'étape 17.

### US-0643 · Repérer les Voyageurs de plus en plus tôt
**En tant que** joueur, **je veux** que la tour de guet repère les Voyageurs plus tôt à mesure que je la renforce, **afin de** voir mes efforts récompensés.

- **Débloquée par** : US-0642
- **Critères d'acceptation** :
  - Le temps d'avance grandit avec le niveau de la tour (chiffre à régler).
  - Si la tour a des Postes, chaque employé ajoute du temps d'avance (chiffre à régler).
  - La fiche de la tour affiche le temps d'avance actuel.
  - En vitesse accélérée, l'écart mesuré entre l'annonce et l'arrivée d'un Voyageur correspond au temps affiché.

### US-0644 · Bâtir la taverne
**En tant que** joueur, **je veux** bâtir une taverne, **afin de** donner envie aux Voyageurs de rester.

- **Débloquée par** : US-0623
- **Critères d'acceptation** :
  - La taverne apparaît sur la page des constructions et se bâtit sans Recherche.
  - Sa fiche annonce son effet : les Voyageurs attendent plus longtemps aux portes.
  - (à décider) : la taverne a des Postes, et ne retient alors personne sans personnel.

### US-0645 · Retenir les Voyageurs plus longtemps
**En tant que** joueur, **je veux** que la taverne fasse attendre les Voyageurs plus longtemps aux portes, **afin de** ne pas les manquer quand je joue peu souvent.

- **Débloquée par** : US-0644, Étape 17
- **Critères d'acceptation** :
  - Le temps d'attente d'un Voyageur aux portes s'allonge avec le niveau de la taverne (chiffre à régler), et avec chaque employé si elle a des Postes.
  - (à décider) : l'allongement vaut aussi pour les Voyageurs déjà aux portes au moment où la taverne est finie.
  - En vitesse accélérée, un Voyageur ignoré repart plus tard avec la taverne que sans, exactement du temps affiché sur la fiche de la taverne.

### US-0646 · Voir ce que la taverne ajoute à l'attente
**En tant que** joueur, **je veux** voir combien de temps la taverne fait gagner sur chaque Voyageur, **afin de** juger si elle vaut d'être agrandie.

- **Débloquée par** : US-0645
- **Critères d'acceptation** :
  - Le compte à rebours de chaque Voyageur aux portes (étape 17) inclut le temps ajouté par la taverne.
  - Le temps gagné grâce à la taverne est indiqué à part (« dont + N grâce à la taverne »).
  - La fiche de la taverne affiche le temps d'attente total d'un Voyageur au niveau actuel et au niveau suivant.
