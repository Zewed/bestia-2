# Jalon 11 · S'étendre

Le Territoire grandit Case par Case grâce aux Avant-postes ; chaque Case gagnée produit selon son Biome et offre des Places aux Espèces qui y vivent, des constructions d'Habitat reproduisent les Biomes qui manquent, et la carte distingue le Foyer, à l'abri, des Marches, qu'un autre joueur pourra prendre. Étapes couvertes : 50 à 52 de l'ordre d'attaque.

## Étape 50 · L'Avant-poste

### US-1101 · Débloquer l'Avant-poste
**En tant que** joueur, **je veux** trouver l'Avant-poste parmi mes constructions, **afin de** pouvoir agrandir mon Territoire.

- **Débloquée par** : Étape 25, Étape 32
- **Critères d'acceptation** :
  - L'Avant-poste apparaît dans la liste des constructions, dans sa famille Avant-poste.
  - Ouvert d'emblée ou par une Recherche de la branche Bâtir (à décider) ; s'il est verrouillé, il dit quelle Recherche l'ouvre, avec un lien vers elle.
  - Tant qu'il n'est pas ouvert, aucune Case ne peut être revendiquée.

### US-1102 · Voir les Cases qu'on peut revendiquer
**En tant que** joueur, **je veux** voir sur la carte quelles Cases je peux revendiquer, **afin de** choisir où m'étendre.

- **Débloquée par** : US-1101, Étape 19
- **Critères d'acceptation** :
  - Un mode « S'étendre » de la carte met en valeur les Cases voisines du Territoire qui peuvent être revendiquées.
  - Toucher l'une d'elles ouvre sa fiche avec son Biome, ce qu'elle produirait, les Places qu'elle offrirait, et un bouton « Revendiquer ».
  - Une Case qui ne peut pas être revendiquée ne propose pas ce bouton et dit pourquoi.

### US-1103 · Revendiquer une Case voisine
**En tant que** joueur, **je veux** bâtir un Avant-poste sur une Case voisine de mon Territoire, **afin de** la faire mienne.

- **Débloquée par** : US-1102
- **Critères d'acceptation** :
  - Revendiquer une Case lance le chantier d'un Avant-poste sur elle, qui coûte des Matériaux et prend du temps (chiffres à régler).
  - Seule une Case qui touche le Territoire par au moins un côté peut être revendiquée.
  - La Case doit n'appartenir à personne.
  - Sans assez de Matériaux, le bouton reste grisé et dit ce qui manque.

### US-1104 · Les Cases qu'on ne peut pas revendiquer
**En tant que** joueur, **je veux** comprendre pourquoi une Case voisine m'est refusée, **afin de** ne pas perdre de temps à essayer.

- **Débloquée par** : US-1103
- **Critères d'acceptation** :
  - Une Case d'un autre Territoire est refusée : on ne la prend que par une Attaque, et seulement si c'est une Marche (étape 59).
  - Les Cases du Cœur sauvage, revendicables ou non (à décider).
  - Les Cases d'eau : côte, lac et rivière revendicables, la mer revendicable ou non (à décider).
  - Chaque refus s'affiche avec sa raison, sur la fiche de la Case.

### US-1105 · Le chantier de l'Avant-poste
**En tant que** joueur, **je veux** suivre le chantier de mon Avant-poste, **afin de** savoir quand la Case sera à moi.

- **Débloquée par** : US-1103, Étape 26
- **Critères d'acceptation** :
  - Le chantier se voit sur la Case, sur la carte, avec son avancement et son temps restant.
  - Les bâtisseurs l'accélèrent, comme pour toute construction.
  - Un seul Avant-poste en chantier à la fois : en lancer un second est refusé avec un message.
  - Le chantier avance même en l'absence du joueur.

### US-1106 · Annuler un Avant-poste en chantier
**En tant que** joueur, **je veux** annuler un Avant-poste en chantier, **afin de** changer d'avis sur la Case à revendiquer.

- **Débloquée par** : US-1105
- **Critères d'acceptation** :
  - Un bouton annule le chantier en cours, après confirmation.
  - Les Matériaux rendus : tout, une partie ou rien (à décider).
  - La Case redevient libre et revendicable, et un autre Avant-poste peut être lancé aussitôt.

### US-1107 · Un coût qui grandit avec le Territoire
**En tant que** joueur, **je veux** connaître le prix de mon prochain Avant-poste, **afin de** préparer mes Matériaux.

- **Débloquée par** : US-1103
- **Critères d'acceptation** :
  - Chaque nouvel Avant-poste coûte plus que le précédent, selon le nombre de Cases déjà possédées (progression : chiffre à régler).
  - Le coût du prochain Avant-poste s'affiche avant qu'on choisisse la Case.
  - Un nombre maximal de Cases par Territoire (à décider).

### US-1108 · La Case rejoint le Territoire
**En tant que** joueur, **je veux** voir ma nouvelle Case entrer dans mon Territoire à la fin du chantier, **afin de** profiter aussitôt de ce qu'elle offre.

- **Débloquée par** : US-1105
- **Critères d'acceptation** :
  - À la fin du chantier, la Case appartient au joueur : sa fiche le dit, l'Avant-poste s'y voit, et le contour du Territoire l'englobe sur la carte.
  - Le brouillard se lève autour de la nouvelle Case (rayon : chiffre à régler).
  - Un récit « Nouvelle Case » s'ajoute à la page Récits, avec le Biome de la Case.
  - Pour tous les autres joueurs, la Case n'est plus libre, même s'ils ne verront les Territoires voisins qu'à l'étape 56.

### US-1109 · La nouvelle Case produit selon son Biome
**En tant que** joueur, **je veux** que chaque Case gagnée produise selon son Biome, **afin de** faire grandir mes ressources avec mon Territoire.

- **Débloquée par** : US-1108, Étape 11
- **Critères d'acceptation** :
  - La Case produit un peu en continu, heure après heure, selon son Biome, comme le Foyer (chiffres par Biome à régler).
  - Sa production commence dès qu'elle rejoint le Territoire, même en l'absence du joueur.
  - Les Cases d'eau produisent aussi ; quoi et combien (chiffre à régler).
  - La production respecte les limites de stock.

### US-1110 · La production de tout le Territoire
**En tant que** joueur, **je veux** voir ce que tout mon Territoire produit chaque heure, **afin de** savoir si mes Cases en valent la peine.

- **Débloquée par** : US-1109
- **Critères d'acceptation** :
  - La barre du haut affiche la production horaire totale du Territoire pour la Viande, les Végétaux, le Bois et la Pierre.
  - Toucher une ressource ouvre le détail Case par Case.
  - Le total est exactement la somme des Cases et des autres sources déjà en place (Nourriciers par exemple).

### US-1111 · Un Territoire d'un seul tenant
**En tant que** joueur, **je veux** que mon Territoire reste toujours d'un seul tenant, **afin de** le lire et le défendre comme un tout.

- **Débloquée par** : US-1108
- **Critères d'acceptation** :
  - Toutes les Cases du Territoire sont reliées au Foyer de proche en proche, sans passer par une Case qui n'est pas au joueur.
  - Aucune action du joueur ne peut couper le Territoire en deux ; c'est vérifié à chaque revendication.
  - Ce que devient une partie du Territoire coupée du Foyer par la prise d'une Marche à l'étape 59 (à décider).

### US-1112 · Deux joueurs visent la même Case
**En tant que** joueur, **je veux** savoir ce qui se passe quand un voisin revendique la même Case que moi, **afin de** ne pas perdre mes Matériaux sans explication.

- **Débloquée par** : US-1105
- **Critères d'acceptation** :
  - Deux joueurs peuvent lancer un Avant-poste sur la même Case libre, ou le premier chantier lancé bloque l'autre (à décider).
  - Si les deux chantiers existent, le premier terminé emporte la Case et l'autre s'arrête ; le perdant récupère ses Matériaux, tout ou partie (à décider), et reçoit un récit.
  - Deux fins de chantier au même instant ne donnent jamais la Case aux deux joueurs.

### US-1113 · Voir son Territoire
**En tant que** joueur, **je veux** une page qui liste toutes mes Cases, **afin de** gérer mon Territoire sans parcourir la carte.

- **Débloquée par** : US-1109
- **Critères d'acceptation** :
  - Une page Territoire liste chaque Case possédée : Biome, production horaire, Places offertes.
  - Elle affiche le nombre total de Cases.
  - Toucher une Case la montre sur la carte.
  - Avec le seul Foyer, la page invite à bâtir un premier Avant-poste.

### US-1114 · Abandonner une Case
**En tant que** joueur, **je veux** savoir si je peux rendre une Case au sauvage, **afin de** corriger un mauvais choix d'extension.

- **Débloquée par** : US-1111
- **Critères d'acceptation** :
  - Pouvoir abandonner une Case de son Territoire (à décider).
  - Si c'est permis : jamais la Case de la hutte du chef, et jamais une Case dont le départ couperait le Territoire en deux.
  - Si c'est permis, les Places perdues suivent la règle des Places perdues (US-1134).

### US-1115 · Une Bête ou une Expédition sur la Case revendiquée
**En tant que** joueur, **je veux** savoir ce que deviennent une Bête sauvage ou une Expédition présentes sur une Case qui rejoint un Territoire, **afin de** ne pas être surpris.

- **Débloquée par** : US-1108, Étape 44
- **Critères d'acceptation** :
  - Une Bête sauvage encore présente sur la Case reste jusqu'à la fin de sa durée, ou disparaît aussitôt (à décider).
  - L'Expédition d'un autre joueur qui y séjourne finit son séjour normalement, ou rentre aussitôt (à décider).
  - Si la règle retenue à l'étape 39 exclut les Territoires, plus aucune Bête sauvage n'apparaît sur cette Case.

### US-1116 · Partir de plus loin
**En tant que** joueur, **je veux** savoir d'où partent mes Expéditions une fois mon Territoire agrandi, **afin de** viser des Cases plus lointaines.

- **Débloquée par** : US-1108, Étape 38
- **Critères d'acceptation** :
  - La portée d'exploration se compte depuis le Foyer, ou depuis la Case du Territoire la plus proche de la destination (à décider).
  - Les trajets des Expéditions et des Récoltes partent du Foyer, ou de la Case la plus proche (à décider).
  - Pendant le choix d'une destination, la carte grise les Cases hors de portée selon la règle retenue.

## Étape 51 · Les Habitats

### US-1117 · Chaque Case offre des Places à son Biome
**En tant que** joueur, **je veux** que chaque Case possédée offre des Places aux Espèces de son Biome, **afin de** pouvoir loger plus de Bêtes à mesure que je m'étends.

- **Débloquée par** : US-1108, Étape 35
- **Critères d'acceptation** :
  - Chaque Case possédée offre des Places aux seules Espèces de son Biome (nombre par Biome : chiffre à régler).
  - Le Foyer offre des Places à son Biome, comme toute Case.
  - Une Case revendiquée ajoute ses Places dès qu'elle rejoint le Territoire.

### US-1118 · Chaque Bête occupe des Places de son Biome
**En tant que** joueur, **je veux** que chaque Bête occupe des Places dans un Habitat de son Biome, **afin de** comprendre ce qui limite la taille de mon armée.

- **Débloquée par** : US-1117
- **Critères d'acceptation** :
  - Chaque Bête occupe, selon la taille de son Espèce, des Places dans un Habitat de son Biome : un éléphant en prend plus qu'un lapin.
  - Les Places d'un Biome ne logent jamais une Espèce d'un autre Biome.
  - Les Bêtes en Expédition et les Blessés gardent leurs Places.

### US-1119 · Voir ses Places par Biome
**En tant que** joueur, **je veux** voir mes Places libres et occupées pour chaque Biome, **afin de** savoir où je peux encore élever.

- **Débloquée par** : US-1118
- **Critères d'acceptation** :
  - Une page Habitats affiche, pour chaque Biome où le joueur a un Habitat, les Places occupées et le total.
  - Le total détaille d'où viennent les Places : Cases de ce Biome et constructions d'Habitat.
  - Les Biomes sans Habitat apparaissent grisés, avec la façon d'en obtenir un.
  - Sur mobile, un Biome par ligne, qu'on déplie pour voir le détail.

### US-1120 · Pas d'Élevage sans Habitat
**En tant que** joueur, **je veux** qu'on m'empêche d'élever une Espèce qui n'a pas d'Habitat chez moi, **afin de** comprendre qu'il me faut d'abord son milieu.

- **Débloquée par** : US-1118, Étape 34
- **Critères d'acceptation** :
  - L'Élevage d'une Espèce est impossible tant que le joueur n'a aucun Habitat de son Biome.
  - Le bouton d'Élevage grisé dit ce qu'il faut : revendiquer une Case de ce Biome, ou bâtir la construction d'Habitat qui le reproduit.
  - Impossible d'élever des Bêtes polaires sans toundra ni glacière.

### US-1121 · Élever dans la limite des Places du Biome
**En tant que** joueur, **je veux** savoir combien de Bêtes je peux encore élever, **afin de** ne pas lancer un Élevage impossible.

- **Débloquée par** : US-1120
- **Critères d'acceptation** :
  - On ne peut pas élever au-delà des Places libres du Biome de l'Espèce.
  - L'écran d'Élevage affiche le nombre maximal de Bêtes qu'on peut encore élever, selon les Places libres et la taille de l'Espèce.
  - Des Places libres dans un autre Biome ne servent à rien pour cette Espèce, et l'écran le dit.

### US-1122 · Débloquer les constructions d'Habitat
**En tant que** joueur, **je veux** débloquer les constructions d'Habitat par la Recherche, **afin de** loger des Espèces dont je n'ai pas le Biome.

- **Débloquée par** : US-1120, Étape 32
- **Critères d'acceptation** :
  - Les constructions d'Habitat forment la famille Habitats, ouverte par des Recherches ; lesquelles (à décider).
  - Une construction d'Habitat verrouillée dit quelle Recherche l'ouvre, avec un lien vers elle.
  - Une construction d'Habitat se bâtit comme les autres : Matériaux, temps, bâtisseurs, une seule du même genre en chantier à la fois.

### US-1123 · Le bassin
**En tant que** joueur, **je veux** bâtir un bassin, **afin de** loger des Espèces de l'eau sans posséder de Case d'eau.

- **Débloquée par** : US-1122
- **Critères d'acceptation** :
  - Le bassin ajoute des Places pour l'eau (chiffre à régler), quelle que soit sa variante : côte, lac, rivière ou mer.
  - Avec un bassin, on peut élever une Espèce de l'eau qu'il reproduit sans posséder de Case de ce Biome.
  - Ses Places apparaissent dans la page Habitats.

### US-1124 · La glacière
**En tant que** joueur, **je veux** bâtir une glacière, **afin de** loger des Bêtes polaires sans posséder de toundra.

- **Débloquée par** : US-1122
- **Critères d'acceptation** :
  - La glacière ajoute des Places pour la toundra (chiffre à régler) ; pour la banquise aussi (à décider).
  - Avec une glacière, on peut élever des Bêtes polaires sans posséder de Case de toundra.
  - Ses Places apparaissent dans la page Habitats.

### US-1125 · La volière
**En tant que** joueur, **je veux** bâtir une volière, **afin de** loger des oiseaux dont je n'ai pas le Biome.

- **Débloquée par** : US-1122
- **Critères d'acceptation** :
  - La volière ajoute des Places pour un Biome (chiffre à régler) ; lequel (à décider).
  - Ses Places ne logent que les Espèces de ce Biome, comme tout Habitat.
  - Ses Places apparaissent dans la page Habitats.

### US-1126 · Une construction d'Habitat pour chaque Biome qui manque
**En tant que** joueur, **je veux** trouver une construction d'Habitat pour les Biomes difficiles à atteindre, **afin de** ne pas être bloqué par la géographie de ma région.

- **Débloquée par** : US-1122
- **Critères d'acceptation** :
  - La liste des constructions prévoit une construction d'Habitat pour chaque Biome, ou seulement pour certains (à décider).
  - Chaque construction d'Habitat reproduit un seul Biome, dit clairement sur sa fiche.
  - Deux constructions d'Habitat différentes ne reproduisent jamais le même Biome (à décider).

### US-1127 · Les niveaux d'une construction d'Habitat
**En tant que** joueur, **je veux** améliorer mes constructions d'Habitat, **afin de** loger toujours plus de Bêtes.

- **Débloquée par** : US-1123, Étape 27
- **Critères d'acceptation** :
  - Chaque niveau ajoute des Places (chiffre à régler), et coûte et dure plus que le précédent.
  - Pendant l'amélioration, les Places déjà acquises restent utilisables.
  - Des Postes dans les constructions d'Habitat (à décider).

### US-1128 · Les eaux et leurs Habitats
**En tant que** joueur, **je veux** savoir quelle eau convient à chaque Espèce aquatique, **afin de** revendiquer la bonne Case.

- **Débloquée par** : US-1117
- **Critères d'acceptation** :
  - Toutes les eaux se valent pour loger une Espèce d'eau : une Espèce de lac peut vivre sur une Case de rivière.
  - La fiche de l'Espèce dit précisément quelle eau lui convient.
  - La page Habitats range les Places d'eau selon la règle retenue.

### US-1129 · Le Foyer loge toujours les Espèces de prairie
**En tant que** joueur, **je veux** que mon Foyer reste l'Habitat des Espèces de prairie, **afin de** ne pas perdre les Places de mes Bêtes de prairie quand les Habitats par Biome arrivent.

- **Débloquée par** : US-1120, Étape 9
- **Critères d'acceptation** :
  - Le Foyer, toujours en prairie (US-0152), offre des Places aux Espèces de prairie, dont la souris, la poule et le pigeon, comme toute Case de prairie.
  - Le passage aux Habitats par Biome ne retire à aucun joueur les Places de prairie de son Foyer.
  - Les Bêtes d'autres Biomes logées au Foyer jusque-là (étape 35) suivent la règle de US-1130.

### US-1130 · Les Bêtes déjà là quand la règle arrive
**En tant que** joueur, **je veux** ne perdre aucune Bête le jour où les Habitats par Biome arrivent, **afin de** continuer ma partie sereinement.

- **Débloquée par** : US-1118
- **Critères d'acceptation** :
  - Au passage à cette règle, aucune Bête déjà possédée ne disparaît.
  - Les Bêtes logées au Foyer hors de leur Biome restent en surnombre, ou gardent une Place d'exception (à décider).
  - Les joueurs concernés voient un message qui explique la nouvelle règle et ce qu'ils peuvent faire.

### US-1131 · Une Bête apprivoisée sans Habitat
**En tant que** joueur, **je veux** savoir ce que devient une Bête apprivoisée dont je n'ai pas l'Habitat, **afin de** ne pas la perdre bêtement.

- **Débloquée par** : US-1118, Étape 40
- **Critères d'acceptation** :
  - Une Bête apprivoisée d'un Biome où le joueur n'a aucun Habitat le rejoint quand même en surnombre, attend en Réserve, ou repart au sauvage (à décider).
  - Si elle complète un Couple, le Couple part en Réserve comme toujours.
  - Le récit du retour dit clairement ce qu'est devenue la Bête.

### US-1132 · Les Couples en Réserve et les Places
**En tant que** joueur, **je veux** savoir si mes Couples occupent des Places, **afin de** compter juste.

- **Débloquée par** : US-1119
- **Critères d'acceptation** :
  - La règle de l'étape 35 s'applique : les Bêtes des Couples en Réserve occupent des Places, ou non (à décider).
  - Si elles en occupent, c'est dans un Habitat de leur Biome, comme toute Bête.
  - La page Habitats montre les Couples à part des autres Bêtes.

### US-1133 · La fiche d'Espèce dit si l'Habitat existe
**En tant que** joueur, **je veux** voir sur la fiche d'une Espèce si j'ai son Habitat, **afin de** savoir tout de suite si je pourrai l'élever.

- **Débloquée par** : US-1119, Étape 46
- **Critères d'acceptation** :
  - La fiche d'une Espèce indique son Biome d'Habitat et, si le joueur en possède un, ses Places libres.
  - Sinon, elle dit comment l'obtenir : Case à revendiquer ou construction d'Habitat à bâtir.
  - L'information est la même depuis le Bestiaire et depuis la Réserve.

### US-1134 · Des Places perdues
**En tant que** joueur, **je veux** savoir ce qui arrive quand un Biome perd des Places, **afin de** ne pas voir mes Bêtes disparaître sans comprendre.

- **Débloquée par** : US-1119
- **Critères d'acceptation** :
  - Quand un Biome perd des Places (Case abandonnée, plus tard Marche prise), les Bêtes déjà là restent en surnombre (à décider).
  - En surnombre, l'Élevage des Espèces de ce Biome est bloqué.
  - La page Habitats signale le surnombre de façon visible.

## Étape 52 · Foyer et Marches

### US-1135 · Le Foyer autour de la hutte du chef
**En tant que** joueur, **je veux** savoir quelles Cases forment mon Foyer, **afin de** connaître la partie de mon Territoire qu'on ne pourra jamais me prendre.

- **Débloquée par** : US-1108
- **Critères d'acceptation** :
  - Les Cases du Territoire assez proches de la hutte du chef forment le Foyer (distance des Marches : chiffre à régler).
  - La Case de la hutte du chef fait toujours partie du Foyer.
  - La distance se compte en Cases, à vol d'oiseau ou par un chemin à travers le Territoire (à décider).

### US-1136 · Les Marches au-delà
**En tant que** joueur, **je veux** savoir quelles Cases forment mes Marches, **afin de** mesurer le risque de m'étendre loin.

- **Débloquée par** : US-1135
- **Critères d'acceptation** :
  - Les Cases du Territoire trop éloignées de la hutte du chef forment les Marches.
  - Une Case est rangée au Foyer ou en Marche dès qu'elle rejoint le Territoire.
  - Un moyen d'agrandir le Foyer, niveau de la hutte du chef ou Recherche (à décider).

### US-1137 · Voir Foyer et Marches sur la carte
**En tant que** joueur, **je veux** distinguer d'un coup d'œil mon Foyer et mes Marches sur la carte, **afin de** voir ce qui peut être pris et ce qui ne le peut pas.

- **Débloquée par** : US-1136, Étape 19
- **Critères d'acceptation** :
  - Les Cases du Foyer et celles des Marches se distinguent au premier regard, par la couleur et par un motif.
  - Une légende explique : « Foyer : ne peut pas être pris », « Marche : peut être prise par un autre joueur ».
  - La distinction reste lisible à tous les zooms.

### US-1138 · La fiche de Case dit si elle peut être prise
**En tant que** joueur, **je veux** que la fiche d'une Case de mon Territoire dise si elle est prenable, **afin de** savoir ce que je risque de perdre.

- **Débloquée par** : US-1136
- **Critères d'acceptation** :
  - La fiche d'une Case du Territoire dit « Foyer, à l'abri » ou « Marche, peut être prise lors d'une Attaque ».
  - Pour une Marche, elle rappelle ce qu'on perdrait : production horaire et Places.

### US-1139 · Prévenir avant de revendiquer une future Marche
**En tant que** joueur, **je veux** savoir avant de bâtir un Avant-poste si la Case sera au Foyer ou en Marche, **afin de** m'étendre en connaissance de cause.

- **Débloquée par** : US-1136, US-1102
- **Critères d'acceptation** :
  - Avant de lancer un Avant-poste, la fiche de la Case dit si elle sera au Foyer ou en Marche.
  - En mode « S'étendre », la carte distingue déjà les futures Cases de Foyer et les futures Marches.

### US-1140 · Compter ses Cases de Foyer et de Marche
**En tant que** joueur, **je veux** voir combien de Cases j'ai au Foyer et en Marches, **afin de** suivre la solidité de mon Territoire.

- **Débloquée par** : US-1136, US-1113
- **Critères d'acceptation** :
  - La page Territoire affiche le nombre de Cases au Foyer et le nombre de Cases en Marches.
  - La liste des Cases peut se filtrer : Foyer ou Marches.

### US-1141 · Foyer et Marches sur mobile
**En tant que** joueur, **je veux** distinguer Foyer et Marches sur mon téléphone, **afin de** jouer au pouce sans me tromper.

- **Débloquée par** : US-1137
- **Critères d'acceptation** :
  - La légende se replie et se rouvre d'un toucher.
  - Le motif des Marches se distingue aussi sans les couleurs, pour les joueurs qui les confondent.
  - Toucher une Case sur un petit écran ouvre la bonne fiche, sans erreur de voisine.

### US-1142 · Dire si une Case est prenable
**En tant que** développeur, **je veux** que le jeu sache dire, pour toute Case d'un Territoire, si elle est prenable, **afin de** brancher plus tard l'Attaque sans réécrire la règle.

- **Débloquée par** : US-1136
- **Critères d'acceptation** :
  - Pour toute Case possédée, une seule règle dit si elle est prenable, et c'est la même que celle de l'affichage.
  - Le Foyer n'est jamais prenable, quelles que soient les circonstances.
  - Cette règle servira telle quelle à la prise d'une Marche (étape 59).
