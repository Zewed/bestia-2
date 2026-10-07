# Jalon 2 · Le territoire respire

Le Foyer se met à produire : Viande, Végétaux, Bois et Pierre s'affichent dans la barre du haut et montent heure après heure selon son Biome, même en l'absence du joueur, jusqu'à la limite de chaque stock. Étapes couvertes : 10 à 12 de l'ordre d'attaque.

## Étape 10 · Les ressources

### US-0201 · Enregistrer les quatre stocks du Territoire
**En tant que** développeur, **je veux** que chaque Territoire garde un stock de Viande, de Végétaux, de Bois et de Pierre, **afin de** porter toute l'économie du jeu.

- **Statut** : Livrée le 2026-10-06. Les quatre Ressources, leur famille et leur ordre sont des données de référence (`donnees/ressources.yaml`). La base donne à chaque Territoire, à sa naissance, un Stock vide de chaque Ressource ; les Territoires déjà nés ont reçu les leurs avec la migration. Un Stock garde ses fractions au millionième, sans arrondi flottant, et la base le refuse négatif.
- **Débloquée par** : Étape 9
- **Critères d'acceptation** :
  - Chaque Territoire a quatre stocks : Viande, Végétaux, Bois, Pierre.
  - Viande et Végétaux sont rangés comme Nourriture, Bois et Pierre comme Matériaux.
  - Les stocks gardent les fractions : 0,4 Bois produit n'est jamais perdu.
  - Un stock ne peut jamais être négatif : la base le refuse.

### US-0202 · Recevoir des quantités de départ
**En tant que** nouveau joueur, **je veux** commencer avec un peu de chaque ressource, **afin de** ne pas partir de rien.

- **Statut** : Livrée le 2026-10-06. Les quantités sont le champ `au_depart` de chaque Ressource dans `donnees/ressources.yaml`, à régler en jouant quand la production et les constructions donneront une échelle ; les changer ne touche que les Territoires qui naissent ensuite. La base les verse dans les Stocks à la naissance ; les Territoires déjà nés les ont reçues avec la migration, qui ne passe qu'une fois.
- **Débloquée par** : US-0201
- **Critères d'acceptation** :
  - À la naissance, le Territoire reçoit 100 Viande, 100 Végétaux, 100 Bois et 100 Pierre (provisoire, décidé le 2026-10-06).
  - Ces quantités se règlent dans les données de référence, pas dans le code.
  - Les joueurs nés avant cette story reçoivent ces quantités, une seule fois.

### US-0203 · Voir ses quatre ressources dans la barre du haut
**En tant que** joueur, **je veux** voir mes quantités de Viande, de Végétaux, de Bois et de Pierre en haut de chaque page, **afin de** connaître d'un coup d'œil ce que je possède.

- **Statut** : Livrée le 2026-10-06. Chaque ressource s'écrit en texte, son nom en petites capitales au-dessus de la quantité, en attendant les icônes (US-0204). Sur ordinateur et sur un téléphone couché, elles sont au milieu de la barre, entre le logo et le nom du chef ; sur un téléphone en portrait, elles forment une bande de quatre colonnes juste sous la barre, comptée dans sa hauteur, sans débordement de 320 px de large à l'écran d'ordinateur. Elles apparaissent une fois le joueur entré dans son Foyer : ni sur le choix du nom, ni sur le récit d'arrivée. La barre met le Territoire à l'heure avant de lire ses Stocks, une seule fois par page avec la page elle-même. Les nombres sont déjà entiers, arrondis vers le bas, les milliers séparés par une espace insécable (l'espace fine du français ne se voit pas dans la police du jeu) : les deux premiers critères d'US-0206.
- **Débloquée par** : US-0202, Étape 7
- **Critères d'acceptation** :
  - La barre du haut montre les quatre ressources, toujours dans l'ordre Viande, Végétaux, Bois, Pierre.
  - Chaque quantité est juste : c'est celle enregistrée pour le Territoire, après rattrapage.
  - Les ressources restent visibles sur toutes les pages du jeu.

### US-0204 · Reconnaître chaque ressource à son icône
**En tant que** joueur, **je veux** une icône distincte pour chaque ressource, **afin de** les reconnaître sans lire.

- **Statut** : Livrée le 2026-10-06. Les icônes sont dans `public/illustrations/ressources`, nommées d'après l'identifiant de la Ressource ; l'icône précède la quantité, et sur un téléphone en portrait elle passe au-dessus, pour tenir six chiffres sur 320 px. Le nom paraît dans une bulle au survol (souris), au clavier et au toucher ; toucher ailleurs ou Échap la referme.
- **Débloquée par** : US-0203
- **Critères d'acceptation** :
  - Chaque ressource a une icône distincte, dans le style du prototype.
  - Décidé le 2026-10-06 : le Bois et la Pierre reprennent les icônes du prototype (le fagot de bûches et les blocs de pierre) ; la Viande (une cuisse rôtie sur l'os) et les Végétaux (carottes, pomme et baies) sont peints avec elles en références de style.
  - Le nom de la ressource apparaît au survol et au toucher, et sert de texte de remplacement.
  - Les icônes restent reconnaissables en petite taille sur mobile.

### US-0205 · Distinguer la Nourriture des Matériaux
**En tant que** joueur, **je veux** voir d'un coup d'œil ce qui se mange et ce qui sert à construire, **afin de** comprendre à quoi sert chaque ressource.

- **Statut** : Livrée le 2026-10-06. Les deux groupes sont séparés d'un fin trait vertical, sans titre écrit ; sur mobile, le trait passe entre la 2e et la 3e colonne de la bande. La bulle donne le nom de la ressource, et dessous, plus pâle, celui de son groupe. Le groupe vient de la famille rangée dans `donnees/ressources.yaml` ; pour un lecteur d'écran, chaque groupe est une liste nommée « Nourriture » ou « Matériaux ».
- **Débloquée par** : US-0203
- **Critères d'acceptation** :
  - Viande et Végétaux forment le groupe « Nourriture », Bois et Pierre le groupe « Matériaux », séparés visuellement.
  - Le nom du groupe apparaît au survol et au toucher, avec le nom de la ressource.
  - Le regroupement se retrouve sur mobile.

### US-0206 · Lire des quantités simples
**En tant que** joueur, **je veux** des nombres ronds et bien espacés, **afin de** lire mes quantités sans effort.

- **Statut** : Livrée le 2026-10-07. Les deux premiers critères l'étaient avec US-0203 ; l'espace des milliers est insécable, l'espace fine du français ne se voyant pas dans la police du jeu. Le seuil d'abréviation est `ABREGER_A_PARTIR_DE` dans `src/reglages.ts`.
- **Débloquée par** : US-0203
- **Critères d'acceptation** :
  - La barre affiche des nombres entiers, arrondis vers le bas : 1 999,8 s'affiche 1 999.
  - Les milliers sont séparés par une espace : 12 500.
  - À partir de 100 000 (provisoire), les grands nombres s'abrègent en milliers puis en millions, toujours arrondis vers le bas, avec une virgule et une espace insécable avant la lettre : une décimale sous 10, aucune au-delà (123 k, 1,2 M, 12 M ; décidé le 2026-10-07).

### US-0207 · Faire tenir la barre du haut sur mobile
**En tant que** joueur, **je veux** voir mes quatre ressources sur mon téléphone sans rien faire défiler, **afin de** jouer au pouce comme sur ordinateur.

- **Statut** : Livrée le 2026-10-07, sans changement d'affichage : la bande des ressources sous la barre (US-0203) et l'abréviation des grands nombres (US-0206) y suffisaient. Vérifié au pire à 320 px, avec et sans barre d'état, et à 375 px avec l'encoche : un nom de chef de 16 « M » et quatre quantités à 99 999 tiennent sans défilement ni chevauchement ; le nom est coupé, et se lit en entier en tête de son menu.
- **Débloquée par** : US-0204, US-0206
- **Critères d'acceptation** :
  - Sur un téléphone en portrait de 320 pixels de large (décidé le 2026-10-07), le logo, les quatre ressources et l'accès au nom du chef tiennent sans défilement de côté.
  - Les quantités restent lisibles et ne se chevauchent pas, même à six chiffres.
  - Si la place manque, c'est le nom du chef qui se replie dans un menu, jamais les ressources.

### US-0208 · Consulter et ajuster les stocks depuis la page de contrôle
**En tant que** développeur, **je veux** voir et modifier les stocks d'un joueur depuis la page de contrôle interne, **afin de** tester chaque situation sans attendre.

- **Statut** : Livrée le 2026-10-07 (autopilot). Un bloc « Stocks d'un joueur » sur `/controle` : la recherche ignore majuscules, accents et signes, comme la règle des noms en double ; les Stocks sont lus après la mise à l'heure du Territoire, sans les zéros inutiles (1 234,4). Chaque ressource a un champ et un bouton « Fixer » (virgule ou point, nombre positif) ; le Territoire est mis à l'heure avant le changement, et le journal de Vercel note « Contrôle : Bois de Ourse Brune (Territoire 7) fixé de 100.000000 à 5000.500000. ».
- **Débloquée par** : US-0201, Étape 3
- **Critères d'acceptation** :
  - La page de contrôle retrouve un joueur par son nom de chef et montre ses quatre stocks exacts, fractions comprises.
  - Un développeur peut fixer la valeur d'un stock ; chaque changement est noté dans le journal.
  - Cet outil existe en local et sur les prévisualisations ; en production, les stocks se consultent mais ne se modifient pas (décidé le 2026-10-07).

## Étape 11 · La production continue

### US-0209 · Régler la production de chaque Biome
**En tant que** développeur, **je veux** une table qui dit combien chaque Biome produit par heure de chaque ressource, **afin de** régler l'équilibre sans toucher au code.

- **Statut** : Livrée le 2026-10-07 (autopilot). La production se règle dans `donnees/biomes.yaml`, sous chaque Biome (`production: { viande, vegetaux, bois, pierre }`), chargée dans la table `production_biome` ; le chargement refuse un Biome à qui il manque une Ressource, une Ressource inconnue ou une valeur négative. La page de contrôle montre ce que chaque Biome produit par heure. Valeurs provisoires, 30 par heure en tout pour chaque Biome, réparties selon son milieu (prairie : 8 Viande, 14 Végétaux, 4 Bois, 4 Pierre).
- **Débloquée par** : US-0201, Étape 4
- **Critères d'acceptation** :
  - Pour chaque Biome, la table donne une production horaire de Viande, de Végétaux, de Bois et de Pierre (valeurs provisoires dans `donnees/biomes.yaml`, à régler en jouant).
  - Les Biomes d'eau ont aussi leur ligne, pour les Cases qui rejoindront un Territoire plus tard.
  - Le Foyer produit comme une Case ordinaire de son Biome (décidé le 2026-10-07) ; un bonus de la hutte du chef pourra venir avec les constructions.
  - Une valeur modifiée s'applique à tous les joueurs dès le calcul suivant, y compris sur le temps pas encore rattrapé (décidé le 2026-10-07) : la tâche planifiée rattrape chaque Territoire toutes les quelques minutes, l'écart reste donc minime.

### US-0210 · Faire produire le Foyer en continu
**En tant que** joueur, **je veux** que mon Foyer produise un peu de ressources en permanence, selon son Biome, **afin de** voir mon Territoire grandir même quand je ne fais rien.

- **Statut** : Livrée le 2026-10-07 (autopilot). La règle `evoluer` des Territoires (`src/temps/regles.ts`) ajoute aux Stocks la production de toutes les Cases portant le chef, Biome par Biome, au prorata exact du temps écoulé ; toute mise à l'heure (page, barre du haut, tâche planifiée) la déclenche. Vérifié en vrai : après 0,30 h, le Foyer en prairie avait produit 2,4 Viande, 4,2 Végétaux, 1,2 Bois et 1,2 Pierre, au millionième près.
- **Débloquée par** : US-0209, Étape 3
- **Critères d'acceptation** :
  - Le Foyer ajoute à chaque stock la production horaire de son Biome, au prorata du temps écoulé : trente minutes donnent la moitié d'une heure.
  - La production passe par le mécanisme unique du temps.
  - Le calcul additionne la production de toutes les Cases du Territoire, qui n'en compte encore qu'une.
  - Une ressource que le Biome ne produit pas reste inchangée.

### US-0211 · Retrouver ses stocks montés après une absence
**En tant que** joueur, **je veux** retrouver en revenant tout ce que mon Foyer a produit pendant mon absence, **afin de** jouer par courtes sessions sans rien perdre.

- **Statut** : Livrée le 2026-10-07 (autopilot), sans code nouveau : le mécanisme unique du temps d'US-0210 suffisait. Des tests sur base le gardent : six heures d'absence donnent exactement six fois la production ; le résultat est identique page fermée, avec la tâche planifiée passée entre-temps, ou page ouverte plusieurs fois ; trois mises à l'heure simultanées ne comptent la production qu'une fois. Vérifié en vrai avec deux onglets ouverts au même moment : mêmes quantités. L'exactitude sur des durées quelconques (arrondi au millionième à chaque pas) reste l'affaire d'US-0219.
- **Débloquée par** : US-0210
- **Critères d'acceptation** :
  - Après une absence de N heures, chaque stock a monté exactement de N fois sa production horaire.
  - Le résultat est le même que la page soit restée ouverte, fermée, ou que la tâche planifiée soit passée entre-temps.
  - Deux onglets ou deux appareils ouverts au même moment affichent les mêmes quantités.

### US-0212 · Voir la production horaire de chaque ressource
**En tant que** joueur, **je veux** voir combien je gagne par heure pour chaque ressource, **afin de** prévoir quand j'aurai de quoi agir.

- **Statut** : Livrée le 2026-10-07 (autopilot). « +8/h » s'affiche en petit à droite de chaque quantité, arrondi vers le bas au dixième, à partir de 1 100 px de large (en dessous, la place manque : la bulle d'US-0214 et US-0215 la donnera) ; une production nulle est plus pâle. L'affichage et le calcul lisent la même requête (`PRODUCTION_DU_TERRITOIRE`). Un lecteur d'écran entend « Viande 104, 8 par heure ».
- **Débloquée par** : US-0203, US-0210
- **Critères d'acceptation** :
  - Sur ordinateur, la production horaire s'affiche près de chaque quantité : « +12/h ».
  - Une production nulle s'affiche « +0/h », en plus discret.
  - La production affichée est exactement celle utilisée par le calcul.

### US-0213 · Voir les stocks monter sans recharger la page
**En tant que** joueur, **je veux** voir mes quantités monter pendant que je joue, **afin de** sentir mon Territoire vivre sous mes yeux.

- **Statut** : Livrée le 2026-10-07 (autopilot). Chaque seconde, la barre ajoute la production écoulée depuis l'arrivée des quantités, mesurée sur l'horloge du navigateur (aucun écart possible avec celle du serveur) et accélérée comme le temps du jeu. Le recalage recharge les quantités du serveur ; une action recharge déjà la page. Vérifié en vrai : 106,99 Végétaux passent à 107 en cinq secondes sans recharger, et revenir sur l'onglet recale aussitôt.
- **Débloquée par** : US-0212
- **Critères d'acceptation** :
  - Page ouverte, les quantités de la barre du haut montent d'elles-mêmes au rythme de la production.
  - L'affichage se recale sur les quantités exactes du jeu toutes les 5 minutes (provisoire, `RECALER_LA_BARRE_MINUTES`) et après chaque action.
  - Revenir sur un onglet resté en arrière-plan affiche aussitôt les bonnes quantités.

### US-0214 · Détailler une ressource au survol
**En tant que** joueur, **je veux** qu'un petit encadré m'explique une ressource quand je passe le pointeur dessus, **afin de** comprendre d'où vient ma production.

- **Statut** : Livrée le 2026-10-07 (autopilot). La bulle de chaque ressource donne son nom, son groupe, sa quantité au centième (arrondie vers le bas, et qui monte comme la barre) et chaque source de production : « Foyer · prairie : +8/h », puis, plus tard, « 2 Cases de forêt : +28/h ». Elle s'ouvre au survol, au clavier (Tab) et au toucher ; collée au bord pour la première et la dernière ressource, elle ne sort pas de l'écran (vérifié à 320 px et 1 440 px).
- **Débloquée par** : US-0212
- **Critères d'acceptation** :
  - Au survol d'une ressource, un encadré montre son nom, sa quantité exacte, sa production horaire et sa source : « Foyer · forêt : +12/h ».
  - L'encadré disparaît quand le pointeur s'éloigne.
  - Il ne sort jamais de l'écran, même pour la ressource la plus à droite.
  - Il s'ouvre aussi au clavier.

### US-0215 · Détailler une ressource au toucher
**En tant que** joueur, **je veux** toucher une ressource sur mon téléphone pour en voir le détail, **afin de** comprendre ma production sans survol possible.

- **Statut** : Livrée le 2026-10-07 (autopilot), sans code nouveau : la bulle d'US-0204 et son détail d'US-0214 répondent déjà au toucher. Vérifié en vrai à 320 px : toucher la Pierre ouvre son détail dans l'écran (de 182 à 316 px), toucher la Viande le remplace (de 4 à 138 px), toucher ailleurs le ferme ; sous 1 100 px de large, la production horaire n'apparaît que dans ce détail.
- **Débloquée par** : US-0207, US-0214
- **Critères d'acceptation** :
  - Sur mobile, toucher une ressource ouvre le même détail qu'au survol.
  - Toucher ailleurs le ferme ; toucher une autre ressource le remplace.
  - Le détail tient dans la largeur de l'écran et se lit sans zoom.
  - Si la barre du haut manque de place, la production horaire ne s'affiche que dans ce détail.

### US-0216 · Résumer ce que le Foyer a produit pendant l'absence
**En tant que** joueur, **je veux** un court récapitulatif de ce que mon Foyer a produit depuis ma dernière visite, **afin de** mesurer ce que j'ai gagné en mon absence.

- **Statut** : Livrée le 2026-10-07 (autopilot). La production est aussi comptée à part depuis la dernière visite (`stock.produit_depuis_visite`). Le message se pose en haut de l'illustration du Foyer. La présence (`territoire.vu_le`) est notée par le navigateur une fois la page affichée, puis à chaque recalage de la barre : une page ouverte compte comme une présence, et un calcul de page en double ne perd pas le message. Vérifié en vrai : après dix heures simulées, « Pendant votre absence : +80 Viande, +140 Végétaux, +40 Bois » (la Pierre, à 0,4, n'y est pas), puis plus rien après un toucher ou au rechargement.
- **Débloquée par** : US-0211
- **Critères d'acceptation** :
  - Après une absence d'au moins 2 heures (provisoire, `RECAP_ABSENCE_HEURES`), un message « Pendant votre absence : +40 Viande, +25 Végétaux… » s'affiche à l'arrivée.
  - Les ressources qui n'ont pas bougé n'y figurent pas.
  - Le message ne s'affiche qu'une fois par retour et se ferme d'un toucher.

### US-0217 · Voir la production sur l'écran du Foyer
**En tant que** joueur, **je veux** un bloc « Production » sur l'écran de mon Foyer, **afin de** relier ce que je gagne au Biome de ma Case.

- **Statut** : Livrée le 2026-10-07 (autopilot). Le bloc « Production · prairie » se tient à droite de l'illustration sur ordinateur (280 px), dessous sur mobile, sans défilement de 390 à 1 440 px de large : l'icône, le nom et « +8/h » de chaque Ressource, ou « Ce Biome ne donne pas de Pierre. » pour une Ressource à zéro. Les chiffres viennent de la même requête que le calcul. L'écran du Foyer garde US-0163 : aucun lien ni bouton qui mène à une fonction absente.
- **Débloquée par** : US-0212, Étape 9
- **Critères d'acceptation** :
  - L'écran du Foyer gagne un bloc « Production » avec les quatre productions horaires et le Biome qui les explique.
  - Une ressource que le Biome ne donne pas est indiquée comme telle : « Ce Biome ne donne pas de Pierre. »
  - Sur mobile, le bloc passe sous l'illustration du Foyer.

### US-0218 · Tester la production en vitesse accélérée
**En tant que** développeur, **je veux** vérifier la production avec le temps accéléré, **afin de** valider des heures de production en quelques minutes.

- **Statut** : Livrée le 2026-10-07 (autopilot), avec US-0038 (le saut dans le temps, reporté jusque-là). Tests sur base : à ×100, 36 secondes réelles ajoutent une heure de production ; un saut d'un jour en ajoute exactement 24. La production affichée (« +4/h ») reste en heures de jeu, et la barre monte à la vitesse du jeu (US-0213). Vérifié en vrai : « +1 jour » fait passer l'heure du jeu du 7 au 8 octobre, et les Stocks d'Ourse Brune gagnent 192 Viande, 336 Végétaux, 96 Bois et 96 Pierre.
- **Débloquée par** : US-0210, Étape 3
- **Critères d'acceptation** :
  - À ×100, une production de +12 Bois/h ajoute 12 Bois toutes les 36 secondes réelles.
  - La production horaire affichée reste exprimée en heures de jeu.
  - Un saut d'un jour depuis la page de contrôle ajoute exactement 24 fois la production horaire.

### US-0219 · Garder des comptes exacts malgré les fractions
**En tant que** développeur, **je veux** calculer les stocks sans erreur d'arrondi qui s'accumule, **afin de** garantir qu'aucun joueur ne gagne ni ne perd rien au fil des rattrapages.

- **Statut** : Livrée le 2026-10-07 (autopilot). Jusque-là, chaque rattrapage arrondissait au millionième : mille rattrapages d'une minute laissaient filer 0,0003 Viande. Désormais la production vaut par_heure × microsecondes, en décimaux exacts ; le Stock en reçoit le nombre entier de millionièmes (division entière) et garde le reste exact (`stock.reste`) pour le calcul suivant. Un test sur base rejoue mille fois le calcul même du jeu, minute par minute, et retrouve au millionième près, reste compris, le résultat d'un seul calcul de mille minutes.
- **Débloquée par** : US-0210
- **Critères d'acceptation** :
  - Les quantités sont calculées en nombres décimaux exacts, jamais en nombres à virgule flottante.
  - Mille rattrapages d'une minute donnent exactement le même total qu'un rattrapage de mille minutes.
  - L'arrondi n'intervient qu'à l'affichage.

## Étape 12 · Les stocks ont une limite

### US-0220 · Donner une limite à chaque stock
**En tant que** développeur, **je veux** une limite propre à chaque stock de chaque Territoire, **afin de** pouvoir la relever plus tard avec les constructions de stockage.

- **Statut** : Livrée le 2026-10-07 (autopilot). Chaque Stock porte sa limite (`stock.limite`), reçue à la naissance depuis `limite_au_depart` de sa Ressource dans `donnees/ressources.yaml` ; les Stocks déjà là l'ont reçue avec la migration. La base ne refuse pas une quantité au-dessus de la limite : ce cas reste à trancher (US-0230).
- **Débloquée par** : US-0201
- **Critères d'acceptation** :
  - Chaque Territoire a une limite de Viande, de Végétaux, de Bois et de Pierre, de 1 000 au départ (provisoire, décidé le 2026-10-07).
  - Les limites de départ se règlent dans les données de référence.
  - La limite est enregistrée par joueur, pour que le grenier, le fumoir, le bûcher et la taillerie puissent la relever (étape 28).
  - Un test vérifie que les quantités de départ sont sous les limites de départ.

### US-0221 · Arrêter la production à la limite
**En tant que** joueur, **je veux** qu'un stock arrivé à sa limite cesse de monter, **afin de** comprendre qu'il est temps de dépenser cette ressource.

- **Statut** : Livrée le 2026-10-07 (autopilot). Le calcul de production plafonne chaque Stock à sa limite et remet son reste exact à zéro : le surplus est perdu. Un Stock déjà à sa limite ne gagne plus rien, les autres continuent. Vérifié en vrai : 999,5 Bois s'arrêtent à 1 000 pile, et y restent après un saut d'un jour, pendant que la Viande gagne ses 192.
- **Débloquée par** : US-0210, US-0220
- **Critères d'acceptation** :
  - Un stock qui atteint sa limite s'arrête exactement à la limite, jamais au-dessus.
  - Les autres stocks continuent de monter normalement.
  - La production qui dépasse est perdue : elle n'est gardée nulle part.

### US-0222 · Respecter la limite pendant le rattrapage
**En tant que** joueur, **je veux** que la limite joue aussi pendant mon absence, **afin de** trouver des stocks justes en revenant.

- **Statut** : Livrée le 2026-10-07 (autopilot), sans code nouveau : le plafond d'US-0221 est dans le calcul unique du temps. Tests sur base : un Bois à dix de sa limite s'y arrête au milieu de dix heures d'absence et ne gagne plus rien ensuite (dix comptés depuis la visite, reste à zéro), la Viande prend ses dix heures ; page fermée, page ouverte par petits pas ou tâche planifiée donnent exactement les mêmes comptes, reste compris. Vérifié en vrai avec US-0221 (saut d'un jour sur un Bois plein).
- **Débloquée par** : US-0221
- **Critères d'acceptation** :
  - Après une longue absence, un stock s'arrête à sa limite, même si la production de l'absence l'aurait dépassée.
  - Un stock qui atteint sa limite au milieu d'une absence ne gagne plus rien pour le reste de l'absence.
  - Le résultat est le même page ouverte, page fermée ou après la tâche planifiée.

### US-0223 · Afficher la limite de chaque stock
**En tant que** joueur, **je veux** voir la limite de chaque stock à côté de sa quantité, **afin de** mesurer la place qu'il me reste.

- **Statut** : Livrée le 2026-10-07 (autopilot). Le détail montre « 640,27 / 1 000 » (la quantité au centième, la limite en entier) et une jauge de remplissage dessous ; la limite vient du Stock même (`stock.limite`), celle du calcul. Au passage, la barre qui monte toute seule (US-0213) s'arrête désormais elle aussi à la limite entre deux recalages.
- **Débloquée par** : US-0214, US-0220
- **Critères d'acceptation** :
  - Le détail au survol et au toucher montre la quantité et la limite : « 1 240 / 2 000 ».
  - Une jauge de remplissage accompagne ces chiffres dans le détail.
  - La limite affichée est celle utilisée par le calcul.

### US-0224 · Signaler un stock plein dans la barre du haut
**En tant que** joueur, **je veux** voir tout de suite qu'un stock est plein, **afin de** ne pas perdre de production sans m'en rendre compte.

- **Débloquée par** : US-0203, US-0221
- **Critères d'acceptation** :
  - Un stock plein change d'apparence dans la barre du haut, avec une couleur d'alerte de la palette et la mention « plein ».
  - Le signal se voit sans survol, donc aussi sur mobile.
  - Il ne repose jamais sur la couleur seule.
  - Il disparaît dès que le stock repasse sous sa limite.

### US-0225 · Expliquer que la production est perdue
**En tant que** joueur, **je veux** un message qui dit clairement que la production d'un stock plein est perdue, **afin de** comprendre ce que me coûte l'attente.

- **Débloquée par** : US-0223, US-0224
- **Critères d'acceptation** :
  - Le détail d'un stock plein dit : « Stock plein : la production de Bois est perdue. »
  - La production horaire de ce stock s'affiche comme arrêtée (« stock plein ») au lieu de « +12/h ».
  - Le détail rappelle la production qui reprendra dès qu'il y aura de la place.

### US-0226 · Afficher le temps avant qu'un stock soit plein
**En tant que** joueur, **je veux** voir dans combien de temps chaque stock sera plein, **afin de** revenir à temps pour dépenser.

- **Débloquée par** : US-0223
- **Critères d'acceptation** :
  - Le détail d'une ressource indique le temps restant : « plein dans 3 h 20 ».
  - Au-delà de 24 heures, le temps s'affiche en jours et en heures : « plein dans 2 j 5 h ».
  - Un stock qui ne produit rien n'affiche pas de temps avant d'être plein.

### US-0227 · Signaler un stock presque plein
**En tant que** joueur, **je veux** être prévenu avant qu'un stock soit plein, **afin de** dépenser avant de perdre de la production.

- **Débloquée par** : US-0224
- **Critères d'acceptation** :
  - Au-delà de (chiffre à régler) % de sa limite, la quantité prend une couleur d'avertissement de la palette.
  - Ce signal se distingue nettement de celui du stock plein.
  - Il se voit sans survol, donc aussi sur mobile.

### US-0228 · Signaler les stocks pleins dans le récapitulatif d'absence
**En tant que** joueur, **je veux** apprendre au retour qu'un stock s'est rempli pendant mon absence, **afin de** mieux prévoir ma prochaine visite.

- **Débloquée par** : US-0216, US-0222
- **Critères d'acceptation** :
  - Si un stock a atteint sa limite pendant l'absence, le récapitulatif le dit : « Bois : stock plein depuis 4 h ».
  - La quantité gagnée affichée s'arrête à ce qui est vraiment entré dans le stock.
  - Un stock déjà plein au départ et resté plein est aussi signalé.

### US-0229 · Reprendre la production dès qu'il y a de la place
**En tant que** joueur, **je veux** que la production reprenne toute seule quand un stock redescend sous sa limite, **afin de** ne jamais avoir à relancer quoi que ce soit.

- **Débloquée par** : US-0208, US-0221
- **Critères d'acceptation** :
  - Dès qu'un stock repasse sous sa limite, sa production reprend sans action du joueur.
  - Le stock remonte jusqu'à la limite, sans la dépasser.
  - La reprise se vérifie dès maintenant en baissant un stock depuis la page de contrôle.

### US-0230 · Traiter un stock au-dessus de sa limite
**En tant que** joueur, **je veux** un comportement clair si un stock dépasse sa limite, **afin de** ne pas voir mes ressources disparaître sans explication.

- **Débloquée par** : US-0221
- **Critères d'acceptation** :
  - Un stock au-dessus de sa limite (limite baissée, réglage de test) ne produit plus rien tant qu'il n'est pas repassé sous la limite.
  - Le surplus est gardé ou retiré (à décider).
  - Tant que le surplus existe, l'affichage montre la vraie quantité, avec le signal « plein ».

### US-0231 · Voir les stocks pleins sur mobile
**En tant que** joueur, **je veux** repérer mes stocks pleins sur mon téléphone aussi vite que sur ordinateur, **afin de** réagir pendant une session de quelques minutes.

- **Débloquée par** : US-0215, US-0224
- **Critères d'acceptation** :
  - Sur mobile, chaque stock plein garde son signal dans la barre du haut, sans ouvrir de détail.
  - Plusieurs stocks pleins en même temps ne font pas déborder la barre.
  - Le détail au toucher d'un stock plein montre la limite et le message de production perdue.

### US-0232 · Vérifier la limite en vitesse accélérée
**En tant que** développeur, **je veux** voir un stock atteindre sa limite en temps accéléré, **afin de** valider l'étape sans attendre des heures.

- **Débloquée par** : US-0218, US-0222
- **Critères d'acceptation** :
  - À ×100, un stock proche de sa limite l'atteint à l'instant prévu et s'y arrête.
  - Page fermée pendant tout ce temps, la réouverture montre le stock exactement à sa limite, avec le signal « plein ».
  - Un saut d'une semaine depuis la page de contrôle laisse chaque stock exactement à sa limite.
