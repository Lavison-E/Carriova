# Qualification et CRM Carriova

Le formulaire public est à `/qualification`. Le suivi privé est à `/admin/crm`, avec connexion à `/admin/connexion`. Aucun compte public, formulaire de préinscription ou paramètre du navigateur ne donne accès au CRM.

## Neon et déploiement Vercel

La connexion existante `DATABASE_URL` reste côté serveur. Pour les migrations et les scripts d’administration, `DATABASE_URL_UNPOOLED` est préférée si elle existe ; sinon `DATABASE_URL` est utilisée. Conserver les paramètres SSL fournis par Neon. Ne jamais publier ces variables avec un préfixe `NEXT_PUBLIC_`.

Le fichier `vercel.json` exécute `npm run db:crm && npm run build`. Les migrations ajoutent les tables CRM et équipe dans une transaction, sous verrou PostgreSQL, et enregistrent leur empreinte. Un déploiement suivant les ignore si elles sont inchangées. Aucun seed, suppression ou remplacement de données existantes n’est effectué. La table historique `leads` doit déjà exister dans la base Carriova. Une base inaccessible, un schéma inattendu ou une migration modifiée interrompt le déploiement.

En cas d’échec, consulter le code d’erreur de migration dans le journal Vercel et vérifier les variables de l’environnement visé. Ne pas lancer `db:seed` pour réparer : ce script historique réinitialise du contenu. Les aperçus doivent utiliser une branche Neon de test, pas les données de production.

Pour préparer un environnement local autorisé, renseigner la connexion dans `.env.local` (ignoré par Git), puis :
```sh
npm run db:crm
```

## Premier compte de l’équipe

Un administrateur ayant accès à la connexion Neon doit créer explicitement le premier compte depuis un terminal de confiance :
```sh
npm run crm:user -- create responsable@example.com "Responsable Carriova" admin
```
L’adresse ci-dessus est un exemple à remplacer. Le mot de passe est demandé deux fois en saisie masquée (15 caractères minimum) ; il n’est jamais passé en argument ni affiché. Les mots de passe sont dérivés avec scrypt et un sel aléatoire. Aucun compte ou mot de passe par défaut n’existe.

Créer un conseiller, réinitialiser son mot de passe ou désactiver son accès :
```sh
npm run crm:user -- create conseiller@example.com "Prénom Nom" advisor
npm run crm:user -- reset conseiller@example.com
npm run crm:user -- disable conseiller@example.com
```
La réinitialisation et la désactivation révoquent toutes les sessions du membre. La réinitialisation ne réactive pas un compte désactivé. Les deux rôles peuvent consulter et suivre les prospects ; la gestion des comptes reste réservée à l’opérateur disposant de l’accès base, hors interface publique.

## Fonctionnement

- Une qualification enregistre atomiquement le prospect, ses réponses, ses consentements datés/versionnés, son état et son historique.
- Le questionnaire ne demande pas d’e-mail : une chaîne vide dans l’ancienne colonne obligatoire représente l’absence d’adresse. Le CRM affiche « Non renseigné ».
- Le refus du contact WhatsApp est accepté. Aucun message n’est envoyé automatiquement. Un lien de conversation n’est proposé que lorsqu’un consentement WhatsApp explicite et un numéro valide existent.
- Les anciens prospects restent visibles. Leur consentement WhatsApp n’est jamais présumé.
- Statuts, relances (date et heure UTC/Abidjan), priorités et notes sont sauvegardés avec historique. Un contrôle de version refuse l’écrasement simultané d’un dossier par deux conseillers.
- L’historique est append-only : les corrections se font par une nouvelle note. Toute demande d’effacement de données requiert une procédure administrative dédiée, avec examen des obligations de conservation ; l’interface n’efface pas les dossiers.
- Chaque lecture et modification vérifie la session en base et le compte actif. Cookies HttpOnly/SameSite, Secure en production ; expiration après 8 heures et révocation à la déconnexion.
- Les limites de connexion et de soumission sont partagées en base entre les instances. Les adresses IP sont hachées avant stockage.

## Vérification et limites

`npm test` couvre les régressions, la validation, les transactions, les migrations répétées, les accès et les sessions. Les tests d’intégration utilisent PostgreSQL via PGlite en mémoire ; ce n’est pas une preuve de connectivité à la branche Neon de production. Exécuter aussi `npm run lint`, `npm run typecheck` et `npm run build`.

L’article fourni et le PDF de confidentialité du 18 octobre 2026 sont publiés fidèlement. La politique d’origine contient des éléments à préciser par Carriova (identité juridique, prestataires, durées, cookies). Les comptes publics et fonctions IA décrits comme futurs n’ont pas été activés par ce CRM.

Références techniques : [Neon pooling](https://neon.com/docs/connect/connection-pooling), [Vercel build configuration](https://vercel.com/docs/project-configuration), [Next.js authentication](https://nextjs.org/docs/app/guides/authentication).
