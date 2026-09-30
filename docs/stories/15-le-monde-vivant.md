# Jalon 15 · Le Monde vivant

Le Monde change de visage au fil du temps : des Espèces rares le traversent, les Saisons modifient la chasse et la cueillette, et des Bêtes d'Espèce mythique surgissent au Cœur sauvage pour les chefs les plus audacieux. Étapes couvertes : 61 à 63 de l'ordre d'attaque.

## Étape 61 · Les Migrations

### US-1501 · Lancer une Migration
**En tant que** développeur, **je veux** que le Monde lance de temps en temps une Migration, où une Espèce rare traverse une région pendant quelques jours, **afin de** créer des occasions à saisir.

- **Débloquée par** : Étape 39, Étape 47
- **Critères d'acceptation** :
  - Une Migration choisit une Espèce, une région de Cases qui compte des Cases de son Biome, et une durée de quelques jours (chiffre à régler).
  - Les Raretés possibles pour une Migration : rare seulement, ou aussi peu commune et épique (à décider).
  - Une Espèce mythique n'est jamais choisie pour une Migration.
  - Le nombre de Migrations en même temps dans un Monde est limité (chiffre à régler).
  - Les Migrations se lancent aussi quand personne n'est connecté.

### US-1502 · Plus de Bêtes de l'Espèce pendant la Migration
**En tant que** joueur, **je veux** que l'Espèce de la Migration apparaisse bien plus souvent dans sa région, **afin de** tenir une vraie chance de l'apprivoiser pendant ces quelques jours.

- **Débloquée par** : US-1501
- **Critères d'acceptation** :
  - Pendant la Migration, les Bêtes de l'Espèce apparaissent bien plus souvent sur les Cases de la région (chiffre à régler).
  - Hors de la région, et après la fin, les apparitions reviennent à la normale.
  - Sur une longue simulation, la région voit mesurablement plus souvent l'Espèce pendant la Migration.
  - Les règles de Rencontre ne changent pas : seules les Expéditions présentes sur la Case voient ces Bêtes.

### US-1503 · Une Migration qui avance
**En tant que** joueur, **je veux** que la Migration se déplace d'un jour à l'autre, **afin de** la voir vraiment traverser le Monde.

- **Débloquée par** : US-1502
- **Critères d'acceptation** :
  - La région se décale chaque jour dans une direction, ou reste fixe pendant toute la Migration (à décider).
  - Si elle avance, la carte montre la région du jour et celle du lendemain.
  - Le trajet ne passe jamais par le Cœur sauvage (à décider).

### US-1504 · Être prévenu d'une Migration proche
**En tant que** joueur, **je veux** être prévenu quand une Migration passe près de mon Territoire, **afin de** préparer une Expédition à temps.

- **Débloquée par** : US-1501
- **Critères d'acceptation** :
  - Les chefs dont le Territoire est assez proche de la région reçoivent un message au début de la Migration (chiffre à régler).
  - Le message donne la Rareté de l'Espèce, la région et la date de fin.
  - Le message nomme l'Espèce, même si le chef ne l'a jamais croisée, ou la montre en silhouette (à décider).
  - Les chefs trop éloignés ne reçoivent rien.

### US-1505 · Voir la Migration sur la carte
**En tant que** joueur, **je veux** voir la région de la Migration sur ma carte, **afin de** savoir où envoyer mes explorateurs.

- **Débloquée par** : US-1504
- **Critères d'acceptation** :
  - La région s'affiche sur la carte des chefs prévenus, avec une marque et un compte à rebours.
  - Elle reste visible sous le brouillard, sans en révéler les Cases (Biome, propriétaire) (à décider).
  - Toucher la marque rouvre le message de la Migration.

### US-1506 · Envoyer une Expédition vers la Migration
**En tant que** joueur, **je veux** préparer une Expédition vers la région de la Migration directement depuis son message, **afin de** ne pas perdre de temps.

- **Débloquée par** : US-1505, Étape 38
- **Critères d'acceptation** :
  - Un bouton ouvre la préparation d'une Expédition avec une Case de la région déjà choisie.
  - La préparation compare l'heure d'arrivée à la fin de la Migration.
  - Un avertissement s'affiche si l'Expédition arriverait après la fin.

### US-1507 · La fin d'une Migration
**En tant que** joueur, **je veux** savoir quand une Migration se termine, **afin de** ne pas envoyer d'Expédition pour rien.

- **Débloquée par** : US-1502, US-1505
- **Critères d'acceptation** :
  - À la fin, la marque disparaît de la carte et les apparitions reviennent à la normale.
  - Une Bête de l'Espèce déjà apparue reste sur sa Case jusqu'à la fin de sa propre durée.
  - Les Expéditions déjà en route vers la région ne sont pas rappelées.

## Étape 62 · Les Saisons du Monde

### US-1508 · Faire tourner les Saisons du Monde
**En tant que** développeur, **je veux** que chaque Monde passe d'une Saison à l'autre, **afin de** faire changer le Monde au fil du temps.

- **Débloquée par** : Étape 24
- **Critères d'acceptation** :
  - Le Monde suit un cycle de Saisons, dont l'hiver ; la liste des autres Saisons (à décider).
  - La durée d'une Saison du Monde (chiffre à régler).
  - Une même Saison vaut pour tout le Monde, mais son effet change selon le Biome.
  - Le changement de Saison se fait aussi quand personne n'est connecté.

### US-1509 · Voir la Saison en cours
**En tant que** joueur, **je veux** voir la Saison en cours et le temps qu'il lui reste, **afin de** savoir dans quelle période je joue.

- **Débloquée par** : US-1508
- **Critères d'acceptation** :
  - Le nom de la Saison et le nombre de jours restants s'affichent sur le Foyer.
  - Toucher la Saison ouvre la fiche de ses effets.
  - L'affichage change à l'instant du passage à la Saison suivante.

### US-1510 · La Saison change la Densité
**En tant que** joueur, **je veux** que la Saison rende certains Biomes plus giboyeux et d'autres moins, **afin de** voir mes Expéditions et mes Récoltes de Viande changer avec le temps.

- **Débloquée par** : US-1508
- **Critères d'acceptation** :
  - Chaque Saison applique un effet sur la Densité par Biome, par exemple un hiver qui rend la toundra plus giboyeuse (chiffre à régler).
  - La Densité reste cachée : l'effet se combine à la Densité du jour sans la révéler.
  - Sur une longue simulation, les Rencontres dans un Biome suivent l'effet de la Saison.

### US-1511 · La Saison change les Récoltes
**En tant que** joueur, **je veux** que la Saison change ce que rapportent mes Récoltes selon le Biome, **afin de** régler mes sorties sur la période.

- **Débloquée par** : US-1508, Étape 22
- **Critères d'acceptation** :
  - Chaque Saison change le rendement des Récoltes par Biome et par ressource, par exemple des Végétaux rares en hiver (chiffre à régler).
  - La même Récolte, sur la même Case, rapporte différemment selon la Saison, à Densité du jour égale.
  - La production continue des Cases change aussi avec la Saison, ou non (à décider).

### US-1512 · Lire les effets de la Saison
**En tant que** joueur, **je veux** une fiche claire de ce que change la Saison en cours, **afin de** choisir où récolter et où explorer.

- **Débloquée par** : US-1510, US-1511
- **Critères d'acceptation** :
  - La fiche indique, pour chaque Biome, si la faune et chaque ressource sont en hausse, stables ou en baisse.
  - Aucun chiffre de Densité n'est révélé.
  - La fiche d'une Case rappelle l'effet de la Saison sur son Biome.

### US-1513 · Annoncer la Saison suivante
**En tant que** joueur, **je veux** être prévenu de l'arrivée de la Saison suivante, **afin de** m'y préparer.

- **Débloquée par** : US-1512
- **Critères d'acceptation** :
  - Un message annonce la Saison suivante quelques jours avant son arrivée (chiffre à régler).
  - Il résume ses principaux effets par Biome.
  - Un second message confirme le changement le jour venu.

### US-1514 · Une Récolte à cheval sur deux Saisons
**En tant que** joueur, **je veux** savoir comment se calcule une Récolte qui commence dans une Saison et finit dans la suivante, **afin de** ne pas être surpris par son résultat.

- **Débloquée par** : US-1511
- **Critères d'acceptation** :
  - Le rendement se calcule selon le temps passé dans chaque Saison, ou selon la Saison du départ (à décider).
  - La règle retenue s'affiche dans la préparation de la Récolte quand le changement de Saison tombe pendant le travail.
  - Le récit du retour indique la ou les Saisons prises en compte.

### US-1515 · La carte aux couleurs de la Saison
**En tant que** joueur, **je veux** que la carte et le Foyer changent d'allure avec la Saison, **afin de** sentir le temps passer.

- **Débloquée par** : US-1509
- **Critères d'acceptation** :
  - La carte et l'illustration du Foyer prennent une teinte propre à chaque Saison, selon ce que permet le chantier des illustrations (à décider).
  - Le changement d'allure ne ralentit pas la carte, sur ordinateur comme sur téléphone.
  - Les Biomes restent reconnaissables quelle que soit la Saison.

## Étape 63 · Les Apparitions

### US-1516 · Faire surgir une Apparition
**En tant que** développeur, **je veux** que le Monde fasse surgir de temps en temps une Bête d'Espèce mythique sur une Case du Cœur sauvage, pour un temps, **afin de** donner aux chefs les plus forts un sommet à atteindre.

- **Débloquée par** : Étape 44, Étape 47
- **Critères d'acceptation** :
  - Une Apparition choisit l'une des Espèces mythiques, une Case du Cœur sauvage et une durée (chiffre à régler).
  - La fréquence des Apparitions dans un Monde (chiffre à régler).
  - Une seule Apparition à la fois par Monde (à décider).
  - En dehors des Apparitions, une Espèce mythique n'apparaît jamais sur une Case.

### US-1517 · Annoncer une Apparition
**En tant que** joueur, **je veux** être prévenu qu'une Apparition a surgi, **afin de** tenter ma chance avant qu'elle ne disparaisse.

- **Débloquée par** : US-1516
- **Critères d'acceptation** :
  - L'annonce part vers tous les chefs du Monde, ou seulement vers ceux assez proches du Cœur sauvage (à décider).
  - Elle nomme l'Espèce mythique, montre son illustration et donne la fin de l'Apparition.
  - Elle désigne la Case exacte, ou seulement une région du Cœur sauvage (à décider).
  - Un compte à rebours reste visible tant que l'Apparition dure.

### US-1518 · Affronter l'Apparition
**En tant que** joueur, **je veux** envoyer une Expédition avec une escorte vers l'Apparition pour la vaincre, **afin de** tenter d'apprivoiser une Bête mythique.

- **Débloquée par** : US-1517, Étape 41
- **Critères d'acceptation** :
  - Seule une Expédition présente sur la Case voit la Bête mythique et peut l'affronter.
  - Le combat suit la règle de somme des forces : l'escorte l'emporte si elle est plus forte, et subit ses pertes dans tous les cas.
  - En cas de défaite, seules les Bêtes de l'escorte subissent des pertes ; les explorateurs fuient.
  - Vaincue, la Bête mythique reste sur sa Case jusqu'à la fin de l'Apparition, pour les vainqueurs suivants.

### US-1519 · Chacun affronte seul
**En tant que** joueur, **je veux** que chaque escorte affronte la Bête mythique pour son compte, **afin de** ne devoir ma victoire qu'à ma propre escorte.

- **Débloquée par** : US-1518
- **Critères d'acceptation** :
  - Les forces des escortes de chefs différents ne s'additionnent jamais contre la Bête mythique.
  - Les escortes présentes sur la Case l'affrontent l'une après l'autre, dans l'ordre d'arrivée.
  - Deux escortes présentes sur la même Case ne se battent jamais entre elles.

### US-1520 · Le premier vainqueur l'apprivoise à coup sûr
**En tant que** joueur, **je veux** apprivoiser à coup sûr la Bête mythique si je suis le premier à la vaincre, **afin de** voir mon audace récompensée.

- **Débloquée par** : US-1518
- **Critères d'acceptation** :
  - Le premier chef dont l'escorte vainc la Bête mythique l'apprivoise à 100 %.
  - Une Bête de cette Espèce mythique rentre avec l'Expédition et rejoint son effectif.
  - Son Espèce s'inscrit au Bestiaire comme apprivoisée.

### US-1521 · Des chances décroissantes pour les suivants
**En tant que** joueur, **je veux** garder une chance d'apprivoiser la Bête mythique même si je ne suis pas le premier à la vaincre, **afin de** garder un intérêt à l'Apparition jusqu'à sa fin.

- **Débloquée par** : US-1520
- **Critères d'acceptation** :
  - Chaque vainqueur suivant a une chance plus faible que le précédent (chiffre à régler).
  - Le rang se compte dans l'ordre des victoires ; un chef ne compte qu'une fois.
  - Sur une longue simulation, les chances suivent bien l'ordre des vainqueurs.
  - Deux victoires au même instant sont départagées selon une règle (à décider).

### US-1522 · Connaître sa chance avant de partir
**En tant que** joueur, **je veux** connaître la chance du prochain vainqueur avant d'envoyer mon Expédition, **afin de** juger si le voyage en vaut la peine.

- **Débloquée par** : US-1521
- **Critères d'acceptation** :
  - La fiche de l'Apparition affiche le nombre de vainqueurs déjà comptés et la chance du prochain.
  - La préparation de l'Expédition prévient que cette chance peut baisser pendant le trajet si d'autres chefs gagnent avant moi.
  - La chance réellement appliquée est celle du rang obtenu au moment de ma victoire.

### US-1523 · Une seule Bête mythique par Espèce et par chef
**En tant que** joueur, **je veux** savoir que je ne peux posséder qu'une Bête de chaque Espèce mythique, **afin de** ne pas partir pour rien.

- **Débloquée par** : US-1521
- **Critères d'acceptation** :
  - Un chef qui possède déjà une Bête de cette Espèce mythique ne peut pas en apprivoiser une deuxième.
  - Il peut quand même l'affronter ; sa victoire prend un rang parmi les vainqueurs, ou non (à décider).
  - L'annonce et la fiche de l'Apparition lui rappellent qu'il la possède déjà.
  - Un chef peut posséder une Bête de chacune des Espèces mythiques.

### US-1524 · Une Bête mythique ne s'élève pas
**En tant que** joueur, **je veux** comprendre qu'une Bête mythique reste unique chez moi, **afin de** ne pas chercher à en réunir un Couple.

- **Débloquée par** : US-1520
- **Critères d'acceptation** :
  - Aucun Couple ne se forme pour une Espèce mythique, et son Élevage reste fermé.
  - La fiche de l'Espèce indique qu'elle ne s'élève pas.
  - Le Bestiaire la montre comme apprivoisée, avec une marque propre aux Espèces mythiques.

### US-1525 · Garder sa Bête mythique
**En tant que** joueur, **je veux** savoir ce que demande ma Bête mythique au quotidien, **afin de** ne pas la perdre bêtement.

- **Débloquée par** : US-1524
- **Critères d'acceptation** :
  - Elle paie son Entretien et occupe des Places dans un Habitat de son Biome, comme toute Bête.
  - En Famine, elle peut retourner au sauvage comme les autres Bêtes, après l'avertissement.
  - Elle combat, peut être Blessée ou mourir comme toute Bête.
  - Un chef qui l'a perdue peut en apprivoiser une autre de la même Espèce lors d'une Apparition suivante (à décider).

### US-1526 · Le récit d'une Apparition
**En tant que** joueur, **je veux** un récit de mon combat contre la Bête mythique, **afin de** savoir si elle m'a suivi et pourquoi.

- **Débloquée par** : US-1521
- **Critères d'acceptation** :
  - Le récit donne les forces en présence, mes pertes, mon rang de vainqueur et la chance appliquée.
  - Il dit clairement si la Bête mythique m'a suivi ou non.
  - Un vainqueur qu'elle n'a pas suivi sait qu'il l'a vaincue mais que le tirage lui a été défavorable.

### US-1527 · Le tableau des vainqueurs
**En tant que** joueur, **je veux** voir la liste des chefs qui ont vaincu l'Apparition, **afin de** savoir qui la possède et combien de rangs sont déjà pris.

- **Débloquée par** : US-1526
- **Critères d'acceptation** :
  - La fiche de l'Apparition liste les vainqueurs dans l'ordre, et indique lesquels l'ont apprivoisée.
  - La liste est visible par tous les chefs qui ont reçu l'annonce.
  - La liste reste consultable après la fin de l'Apparition (à décider).

### US-1528 · La fin d'une Apparition
**En tant que** joueur, **je veux** savoir quand une Apparition se termine, **afin de** ne pas envoyer d'Expédition pour rien.

- **Débloquée par** : US-1518
- **Critères d'acceptation** :
  - À la fin de sa durée, la Bête mythique disparaît de sa Case.
  - Une Expédition qui arrive après la fin ne trouve rien, et son récit le dit.
  - Les chefs prévenus de l'Apparition reçoivent un message de fin.
