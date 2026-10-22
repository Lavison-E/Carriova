# Parcours client et profil carrière

## Demande et commande

Les nouvelles demandes passent par cinq étapes : Demande → Proposition → Réalisation → Livraison → Validation.

- L’équipe envoie une proposition avec un prix explicite en FCFA (0 est accepté pour une prestation offerte). Le client accepte ou demande une modification ; aucune action ne représente un paiement.
- Pendant la réalisation, les fichiers `review` restent privés jusqu’à « Envoyer pour validation ». Le client approuve le travail ou demande une révision motivée. Après une révision, un nouveau fichier est nécessaire.
- L’approbation intermédiaire place la commande en `finalized`. L’équipe joint ensuite les fichiers `delivery` définitifs et publie la livraison.
- Le client confirme la réception ou demande une retouche. Les fichiers déjà publiés restent accessibles et ne sont jamais supprimés par une modification de statut.
- Chaque modification utilise la version du dossier. Les événements, messages et notifications sont enregistrés dans la même transaction. Une panne d’e-mail ne supprime pas la livraison.

Les fichiers sont privés, limités à 3 Mo et contrôlés par propriétaire ou session équipe. Chaque catégorie dispose de 12 emplacements. Les anciens dossiers livrés ou terminés restent inchangés.

## Qualification et comptes

La question sur la volonté de payer a été retirée. Les nouvelles réponses enregistrent `not_asked`, sans déduire une intention d’achat ; les réponses historiques restent lisibles. Le budget et les consentements séparés restent disponibles.

L’inscription demande un numéro WhatsApp avec indicatif. Les comptes existants conservent leur accès et peuvent ajouter leur numéro dans leur compte. Donner un numéro ne vaut pas consentement marketing.

## Profil et offres

Le profil privé `/espace/profil` permet d’enregistrer les métiers souhaités, compétences, niveau d’expérience, pays et modes de travail, contrats, langues, formation, disponibilité et un CV appartenant au compte. Une sauvegarde partielle est autorisée ; métier, niveau et pays recherchés sont nécessaires au matching.

`/espace/opportunites` rapproche ces choix d’annonces publiques récentes. Les pays, contrats et modes de travail explicitement incompatibles sont filtrés ; les mots de métier et de compétences ordonnent ensuite les résultats. Chaque suggestion présente ses raisons et les exigences à vérifier auprès du recruteur. Un catalogue vide ou indisponible ne produit aucune offre fictive.

Aucune candidature automatique n’est envoyée. Le profil prépare une évolution future ; un futur agent devra disposer d’une autorisation distincte avant d’envoyer des candidatures ou de partager des documents.

## Déploiement et contrôle

Le runner `npm run db:crm` applique les migrations additives `20261018_cv.sql`, `20261022_workflow.sql` puis `20261022_career_profile.sql`. Ne pas utiliser le seed historique sur la production. Les migrations déjà appliquées sont vérifiées par checksum.

La suite de tests utilise PGlite et des fournisseurs simulés, sans base Neon ni e-mail réels. Pour les contrôles navigateur locaux, utiliser le serveur de base éphémère existant et désactiver Resend/Groq. Le Studio CV et sa configuration sont documentés dans `CV_STUDIO.md`.
