# Jalon 12 · Les Épreuves

Le nouveau chef n'est plus lâché seul dans le Monde : une suite d'Épreuves le guide pas à pas, du choix de son Couple de départ jusqu'à sa première Expédition et au-delà, en ouvrant l'interface petit à petit et en le récompensant à chaque étape. Étape couverte : 53 de l'ordre d'attaque.

## Étape 53 · Les Épreuves guidées

### US-1201 · Décrire les Épreuves dans les données du jeu
**En tant que** développeur, **je veux** décrire chaque Épreuve dans une liste ordonnée (titre, court récit, objectifs, récompense, écrans qu'elle ouvre, écran où agir), **afin de** pouvoir régler la suite sans toucher au code des écrans.

- **Débloquée par** : Étape 9
- **Critères d'acceptation** :
  - Chaque Épreuve a un titre, un récit de deux phrases au plus, un ou plusieurs objectifs, une récompense, la liste des écrans qu'elle ouvre et l'écran où l'on agit.
  - Un objectif se vérifie à partir de l'état du joueur (un Métier donné, une construction terminée, une Récolte revenue) sans rien lui demander de plus.
  - Changer l'ordre ou le contenu d'une Épreuve ne demande de modifier que cette liste.
  - La suite décrite dans ce jalon (US-1215 à US-1230) est une première proposition, à valider en jouant (à décider).

### US-1202 · Recevoir la première Épreuve en arrivant sur son Foyer
**En tant que** nouveau joueur, **je veux** qu'un message d'accueil me présente la première Épreuve dès que mon Foyer apparaît, **afin de** savoir tout de suite par où commencer.

- **Débloquée par** : US-1201
- **Critères d'acceptation** :
  - Juste après la naissance sur la carte, un message d'accueil s'affiche une seule fois, avec le nom du chef et l'Espèce du Couple de départ choisi.
  - Il annonce le nombre d'Épreuves et présente la première (titre, récit, objectif).
  - Un bouton « Commencer la première Épreuve » ferme le message et mène à l'écran où agir.
  - Une fois fermé, le message ne revient plus, même après déconnexion ou sur un autre appareil.

### US-1203 · Voir l'Épreuve en cours
**En tant que** joueur, **je veux** voir en permanence l'Épreuve en cours dans un encart, **afin de** toujours savoir quoi faire ensuite.

- **Débloquée par** : US-1202
- **Critères d'acceptation** :
  - L'encart indique « Épreuve N sur M », le titre, les objectifs et la récompense promise.
  - Chaque objectif rempli est coché.
  - L'encart est visible depuis le Foyer et depuis l'écran où l'Épreuve se joue.
  - Toucher l'encart affiche le récit complet de l'Épreuve.

### US-1204 · Suivre un objectif chiffré
**En tant que** joueur, **je veux** voir un compteur sur les objectifs qui demandent plusieurs pas (par exemple « 2/3 Habitants avec un Métier »), **afin de** savoir combien il m'en reste.

- **Débloquée par** : US-1203
- **Critères d'acceptation** :
  - Le compteur affiche ce qui est fait sur ce qui est demandé.
  - Il se met à jour sans recharger la page quand le joueur agit.
  - Ce qui s'est passé pendant l'absence du joueur (une Récolte revenue, un chantier fini) est compté dès l'ouverture de la page.
  - Un objectif à un seul pas n'affiche pas de compteur, seulement sa case à cocher.

### US-1205 · Aller droit au but avec « Y aller »
**En tant que** nouveau joueur, **je veux** un bouton « Y aller » qui m'amène à l'écran où l'objectif se remplit, **afin de** ne pas chercher où toucher.

- **Débloquée par** : US-1203
- **Critères d'acceptation** :
  - Le bouton ouvre l'écran du premier objectif non rempli.
  - L'élément à utiliser (la hutte à bâtir, l'Habitant sans Métier, la Case à récolter) est mis en avant sur cet écran.
  - La mise en avant disparaît dès que le joueur a agi.
  - Si l'objectif se remplit sur un autre écran que prévu, le bouton suit l'objectif suivant.

### US-1206 · Réclamer la récompense d'une Épreuve
**En tant que** joueur, **je veux** réclamer la récompense d'une Épreuve réussie d'un seul geste, **afin de** sentir que mes efforts paient.

- **Débloquée par** : US-1204, US-1205
- **Critères d'acceptation** :
  - Quand tous les objectifs sont remplis, « Y aller » laisse la place à « Réclamer la récompense ».
  - Le jeu vérifie à nouveau les objectifs au moment du geste ; la récompense s'ajoute aux stocks et un message « Épreuve réussie » le confirme.
  - Une récompense n'est reçue qu'une seule fois, même avec deux touchers rapides ou deux onglets ouverts.
  - L'Épreuve suivante s'affiche aussitôt dans l'encart.

### US-1207 · Une récompense qui déborde des stocks
**En tant que** joueur, **je veux** être prévenu quand une récompense dépasserait mes limites de stock, **afin de** ne pas la gaspiller sans le savoir.

- **Débloquée par** : US-1206, Étape 12
- **Critères d'acceptation** :
  - Avant de réclamer, l'encart signale quelle part de la récompense dépasserait la limite de stock.
  - La récompense reste disponible sans limite de temps : le joueur peut attendre d'avoir de la place pour la réclamer.
  - La part qui dépasse la limite est perdue ou gardée au-dessus de la limite (à décider).

### US-1208 · Commencer avec une interface réduite
**En tant que** nouveau joueur, **je veux** ne voir au départ que quelques écrans, **afin de** ne pas être noyé sous les menus le premier jour.

- **Débloquée par** : US-1201
- **Critères d'acceptation** :
  - Au départ, seuls le Foyer, la page Habitants, les récits et les réglages sont accessibles.
  - Les autres entrées du menu apparaissent grisées, avec un cadenas.
  - Une entrée verrouillée ne s'ouvre pas, même en tapant son adresse directement.
  - La barre du haut (nom du chef, ressources) reste complète dès le départ.

### US-1209 · Savoir quelle Épreuve ouvre un écran verrouillé
**En tant que** joueur, **je veux** qu'un écran verrouillé me dise quelle Épreuve l'ouvre, **afin de** savoir comment y accéder.

- **Débloquée par** : US-1208
- **Critères d'acceptation** :
  - Toucher une entrée verrouillée affiche le titre et le numéro de l'Épreuve qui l'ouvre.
  - Le même écran montre l'encart de l'Épreuve en cours, avec son bouton « Y aller ».
  - L'entrée que l'Épreuve en cours va ouvrir porte une marque qui la distingue des autres entrées verrouillées.

### US-1210 · Voir un écran s'ouvrir
**En tant que** joueur, **je veux** être prévenu quand une Épreuve réussie ouvre un nouvel écran, **afin de** le découvrir sans attendre.

- **Débloquée par** : US-1206, US-1208
- **Critères d'acceptation** :
  - Le message « Épreuve réussie » nomme les écrans qui s'ouvrent.
  - L'entrée du menu se déverrouille aussitôt et reste mise en avant jusqu'à la première visite.
  - Un écran ouvert ne se reverrouille jamais.

### US-1211 · Ne jamais perdre l'accès à ce qu'on utilise déjà
**En tant que** joueur, **je veux** garder l'accès à tout ce que j'ai déjà mis en route, même si l'Épreuve correspondante n'est pas faite, **afin de** ne jamais être bloqué par les Épreuves.

- **Débloquée par** : US-1208
- **Critères d'acceptation** :
  - Un joueur qui possède déjà une construction, une Recherche en cours, une sortie en chemin ou une Bête élevée voit l'écran correspondant ouvert.
  - Une Récolte en cours reste suivable et rappelable, une Expédition en cours reste suivable, quel que soit l'avancement dans les Épreuves.
  - L'avertissement « famine imminente » s'affiche toujours, même si l'écran concerné est encore verrouillé.

### US-1212 · Une Épreuve déjà accomplie
**En tant que** joueur, **je veux** qu'une Épreuve dont j'ai déjà rempli les objectifs soit aussitôt marquée réussie, **afin de** ne pas refaire ce que j'ai déjà fait.

- **Débloquée par** : US-1206
- **Critères d'acceptation** :
  - Quand une Épreuve devient l'Épreuve en cours et que ses objectifs sont déjà remplis, l'encart passe directement à « Réclamer la récompense ».
  - Un objectif qui porte sur un état (au moins une hutte bâtie) compte l'état présent, pas une action à refaire.
  - Un objectif qui porte sur une action (une Récolte revenue) compte aussi les actions faites avant l'Épreuve (à décider).

### US-1213 · Les chefs installés avant les Épreuves
**En tant que** joueur, **je veux** que tout ce que j'ai fait avant l'arrivée des Épreuves soit reconnu, **afin de** ne pas voir mon interface se refermer.

- **Débloquée par** : US-1211, US-1212
- **Critères d'acceptation** :
  - À la mise en ligne des Épreuves, chaque chef existant est placé à la première Épreuve qu'il n'a pas remplie.
  - Aucun écran qu'il utilisait ne se verrouille.
  - Les récompenses des Épreuves qu'il a ainsi sautées lui sont versées ou non (à décider).

### US-1214 · Ne jamais rester coincé dans une Épreuve
**En tant que** développeur, **je veux** vérifier qu'un nouveau chef peut toujours remplir l'Épreuve en cours avec ce qu'il possède, **afin de** garantir qu'aucun joueur ne reste bloqué.

- **Débloquée par** : US-1201
- **Critères d'acceptation** :
  - Une simulation en temps accéléré joue toute la suite depuis un Foyer neuf, pour chacun des trois Couples de départ, sans jamais manquer de Nourriture ni de Matériaux.
  - Elle passe pour un Foyer posé sur chacun des Biomes présents sur la Couronne, y compris pour l'Élevage du Couple de départ.
  - Si un objectif demande plus que les stocks de départ, la production et les récompenses précédentes, le test échoue.
  - La durée mesurée jusqu'à la première Expédition est comparée à l'objectif visé (chiffre à régler).

### US-1215 · Épreuve 1 « Chacun sa tâche » : donner un Métier
**En tant que** nouveau joueur, **je veux** que la première Épreuve me demande de donner un Métier à mes Habitants, **afin de** comprendre que mon village tourne grâce à eux.

- **Débloquée par** : US-1206, US-1208, Étape 14
- **Critères d'acceptation** :
  - Objectif : chaque Habitant a un Métier, avec un compteur « N/3 » au départ.
  - Le récit rappelle que les Habitants ne combattent jamais et que toute la force vient des Bêtes.
  - « Y aller » ouvre la page Habitants sur le premier Habitant sans Métier.
  - Récompense : de la Nourriture (chiffre à régler) ; ouvre la Réserve.

### US-1216 · Épreuve 2 « Le Couple de départ » : découvrir sa Réserve
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse ouvrir la fiche de l'Espèce de mon Couple de départ, **afin de** connaître ses forces et son Rôle.

- **Débloquée par** : US-1215, Étape 33, Étape 37
- **Critères d'acceptation** :
  - Objectif : ouvrir la fiche de l'Espèce du Couple de départ dans la Réserve.
  - Le récit reprend le style de jeu choisi (se défendre, grandir ou explorer) et nomme le Rôle de l'Espèce quand elle en a un (Nourricier pour la poule, Éclaireur pour le pigeon).
  - Le récit explique qu'un Couple réuni ne combat plus et vit à l'abri dans la Réserve.
  - Récompense : de la Nourriture (chiffre à régler) ; ouvre l'Élevage.

### US-1217 · Épreuve 3 « Les premiers petits » : élever des Bêtes
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse élever mes premières Bêtes de l'Espèce de mon Couple, **afin de** voir mon effectif grandir.

- **Débloquée par** : US-1216, Étape 35
- **Critères d'acceptation** :
  - Objectif : posséder un nombre de Bêtes élevées de l'Espèce du Couple de départ (chiffre à régler), avec son compteur.
  - Les stocks de départ et les récompenses précédentes suffisent à payer cet Élevage.
  - Le récit prévient que chaque Bête mange chaque heure selon son régime et occupe des Places.
  - Récompense : de la Nourriture (chiffre à régler) ; ouvre la carte.

### US-1218 · Épreuve 4 « Au-delà du feu » : ouvrir la carte
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse ouvrir la carte et toucher une Case autour de mon Foyer, **afin de** découvrir le Monde qui m'entoure.

- **Débloquée par** : US-1217, Étape 20
- **Critères d'acceptation** :
  - Objectif : ouvrir la fiche d'une Case qui n'est pas le Foyer.
  - « Y aller » ouvre la carte centrée sur le Foyer.
  - Le récit explique le brouillard, la Couronne où l'on naît et, au loin, le Cœur sauvage.
  - Récompense : du Bois et de la Pierre (chiffre à régler) ; ouvre les Récoltes.

### US-1219 · Épreuve 5 « La première Récolte » : ramener une Récolte
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse envoyer une Récolte et la voir revenir, **afin de** comprendre qu'une sortie rapporte bien plus que la production du Foyer.

- **Débloquée par** : US-1218, Étape 22
- **Critères d'acceptation** :
  - Objectif : une Récolte revenue, quels que soient le Métier et la ressource.
  - « Y aller » propose une Case proche qui convient à un Métier déjà donné ; si aucun Habitant n'a de Métier de Récolte, il mène d'abord à la page Habitants.
  - Une Récolte rappelée à l'aller ne remplit pas l'objectif.
  - Récompense : du Bois (chiffre à régler) ; ouvre les constructions.

### US-1220 · Épreuve 6 « Un toit de plus » : bâtir une hutte
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse bâtir une hutte, **afin de** découvrir la construction et de faire de la place pour de nouveaux Habitants.

- **Débloquée par** : US-1219, Étape 26
- **Critères d'acceptation** :
  - Objectif : une hutte terminée.
  - Le récit conseille de donner le Métier de bâtisseur à un Habitant pour aller plus vite.
  - L'encart montre l'avancée du chantier en cours.
  - Récompense : du Bois et de la Pierre (chiffre à régler).

### US-1221 · Épreuve 7 « Des mains en plus » : accueillir un Voyageur
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse accueillir un Voyageur, **afin de** découvrir comment mon village grandit.

- **Débloquée par** : US-1220, Étape 17
- **Critères d'acceptation** :
  - Objectif : un Voyageur accueilli.
  - Pendant cette Épreuve, un Voyageur arrive à coup sûr aux portes dans un délai court (chiffre à régler) (à décider).
  - S'il repart sans être accueilli, un autre arrive plus tard, pour que l'Épreuve ne se bloque pas.
  - Récompense : de la Nourriture (chiffre à régler).

### US-1222 · Épreuve 8 « Des réserves pour durer » : bâtir un stockage
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse bâtir un premier stockage, **afin de** comprendre que mes stocks ont une limite.

- **Débloquée par** : US-1221, Étape 28
- **Critères d'acceptation** :
  - Objectif : un grenier, un fumoir, un bûcher ou une taillerie terminé.
  - « Y aller » propose le stockage de la ressource la plus proche de sa limite.
  - Le récit explique qu'un stock plein ne monte plus.
  - Récompense : du Bois et de la Pierre (chiffre à régler).

### US-1223 · Épreuve 9 « Le cercle des sages » : ouvrir la Recherche
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse bâtir le cercle des sages et y placer un chercheur, **afin de** débloquer la Recherche.

- **Débloquée par** : US-1222, Étape 31
- **Critères d'acceptation** :
  - Objectifs : le cercle des sages terminé, et au moins un Habitant chercheur.
  - Le récit précise que la Recherche ouvre des constructions, des Rôles et la portée des Expéditions, mais ne rend jamais les Bêtes plus fortes.
  - Récompense : du Bois et de la Pierre (chiffre à régler) ; ouvre la Recherche.

### US-1224 · Épreuve 10 « Les sages au travail » : mener une Recherche
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse mener une première Recherche jusqu'au bout, **afin de** voir comment la Recherche ouvre le jeu.

- **Débloquée par** : US-1223, Étape 32
- **Critères d'acceptation** :
  - Objectif : une Recherche de la branche Explorer terminée.
  - « Y aller » ouvre l'arbre de Recherche sur la première Recherche de cette branche.
  - L'encart montre le temps restant de la Recherche en cours.
  - Récompense : de la Nourriture (chiffre à régler).

### US-1225 · Épreuve 11 « Des yeux au loin » : former un explorateur
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse donner le Métier d'explorateur à un Habitant, **afin de** préparer ma première Expédition.

- **Débloquée par** : US-1224, Étape 38
- **Critères d'acceptation** :
  - Objectif : au moins un Habitant explorateur.
  - Le récit explique que les explorateurs trouvent les Bêtes sauvages et fuient toujours le combat.
  - « Y aller » ouvre la page Habitants.
  - Récompense : de la Nourriture (chiffre à régler) ; ouvre les Expéditions.

### US-1226 · Épreuve 12 « La première Expédition » : partir à la découverte
**En tant que** nouveau joueur, **je veux** que l'Épreuve me fasse envoyer une première Expédition et la voir revenir, **afin de** découvrir le cœur du jeu : trouver des Bêtes sauvages.

- **Débloquée par** : US-1225, Étape 45
- **Critères d'acceptation** :
  - Objectif : une Expédition revenue.
  - Le récit conseille d'emmener quelques Bêtes en escorte, rappelle que seules les Bêtes risquent leur vie, et cite l'effet des pigeons pour qui les a choisis.
  - C'est la dernière Épreuve qui verrouille l'interface : sa récompense ouvre le Bestiaire et tous les écrans restants.
  - Récompense : de la Nourriture, du Bois et de la Pierre (chiffre à régler).

### US-1227 · Épreuve 13 « Un nouveau visage » : apprivoiser une Bête sauvage
**En tant que** joueur, **je veux** que l'Épreuve suivante me pousse à apprivoiser ma première Bête sauvage, **afin de** poursuivre au-delà de la première Expédition.

- **Débloquée par** : US-1226, Étape 46
- **Critères d'acceptation** :
  - Objectif : une Bête sauvage apprivoisée.
  - Le récit prévient qu'il faut parfois plusieurs Expéditions, et que l'escorte doit être assez forte pour que la Bête suive.
  - « Y aller » ouvre la préparation d'une Expédition.
  - Récompense : de la Nourriture (chiffre à régler).

### US-1228 · Épreuve 14 « Un deuxième Couple » : réunir un Couple
**En tant que** joueur, **je veux** que l'Épreuve me fixe comme but de réunir un Couple d'une nouvelle Espèce, **afin de** comprendre le but profond du jeu.

- **Débloquée par** : US-1227, Étape 43
- **Critères d'acceptation** :
  - Objectif : un Couple réuni d'une autre Espèce que celle du Couple de départ.
  - L'encart montre, pour l'Espèce la plus avancée, s'il manque le mâle ou la femelle.
  - Le récit prévient que cela peut prendre plusieurs jours et que l'Élevage de l'Espèce restera ouvert pour toujours.
  - Récompense : de la Nourriture et des Matériaux (chiffre à régler).

### US-1229 · Épreuve 15 « Une Case de plus » : bâtir un Avant-poste
**En tant que** joueur, **je veux** que l'Épreuve me fasse revendiquer une Case voisine, **afin de** savoir étendre mon Territoire et offrir de nouveaux Habitats.

- **Débloquée par** : US-1228, Étape 51
- **Critères d'acceptation** :
  - Objectif : un Avant-poste terminé et une nouvelle Case dans le Territoire.
  - Le récit explique que chaque Case offre des Places pour les Espèces de son Biome.
  - Le récit prévient que les Cases trop éloignées du Foyer forment les Marches, que d'autres chefs pourront prendre.
  - Récompense : des Matériaux (chiffre à régler).

### US-1230 · Une Épreuve propre au Couple de départ
**En tant que** nouveau joueur, **je veux** une Épreuve qui met en valeur le Couple que j'ai choisi, **afin de** sentir l'intérêt de mon choix.

- **Débloquée par** : US-1226
- **Critères d'acceptation** :
  - Poule : faire produire de la Nourriture par des poules grâce à leur Rôle de Nourricier.
  - Pigeon : emmener des pigeons dans une Expédition grâce à leur Rôle d'Éclaireur.
  - Souris : réunir un effectif de souris prêtes à défendre le Foyer (chiffre à régler).
  - L'existence de cette Épreuve et sa place dans la suite (à décider).

### US-1231 · La fin des Épreuves
**En tant que** joueur, **je veux** un dernier message quand j'ai réussi toutes les Épreuves, **afin de** savoir que je vole désormais de mes propres ailes.

- **Débloquée par** : US-1229
- **Critères d'acceptation** :
  - Après la dernière récompense, un message félicite le chef et rappelle le but du jeu : réunir le plus de Couples possible.
  - L'encart d'Épreuve disparaît du Foyer et des autres écrans.
  - Tous les écrans sont ouverts.

### US-1232 · Passer les Épreuves
**En tant que** joueur, **je veux** pouvoir passer les Épreuves quand je connais déjà Bestia, **afin de** débloquer tout le jeu sans attendre.

- **Débloquée par** : US-1210
- **Critères d'acceptation** :
  - Le choix de passer les Épreuves est proposé, comme dans le prototype (à décider).
  - Une confirmation prévient que les récompenses des Épreuves restantes seront perdues.
  - Après confirmation, tous les écrans s'ouvrent et l'encart disparaît.
  - Le choix est définitif.

### US-1233 · L'encart d'Épreuve sur téléphone
**En tant que** joueur, **je veux** un encart d'Épreuve compact sur mon téléphone, **afin de** garder visible l'écran où je joue.

- **Débloquée par** : US-1206
- **Critères d'acceptation** :
  - Sur un écran de téléphone, l'encart se réduit à une ligne (numéro, titre, avancée) et se déplie d'un toucher.
  - « Y aller » et « Réclamer la récompense » restent atteignables au pouce.
  - L'encart ne provoque aucun défilement de côté.

### US-1234 · Revoir les Épreuves réussies
**En tant que** joueur, **je veux** relire la liste des Épreuves que j'ai réussies, **afin de** retrouver un conseil oublié.

- **Débloquée par** : US-1206
- **Critères d'acceptation** :
  - La liste donne, dans l'ordre, le titre, le récit et la récompense de chaque Épreuve réussie.
  - Les Épreuves à venir ne sont pas dévoilées ; seul leur nombre s'affiche.
  - La liste reste consultable après la fin des Épreuves.
