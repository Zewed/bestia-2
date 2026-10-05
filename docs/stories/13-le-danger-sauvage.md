# Jalon 13 · Le danger sauvage

Le monde sauvage ne se contente plus d'attendre : des Bêtes sauvages viennent attaquer le Territoire, annoncées à l'avance, et le chef apprend à garder des Bêtes au Foyer et à bâtir des défenses. Étapes couvertes : 54 à 55 de l'ordre d'attaque.

## Étape 54 · Les Incursions

### US-1301 · Faire naître des Incursions
**En tant que** développeur, **je veux** que le Monde lance de temps en temps une Incursion contre un Territoire, plus souvent près du Cœur sauvage, **afin de** faire peser le danger sauvage sur tous les chefs sans les écraser.

- **Débloquée par** : Étape 39, Étape 52
- **Critères d'acceptation** :
  - La fréquence des Incursions contre un Territoire dépend de la distance entre son Foyer et le Cœur sauvage (chiffre à régler).
  - Sur une longue simulation en temps accéléré, un Territoire proche du Cœur sauvage subit mesurablement plus d'Incursions qu'un Territoire de la Couronne.
  - Les Incursions se déclenchent aussi contre un joueur absent, grâce au passage régulier du temps.
  - Un délai minimal sépare deux Incursions contre un même Territoire (chiffre à régler).

### US-1302 · Composer une Incursion
**En tant que** développeur, **je veux** qu'une Incursion rassemble des Bêtes sauvages tirées selon les mêmes règles de Rareté que les Bêtes qui apparaissent sur les Cases, **afin de** rendre chaque Incursion crédible et variée.

- **Débloquée par** : US-1301
- **Critères d'acceptation** :
  - Les Raretés suivent les pourcentages de la région (communes majoritaires, plus rares près du Cœur sauvage).
  - Les Espèces sont tirées parmi celles des Biomes proches du Territoire visé (à décider).
  - Le nombre de Bêtes par Incursion (chiffre à régler).
  - La force totale d'une Incursion tient compte ou non de la force du Territoire visé (à décider).

### US-1303 · Être prévenu d'une Incursion
**En tant que** chef attaqué, **je veux** être prévenu qu'une Incursion approche, avec son heure d'arrivée, **afin de** me préparer à temps.

- **Débloquée par** : US-1302
- **Critères d'acceptation** :
  - L'annonce arrive toujours avant l'Incursion, jamais après.
  - Elle donne l'heure d'arrivée et un compte à rebours.
  - Sans tour de guet, le préavis est court mais existe toujours (chiffre à régler).
  - L'annonce reste lisible dans les récits après l'Incursion.

### US-1304 · Un préavis allongé par la tour de guet
**En tant que** chef attaqué, **je veux** que ma tour de guet repère les Incursions plus tôt, **afin de** gagner du temps pour m'organiser.

- **Débloquée par** : US-1303, Étape 30
- **Critères d'acceptation** :
  - Chaque niveau de la tour de guet allonge le préavis des Incursions (chiffre à régler).
  - Chaque employé à son Poste allonge encore le préavis ; sans personnel, la tour n'apporte rien.
  - La fiche de la tour affiche le préavis qu'elle donne.
  - Un test en temps accéléré mesure le bon préavis pour chaque niveau et chaque nombre d'employés.

### US-1305 · Ce que dit l'annonce
**En tant que** chef attaqué, **je veux** savoir d'où vient l'Incursion et ce qu'elle rassemble, **afin de** juger si ma défense suffit.

- **Débloquée par** : US-1303
- **Critères d'acceptation** :
  - L'annonce indique de quelle direction arrive l'Incursion.
  - Ce qu'elle révèle de sa composition (Espèces, nombre, force estimée) dépend de la tour de guet ou non (à décider).
  - Une Espèce que le joueur n'a jamais croisée n'y est jamais nommée : elle apparaît en silhouette, comme au Bestiaire.

### US-1306 · Voir l'Incursion approcher
**En tant que** chef attaqué, **je veux** un bandeau visible sur tous les écrans tant qu'une Incursion est annoncée, **afin de** ne pas l'oublier entre deux sessions.

- **Débloquée par** : US-1303
- **Critères d'acceptation** :
  - Un bandeau apparaît en haut de chaque écran dès l'annonce.
  - Il affiche le temps restant, qui descend en direct.
  - Le toucher ouvre l'annonce complète.
  - Il disparaît quand l'Incursion est résolue.

### US-1307 · Les Bêtes restées au Foyer défendent
**En tant que** chef attaqué, **je veux** que mes Bêtes présentes sur le Territoire défendent contre l'Incursion, **afin de** rendre utile le fait de garder des Bêtes à la maison.

- **Débloquée par** : US-1302, Étape 42
- **Critères d'acceptation** :
  - Seules les Bêtes présentes sur le Territoire à l'heure de l'Incursion défendent.
  - Les Bêtes parties en Récolte ou en Expédition ne défendent pas.
  - Les Couples en Réserve et les Bêtes affectées à leur Rôle (US-0842) ne combattent jamais et ne subissent aucune perte.
  - Les Blessés en cours de guérison ne combattent pas.
  - Les Habitants ne combattent jamais et ne comptent jamais dans les pertes.

### US-1308 · Voir qui garde le Foyer
**En tant que** joueur, **je veux** voir d'un coup d'œil les Bêtes présentes au Foyer et leur force totale, **afin de** décider qui envoyer en sortie et qui garder.

- **Débloquée par** : US-1307
- **Critères d'acceptation** :
  - L'écran des Bêtes sépare, par Espèce, les Bêtes présentes, parties, Blessées et affectées à leur Rôle.
  - La force totale des Bêtes présentes qui défendront s'affiche.
  - Quand une Incursion est annoncée, l'écran indique pour chaque sortie si ses Bêtes seront rentrées avant son arrivée.

### US-1309 · Rentrer à temps pour défendre
**En tant que** chef attaqué, **je veux** que mes Bêtes qui rentrent avant l'arrivée de l'Incursion défendent, **afin de** pouvoir rappeler mes sorties quand je vois le danger.

- **Débloquée par** : US-1307
- **Critères d'acceptation** :
  - Une Bête revenue avant l'heure de l'Incursion compte dans la défense.
  - Une Bête qui arrive après ne combat pas, même à une seconde près.
  - Les Bêtes d'une Récolte rappelée à l'aller défendent si elles rentrent à temps.
  - Le rappel d'une Expédition pour défendre le Foyer est possible ou non (à décider).

### US-1310 · Résoudre le combat d'une Incursion
**En tant que** chef attaqué, **je veux** que le combat se règle par la somme des forces des deux camps, **afin de** comprendre facilement pourquoi j'ai gagné ou perdu.

- **Débloquée par** : US-1307
- **Critères d'acceptation** :
  - La même règle que pour une Bête trop forte en Expédition s'applique : somme des forces, sans seuil de taille.
  - Le camp le plus fort l'emporte ; les pertes des deux camps dépendent de l'écart de force (chiffre à régler).
  - Le combat se résout à l'heure prévue, que le joueur soit connecté ou non.
  - L'issue d'une égalité parfaite de force (à décider).

### US-1311 · Blessés et morts après une Incursion
**En tant que** chef attaqué, **je veux** qu'une partie de mes pertes soient des Blessés qui guérissent, **afin de** ne pas tout perdre à chaque combat.

- **Débloquée par** : US-1310
- **Critères d'acceptation** :
  - Une partie des pertes du défenseur sont des Blessés, le reste meurt, dans les proportions déjà utilisées en Expédition.
  - Les Blessés guérissent avec le temps et reviennent dans l'effectif.
  - Les Bêtes sauvages survivantes repartent au sauvage : une Incursion n'apprivoise jamais de Bête.

### US-1312 · De la Viande après une Incursion repoussée
**En tant que** joueur, **je veux** qu'une Incursion repoussée puisse me laisser de la Viande, **afin de** tirer profit d'une bonne défense.

- **Débloquée par** : US-1310, Étape 12
- **Critères d'acceptation** :
  - Une Incursion repoussée laisse de la Viande selon les Bêtes sauvages tuées (chiffre à régler).
  - La Viande s'ajoute au stock dans la limite de stock.
  - Une Incursion qui l'emporte ne laisse rien.

### US-1313 · Une Incursion qui l'emporte
**En tant que** chef attaqué, **je veux** savoir ce que me coûte une Incursion que je n'ai pas repoussée, **afin de** mesurer le risque de laisser mon Foyer sans défense.

- **Débloquée par** : US-1310
- **Critères d'acceptation** :
  - Mes Bêtes présentes subissent leurs pertes, en Blessés et en morts.
  - Ce que les Bêtes sauvages emportent ou abîment en plus (Nourriture, constructions) (à décider).
  - Une Incursion ne fait jamais changer une Case de main.
  - Aucun Couple et aucun Habitant n'est perdu.

### US-1314 · Un Foyer sans aucune défense
**En tant que** chef attaqué, **je veux** qu'une Incursion contre un Territoire sans Bête présente se règle sans combat, **afin de** comprendre le résultat sans ambiguïté.

- **Débloquée par** : US-1313
- **Critères d'acceptation** :
  - Sans Bête présente pour défendre, l'Incursion l'emporte sans combat ; les Bêtes affectées à leur Rôle ne comptent pas.
  - Le récit le dit clairement et conseille de garder des Bêtes au Foyer.
  - Aucun Couple et aucun Habitant n'est perdu.

### US-1315 · Le récit d'une Incursion
**En tant que** chef attaqué, **je veux** un récit de chaque Incursion, **afin de** comprendre ce qui s'est passé pendant mon absence.

- **Débloquée par** : US-1311, US-1312, US-1313
- **Critères d'acceptation** :
  - Le récit donne l'heure, les Bêtes sauvages en présence (Espèce et nombre), les Bêtes du défenseur et la force totale de chaque camp.
  - Il indique le vainqueur, les Blessés, les morts et la Viande laissée.
  - Le récit s'affiche dès la visite suivante si le joueur n'était pas connecté, et reste consultable ensuite.
  - Les Espèces sauvages affrontées s'inscrivent au Bestiaire comme croisées (à décider).

### US-1316 · Rejouer les événements dans le bon ordre
**En tant que** développeur, **je veux** qu'au rattrapage du temps les Incursions, les retours de sortie, l'Entretien et les guérisons soient rejoués dans l'ordre où ils ont eu lieu, **afin de** donner à un joueur absent le même résultat que s'il avait été connecté.

- **Débloquée par** : US-1310
- **Critères d'acceptation** :
  - Une Expédition revenue une heure avant l'Incursion défend, même si le joueur ouvre la page trois jours plus tard.
  - Une Famine survenue avant l'Incursion réduit bien les défenseurs.
  - Un test compare le même scénario joué page ouverte et page fermée : les résultats sont identiques.

### US-1317 · Pas d'Incursion pour les tout nouveaux chefs
**En tant que** nouveau joueur, **je veux** être à l'abri des Incursions pendant mes premiers jours, **afin de** découvrir le jeu sans perdre les premières Bêtes que mes explorateurs ramènent.

- **Débloquée par** : US-1301
- **Critères d'acceptation** :
  - Aucune Incursion ne vise un chef pendant une durée après sa naissance (chiffre à régler) (à décider).
  - Les premières Incursions d'un chef sont plus faibles que les suivantes (à décider).
  - La fin de cette protection est annoncée à l'avance.

## Étape 55 · Les défenses construites

### US-1318 · Bâtir une palissade
**En tant que** joueur, **je veux** bâtir une palissade, **afin de** renforcer ma défense sans nourrir de Bêtes en plus.

- **Débloquée par** : US-1310, Étape 32
- **Critères d'acceptation** :
  - La palissade appartient à la famille Défense et se débloque par une Recherche de la branche Défendre.
  - Elle coûte des Matériaux et du temps, comme toute construction.
  - Une fois terminée, elle ajoute de la force en défense (chiffre à régler).
  - Elle ne mange rien et n'occupe aucune Place.
  - Elle se bâtit au Foyer ; en bâtir sur d'autres Cases du Territoire (à décider).

### US-1319 · Creuser des fosses
**En tant que** joueur, **je veux** creuser des fosses, **afin de** disposer d'un second moyen de renforcer ma défense.

- **Débloquée par** : US-1318
- **Critères d'acceptation** :
  - Les fosses appartiennent à la famille Défense et se débloquent par une Recherche de la branche Défendre.
  - Elles coûtent des Matériaux et du temps.
  - Une fois creusées, elles ajoutent de la force en défense (chiffre à régler).
  - Ce qui distingue les fosses de la palissade dans le combat (à décider).

### US-1320 · Améliorer ses défenses
**En tant que** joueur, **je veux** monter mes défenses de niveau, **afin de** suivre la menace qui grandit.

- **Débloquée par** : US-1318, US-1319, Étape 27
- **Critères d'acceptation** :
  - Chaque niveau de palissade ou de fosses ajoute de la force en défense (chiffre à régler).
  - Chaque niveau coûte et dure plus que le précédent.
  - La fiche de la construction montre la force actuelle et celle du niveau suivant.

### US-1321 · Les défenses entrent dans le combat
**En tant que** chef attaqué, **je veux** que mes défenses s'ajoutent à mes Bêtes pendant le combat, **afin de** voir mes constructions changer vraiment l'issue.

- **Débloquée par** : US-1318, US-1319
- **Critères d'acceptation** :
  - La force des défenses s'ajoute à celle des Bêtes présentes, dans la même somme.
  - Un test montre qu'une Incursion qui l'emporte sans palissade est repoussée avec, à Bêtes égales.
  - Les défenses combattent même quand aucune Bête n'est présente : l'Incursion n'est alors plus gagnée sans combat.
  - Les défenses ne partent jamais en sortie : elles ne servent qu'à défendre.

### US-1322 · Les défenses après le combat
**En tant que** chef attaqué, **je veux** savoir si mes défenses ont souffert d'un combat, **afin de** savoir si je dois les remettre en état.

- **Débloquée par** : US-1321
- **Critères d'acceptation** :
  - Les défenses ne meurent pas et ne deviennent jamais des Blessés.
  - Elles s'usent au combat et se réparent, ou restent intactes (à décider).
  - Si elles s'usent, leur force baisse jusqu'à leur remise en état, et le coût de la remise en état s'affiche (à décider).

### US-1323 · La force totale du Foyer
**En tant que** joueur, **je veux** voir la force totale de mon Foyer, Bêtes présentes et défenses comprises, **afin de** savoir si je suis prêt à recevoir une Incursion.

- **Débloquée par** : US-1308, US-1321
- **Critères d'acceptation** :
  - Le Foyer affiche la force des Bêtes présentes, celle des défenses, et leur total.
  - Le total se met à jour quand des Bêtes partent, rentrent ou guérissent, et quand une défense s'achève.
  - Quand la composition d'une Incursion annoncée est connue, le total s'affiche à côté de sa force estimée.

### US-1324 · Les défenses dans le récit
**En tant que** chef attaqué, **je veux** que le récit d'une Incursion montre ce qu'ont apporté mes défenses, **afin de** savoir si elles valent leur prix.

- **Débloquée par** : US-1315, US-1321
- **Critères d'acceptation** :
  - Le récit liste chaque défense présente et la force qu'elle a ajoutée.
  - Il sépare la force des Bêtes et celle des défenses dans le total du défenseur.
  - S'il existe une usure des défenses, le récit l'indique (à décider).
