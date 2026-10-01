# Jalon 0 · Les fondations

Rien de visible pour le joueur, mais tout le reste en dépend : le jeu est en ligne, il a déjà l'allure du prototype, son temps avance tout seul et ses premières données sont en base. Étapes couvertes : 1 à 4 de l'ordre d'attaque.

## Étape 1 · Le projet en ligne

### US-0001 · Créer le projet Next.js
**En tant que** développeur, **je veux** un projet Next.js qui démarre sur mon poste et affiche une page « Bestia », **afin de** poser le socle sur lequel tout le jeu sera construit.

- **Débloquée par** : rien
- **Critères d'acceptation** :
  - Une commande installe les dépendances, une autre lance le projet en local.
  - L'adresse locale affiche une page qui porte le mot « Bestia ».
  - Une commande de vérification (lint et compilation) passe sans erreur sur le projet neuf.

### US-0002 · Relier le projet à une base Postgres
**En tant que** développeur, **je veux** que le projet lise et écrive dans une base Postgres, **afin de** garder l'état du Monde durablement, même après un redémarrage.

- **Débloquée par** : US-0001
- **Critères d'acceptation** :
  - Une requête d'essai écrit une ligne dans la base puis la relit à l'identique.
  - Si la base ne répond pas, le projet affiche une erreur claire au lieu d'échouer en silence.
  - La base est hébergée chez Neon, et le code y accède avec Drizzle.

### US-0003 · Tenir les secrets hors du code
**En tant que** développeur, **je veux** que l'adresse de la base et toutes les clés soient lues dans des variables d'environnement, **afin de** ne jamais exposer un secret dans le dépôt.

- **Débloquée par** : US-0002
- **Critères d'acceptation** :
  - Un fichier d'exemple liste chaque variable nécessaire, sans aucune valeur secrète.
  - Au démarrage, une variable obligatoire manquante produit un message qui la nomme.
  - Aucun secret n'apparaît dans le code ni dans l'historique du dépôt.

### US-0004 · Faire évoluer la base par migrations
**En tant que** développeur, **je veux** décrire chaque changement de structure de la base dans une migration versionnée, **afin de** retrouver la même base partout, de mon poste à la production.

- **Débloquée par** : US-0002
- **Critères d'acceptation** :
  - Une base vide atteint la structure à jour en appliquant les migrations dans l'ordre.
  - Relancer les migrations sur une base déjà à jour ne change rien.
  - Aucune migration ne vide les tables du Monde : un Monde ne se réinitialise jamais.

### US-0005 · Mettre le projet en ligne sur Vercel
**En tant que** développeur, **je veux** héberger le projet sur Vercel, relié à une base de production, **afin de** donner au jeu une adresse publique.

- **Débloquée par** : US-0003, US-0004
- **Critères d'acceptation** :
  - L'adresse publique répond en HTTPS et affiche la page « Bestia ».
  - La version en ligne utilise la base de production, distincte de la base locale.
  - Les migrations en attente s'appliquent à la mise en ligne, avant que la nouvelle version réponde.
  - Le jeu répond sur bestia-2.vercel.app en attendant son nom de domaine (à décider).

### US-0006 · Redéployer à chaque envoi sur main
**En tant que** développeur, **je veux** que chaque envoi sur la branche main remette le jeu en ligne tout seul, **afin de** livrer chaque étape sans manipulation.

- **Débloquée par** : US-0005
- **Critères d'acceptation** :
  - Un envoi sur main déclenche un déploiement sans aucune action manuelle.
  - Un déploiement qui échoue laisse la version précédente en ligne.
  - Chaque déploiement indique de quel envoi il vient.

### US-0007 · Prévisualiser une branche avant sa mise en ligne
**En tant que** développeur, **je veux** une adresse de prévisualisation pour chaque branche, **afin de** vérifier une étape avant qu'elle n'arrive sur main.

- **Débloquée par** : US-0006
- **Critères d'acceptation** :
  - Chaque branche envoyée obtient sa propre adresse de prévisualisation.
  - Une prévisualisation n'écrit jamais dans la base de production.
  - Chaque branche a sa propre base : une branche Neon créée par l'intégration Vercel à la prévisualisation.

### US-0008 · Vérifier automatiquement chaque envoi
**En tant que** développeur, **je veux** que la vérification du code et les tests automatiques tournent à chaque envoi, **afin de** ne jamais mettre en ligne une étape cassée.

- **Débloquée par** : US-0006
- **Critères d'acceptation** :
  - Chaque envoi lance le lint, la compilation et les tests automatiques.
  - Un échec empêche la mise en ligne sur main.
  - Le résultat de la vérification s'affiche à côté de l'envoi.

### US-0009 · Consulter une page de santé
**En tant que** développeur, **je veux** une adresse qui dit si le jeu et sa base répondent, **afin de** confirmer d'un coup d'œil qu'une mise en ligne s'est bien passée.

- **Débloquée par** : US-0005
- **Critères d'acceptation** :
  - L'adresse de santé répond « ok » quand le jeu et la base répondent.
  - Si la base ne répond pas, elle le dit, avec un code d'erreur.
  - Elle indique la version actuellement en ligne.
  - Elle n'expose aucun secret (adresse de la base, clés, variables).

## Étape 2 · L'habillage Bento

### US-0010 · Reprendre la palette du prototype
**En tant que** développeur, **je veux** les couleurs du prototype Bestia, Encre comprise, rangées sous des noms uniques, **afin de** puiser dans la même palette sur tous les écrans.

- **Débloquée par** : US-0001
- **Critères d'acceptation** :
  - Chaque couleur du prototype existe sous un nom unique, réutilisable partout.
  - Aucune couleur n'est écrite en dur dans un écran.
  - Changer une couleur à un seul endroit la change sur toutes les pages.

### US-0011 · Reprendre les polices du prototype
**En tant que** développeur, **je veux** les polices du prototype pour les titres et les textes, **afin de** retrouver le ton du prototype dès la première page.

- **Débloquée par** : US-0001
- **Critères d'acceptation** :
  - Titres et textes utilisent les polices du prototype.
  - Le chargement des polices ne fait pas sauter la mise en page.
  - Les caractères du jeu s'affichent correctement : é, è, ê, à, ç, œ (Cœur sauvage), É (Élevage, Épreuve).

### US-0012 · Créer le bloc arrondi Bento
**En tant que** développeur, **je veux** un bloc arrondi réutilisable, avec les coins, l'ombre et les marges du prototype, **afin de** composer chaque écran avec la même brique.

- **Débloquée par** : US-0010
- **Critères d'acceptation** :
  - Le bloc accepte un titre facultatif et n'importe quel contenu.
  - Ses arrondis, son ombre et ses marges sont ceux du prototype.
  - Il garde son allure avec un texte court, un texte long ou une illustration.

### US-0013 · Ranger les blocs en grille Bento
**En tant que** développeur, **je veux** une grille qui range les blocs comme dans le prototype, **afin de** composer des pages lisibles sur ordinateur comme sur mobile.

- **Débloquée par** : US-0012
- **Critères d'acceptation** :
  - Sur ordinateur, les blocs se rangent sur plusieurs colonnes, et un bloc peut en occuper deux.
  - Sur mobile, les blocs passent sur une seule colonne, dans l'ordre de lecture.
  - Aucun défilement de côté n'apparaît, jusqu'à une largeur d'écran de 320 pixels.

### US-0014 · Afficher la barre du haut Encre
**En tant que** développeur, **je veux** la barre du haut couleur Encre du prototype sur chaque page, **afin de** préparer l'endroit où le joueur retrouvera son nom et ses ressources.

- **Débloquée par** : US-0010, US-0011
- **Critères d'acceptation** :
  - Une barre couleur Encre occupe le haut de chaque page.
  - Elle se comporte au défilement comme celle du prototype.
  - Elle reste basse sur mobile, pour laisser la place au jeu.
  - Elle n'affiche encore aucune information de joueur.

### US-0015 · Placer le logo du loup dans la barre du haut
**En tant que** développeur, **je veux** le logo du loup du prototype dans la barre du haut, **afin de** signer chaque page aux couleurs de Bestia.

- **Débloquée par** : US-0014
- **Critères d'acceptation** :
  - Le logo du loup s'affiche à gauche de la barre, net sur les écrans haute définition.
  - Un clic ou un toucher sur le logo ramène à la page d'accueil.
  - Le logo porte le texte de remplacement « Bestia ».

### US-0016 · Donner au jeu son icône et son titre d'onglet
**En tant que** développeur, **je veux** le logo du loup comme icône d'onglet et « Bestia » comme titre, **afin de** rendre le jeu reconnaissable parmi les onglets ouverts.

- **Débloquée par** : US-0015
- **Critères d'acceptation** :
  - L'onglet du navigateur montre le logo du loup et le titre « Bestia ».
  - Chaque page peut compléter le titre (par exemple « Bestia · Accueil »).
  - Ajouté à l'écran d'accueil d'un téléphone, le jeu garde l'icône du loup.

### US-0017 · Ranger les illustrations reprises du prototype
**En tant que** développeur, **je veux** un seul endroit où ranger les illustrations du prototype et celles à venir, **afin de** les afficher vite et nettes sur tous les écrans.

- **Débloquée par** : US-0005
- **Critères d'acceptation** :
  - Les illustrations sont servies dans un format léger pour le web, à une taille adaptée à l'écran.
  - Une illustration manquante affiche un visuel de remplacement, jamais une image cassée.
  - Le lieu de stockage des illustrations, dans le projet ou dans un stockage de fichiers (à décider).

### US-0018 · Habiller la page d'accueil en Bento
**En tant que** développeur, **je veux** une page d'accueil faite de la barre du haut et de quelques blocs Bento, **afin de** montrer dès maintenant l'allure du jeu.

- **Débloquée par** : US-0013, US-0015, US-0017
- **Critères d'acceptation** :
  - La page d'accueil montre la barre du haut, le nom « Bestia » et quelques blocs, dont une illustration du prototype.
  - Mise à côté du prototype, elle en a clairement l'allure : couleurs, polices, arrondis, espacements.
  - Elle s'affiche en moins de (chiffre à régler) secondes sur une connexion mobile moyenne.

### US-0019 · Vérifier l'habillage sur mobile
**En tant que** développeur, **je veux** contrôler la page d'accueil sur un vrai téléphone, **afin de** garantir que mobile et ordinateur sont à égalité dès le départ.

- **Débloquée par** : US-0018
- **Critères d'acceptation** :
  - Sur un téléphone en portrait, la page se lit sans zoom ni défilement de côté.
  - Les textes ne descendent jamais sous (chiffre à régler) pixels.
  - Tout élément touchable mesure au moins (chiffre à régler) pixels de côté.
  - En paysage, la barre du haut et le logo restent entiers.

## Étape 3 · Le temps du jeu

### US-0020 · Enregistrer le Monde en base
**En tant que** développeur, **je veux** un Monde enregistré en base avec sa date de naissance, **afin de** donner au temps du jeu quelque chose à faire avancer.

- **Débloquée par** : US-0004
- **Critères d'acceptation** :
  - La base contient un Monde, créé une seule fois même si l'initialisation est relancée.
  - Rien dans l'application ne permet de remettre un Monde à zéro.
  - Le nom du Monde (à décider).

### US-0021 · Mémoriser jusqu'où le temps a été calculé
**En tant que** développeur, **je veux** que chaque élément qui vit dans le temps garde l'instant jusqu'auquel il a été calculé, **afin de** connaître exactement la durée à rattraper.

- **Débloquée par** : US-0020
- **Critères d'acceptation** :
  - Chaque élément suivi (le Monde pour commencer, plus tard chaque Territoire) porte un instant « calculé jusqu'à ».
  - Cet instant n'avance que lorsqu'un calcul a réussi et a été enregistré.
  - Il ne recule jamais.

### US-0022 · Lire l'heure du jeu à une seule source
**En tant que** développeur, **je veux** que l'heure du jeu vienne toujours de l'application en ligne et jamais de l'appareil du joueur, **afin de** rendre inutile tout changement d'heure sur le téléphone d'un joueur.

- **Débloquée par** : US-0021
- **Critères d'acceptation** :
  - Tous les calculs lisent l'heure du jeu à une seule fonction.
  - Changer l'heure de l'ordinateur ou du téléphone ne change aucun résultat.
  - Les instants sont enregistrés en temps universel et affichés dans le fuseau du joueur.

### US-0023 · Écrire un mécanisme unique pour faire avancer le temps
**En tant que** développeur, **je veux** une seule fonction qui fait avancer un élément de son instant « calculé jusqu'à » jusqu'à maintenant, **afin de** garantir le même résultat, que la page soit ouverte ou que la tâche planifiée passe.

- **Débloquée par** : US-0022
- **Critères d'acceptation** :
  - Avancer de dix heures d'un coup donne exactement le même résultat qu'avancer dix fois d'une heure.
  - Avancer d'une durée nulle ne change rien.
  - Les événements datés qui tombent dans l'intervalle sont traités dans l'ordre de leur date, chacun à son instant exact.
  - Tout ce qui dépend du temps passe par cette fonction, et par elle seule.

### US-0024 · Rattraper le temps à l'ouverture d'une page
**En tant que** développeur, **je veux** qu'avant d'afficher une page, l'élément concerné soit avancé jusqu'à maintenant, **afin de** montrer toujours un état à jour, même après une longue absence.

- **Débloquée par** : US-0023
- **Critères d'acceptation** :
  - Chaque page qui montre un élément suivi le rattrape avant de l'afficher.
  - Deux ouvertures rapprochées ne rattrapent que le temps écoulé entre elles.
  - Si le rattrapage échoue, la page affiche un message d'erreur plutôt qu'un état périmé.

### US-0025 · Faire passer une tâche planifiée pour les absents
**En tant que** développeur, **je veux** une tâche planifiée qui fait avancer régulièrement ce que personne n'a ouvert, **afin de** tenir le Monde à jour même quand les joueurs sont absents.

- **Débloquée par** : US-0023, US-0005
- **Critères d'acceptation** :
  - Une tâche planifiée Vercel passe toutes les (chiffre à régler) minutes en production.
  - À chaque passage, elle avance tout élément qui n'a pas été calculé depuis plus de (chiffre à régler) minutes.
  - Elle travaille par lots, pour rester sous la durée d'exécution permise par Vercel.

### US-0026 · Protéger l'adresse de la tâche planifiée
**En tant que** développeur, **je veux** que seule la tâche planifiée de Vercel puisse déclencher le rattrapage des absents, **afin de** fermer la porte aux appels malveillants ou trop fréquents.

- **Débloquée par** : US-0025
- **Critères d'acceptation** :
  - Un appel sans le secret attendu est refusé et ne fait rien avancer.
  - Le secret est lu dans une variable d'environnement.
  - Les appels refusés sont notés dans le journal.

### US-0027 · Ne jamais compter deux fois le même temps
**En tant que** développeur, **je veux** que deux rattrapages simultanés du même élément ne s'additionnent pas, **afin de** garder un Monde juste quand une page s'ouvre pendant le passage de la tâche planifiée.

- **Débloquée par** : US-0024, US-0025
- **Critères d'acceptation** :
  - Si deux calculs visent le même élément au même moment, un seul s'applique ; l'autre repart de l'état enregistré.
  - Un test qui lance plusieurs rattrapages en parallèle obtient le même résultat qu'un seul.
  - Un calcul interrompu n'enregistre rien : tout ou rien.

### US-0028 · Rattraper une longue absence sans attendre
**En tant que** développeur, **je veux** qu'une très longue absence se rattrape vite, **afin de** ne pas faire attendre le joueur qui revient après des semaines.

- **Débloquée par** : US-0023
- **Critères d'acceptation** :
  - Une absence de (chiffre à régler) jours se rattrape en moins de (chiffre à régler) secondes.
  - Le résultat est identique à celui d'un rattrapage heure par heure.
  - La durée de chaque rattrapage est notée dans le journal.

### US-0029 · Garder un journal des passages de la tâche planifiée
**En tant que** développeur, **je veux** une trace de chaque passage de la tâche planifiée, **afin de** repérer tout de suite un passage manqué ou en erreur.

- **Débloquée par** : US-0025
- **Critères d'acceptation** :
  - Chaque passage note son heure, sa durée, le nombre d'éléments avancés et les erreurs rencontrées.
  - Une erreur sur un élément n'empêche pas les autres d'avancer.
  - Les (chiffre à régler) derniers passages restent consultables.

### US-0030 · Accélérer le temps en développement
**En tant que** développeur, **je veux** un réglage qui fait passer le temps du jeu cent fois plus vite, **afin de** tester en quelques minutes ce qui prend des heures.

- **Débloquée par** : US-0022
- **Critères d'acceptation** :
  - Avec le réglage à ×100, une minute réelle fait avancer l'heure du jeu de cent minutes.
  - Le réglage passe par une variable d'environnement, sans toucher au code.
  - Le rattrapage à l'ouverture de page et la tâche planifiée suivent tous deux le temps accéléré.
  - Changer de vitesse ne fait jamais reculer l'heure du jeu.

### US-0031 · Interdire l'accélération en production
**En tant que** développeur, **je veux** que le temps passe toujours à vitesse normale en production, **afin de** protéger le vrai Monde d'une erreur de réglage.

- **Débloquée par** : US-0030
- **Critères d'acceptation** :
  - En production, le temps passe à vitesse normale, quel que soit le réglage.
  - Un réglage d'accélération trouvé en production est signalé dans le journal au démarrage.
  - L'accélération reste possible en local et sur les prévisualisations.

### US-0032 · Signaler à l'écran que le temps est accéléré
**En tant que** développeur, **je veux** un bandeau visible quand le temps est accéléré, **afin de** ne jamais confondre un test accéléré avec le vrai rythme du jeu.

- **Débloquée par** : US-0030, US-0014
- **Critères d'acceptation** :
  - Quand le temps est accéléré, un bandeau « Temps ×100 » s'affiche sur chaque page.
  - À vitesse normale, le bandeau n'existe pas.
  - Sur mobile, il reste lisible sans masquer la barre du haut.

### US-0033 · Créer un compteur de test
**En tant que** développeur, **je veux** un compteur rattaché au Monde qui gagne un point par heure de jeu, **afin de** vérifier que le temps avance juste.

- **Débloquée par** : US-0023
- **Critères d'acceptation** :
  - Le compteur passe par le mécanisme unique, comme tout ce qui dépend du temps.
  - Après trois heures de jeu, il a gagné exactement trois points, et 1,5 point après une heure et demie.
  - Un développeur peut le remettre à zéro sans toucher au reste du Monde.

### US-0034 · Ouvrir une page de contrôle interne
**En tant que** développeur, **je veux** une page interne qui montre l'heure du jeu, la vitesse du temps, le compteur de test et les derniers passages de la tâche planifiée, **afin de** surveiller le temps du jeu d'un coup d'œil.

- **Débloquée par** : US-0013, US-0029, US-0033
- **Critères d'acceptation** :
  - La page affiche l'heure du jeu, le facteur d'accélération et la valeur du compteur.
  - Elle liste les derniers passages de la tâche planifiée avec leur résultat.
  - Elle n'est ouverte qu'aux développeurs ; la façon de les reconnaître (à décider).
  - Aucun lien visible par un joueur n'y mène.

### US-0035 · Vérifier le compteur page ouverte
**En tant que** développeur, **je veux** voir le compteur avancer à chaque ouverture de la page de contrôle, **afin de** valider le rattrapage à l'ouverture de page.

- **Débloquée par** : US-0024, US-0034
- **Critères d'acceptation** :
  - Chaque rechargement montre une valeur supérieure ou égale à la précédente.
  - Deux rechargements à une heure d'écart montrent exactement un point de plus.
  - La valeur affichée est celle enregistrée en base juste après le rechargement.

### US-0036 · Vérifier le compteur page fermée
**En tant que** développeur, **je veux** que le compteur avance sans que personne n'ouvre la page, **afin de** valider le passage de la tâche planifiée.

- **Débloquée par** : US-0025, US-0035
- **Critères d'acceptation** :
  - Page fermée pendant plusieurs heures, le journal montre que la tâche planifiée a fait avancer le compteur.
  - À la réouverture, le compteur affiche exactement le nombre d'heures écoulées depuis sa remise à zéro.

### US-0037 · Vérifier le compteur en vitesse accélérée
**En tant que** développeur, **je veux** voir le compteur avancer cent fois plus vite avec le réglage ×100, **afin de** valider l'accélération avant de m'en servir pour tout le reste.

- **Débloquée par** : US-0032, US-0036
- **Critères d'acceptation** :
  - À ×100, le compteur gagne un point toutes les 36 secondes réelles.
  - Page fermée dix minutes réelles, il a gagné environ 16,7 points à la réouverture.
  - Revenir à vitesse normale ne fait ni reculer ni sauter le compteur.

### US-0038 · Faire un saut dans le temps en développement
**En tant que** développeur, **je veux** avancer l'heure du jeu d'un bloc depuis la page de contrôle, **afin de** tester une longue absence sans attendre.

- **Débloquée par** : US-0031, US-0034
- **Critères d'acceptation** :
  - Un bouton avance l'heure du jeu d'une durée choisie : une heure, un jour, une semaine.
  - Le compteur de test reflète aussitôt le saut.
  - Le bouton n'existe pas en production.

## Étape 4 · Les premières données

### US-0039 · Charger les données de référence par un script rejouable
**En tant que** développeur, **je veux** décrire les données du jeu dans des fichiers du projet et les charger en base d'une seule commande, **afin de** faire évoluer le contenu sans écrire une migration à chaque fois.

- **Débloquée par** : US-0004
- **Critères d'acceptation** :
  - Une seule commande remplit une base vide avec toutes les données de référence.
  - La relancer met à jour les valeurs modifiées, sans créer de doublon.
  - Le chargement se lance tout seul à chaque mise en ligne.
  - Les fichiers de données se relisent sans connaître le code, pour les chantiers de contenu.

### US-0040 · Enregistrer les Biomes
**En tant que** développeur, **je veux** tous les Biomes du Monde en base, **afin de** rattacher chaque Case et chaque Espèce à son milieu.

- **Débloquée par** : US-0039
- **Critères d'acceptation** :
  - La base contient prairie, forêt, jungle, savane, désert, montagne, toundra, banquise et eau.
  - L'eau existe sous ses quatre formes : côte, lac, rivière, mer ; les traiter comme quatre Biomes distincts ou comme quatre variantes de l'eau (à décider).
  - Chaque Biome a un nom affiché en français et un identifiant stable qui ne changera plus.

### US-0041 · Enregistrer les six Raretés
**En tant que** développeur, **je veux** les six Raretés en base, rangées de la plus faible à la plus forte, **afin de** classer chaque Espèce selon sa puissance et la difficulté à la trouver.

- **Débloquée par** : US-0039
- **Critères d'acceptation** :
  - La base contient commune, peu commune, rare, épique, légendaire et mythique, dans cet ordre.
  - L'ordre permet de comparer deux Raretés entre elles.
  - Les Espèces de Rareté mythique sont marquées comme ne s'élevant pas.

### US-0042 · Enregistrer les quatre Rôles
**En tant que** développeur, **je veux** les quatre Rôles en base, **afin de** rattacher un usage particulier aux Espèces qui en ont un.

- **Débloquée par** : US-0039
- **Critères d'acceptation** :
  - La base contient Porteur, Éclaireur, Nourricier et Bâtisseur.
  - Chaque Rôle a une phrase qui dit ce qu'il permet.
  - Une Espèce a au plus un Rôle, ou aucun.

### US-0043 · Décrire une Espèce en base
**En tant que** développeur, **je veux** une fiche d'Espèce qui porte toutes ses caractéristiques, **afin de** décrire de la même façon les trois premières Espèces et les 2000 à venir.

- **Débloquée par** : US-0040, US-0041, US-0042
- **Critères d'acceptation** :
  - Une Espèce porte : nom, attaque, vie, vitesse, charge, taille (Places occupées), régime (carnivore, herbivore ou omnivore), Entretien par heure, Biome d'Habitat, Rôle éventuel, Rareté et illustration.
  - Rien n'est rattaché à une Bête en particulier : toutes les Bêtes d'une Espèce partagent la même fiche.
  - Une Espèce sans Biome d'Habitat, sans Rareté ou sans régime est refusée par la base.
  - Chaque fiche peut noter la source réelle de ses chiffres.

### US-0044 · Enregistrer la souris
**En tant que** développeur, **je veux** la souris en base avec toutes ses caractéristiques, **afin de** proposer l'Espèce qui aide à se défendre.

- **Débloquée par** : US-0043
- **Critères d'acceptation** :
  - La souris est en base, Rareté commune, sans Rôle.
  - Son régime et ses caractéristiques sont tirés de l'animal réel (chiffre à régler).
  - Son Biome d'Habitat (à décider).

### US-0045 · Enregistrer la poule
**En tant que** développeur, **je veux** la poule en base avec toutes ses caractéristiques, **afin de** proposer l'Espèce qui aide à grandir.

- **Débloquée par** : US-0043
- **Critères d'acceptation** :
  - La poule est en base, Rareté commune, avec le Rôle Nourricier.
  - Son régime et ses caractéristiques sont tirés de l'animal réel (chiffre à régler).
  - Son Biome d'Habitat (à décider).

### US-0046 · Enregistrer le pigeon
**En tant que** développeur, **je veux** le pigeon en base avec toutes ses caractéristiques, **afin de** proposer l'Espèce qui aide à explorer.

- **Débloquée par** : US-0043
- **Critères d'acceptation** :
  - Le pigeon est en base, Rareté commune, avec le Rôle Éclaireur.
  - Son régime et ses caractéristiques sont tirés de l'animal réel (chiffre à régler).
  - Son Biome d'Habitat (à décider).

### US-0047 · Marquer les Espèces du Couple de départ
**En tant que** développeur, **je veux** marquer la souris, la poule et le pigeon comme seules Espèces proposées en Couple de départ, avec leur style de jeu, **afin de** préparer l'écran de choix du jalon 1.

- **Débloquée par** : US-0044, US-0045, US-0046
- **Critères d'acceptation** :
  - Seules ces trois Espèces sont marquées, dans l'ordre souris, poule, pigeon.
  - Chacune porte son style de jeu : se défendre (souris), grandir (poule), explorer (pigeon).
  - La phrase complète qui présente chaque style (à décider).

### US-0048 · Rattacher les illustrations des trois Espèces
**En tant que** développeur, **je veux** l'illustration de la souris, de la poule et du pigeon rattachée à leur fiche, **afin de** montrer les premières Bêtes dans la direction artistique du prototype.

- **Débloquée par** : US-0017, US-0047
- **Critères d'acceptation** :
  - Chacune des trois Espèces a son illustration, peinte dans la direction artistique du prototype.
  - Chaque illustration existe en grand format et en vignette.
  - Une Espèce sans illustration affiche le visuel de remplacement prévu.

### US-0049 · Vérifier la cohérence des données de référence
**En tant que** développeur, **je veux** un test automatique qui contrôle les données de référence, **afin de** repérer une erreur de saisie avant qu'elle n'arrive en ligne.

- **Débloquée par** : US-0008, US-0047
- **Critères d'acceptation** :
  - Le test vérifie que chaque Espèce a un Biome d'Habitat, une Rareté et un régime qui existent en base.
  - Il vérifie qu'aucune caractéristique chiffrée n'est négative.
  - Il échoue si une Espèce a plus d'un Rôle, ou si le Couple de départ ne compte pas exactement trois Espèces.

### US-0050 · Lister les Biomes sur la page de contrôle
**En tant que** développeur, **je veux** voir la liste des Biomes sur la page de contrôle interne, **afin de** vérifier ce qui est réellement en base.

- **Débloquée par** : US-0034, US-0040
- **Critères d'acceptation** :
  - La page liste chaque Biome avec son nom et son identifiant.
  - Les quatre formes de l'eau apparaissent clairement.
  - La liste reflète la base, pas les fichiers de données.

### US-0051 · Lister les Espèces sur la page de contrôle
**En tant que** développeur, **je veux** voir chaque Espèce en base avec son illustration et toutes ses caractéristiques, **afin de** relire d'un coup d'œil les données des trois Espèces de départ.

- **Débloquée par** : US-0048, US-0050
- **Critères d'acceptation** :
  - Chaque Espèce s'affiche avec son illustration, sa Rareté, son Rôle et toutes ses caractéristiques.
  - Une caractéristique vide ou encore à régler est signalée en couleur.
  - Les Raretés et les Rôles en base sont listés aussi.
