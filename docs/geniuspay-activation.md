# Activation des paiements GeniusPay

Documentation fournisseur : https://geniuspay.ci/docs/api (consultée le 2 novembre 2026).

## Variables serveur

Ajouter dans Vercel, sans les préfixer par `NEXT_PUBLIC_` :
- `GENIUSPAY_ENVIRONMENT` : `sandbox` pour les tests ou `live` pour les encaissements.
- `GENIUSPAY_API_KEY` : clé `pk_sandbox_...` ou `pk_live_...` du même environnement.
- `GENIUSPAY_API_SECRET` : clé `sk_sandbox_...` ou `sk_live_...` correspondante.
- `GENIUSPAY_WEBHOOK_SECRET` : secret `whsec_...` fourni à la création du webhook.
- `NEXT_PUBLIC_SITE_URL` existe déjà : origine canonique HTTPS du site, sans chemin.

Les quatre variables GeniusPay sont nécessaires. Une configuration incomplète ou incohérente désactive le checkout. Le mode sandbox est désactivé quand `VERCEL_ENV=production` : tester en local ou sur un déploiement Preview dédié. Aucune vraie clé ne figure dans le dépôt.

## Mise en place

1. Appliquer `npm run db:crm` sur la base choisie. La migration `20261102_payments.sql` ajoute uniquement le registre des paiements et des notifications.
2. Créer dans GeniusPay un webhook du même environnement, URL `https://www.carriovaci.com/api/payments/geniuspay/webhook` (ou origine Preview pour les tests).
3. Souscrire aux événements `payment.initiated`, `payment.success`, `payment.failed`, `payment.cancelled`, `payment.expired`, `payment.refunded`. Conserver immédiatement le secret webhook dans Vercel.
4. Tester avec un compte client de test, une proposition acceptée et les clés sandbox sur Preview. Vérifier retour checkout ET webhook, acompte/solde, échec et nouvelle tentative, puis l’isolement entre deux clients.
5. Pour encaisser réellement, utiliser les trois clés live, `GENIUSPAY_ENVIRONMENT=live` et un compte marchand activé. Redéployer puis effectuer un test réel explicitement autorisé. Un build réussi ou les tests simulés ne prouvent ni l’activation du marchand ni celle d’un opérateur.

## Règles appliquées

Le client doit posséder la demande et avoir accepté sa proposition. Le montant provient exclusivement de PostgreSQL : total jusqu’à 25 000 FCFA, sinon 50 % au démarrage (arrondi supérieur au franc) puis solde lorsque la réalisation est finalisée pour livraison. Une proposition gratuite n’ouvre pas de checkout. GeniusPay impose un minimum de 200 FCFA ; une proposition inférieure doit être traitée avec l’équipe.

La redirection navigateur ne prouve aucun paiement. La confirmation utilise un GET authentifié vers le fournisseur et compare référence, montant brut, XOF, environnement, UUID local, demande, client, étape et prix accepté. Chaque webhook vérifie le HMAC-SHA256 du corps brut préfixé par le timestamp, une fenêtre de 5 minutes, son environnement et son événement, puis interroge également l’API. Les identifiants des événements et références sont conservés pour empêcher les doubles crédits. Les transactions sandbox ne comptent jamais parmi les transactions live et leurs événements portent explicitement la mention TEST.

La documentation publique ne définit pas de clé d’idempotence à la création. Carriova réserve la transaction en base sous verrou avant l’appel GeniusPay, réutilise le lien existant et n’effectue aucune nouvelle création après un résultat réseau incertain. Un webhook signé peut retrouver la réservation grâce au `metadata.payment_id`. Si aucun webhook n’arrive et qu’aucune référence n’a été reçue, l’équipe doit rechercher cette métadonnée dans le tableau de bord GeniusPay : ne pas supprimer la réservation ni relancer avant d’avoir prouvé l’absence de transaction. Les échecs/expirations confirmés permettent une nouvelle tentative ; un succès tardif en doublon est conservé pour vérification manuelle, sans double crédit.

Aucun envoi de mail, remboursement automatique ou paiement réel n’est exécuté par les tests. Le registre financier ne modifie pas automatiquement le statut de réalisation ; l’équipe consulte le règlement confirmé avant de commencer.

## API interne

- `GET /api/payments/geniuspay?requestId=123` : état privé du client.
- `POST /api/payments/geniuspay` avec `{ "requestId": 123 }` : ouvrir ou retrouver le checkout.
- `POST /api/payments/geniuspay/verify` avec `{ "requestId": 123, "paymentId": "UUID facultatif" }` : vérifier auprès du fournisseur.
- `GET /api/payments/geniuspay/admin?requestId=123` : état réservé à l’équipe authentifiée.
- `POST /api/payments/geniuspay/webhook` : notifications signées du fournisseur.

Les mutations client exigent une session et une origine identique au site. Limite PostgreSQL : 30 accès paiement par client et par minute. Les erreurs ne journalisent ni clés, ni réponses fournisseur complètes, ni coordonnées client.
