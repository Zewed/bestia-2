# Jalon 8 · Les Bêtes à la maison

Le joueur retrouve son Couple de départ dans la Réserve, découvre la fiche complète de son Espèce, élève ses premières Bêtes et apprend à les loger et à les nourrir : si elles ont faim, elles retournent à l'état sauvage. Le Rôle de son Couple de départ se met au travail. Étapes couvertes : 33 à 37 de l'ordre d'attaque.

## Étape 33 · La Réserve

### US-0801 · Ouvrir la Réserve
**En tant que** joueur, **je veux** ouvrir la Réserve de mon Territoire, **afin de** voir les Couples que j'ai réunis.

- **Débloquée par** : Étape 4, Étape 8
- **Critères d'acceptation** :
  - Une entrée « Réserve » de la navigation ouvre la page, sur ordinateur comme sur mobile.
  - La page présente la Réserve comme le lieu protégé où vivent les Couples, qui ne combattent plus.
  - La page affiche le nombre de Couples qu'elle abrite (un seul au départ).

### US-0802 · Voir son Couple de départ
**En tant que** joueur, **je veux** voir mon Couple de départ dans la Réserve, **afin de** retrouver les Bêtes avec lesquelles tout commence.

- **Débloquée par** : US-0801
- **Critères d'acceptation** :
  - Le Couple choisi à l'étape 8 apparaît avec l'illustration de son Espèce, son nom et sa Rareté.
  - Le mâle et la femelle sont tous deux visibles, et marqués comme tels.
  - Le style de jeu choisi est rappelé en une phrase (se défendre, grandir ou explorer).
  - Un joueur ne voit jamais la Réserve d'un autre joueur.

### US-0803 · Ouvrir la fiche d'une Espèce
**En tant que** joueur, **je veux** ouvrir la fiche de l'Espèce de mon Couple, **afin de** tout savoir sur elle.

- **Débloquée par** : US-0802
- **Critères d'acceptation** :
  - Toucher le Couple ouvre la fiche de son Espèce, avec l'illustration en grand, le nom et la Rareté.
  - La Rareté est l'une des six (commune, peu commune, rare, épique, légendaire, mythique) et porte un repère visuel propre à chacune.
  - Fermer la fiche ramène à la Réserve.

### US-0804 · Lire l'attaque, la vie, la vitesse et la charge
**En tant que** joueur, **je veux** lire les chiffres de combat et de transport d'une Espèce, **afin de** savoir ce que vaut chacune de ses Bêtes.

- **Débloquée par** : US-0803
- **Critères d'acceptation** :
  - La fiche affiche l'attaque, la vie, la vitesse et la charge de l'Espèce, avec les valeurs enregistrées pour elle.
  - Ces valeurs sont les mêmes pour tous les joueurs, quelles que soient leurs Recherches.
  - Aucune valeur ne manque : une Espèce incomplète est signalée sur la page de contrôle interne (étape 4) plutôt qu'affichée à moitié.

### US-0805 · Lire la taille, le régime et l'Entretien
**En tant que** joueur, **je veux** lire ce qu'une Bête occupe et ce qu'elle mange, **afin de** savoir combien je peux en loger et en nourrir.

- **Débloquée par** : US-0803
- **Critères d'acceptation** :
  - La fiche affiche la taille de l'Espèce, en Places occupées par Bête.
  - Elle affiche le régime : carnivore, herbivore ou omnivore.
  - Elle affiche l'Entretien par heure et par Bête, dans la Nourriture qui correspond au régime.

### US-0806 · Lire le Biome d'Habitat et le Rôle
**En tant que** joueur, **je veux** lire où vit une Espèce et à quoi elle sert en dehors du combat, **afin de** savoir où l'élever et comment l'employer.

- **Débloquée par** : US-0803
- **Critères d'acceptation** :
  - La fiche affiche le Biome d'Habitat de l'Espèce, avec son nom et son pictogramme.
  - Elle affiche le Rôle de l'Espèce (Porteur, Éclaireur, Nourricier ou Bâtisseur), ou « Aucun Rôle ».
  - Un Rôle pas encore débloqué s'affiche grisé, avec la mention « À débloquer par la Recherche ».

### US-0807 · Comprendre une caractéristique
**En tant que** nouveau joueur, **je veux** qu'on m'explique chaque caractéristique d'une Espèce, **afin de** comprendre ce que veulent dire les chiffres.

- **Débloquée par** : US-0804, US-0805, US-0806
- **Critères d'acceptation** :
  - Toucher le nom d'une caractéristique affiche une explication d'une phrase (par exemple, pour la charge : ce qu'une Bête peut porter).
  - Chaque caractéristique de la fiche a son explication.
  - L'explication se ferme d'un toucher ailleurs ou d'un bouton.

### US-0808 · Lire la fiche d'une Espèce sur mobile
**En tant que** joueur, **je veux** lire la fiche d'une Espèce confortablement sur mon téléphone, **afin de** consulter mes Bêtes où que je sois.

- **Débloquée par** : US-0807
- **Critères d'acceptation** :
  - Sur un écran de téléphone (375 pixels de large), l'illustration occupe le haut de la fiche et les caractéristiques se rangent en grille, sans défilement de côté.
  - Toute la fiche se lit sans zoom.
  - Les explications des caractéristiques s'ouvrent et se ferment au pouce.

### US-0809 · Comprendre comment remplir la Réserve
**En tant que** nouveau joueur, **je veux** comprendre comment d'autres Couples rejoindront ma Réserve, **afin de** savoir ce que je chercherai ensuite.

- **Débloquée par** : US-0802
- **Critères d'acceptation** :
  - Sous le Couple de départ, la Réserve explique en une phrase qu'un mâle et une femelle apprivoisés d'une même Espèce y forment un nouveau Couple.
  - Cette explication reste affichée tant que la Réserve ne compte que le Couple de départ.
  - (à décider) : le Couple de départ compte dans le nombre de Couples réunis du classement principal (étape 60).

## Étape 34 · L'Élevage

### US-0810 · Voir l'effectif par Espèce
**En tant que** joueur, **je veux** voir combien de Bêtes j'ai de chaque Espèce, **afin de** connaître la taille de mon armée.

- **Débloquée par** : US-0803
- **Critères d'acceptation** :
  - Une page Bêtes liste chaque Espèce dont le joueur a des Bêtes, avec son illustration et son effectif.
  - Les Bêtes du Couple, en Réserve, ne comptent pas dans l'effectif.
  - Le total des Bêtes s'affiche en haut de la page.
  - Toucher une Espèce ouvre sa fiche, qui rappelle aussi l'effectif.

### US-0811 · Voir un effectif vide
**En tant que** nouveau joueur, **je veux** comprendre pourquoi je n'ai encore aucune Bête, **afin de** savoir comment en obtenir.

- **Débloquée par** : US-0810
- **Critères d'acceptation** :
  - Sans aucune Bête, la page Bêtes affiche « Aucune Bête pour l'instant » et explique qu'on élève des Bêtes à partir de son Couple.
  - Un bouton mène à la fiche de l'Espèce du Couple de départ.
  - Dès la première Bête née, ce message laisse place à la liste.

### US-0812 · Trouver l'Élevage de son Espèce
**En tant que** joueur, **je veux** trouver l'Élevage sur la fiche de l'Espèce de mon Couple, **afin de** produire mes premières Bêtes.

- **Débloquée par** : US-0803
- **Critères d'acceptation** :
  - La fiche de l'Espèce du Couple de départ propose un bloc « Élever ».
  - Seules les Espèces dont le joueur a réuni le Couple proposent ce bloc.
  - Le jeu refuse l'Élevage d'une Espèce sans Couple, même demandé par un autre chemin que le bouton.

### US-0813 · Choisir combien de Bêtes élever
**En tant que** joueur, **je veux** choisir le nombre de Bêtes à élever, **afin de** doser ce que j'investis.

- **Débloquée par** : US-0812
- **Critères d'acceptation** :
  - Le bloc « Élever » propose un champ de quantité, des boutons « − » et « + », et un bouton « Max ».
  - « Max » donne le plus grand nombre de Bêtes que les stocks de Nourriture permettent de payer.
  - Une quantité nulle, négative ou non entière est refusée avec un message clair.

### US-0814 · Voir le coût et la durée d'un Élevage
**En tant que** joueur, **je veux** voir ce que coûte un Élevage et combien de temps il prend, **afin de** décider avant de payer.

- **Débloquée par** : US-0813
- **Critères d'acceptation** :
  - Le bloc affiche le coût total en Nourriture : le coût d'une Bête (chiffre à régler par Espèce) fois la quantité choisie.
  - (à décider) : le coût se paie en Viande, en Végétaux, ou selon le régime de l'Espèce.
  - Le bloc affiche la durée d'Élevage d'une Bête (chiffre à régler par Espèce), la durée totale et l'heure où naîtra la dernière Bête.
  - Coût et durée se mettent à jour à chaque changement de quantité.

### US-0815 · Lancer un Élevage
**En tant que** joueur, **je veux** lancer l'Élevage de la quantité choisie, **afin de** voir grandir mon effectif.

- **Débloquée par** : US-0814
- **Critères d'acceptation** :
  - Le bouton « Élever » retire aussitôt le coût total des stocks, et la barre du haut se met à jour.
  - L'Élevage démarre à l'heure du clic.
  - Un double clic ne lance qu'un Élevage et ne fait payer qu'une fois.

### US-0816 · Refuser un Élevage faute de Nourriture
**En tant que** joueur, **je veux** qu'on m'empêche de lancer un Élevage que je ne peux pas payer, **afin de** ne jamais me retrouver avec des stocks négatifs.

- **Débloquée par** : US-0815
- **Critères d'acceptation** :
  - Tant que la Nourriture manque pour la quantité choisie, le bouton « Élever » est désactivé et dit ce qui manque.
  - Si les stocks ont baissé entre l'affichage et le clic, le jeu refuse l'Élevage avec un message clair et ne retire rien.
  - Aucun stock ne descend jamais sous zéro.

### US-0817 · Recevoir les Bêtes une à une
**En tant que** joueur, **je veux** voir mes Bêtes naître l'une après l'autre, **afin de** pouvoir compter sur les premières sans attendre la fin de l'Élevage.

- **Débloquée par** : US-0810, US-0815
- **Critères d'acceptation** :
  - Les Bêtes d'un Élevage naissent l'une après l'autre, chacune après la durée d'Élevage de l'Espèce.
  - Chaque Bête née s'ajoute aussitôt à l'effectif de son Espèce.
  - À la fin de l'Élevage, un récit court annonce « N Bêtes de <Espèce> ont rejoint votre effectif » sur la page Récits (étape 16).
  - En vitesse accélérée, le nombre de Bêtes nées au bout d'un temps donné correspond au rythme prévu.

### US-0818 · Suivre l'Élevage en cours
**En tant que** joueur, **je veux** voir où en est mon Élevage, **afin de** savoir quand naîtra la prochaine Bête.

- **Débloquée par** : US-0817
- **Critères d'acceptation** :
  - Le bloc « Élever » montre l'Élevage en cours : Bêtes déjà nées sur quantité demandée, temps avant la prochaine naissance, heure de la dernière.
  - Le décompte avance sans recharger la page, et reste juste après un rechargement ou sur un autre appareil.
  - Un bloc de l'accueil résume l'Élevage en cours, ou affiche « Aucun Élevage en cours ».

### US-0819 · Ajouter un Élevage à la file
**En tant que** joueur, **je veux** commander un nouvel Élevage pendant qu'un autre est en cours, **afin de** ne pas avoir à revenir au bon moment pour relancer.

- **Débloquée par** : US-0818
- **Critères d'acceptation** :
  - Pendant un Élevage, le joueur peut en lancer un autre de la même Espèce : il se paie aussitôt et prend place dans une file.
  - Les Élevages de la file se suivent dans l'ordre, sans temps mort entre eux.
  - La file affiche chaque Élevage avec sa quantité et son heure de fin prévue.
  - (à décider) : une longueur maximale de file (chiffre à régler), et, quand il y aura plusieurs Espèces, une file par Espèce ou une seule pour toutes.

### US-0820 · Annuler un Élevage
**En tant que** joueur, **je veux** annuler un Élevage de la file, **afin de** récupérer de la Nourriture si j'en ai besoin ailleurs.

- **Débloquée par** : US-0819
- **Critères d'acceptation** :
  - Chaque Élevage de la file a un bouton « Annuler » qui demande une confirmation.
  - Les Bêtes déjà nées restent ; celles qui ne sont pas encore nées sont remboursées d'une part de leur coût (chiffre à régler), affichée avant la confirmation.
  - Les Élevages suivants de la file avancent aussitôt d'autant, et leurs heures de fin se mettent à jour.
  - Ce qui dépasserait la limite de stock est perdu, et la confirmation le signale (à décider).

### US-0821 · Retrouver les Bêtes nées pendant l'absence
**En tant que** joueur, **je veux** trouver dans mon effectif les Bêtes nées pendant que j'étais parti, **afin de** ne pas avoir à rester connecté pour élever.

- **Débloquée par** : US-0817, Étape 3
- **Critères d'acceptation** :
  - Au retour, l'effectif compte exactement les Bêtes nées pendant l'absence, au rythme de l'Élevage.
  - Les Élevages avancent même si le joueur ne revient pas : le passage régulier du Monde les fait progresser (étape 3).
  - Un seul récit récapitule les naissances de l'absence (« N Bêtes de <Espèce> sont nées pendant votre absence »).

## Étape 35 · L'Entretien et les Places

### US-0822 · Voir les Places de l'Habitat du Foyer
**En tant que** joueur, **je veux** voir combien de Places offre l'Habitat de mon Foyer et combien sont prises, **afin de** savoir combien de Bêtes je peux encore loger.

- **Débloquée par** : US-0810
- **Critères d'acceptation** :
  - La page Bêtes affiche « Places : occupées / total » pour l'Habitat du Foyer.
  - Le nombre total de Places du Foyer vient des réglages du jeu (chiffre à régler).
  - Le même compteur apparaît dans le bloc « Élever ».

### US-0823 · Loger l'Espèce du Couple de départ au Foyer
**En tant que** joueur, **je veux** pouvoir élever l'Espèce de mon Couple de départ quel que soit le Biome de mon Foyer, **afin de** ne pas être bloqué dès le départ par la Case où je suis né.

- **Débloquée par** : US-0822
- **Critères d'acceptation** :
  - Tout Foyer offre des Places à l'Espèce du Couple de départ, quel que soit son Biome.
  - (à décider) : c'est une exception propre au Couple de départ, ou les trois Espèces de départ ont pour Habitat tous les Biomes de la Couronne.
  - Le Biome d'Habitat affiché sur la fiche de l'Espèce est cohérent avec la règle retenue.
  - Les Habitats des autres Espèces, Case par Case, arrivent à l'étape 51.

### US-0824 · Occuper des Places selon la taille
**En tant que** joueur, **je veux** que chaque Bête occupe des Places selon sa taille, **afin de** comprendre qu'un grand animal se loge moins facilement qu'un petit.

- **Débloquée par** : US-0817, US-0822
- **Critères d'acceptation** :
  - Chaque Bête née occupe autant de Places que la taille de son Espèce.
  - Les Places occupées valent la somme, Espèce par Espèce, de l'effectif fois la taille.
  - Une Bête qui quitte l'effectif libère aussitôt ses Places.
  - (à décider) : les Bêtes du Couple en Réserve occupent des Places, ou non.

### US-0825 · Bloquer l'Élevage quand les Places manquent
**En tant que** joueur, **je veux** qu'on m'empêche d'élever plus de Bêtes que je ne peux en loger, **afin de** ne jamais avoir de Bête sans Place.

- **Débloquée par** : US-0819, US-0824
- **Critères d'acceptation** :
  - Le bouton « Max » tient compte des Places libres : il ne propose jamais plus de Bêtes qu'elles ne peuvent en loger.
  - Les Places des Bêtes pas encore nées sont réservées dès le lancement de l'Élevage, et comptées comme prises.
  - Quand les Places manquent, le bouton « Élever » est désactivé avec le message « Plus assez de Places dans l'Habitat du Foyer ».
  - Le jeu refuse un Élevage qui dépasserait les Places libres, même demandé par un autre chemin que le bouton.

### US-0826 · Payer l'Entretien chaque heure
**En tant que** joueur, **je veux** que mes Bêtes mangent chaque heure selon leur régime, **afin de** sentir le vrai prix d'une armée.

- **Débloquée par** : US-0817
- **Critères d'acceptation** :
  - Chaque heure, chaque Bête de l'effectif mange l'Entretien de son Espèce, à partir de sa naissance.
  - Un carnivore mange de la Viande, un herbivore des Végétaux.
  - (à décider) : ce que mange un omnivore (l'une ou l'autre selon les stocks, ou un partage fixe entre les deux).
  - (à décider) : les Bêtes du Couple en Réserve mangent un Entretien, ou non.
  - Après une absence, les stocks ont baissé exactement de l'Entretien dû, Bête par Bête.

### US-0827 · Voir l'Entretien des Bêtes dans le solde horaire
**En tant que** joueur, **je veux** voir dans la barre du haut ce que mes Bêtes mangent chaque heure, **afin de** savoir si ma Nourriture monte ou descend.

- **Débloquée par** : US-0826, Étape 15
- **Critères d'acceptation** :
  - Le solde horaire de Viande et de Végétaux de la barre du haut (étape 15) retire aussi l'Entretien des Bêtes.
  - Le détail du solde ajoute une ligne par Espèce (« Poules : − N par heure »), à côté de ce que mangent les Habitants.
  - La valeur change dès qu'une Bête naît ou part.

### US-0828 · Prévoir l'Entretien avant d'élever
**En tant que** joueur, **je veux** voir ce que coûteront chaque heure les Bêtes que je m'apprête à élever, **afin de** ne pas lancer un Élevage que je ne pourrai pas nourrir.

- **Débloquée par** : US-0814, US-0826
- **Critères d'acceptation** :
  - Le bloc « Élever » affiche l'Entretien que coûteront les Bêtes demandées (par exemple « + N Végétaux par heure »).
  - Il affiche aussi le solde horaire qu'on aura une fois toutes ces Bêtes nées.
  - Si ce solde devient négatif, un avertissement le dit avant le lancement, sans bloquer le bouton.

## Étape 36 · La Famine des Bêtes

### US-0829 · Être averti d'une famine imminente
**En tant que** joueur, **je veux** être averti avant que mes Bêtes ne manquent de Nourriture, **afin de** réagir à temps.

- **Débloquée par** : US-0827, Étape 15
- **Critères d'acceptation** :
  - L'avertissement « famine imminente » de l'étape 15 tient compte de l'Entretien des Bêtes comme de ce que mangent les Habitants.
  - Il se déclenche aussi quand seul le stock dont dépend une Espèce va manquer (par exemple la Viande pour un carnivore), même si l'autre Nourriture est abondante.
  - Il donne l'heure à laquelle ce stock sera vide, sur ordinateur comme sur mobile.
  - En vitesse accélérée, il apparaît exactement au moment prévu.

### US-0830 · Savoir quelles Bêtes vont avoir faim
**En tant que** joueur, **je veux** savoir quelles Bêtes sont menacées, **afin de** savoir quelle Nourriture aller chercher.

- **Débloquée par** : US-0829
- **Critères d'acceptation** :
  - L'avertissement nomme la Nourriture qui va manquer (Viande ou Végétaux) et les Espèces qui en dépendent.
  - Il donne, pour chaque Espèce, le nombre de Bêtes menacées.
  - Il propose un lien pour lancer une Récolte de chasseurs ou de cueilleurs, selon la Nourriture qui manque.

### US-0831 · Recalculer l'avertissement quand l'effectif change
**En tant que** joueur, **je veux** que l'avertissement suive les naissances et les départs de mes Bêtes, **afin de** savoir à tout moment si elles sont tirées d'affaire.

- **Débloquée par** : US-0829
- **Critères d'acceptation** :
  - Une naissance qui fait passer le solde sous le seuil déclenche l'avertissement, sans recharger la page.
  - Des Bêtes qui partent, ou un Élevage annulé, peuvent le lever, selon la même marge qu'à l'étape 15.
  - L'heure à laquelle le stock sera vide se met à jour à chaque changement de l'effectif.

### US-0832 · Voir des Bêtes affamées retourner à l'état sauvage
**En tant que** joueur, **je veux** que des Bêtes que je ne nourris plus s'en aillent, **afin de** sentir le prix d'une armée trop grande pour mes stocks.

- **Débloquée par** : US-0826, US-0829
- **Critères d'acceptation** :
  - Quand le stock dont dépend une Espèce est vide et que son Entretien ne peut pas être payé, des Bêtes affamées quittent l'effectif et retournent à l'état sauvage.
  - (à décider) : combien partent à chaque heure : autant qu'il faut pour que l'Entretien de celles qui restent soit payé, ou (chiffre à régler) Bêtes par heure de Famine, comme pour les Habitants (étape 16).
  - Les Bêtes parties libèrent leurs Places et ne coûtent plus d'Entretien.
  - (à décider) : un Élevage en cours continue pendant la Famine, ou se suspend.
  - (à décider) : les Bêtes parties réapparaissent comme Bêtes sauvages sur la carte, ou disparaissent.

### US-0833 · Lire le récit d'une Famine
**En tant que** joueur, **je veux** un récit de chaque Famine, **afin de** comprendre ce que j'ai perdu et quand.

- **Débloquée par** : US-0832
- **Critères d'acceptation** :
  - Chaque Famine donne un récit : l'heure, la Nourriture qui a manqué, et le nombre de Bêtes parties par Espèce.
  - Le récit reste consultable après coup sur la page Récits (étape 16).
  - Si des Habitants sont partis dans la même Famine (étape 16), le récit les distingue des Bêtes.

### US-0834 · Garder son Couple et son Élevage après une Famine
**En tant que** joueur, **je veux** que mon Couple et mon Élevage survivent à une Famine, **afin de** pouvoir tout reconstruire ensuite.

- **Débloquée par** : US-0832
- **Critères d'acceptation** :
  - Les Bêtes du Couple, à l'abri en Réserve, ne retournent jamais à l'état sauvage.
  - L'Élevage de l'Espèce reste ouvert même si toutes les Bêtes de l'effectif sont parties.
  - On peut relancer un Élevage dès que la Nourriture le permet.

### US-0835 · Subir une Famine pendant l'absence
**En tant que** joueur, **je veux** que ce qui s'est passé pendant mon absence soit compté comme si j'étais resté, **afin de** pouvoir faire confiance au jeu.

- **Débloquée par** : US-0833, Étape 3
- **Critères d'acceptation** :
  - Le rattrapage du temps calcule la Famine heure par heure : le nombre de Bêtes parties est le même que si le joueur était resté connecté.
  - Au retour, un récapitulatif dit quand la Famine a commencé et combien de Bêtes sont parties.
  - En vitesse accélérée, une Famine provoquée fait partir le bon nombre de Bêtes.

### US-0836 · Partager la Nourriture entre Habitants et Bêtes
**En tant que** joueur, **je veux** savoir qui mange en premier quand la Nourriture manque, **afin de** prévoir qui je risque de perdre.

- **Débloquée par** : US-0832, Étape 16
- **Critères d'acceptation** :
  - (à décider) : quand la Nourriture ne suffit pas pour tous, les Habitants mangent d'abord, les Bêtes d'abord, ou chacun reçoit une part égale.
  - La règle retenue est expliquée dans l'avertissement « famine imminente ».
  - En vitesse accélérée, une Famine qui touche à la fois Habitants et Bêtes fait partir chacun selon cette règle.

## Étape 37 · Le Rôle du Couple de départ

### US-0837 · Voir le Rôle de son Couple de départ débloqué d'office
**En tant que** joueur, **je veux** que le Rôle de mon Couple de départ soit acquis dès le début, **afin de** profiter tout de suite du style de jeu que j'ai choisi.

- **Débloquée par** : US-0806
- **Critères d'acceptation** :
  - Pour un Couple de poules, la fiche affiche le Rôle Nourricier comme débloqué, avec la mention « Débloqué d'office ».
  - Pour un Couple de pigeons, la fiche affiche de même le Rôle Éclaireur.
  - Aucune Recherche n'est demandée pour ce Rôle.
  - (à décider) : le Rôle débloqué d'office vaut aussi pour les autres Espèces du même Rôle apprivoisées plus tard, ou seulement pour l'Espèce du Couple de départ.

### US-0838 · Nourrir le Territoire avec les poules
**En tant que** joueur, **je veux** que mes poules Nourricières produisent de la Nourriture sans que j'aie à chasser, **afin de** grandir plus vite.

- **Débloquée par** : US-0826, US-0837
- **Critères d'acceptation** :
  - Chaque poule de l'effectif produit de la Nourriture en continu, heure après heure (chiffre à régler par poule).
  - (à décider) : les poules produisent de la Viande, des Végétaux, ou les deux.
  - (à décider) : les poules du Couple en Réserve produisent aussi, ou seulement celles de l'effectif.
  - Après une absence, la Nourriture produite est exactement celle attendue, poule par poule, de sa naissance à son éventuel départ.
  - (à décider) : une poule rapporte plus de Nourriture qu'elle ne coûte d'Entretien.

### US-0839 · Voir la production des poules dans le solde horaire
**En tant que** joueur, **je veux** voir ce que rapportent mes poules chaque heure, **afin de** savoir combien il m'en faut.

- **Débloquée par** : US-0827, US-0838
- **Critères d'acceptation** :
  - Le détail du solde horaire affiche une ligne « Poules nourricières : + N par heure ».
  - La ligne change dès qu'une poule naît ou part.
  - La fiche de la poule affiche ce qu'une poule rapporte par heure.

### US-0840 · Arrêter la production des poules quand le stock est plein
**En tant que** joueur, **je veux** que la production des poules respecte la limite de stock, **afin de** comprendre qu'il faut agrandir mes stockages pour en profiter.

- **Débloquée par** : US-0838, Étape 28
- **Critères d'acceptation** :
  - La Nourriture produite par les poules s'arrête à la limite de stock, comme la production du Foyer (étape 12).
  - La production reprend dès qu'il y a de nouveau de la place dans le stock.
  - Après une absence, rien n'est compté au-delà de la limite.

### US-0841 · Voir les pigeons Éclaireurs attendre les Expéditions
**En tant que** joueur, **je veux** savoir à quoi serviront mes pigeons Éclaireurs, **afin de** préparer mes premières Expéditions.

- **Débloquée par** : US-0837
- **Critères d'acceptation** :
  - La fiche du pigeon explique le Rôle Éclaireur : révéler plus de brouillard et garder plus longtemps visibles, pour l'Expédition, les Bêtes apparues.
  - Tant que les Expéditions n'existent pas, ce Rôle n'a aucun effet, et la fiche le dit (« Servira lors des Expéditions »).
  - Son effet se vérifiera au jalon 9 (étape 45).

### US-0842 · Voir la souris sans Rôle
**En tant que** joueur, **je veux** comprendre pourquoi mes souris n'ont pas de Rôle, **afin de** savoir sur quoi compter pour me défendre.

- **Débloquée par** : US-0806
- **Critères d'acceptation** :
  - La fiche de la souris affiche « Aucun Rôle », sans erreur ni case vide.
  - La Réserve rappelle le style choisi : se défendre.
  - Aucun Rôle n'est débloqué d'office pour ce joueur.
