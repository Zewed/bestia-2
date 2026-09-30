# Jalon 7 · La Recherche

Le joueur bâtit le cercle des sages, y met des chercheurs et mène ses premières Recherches dans un arbre en quatre branches ; une construction verrouillée dit enfin quelle Recherche l'ouvre, et y mène d'un toucher. Aucune Recherche ne rend jamais les Bêtes plus fortes. Étapes couvertes : 31 à 32 de l'ordre d'attaque.

## Étape 31 · Le cercle des sages

### US-0701 · Bâtir le cercle des sages
**En tant que** joueur, **je veux** bâtir le cercle des sages, **afin de** pouvoir y mener mes premières Recherches.

- **Débloquée par** : Étape 27
- **Critères d'acceptation** :
  - Le cercle des sages apparaît dans la famille Recherche de la page des constructions, et se bâtit sans Recherche.
  - Il se bâtit comme toute construction : coût en Matériaux et durée (chiffre à régler), accélérés par les bâtisseurs.
  - Tant qu'il n'est pas bâti, aucune Recherche ne peut être lancée.

### US-0702 · Ouvrir la page Recherche
**En tant que** joueur, **je veux** ouvrir une page Recherche, **afin de** voir ce que je peux apprendre.

- **Débloquée par** : US-0701
- **Critères d'acceptation** :
  - Une entrée « Recherche » de la navigation ouvre la page, sur ordinateur comme sur mobile.
  - Sans cercle des sages, la page affiche « Bâtissez le cercle des sages pour mener des Recherches », avec un lien vers sa fiche.
  - Avec le cercle bâti, la page liste les Recherches qu'on peut lancer.

### US-0703 · Voir ses chercheurs
**En tant que** joueur, **je veux** voir combien de chercheurs travaillent au cercle des sages, **afin de** savoir à quelle vitesse mes Recherches avanceront.

- **Débloquée par** : US-0702, Étape 14
- **Critères d'acceptation** :
  - La page Recherche affiche le nombre d'Habitants dont le Métier est chercheur.
  - Sans chercheur, elle affiche « Aucun chercheur » et un lien vers la page Habitants pour en désigner un.
  - Le nombre se met à jour dès qu'un Habitant change de Métier.

### US-0704 · Lire la fiche d'une Recherche
**En tant que** joueur, **je veux** ouvrir la fiche d'une Recherche, **afin de** savoir ce qu'elle m'apporte avant de la lancer.

- **Débloquée par** : US-0702
- **Critères d'acceptation** :
  - Toucher une Recherche ouvre sa fiche : nom, branche, description en une phrase.
  - La fiche dit ce que la Recherche débloque : une construction, un Rôle, ou de la portée pour les Expéditions.
  - La fiche affiche le coût (chiffre à régler) et la durée prévue avec les chercheurs présents.

### US-0705 · Lancer une Recherche
**En tant que** joueur, **je veux** lancer une Recherche, **afin de** débloquer ce qu'elle promet.

- **Débloquée par** : US-0704
- **Critères d'acceptation** :
  - Le bouton « Chercher » retire aussitôt le coût des stocks (ressources demandées : à décider) et la barre du haut se met à jour.
  - La Recherche passe à l'état « En cours » et affiche son heure de fin.
  - Un double clic ne lance qu'une Recherche et ne fait payer qu'une fois.

### US-0706 · Refuser une Recherche trop chère
**En tant que** joueur, **je veux** qu'on m'empêche de lancer une Recherche que je ne peux pas payer, **afin de** ne jamais me retrouver avec des stocks négatifs.

- **Débloquée par** : US-0705
- **Critères d'acceptation** :
  - Tant qu'une ressource manque, le bouton « Chercher » est désactivé et dit laquelle et combien.
  - Si les stocks ont baissé entre l'affichage et le clic, le jeu refuse la Recherche avec un message clair et ne retire rien.
  - Aucun stock ne descend jamais sous zéro.

### US-0707 · Savoir ce que devient une Recherche sans chercheur
**En tant que** joueur, **je veux** savoir ce qui se passe quand je n'ai aucun chercheur, **afin de** ne pas attendre une Recherche qui n'avance pas.

- **Débloquée par** : US-0703, US-0705
- **Critères d'acceptation** :
  - (à décider) : sans chercheur, on ne peut pas lancer de Recherche, ou elle avance à une vitesse réduite (chiffre à régler) ; la règle est la même que pour les chantiers sans bâtisseur (étape 26).
  - Si la Recherche s'arrête, elle affiche « À l'arrêt : aucun chercheur » et son temps restant ne décompte plus.
  - Elle reprend là où elle en était dès qu'un chercheur revient.

### US-0708 · Ne mener qu'une Recherche à la fois
**En tant que** joueur, **je veux** savoir combien de Recherches je peux mener en même temps, **afin de** choisir la plus utile.

- **Débloquée par** : US-0705
- **Critères d'acceptation** :
  - (à décider) : une seule Recherche en cours pour tout le Territoire, ou une par branche.
  - Quand la limite est atteinte, les autres Recherches affichent « Une Recherche est déjà en cours » à la place du bouton.
  - Le jeu refuse la Recherche de trop, même demandée depuis un autre onglet.

### US-0709 · Suivre la Recherche en cours
**En tant que** joueur, **je veux** voir ma Recherche avancer, **afin de** savoir quand elle aboutira.

- **Débloquée par** : US-0705
- **Critères d'acceptation** :
  - La Recherche en cours affiche une barre d'avancement, le temps restant et l'heure de fin, qui avancent sans recharger la page.
  - Après un rechargement, ou depuis un autre appareil, l'avancement est exactement le même.
  - Un bloc de l'accueil montre la Recherche en cours et son temps restant, ou « Aucune Recherche en cours » avec un lien vers la page Recherche.
  - En vitesse accélérée, la Recherche avance cent fois plus vite.

### US-0710 · Chercher plus vite avec plus de chercheurs
**En tant que** joueur, **je veux** que plus de chercheurs fassent aboutir une Recherche plus vite, **afin de** choisir entre chercher vite et envoyer mes Habitants ailleurs.

- **Débloquée par** : US-0703, US-0709
- **Critères d'acceptation** :
  - La durée d'une Recherche baisse avec le nombre de chercheurs (à décider : durée divisée par le nombre de chercheurs, comme pour les bâtisseurs).
  - Ajouter un chercheur en cours de route raccourcit le temps restant sans perdre le travail fait, et l'heure de fin se met à jour.
  - En vitesse accélérée, une même Recherche aboutit plus tôt avec deux chercheurs qu'avec un seul, de l'écart prévu par la règle.

### US-0711 · Perdre des chercheurs en cours de Recherche
**En tant que** joueur, **je veux** voir ma Recherche ralentir quand des chercheurs s'en vont, **afin de** comprendre pourquoi son heure de fin recule.

- **Débloquée par** : US-0710, Étape 16
- **Critères d'acceptation** :
  - Donner un autre Métier à un chercheur allonge le temps restant, et l'heure de fin se met à jour.
  - Un chercheur qui s'en va pendant une Famine ralentit la Recherche de la même façon.
  - Si le dernier chercheur part, la Recherche suit la règle de l'US-0707.
  - Le travail déjà fait n'est jamais perdu.

### US-0712 · Annuler une Recherche
**En tant que** joueur, **je veux** annuler une Recherche en cours, **afin de** changer de priorité.

- **Débloquée par** : US-0709
- **Critères d'acceptation** :
  - Un bouton « Annuler » sur la Recherche en cours demande une confirmation.
  - Avant de confirmer, le joueur voit ce qu'il récupère : une part du coût payé (chiffre à régler).
  - Après confirmation, la Recherche redevient disponible et son avancement est perdu.
  - Une Recherche déjà aboutie ne peut plus être annulée, même si la page n'a pas encore été rafraîchie.

### US-0713 · Voir une Recherche aboutir
**En tant que** joueur, **je veux** être prévenu quand une Recherche aboutit, **afin de** profiter tout de suite de ce qu'elle débloque.

- **Débloquée par** : US-0709
- **Critères d'acceptation** :
  - À l'heure de fin, la Recherche passe à l'état « Acquise ».
  - Un récit court annonce « Recherche acquise : <nom> » sur la page Récits (étape 16), dit ce qu'elle débloque et y mène d'un toucher.
  - Aucune notification du navigateur n'est envoyée pour une Recherche aboutie (elles sont réservées aux événements importants, étape 64).

### US-0714 · Retrouver une Recherche finie pendant l'absence
**En tant que** joueur, **je veux** trouver acquises les Recherches qui ont abouti pendant que j'étais parti, **afin de** ne pas avoir à rester connecté.

- **Débloquée par** : US-0713, Étape 3
- **Critères d'acceptation** :
  - Une Recherche aboutit à son heure même si le joueur ne revient pas : le passage régulier du Monde l'achève (étape 3).
  - Son effet compte depuis l'heure de fin réelle, pas depuis l'heure de la visite.
  - Le récit d'aboutissement porte l'heure réelle de fin et apparaît parmi les récits non lus à la visite suivante.

### US-0715 · Améliorer le cercle des sages
**En tant que** joueur, **je veux** améliorer mon cercle des sages, **afin de** faire mieux avancer mes Recherches.

- **Débloquée par** : US-0701, US-0710
- **Critères d'acceptation** :
  - Le cercle des sages monte en niveau comme toute construction, chaque niveau coûtant et durant plus que le précédent (étape 27).
  - (à décider) : ce qu'apporte un niveau de plus (plus de chercheurs utiles, des Recherches plus avancées, ou des Recherches plus rapides).
  - La fiche du cercle affiche l'effet du niveau actuel et celui du suivant.
  - (à décider) : une Recherche en cours continue pendant l'amélioration du cercle.

### US-0716 · Garder ses Recherches pour toujours
**En tant que** joueur, **je veux** qu'une Recherche acquise le reste pour toujours, **afin de** ne jamais avoir à la refaire.

- **Débloquée par** : US-0713
- **Critères d'acceptation** :
  - Une Recherche acquise ne se perd jamais : ni pendant une Famine, ni quand le joueur n'a plus de chercheur, ni pendant l'amélioration du cercle.
  - La page Recherche liste les Recherches acquises avec leur date d'aboutissement.
  - Une construction débloquée le reste, même si le joueur n'a plus aucun chercheur.

## Étape 32 · L'arbre en quatre branches

### US-0717 · Voir l'arbre en quatre branches
**En tant que** joueur, **je veux** voir mes Recherches rangées en quatre branches, **afin de** choisir la direction que prend mon Territoire.

- **Débloquée par** : US-0704
- **Critères d'acceptation** :
  - La page Recherche montre quatre branches : Bâtir, Le vivant, Explorer, Défendre, chacune avec son nom et son repère visuel.
  - Chaque Recherche appartient à une seule branche.
  - Dans une branche, les Recherches se lisent de la première à la plus avancée.
  - Le contenu des branches vient de la liste des Recherches (à décider : quelles Recherches, en plus de celles que nomme la liste des constructions).

### US-0718 · Reconnaître l'état de chaque Recherche
**En tant que** joueur, **je veux** reconnaître d'un coup d'œil où en est chaque Recherche, **afin de** savoir ce que je peux lancer maintenant.

- **Débloquée par** : US-0713, US-0717
- **Critères d'acceptation** :
  - Chaque Recherche porte l'un de quatre états : acquise, en cours, disponible, verrouillée.
  - Chaque état a un repère visuel et un libellé, lisible sans se fier aux couleurs.
  - Chaque branche affiche un compteur « N acquises sur M ».

### US-0719 · Voir les prérequis d'une Recherche
**En tant que** joueur, **je veux** voir ce qu'il faut avoir acquis avant une Recherche, **afin de** préparer mon chemin dans l'arbre.

- **Débloquée par** : US-0718
- **Critères d'acceptation** :
  - Dans l'arbre, un trait relie chaque Recherche à ses prérequis.
  - La fiche d'une Recherche liste ses prérequis, chacun avec son état et un lien vers sa fiche.
  - (à décider) : un prérequis peut venir d'une autre branche, ou d'un niveau du cercle des sages.

### US-0720 · Refuser une Recherche dont les prérequis manquent
**En tant que** joueur, **je veux** qu'on m'empêche de lancer une Recherche dont je n'ai pas les prérequis, **afin de** suivre l'ordre de l'arbre.

- **Débloquée par** : US-0705, US-0719
- **Critères d'acceptation** :
  - Une Recherche verrouillée affiche « Demande : <prérequis manquants> » à la place du bouton « Chercher ».
  - Le jeu refuse la Recherche même si la demande arrive par un autre chemin que le bouton.
  - Dès que le dernier prérequis est acquis, la Recherche devient disponible, sans recharger la page.

### US-0721 · Savoir où en est une branche
**En tant que** joueur, **je veux** voir la prochaine étape de chaque branche, **afin de** ne pas chercher dans l'arbre quoi lancer.

- **Débloquée par** : US-0718
- **Critères d'acceptation** :
  - Chaque branche met en avant sa prochaine Recherche disponible.
  - Une branche dont toutes les Recherches sont acquises affiche « Branche terminée pour l'instant ».
  - Une branche où rien n'est disponible dit quel prérequis manque, avec un lien vers lui.

### US-0722 · Débloquer une construction par la Recherche
**En tant que** joueur, **je veux** qu'une Recherche acquise rende sa construction constructible, **afin de** récolter le fruit de mes efforts.

- **Débloquée par** : US-0713, Étape 25
- **Critères d'acceptation** :
  - Quand une Recherche qui débloque une construction est acquise, la construction perd son cadenas sur la page des constructions et devient constructible.
  - Tant que la Recherche n'est pas acquise, même en cours, le jeu refuse le chantier de cette construction.
  - Un contrôle automatique vérifie que chaque construction verrouillée de la liste des constructions est reliée à une Recherche qui existe dans l'arbre.

### US-0723 · Savoir quelle Recherche ouvre une construction verrouillée
**En tant que** joueur, **je veux** qu'une construction verrouillée me dise quelle Recherche l'ouvre, **afin de** savoir quoi chercher pour l'obtenir.

- **Débloquée par** : US-0722
- **Critères d'acceptation** :
  - La mention « Demande une Recherche » (étape 25) devient « Demande la Recherche : <nom> (branche <branche>) », sur la page des constructions et sur la fiche.
  - Si cette Recherche est en cours, la construction affiche « Recherche en cours, fin dans… ».
  - Si elle est déjà acquise, le cadenas a disparu (US-0722).

### US-0724 · Suivre le lien vers la bonne Recherche
**En tant que** joueur, **je veux** passer d'un toucher de la construction verrouillée à la Recherche qui l'ouvre, **afin de** la lancer sans la chercher dans l'arbre.

- **Débloquée par** : US-0717, US-0723
- **Critères d'acceptation** :
  - Le nom de la Recherche est un lien qui ouvre la page Recherche sur la bonne branche, avec la fiche de cette Recherche ouverte et mise en évidence.
  - Si la Recherche est disponible, son bouton « Chercher » est directement accessible depuis cette fiche.
  - Un contrôle automatique vérifie, pour chaque construction verrouillée, que le lien mène bien à la Recherche qui la débloque.

### US-0725 · Remonter les prérequis depuis une construction verrouillée
**En tant que** joueur, **je veux** voir tout le chemin de Recherches qui mène à une construction, **afin de** savoir combien d'étapes il me reste.

- **Débloquée par** : US-0719, US-0724
- **Critères d'acceptation** :
  - Si la Recherche qui ouvre la construction est elle-même verrouillée, sa fiche montre le chemin des Recherches à faire avant, dans l'ordre.
  - Chaque étape du chemin est un lien vers la fiche de sa Recherche.
  - Le chemin se raccourcit à mesure que les Recherches sont acquises.

### US-0726 · Aller de la Recherche à la construction qu'elle débloque
**En tant que** joueur, **je veux** voir depuis une Recherche la construction qu'elle ouvre, **afin de** savoir pourquoi elle vaut la peine.

- **Débloquée par** : US-0722
- **Critères d'acceptation** :
  - La fiche d'une Recherche qui débloque une construction montre cette construction (nom, illustration, effet) avec un lien vers sa fiche.
  - Une fois la Recherche acquise, le lien mène à la construction, prête à être bâtie.

### US-0727 · Voir ce que débloque chaque Recherche
**En tant que** joueur, **je veux** que chaque Recherche annonce clairement son effet, **afin de** comparer les branches entre elles.

- **Débloquée par** : US-0704, US-0717
- **Critères d'acceptation** :
  - Chaque Recherche annonce un effet, et un seul genre d'effet : une construction, un Rôle, ou de la portée pour les Expéditions.
  - (à décider) : les Recherches de Rôles et de portée apparaissent déjà dans l'arbre à ce jalon, ou seulement quand leur effet existe ; leur effet se vérifiera aux étapes 38 et 49.
  - Aucune Recherche n'apparaît dans l'arbre sans effet annoncé.

### US-0728 · Parcourir l'arbre sur mobile
**En tant que** joueur, **je veux** parcourir l'arbre des Recherches au pouce sur mon téléphone, **afin de** lancer une Recherche en quelques secondes.

- **Débloquée par** : US-0719
- **Critères d'acceptation** :
  - Sur un écran de téléphone (375 pixels de large), les quatre branches s'affichent en onglets et les Recherches d'une branche en colonne, sans défilement de côté.
  - La fiche d'une Recherche s'ouvre en plein écran, avec ses prérequis sous forme de liste.
  - Lancer ou annuler une Recherche se fait au pouce, sans zoom.

### US-0729 · Aucune Recherche de force
**En tant que** joueur, **je veux** être sûr qu'aucune Recherche ne rend les Bêtes plus fortes, **afin de** savoir que ma puissance ne vient que des Espèces que j'ai trouvées et élevées.

- **Débloquée par** : US-0727
- **Critères d'acceptation** :
  - Aucune Recherche, dans aucune branche, ne change l'attaque, la vie, la vitesse, la charge, la taille ou l'Entretien d'une Espèce.
  - La branche Défendre débloque des constructions de défense, jamais un gain de force pour les Bêtes.
  - Les caractéristiques d'une Espèce sont les mêmes chez tous les joueurs, quelles que soient leurs Recherches (vérifié dès que la fiche d'Espèce existe, étape 33).

### US-0730 · Interdire une Recherche de force dans la liste
**En tant que** développeur, **je veux** que la liste des Recherches ne puisse contenir aucun effet sur les caractéristiques d'une Espèce, **afin de** garder cette règle vraie quand l'arbre grandira.

- **Débloquée par** : US-0729
- **Critères d'acceptation** :
  - Les seuls effets qu'une Recherche peut porter sont : débloquer une construction, débloquer un Rôle, augmenter la portée des Expéditions.
  - Une Recherche avec un autre effet est refusée au chargement de la liste, avec un message qui la nomme.
  - Ce contrôle passe automatiquement à chaque mise en ligne.
