// La structure de la base. Chaque table arrive avec la story qui en a besoin
// (le Monde avec US-0020) ; tout changement passe par une migration :
//   npm run db:generate   écrit la migration à partir de ce fichier
//   npm run db:migrate    l'applique
export {};
