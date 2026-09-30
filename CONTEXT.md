# Bestia

Un jeu de stratégie persistant où l'on est d'abord un dresseur : on découvre des bêtes sauvages dans un monde ouvert, on les apprivoise, on les fait se reproduire jusqu'à lever une armée, et l'on étend son territoire face à un monde sauvage menaçant.

## Language

**Monde**:
Une planète sauvage partagée par ses joueurs, qui ne s'arrête ni ne se réinitialise jamais ; quand un Monde est plein, on en ouvre un autre.
_Avoid_: Univers, serveur, galaxie

**Territoire**:
L'ensemble d'un seul tenant des Cases qu'un joueur possède ; il grandit de proche en proche.
_Avoid_: Planète, base, colonie

**Case**:
Un hexagone du Monde, doté d'un biome, qui rapporte un peu et en continu à celui qui la possède.
_Avoid_: Tuile, parcelle, position, coordonnée

**Biome**:
Le milieu naturel d'une Case, parmi : prairie, forêt, jungle, savane, désert, montagne, toundra, banquise, eau (côte, lac, rivière, mer).
_Avoid_: Terrain, climat

**Couronne**:
La bordure extérieure du Monde, où les joueurs s'installent en arrivant.

**Cœur sauvage**:
Le centre du Monde, inhabité, où vivent les Espèces les plus rares.
_Avoid_: Centre, zone dangereuse

**Anneau**:
Une bande de Cases à même distance du Cœur sauvage, de la Couronne (la plus extérieure) au Cœur sauvage (la plus intérieure) ; plus un Anneau est intérieur, plus les Raretés élevées y apparaissent souvent.
_Avoid_: Zone, cercle, couche

**Densité**:
L'abondance de faune d'une Case, cachée, qui change chaque jour.

**Avant-poste**:
La construction qui permet de revendiquer une Case voisine de son Territoire.

**Foyer**:
Le cœur d'un Territoire, autour de la hutte du chef, qu'aucun autre joueur ne peut prendre.
_Avoid_: Capitale, base

**Marche**:
La partie d'un Territoire trop éloignée du Foyer, dont les Cases peuvent être prises par un autre joueur.
_Avoid_: Zone disputée, frontière, périphérie

**Bête**:
Un animal du Monde, qu'il soit encore sauvage ou déjà apprivoisé ; toutes les Bêtes d'une même Espèce sont identiques.
_Avoid_: Unité, vaisseau, créature, monstre, individu

**Bête sauvage**:
Une Bête qui n'appartient à personne, que le Monde fait apparaître de temps en temps sur une Case pour une durée limitée ; toutes les Raretés sauf mythique peuvent apparaître partout et les communes restent partout les plus nombreuses, mais les plus rares sont plus fréquentes près du Cœur sauvage.

**Espèce**:
Une sorte d'animal, avec des caractéristiques calquées sur l'animal réel (un mammouth vaut une foule de souris).
_Avoid_: Race, type, classe, carte

**Rareté**:
Le rang d'une Espèce, parmi six (commune, peu commune, rare, épique, légendaire, mythique), qui dit à la fois sa puissance et la difficulté à la trouver : plus une Espèce est forte, plus elle est rare.
_Avoid_: Niveau, palier, qualité

**Espèce légendaire**:
Une Espèce qui a réellement existé mais a disparu, et qui était redoutable (tyrannosaure, mammouth).
_Avoid_: Boss, fossile

**Espèce mythique**:
Une Espèce qui n'existe que dans les légendes (phénix, dragon), au sommet de la Rareté ; elle ne s'élève pas, et un joueur n'en possède au plus qu'une Bête.
_Avoid_: Monstre, divinité

**Habitat**:
Le milieu dont une Espèce a besoin pour être élevée et logée : une Case de son biome, ou une construction qui reproduit ce biome ; chaque Habitat offre un nombre de Places.
_Avoid_: Enclos, zone

**Place**:
Ce qu'une Bête occupe dans un Habitat, selon sa taille ; un éléphant prend plus de Places qu'un lapin.
_Avoid_: Slot, capacité, logement

**Entretien**:
La Nourriture qu'une Bête consomme chaque heure, en plus de ce que coûte son Élevage ; avec les Places, c'est ce qui limite la taille d'une armée.
_Avoid_: Upkeep, ration, consommation

**Habitant**:
Un humain du Territoire ; il ne combat jamais, et il exerce un Métier.
_Avoid_: Villageois, ouvrier, unité, population

**Métier**:
L'occupation d'un Habitant : explorateur, chasseur, cueilleur, bûcheron, mineur, chercheur, bâtisseur, ou un Poste.
_Avoid_: Job, classe, profession

**Voyageur**:
Un humain de passage qui attend aux portes du Territoire ; accueilli, il devient un Habitant, sinon il repart.
_Avoid_: Recrue, immigrant

**Poste**:
L'emploi d'un Habitant (ou d'une Bête à Rôle) dans une construction, qui ne fonctionne qu'avec son personnel.
_Avoid_: Affectation, slot

**Récolte**:
Une sortie d'Habitants vers une Case pour en rapporter des Matériaux ou de la Nourriture ; elle rapporte bien plus que la production continue des Cases.
_Avoid_: Mission, collecte, farm

**Expédition**:
Une sortie d'Explorateurs, accompagnés ou non de Bêtes, vers une Case lointaine, pour y trouver des Bêtes sauvages ; seules les Bêtes y risquent leur vie, les Explorateurs fuient.
_Avoid_: Mission, raid

**Récit**:
Le compte rendu daté d'un événement du Territoire (retour d'une Récolte ou d'une Expédition, Attaque, Incursion, Famine), que le joueur lit après coup.
_Avoid_: Rapport, journal, message

**Rencontre**:
Le moment où une Bête sauvage apparaît sur une Case où se trouve une Expédition ; seules les Expéditions présentes la voient. Si elle est à leur portée, elle suit l'une d'elles, avec des chances proportionnelles à la force de chaque escorte ; sinon elle reste sur la Case jusqu'à la fin de sa durée, et peut attaquer.

**Attaque**:
Une sortie de Bêtes vers le Territoire d'un autre joueur pour affronter ses Bêtes et piller sa Nourriture et ses Matériaux ; on ne peut jamais y voler de Bêtes.
_Avoid_: Raid, pillage, assaut

**Incursion**:
L'attaque d'un Territoire par des Bêtes sauvages, annoncée à l'avance et plus fréquente près du Cœur sauvage.
_Avoid_: Vague, invasion, attaque sauvage

**Blessé**:
Une Bête mise hors de combat qui guérit avec le temps, plus vite si l'on s'en occupe ; les autres pertes sont des morts.

**Repos**:
Un mode que le joueur active pour une durée minimale, pendant lequel son Territoire ne produit plus, ne consomme plus et ne peut plus être attaqué.
_Avoid_: Vacances, pause

**Bouclier**:
La protection d'un nouveau chef : pendant ses débuts, son Territoire ne peut pas être attaqué par les autres joueurs ; contrairement au Repos, tout continue d'y tourner.
_Avoid_: Immunité, protection

**Famine**:
Le manque de Nourriture pour payer l'Entretien : les Bêtes affamées retournent à l'état sauvage et les Habitants s'en vont, après un avertissement.
_Avoid_: Mort de faim, pénurie

**Apprivoisement**:
Le fait qu'une Bête sauvage, une seule à la fois, rejoigne un joueur à l'issue d'une Rencontre ; son sexe est dû au hasard.
_Avoid_: Capture, recrutement, dressage

**Couple**:
Un mâle et une femelle apprivoisés de la même Espèce ; une fois réuni, il part à l'abri dans la Réserve et ne combat plus.

**Réserve**:
Le lieu protégé du Territoire où vivent les Couples.

**Élevage**:
Le fait de produire, à la demande du joueur, des Bêtes d'une Espèce dont il a réuni un Couple ; il reste acquis pour toujours.
_Avoid_: Reproduction, dressage, entraînement

**Nourriture**:
La Viande et les Végétaux, que mangent les Bêtes (selon leur régime) et les Habitants.
_Avoid_: Vivres, ration

**Matériaux**:
Le Bois et la Pierre, qui servent à construire.
_Avoid_: Ressources de construction

**Recherche**:
Ce qu'un joueur a appris, en quatre branches (Bâtir, Le vivant, Explorer, Défendre), qui débloquent des constructions, les Rôles et la portée des Expéditions, mais jamais la force des Bêtes.
_Avoid_: Technologie, science, savoir

**Migration**:
Un événement du Monde où une Espèce rare traverse une région pendant quelques jours.

**Saison du Monde**:
Une période qui change la Densité et les récoltes selon le Biome (un hiver rend la toundra giboyeuse et les Végétaux rares).
_Avoid_: Saison de jeu, reset

**Apparition**:
Un événement du Monde où une Bête d'Espèce mythique surgit dans le Cœur sauvage pour un temps ; le premier joueur qui la vainc l'apprivoise à coup sûr, les suivants avec des chances décroissantes.
_Avoid_: Boss, raid

**Couple de départ**:
Le Couple d'une Espèce très faible, choisi au début du jeu parmi trois (souris, poule, pigeon), qui permet d'élever ses premières Bêtes.
_Avoid_: Starter, kit de départ

**Épreuve**:
Une étape guidée du début de jeu, qui débloque le jeu petit à petit et rapporte une récompense.
_Avoid_: Quête, mission, tutoriel

**Bestiaire**:
Le catalogue personnel d'un joueur, où s'inscrit chaque Espèce qu'il a croisée, apprivoisée ou dont il a réuni le Couple.
_Avoid_: Pokédex, collection, encyclopédie

**Rôle**:
Un usage particulier qu'ont certaines Espèces en plus du combat : Bâtisseur, Éclaireur, Porteur ou Nourricier.

**Bâtisseur**:
Une Espèce sans laquelle certaines constructions sont impossibles (le castor pour le barrage).

**Clan**:
Un groupe de joueurs qui coopèrent face au monde sauvage.
_Avoid_: Alliance, guilde
