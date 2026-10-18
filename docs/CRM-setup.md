# Qualification, CRM et espace client Carriova

Mise à jour technique : 18 octobre 2026.

Le formulaire public est à `/qualification`. Les clients créent un compte à `/compte/creer`, se connectent à `/compte/connexion` et retrouvent leurs demandes dans `/espace`. L’équipe se connecte à `/admin/connexion` : les prospects sont à `/admin/crm` et les demandes de prestations à `/admin/commandes`. Un compte client ne donne aucun accès aux écrans ou aux fichiers de l’équipe.

## Neon et déploiement Vercel

La connexion existante `DATABASE_URL` reste côté serveur. Pour les migrations et les scripts d’administration, `DATABASE_URL_UNPOOLED` est préférée si elle existe ; sinon `DATABASE_URL` est utilisée. Conserver les paramètres SSL fournis par Neon. Ne jamais publier ces variables avec un préfixe `NEXT_PUBLIC_`.

Le fichier `vercel.json` exécute `npm run db:crm && npm run build`. Le runner applique, dans cet ordre, les migrations équipe, CRM, comptes clients et espace client : `20261018_staff.sql`, `20261018_crm.sql`, `20261018_customer.sql`, `20261018_workspace.sql`, `20261018_staff_invites.sql` et `20261018_notifications.sql`. Il utilise une transaction globale, un verrou PostgreSQL et un journal d’empreintes. Un déploiement suivant ignore les migrations déjà appliquées si elles sont inchangées. Aucun jeu de données de démonstration, suppression ou remplacement des données existantes n’est effectué. La table historique `leads` doit déjà exister dans la base Carriova. Une base inaccessible, un schéma inattendu ou une migration déjà appliquée puis modifiée interrompt le déploiement.

En cas d’échec, consulter le code d’erreur de migration dans le journal Vercel et vérifier les variables de l’environnement visé. Ne pas lancer `db:seed` pour réparer : ce script historique réinitialise du contenu. Les aperçus doivent utiliser une branche Neon de test, pas les données de production.

Pour préparer un environnement local autorisé, renseigner la connexion dans `.env.local` (ignoré par Git), puis :

```sh
npm run db:crm
```

## Premier compte de l’équipe

Le propriétaire ou l’opérateur autorisé disposant de l’accès à Neon crée explicitement le premier compte administrateur depuis un terminal de confiance, après les migrations :

```sh
npm run crm:user -- create responsable@example.com "Responsable Carriova" admin
```

L’adresse ci-dessus est un exemple à remplacer par celle du responsable. Cette commande initialise l’accès de l’équipe ; un compte GitHub ou un compte client n’est pas automatiquement administrateur. Le mot de passe est demandé deux fois en saisie masquée (15 caractères minimum) ; il n’est jamais passé en argument ni affiché. Les mots de passe sont dérivés avec scrypt et un sel aléatoire. Aucun compte ou mot de passe par défaut n’existe.

Créer un conseiller, réinitialiser son mot de passe ou désactiver son accès :

```sh
npm run crm:user -- create conseiller@example.com "Prénom Nom" advisor
npm run crm:user -- reset conseiller@example.com
npm run crm:user -- disable conseiller@example.com
```

La réinitialisation et la désactivation révoquent toutes les sessions du membre. La réinitialisation ne réactive pas un compte désactivé. Les rôles `admin` et `advisor` peuvent suivre les prospects et les prestations de l’ensemble des clients. La gestion des comptes d’équipe reste réservée à l’opérateur disposant de l’accès base, hors interface publique. La session équipe expire après 8 heures ; son cookie est limité à `/admin`.

## Qualification et rattachement à un compte

Une qualification enregistre atomiquement le prospect, ses réponses, ses consentements datés et versionnés, son état CRM et son historique. Le questionnaire ne demande pas d’e-mail : une chaîne vide dans l’ancienne colonne obligatoire représente l’absence d’adresse. Le CRM affiche « Non renseigné ».

Pour un client connecté, la qualification crée également sa demande dans l’espace. Pour une personne non connectée, un jeton opaque conservé dans un cookie HttpOnly permet de rattacher la demande lors de l’inscription ou de la connexion depuis le même navigateur, pendant 7 jours. Seule l’empreinte du jeton est stockée en base. Le rattachement n’est jamais effectué par simple correspondance d’adresse e-mail. Chaque qualification ne peut être rattachée qu’à une demande.

Le refus du contact WhatsApp est accepté. Aucun message WhatsApp ni transfert vers un CRM tiers n’est déclenché par cette qualification. Un lien de conversation manuel n’est proposé à l’équipe que lorsqu’un consentement WhatsApp explicite et un numéro valide existent. Les anciens prospects restent visibles ; leur consentement WhatsApp n’est jamais présumé.

Statuts CRM, relances (date et heure UTC/Abidjan), priorités et notes sont sauvegardés avec historique. Un contrôle de version refuse l’écrasement simultané d’un dossier. L’historique CRM est conservé par ajout de nouvelles entrées : les corrections se font par une nouvelle note. L’interface ne supprime pas les dossiers.

## Demandes, propositions et livraison

Le client peut créer une demande, préciser son besoin, joindre ses documents, échanger avec l’équipe et consulter la chronologie. Les messages et les notes saisis dans le suivi d’une prestation sont visibles par le client et l’équipe ; ce ne sont pas des notes internes au CRM.

Le parcours principal est le suivant :

1. **Demande reçue** : le client crée sa demande, ou elle est rattachée depuis sa qualification.
2. **En étude** : l’équipe examine les éléments transmis.
3. **Proposition envoyée** : l’équipe renseigne le montant en francs CFA (XOF), une échéance éventuelle et une note publique. Un montant vide signifie qu’aucun prix n’est proposé ; `0` indique une prestation offerte.
4. **En cours** : le client accepte la proposition. Le montant accepté ne peut ensuite plus être modifié dans ce suivi.
5. **Livraison disponible** : depuis `/admin/commandes/[id]`, l’équipe utilise le bloc « Livrer le produit au client », joint un ou plusieurs fichiers (un dépôt à la fois), puis publie la livraison avec un message facultatif. Le dépôt d’un fichier préparatoire ne le rend pas encore visible au client. La publication dédiée conserve le devis et l’échéance, vérifie la version de la commande et déclenche la notification. Le client retrouve son produit dans le suivi de sa commande et dans « Produits & documents » (`/espace/documents`), avec un téléchargement privé par fichier.
6. **Révision demandée** : le client explique les ajustements souhaités. L’équipe reprend le travail et doit joindre un nouveau fichier avant de publier la livraison révisée.
7. **Terminée** : le client confirme la réception et valide la livraison.

L’équipe peut annuler une demande aux étapes autorisées en indiquant le motif au client. Une demande terminée ou annulée n’accepte plus de changement de statut ni de nouveau fichier ; les échanges de messages restent possibles. Les modifications de statut utilisent un contrôle de version : après un conflit, recharger la demande avant de réessayer.

Pour limiter les créations et le stockage, un compte client peut créer 20 demandes depuis son espace sur 24 heures, envoyer 60 messages par heure et déposer 24 fichiers sur 24 heures, toutes ses demandes confondues. Les notes de révision du client comptent parmi les messages. Ces plafonds sont contrôlés en base et s’appliquent aux opérations enregistrées ; une transaction annulée ne consomme pas le compteur. L’équipe reste libre de répondre et de déposer les livrables. Chaque commande dispose de deux plafonds distincts : 12 documents de travail et 12 fichiers de livraison. Les documents du client ne consomment donc pas les emplacements réservés aux produits de l’équipe.

L’acceptation d’une proposition n’enregistre aucun paiement. Cette version ne comporte pas de paiement en ligne, de statut « payé » déduit automatiquement ou de confirmation bancaire.

## Documents privés

Les pièces jointes sont stockées dans PostgreSQL/Neon, dans une colonne binaire privée. Les formats acceptés sont PDF, DOCX, JPG/JPEG et PNG, avec un maximum de **3 MiB (3 145 728 octets) par fichier** et **12 documents de travail et 12 fichiers de livraison par demande**. Le serveur contrôle l’extension, la signature du contenu, la taille et le nom. Ces contrôles de format ne constituent pas un service d’analyse antivirus.

Chaque lecture vérifie la session et le propriétaire de la demande. Les fichiers du client sont téléchargés via `/api/espace/fichiers/[id]`. Les fichiers de l’équipe utilisent `/admin/fichiers/[id]`, afin de recevoir le cookie équipe limité à `/admin`. Les réponses sont servies en pièces jointes avec un cache privé désactivé. Les fichiers de livraison préparés restent invisibles au client jusqu’à la publication de la livraison ; seuls les membres de l’équipe peuvent les déposer.

Pour accepter le fichier et son enveloppe multipart, la limite des Server Actions est réglée à `4mb` dans la configuration Next.js. La limite applicative de 3 MiB reste vérifiée côté serveur.

## Comptes clients et récupération d’accès

L’inscription demande le nom, l’adresse e-mail, un mot de passe d’au moins 8 caractères et le consentement nécessaire au compte. Le consentement marketing est distinct. Les mots de passe ne sont pas conservés en clair. La session client dure 7 jours et utilise un cookie HttpOnly, SameSite=Lax, Secure en production. Le compte doit rester actif à chaque requête. Un changement ou une réinitialisation du mot de passe révoque les sessions précédentes.

La récupération à `/compte/recuperer` utilise l’intégration Resend lorsqu’elle est configurée. Renseigner côté serveur :

- `RESEND_API_KEY` : clé du service d’envoi ;
- `EMAIL_FROM` : expéditeur autorisé pour l’envoi ;
- `NEXT_PUBLIC_SITE_URL` : adresse HTTPS réelle du site, utilisée pour construire le lien de récupération.

`RESEND_BASE_URL` est facultative et utilise `https://api.resend.com` par défaut. `LEAD_NOTIFICATION_EMAIL` n’est pas nécessaire à la récupération client. Ne pas publier la clé Resend dans une variable `NEXT_PUBLIC_*`.

Le lien de récupération expire après 30 minutes et ne peut servir qu’une fois. Sa seule empreinte est conservée en base. La réponse affichée ne révèle pas si l’adresse possède un compte et ne prouve pas que l’e-mail est arrivé. Vérifier la réception effective sur une adresse de test contrôlée et les journaux du prestataire avant de déclarer l’envoi opérationnel. Sans configuration d’envoi, l’interface indique l’indisponibilité et invite à contacter Carriova. Aucun e-mail de récupération n’est envoyé par les tests automatisés.

## Vérification et confidentialité

`npm test` couvre la validation, les transactions, les migrations répétées, les accès, les sessions, l’isolation entre deux clients, les conflits de version, les fichiers privés et les parcours de livraison/révision. Les tests d’intégration utilisent PostgreSQL via PGlite en mémoire ; ils ne prouvent pas la connectivité à la branche Neon de production. Exécuter aussi `npm run lint`, `npm run typecheck` et `npm run build`.

L’article fourni et le PDF de confidentialité du 18 octobre 2026 restent publiés fidèlement. La page `/legal/confidentialite` comporte désormais un complément daté décrivant les comptes clients et l’espace actifs dans cette version, sans réécrire le document historique. Les informations juridiques et durées de conservation restant à préciser par Carriova ne sont pas déduites de l’implémentation. Les demandes relatives aux données ou à leur suppression passent par le contact existant : `contact@carriovaci.com`.

## Invitation de l’équipe par e-mail

Après le déploiement des migrations et de la page d’activation, un opérateur autorisé peut inviter le premier administrateur sans choisir son mot de passe :

```sh
npm run crm:invite -- contact@carriovaci.com "Équipe Carriova" admin
```

Le compte reste désactivé jusqu’au choix du mot de passe par le destinataire à `/admin/activer`. L’invitation est personnelle, expire après 24 heures et ne peut servir qu’une fois. La commande ne journalise ni le lien ni le jeton. Elle refuse de remplacer un compte déjà actif. Les commandes de désactivation et de réinitialisation de l’opérateur révoquent les invitations en attente.

## Messagerie de l’espace client

`EMAIL_TRANSACTIONAL_FROM` définit l’expéditeur des nouveaux messages de la plateforme. Sa valeur par défaut est `CARRIOVA <noreply@carriovaci.com>` ; le domaine doit être vérifié dans Resend. `EMAIL_FROM` reste l’expéditeur des formulaires historiques. `SUPPORT_EMAIL` définit l’adresse de réponse et d’assistance, avec repli sur `CONTACT_EMAIL`. Le support actuel est `contact@carriovaci.com`. Une variable ne crée aucune boîte mail ; la réception de ce domaine est administrée chez Hostinger.

Les nouveaux comptes clients reçoivent un message de bienvenue. Les demandes, propositions, livraisons, révisions et messages génèrent des notifications adaptées au client ou à l’équipe. Ces e-mails contiennent un lien vers l’espace authentifié ; les messages privés et pièces jointes ne sont pas copiés dans l’e-mail. La migration n’envoie aucun message rétrospectif aux anciens inscrits.

Les notifications sont placées dans une file PostgreSQL pendant la même transaction que l’événement. L’envoi s’effectue après son enregistrement : une panne de Resend n’annule pas la demande du client. Les membres de l’équipe peuvent consulter l’état et relancer les envois depuis `/admin/notifications`. Un état accepté par Resend ne prouve pas la lecture par le destinataire. Le lien d’activation de l’équipe et la récupération du mot de passe suivent leurs propres règles d’expiration et ne sont pas inclus dans cette file de suivi des demandes.
Les reprises automatiques s’arrêtent après 23 heures lorsqu’un résultat reste incertain, car la protection d’idempotence du prestataire est limitée dans le temps. L’équipe doit vérifier l’envoi dans Resend avant une relance manuelle tardive, afin d’éviter un doublon.
