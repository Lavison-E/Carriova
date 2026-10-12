# CARRIOVA

Plateforme de carrière et d’employabilité pensée pour accompagner les candidats en Côte d’Ivoire et en Afrique de l’Ouest. CARRIOVA aide chacun à valoriser son parcours, préparer ses candidatures, explorer des opportunités et faire progresser sa carrière.

Site : [www.carriovaci.com](https://www.carriovaci.com)

## Ce que propose le site

- Des parcours et conseils pour créer ou améliorer son CV et sa lettre de motivation.
- Des offres d’emploi, des ressources et des contenus consacrés à la carrière.
- Des demandes de coaching, des formulaires de contact et des demandes de création de compte.
- Des pages de solutions autour du matching emploi-profil et de l’expertise humaine.
- Des intégrations facultatives pour les notifications e-mail, WhatsApp, un CRM et l’analytics.

Le contenu éditorial, les offres, les FAQ et plusieurs données du site sont gérés dans PostgreSQL.

## Stack technique

- [Next.js 16](https://nextjs.org/) avec App Router
- [React 19](https://react.dev/) et TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- PostgreSQL avec [Drizzle ORM](https://orm.drizzle.team/)

## Prérequis

- Node.js 20.9 ou ultérieur et npm
- Une base PostgreSQL accessible

## Installation locale

```bash
git clone https://github.com/Lavison-E/Carriova.git
cd Carriova
npm ci
```

Créez votre fichier d’environnement local à partir du modèle :

```bash
cp .env.example .env
```

Sous PowerShell, utilisez plutôt :

```powershell
Copy-Item .env.example .env
```

Configurez `DATABASE_URL` avec l’URL PostgreSQL pooled de Neon. Pour les opérations de schéma, ajoutez de préférence l’URL directe de Neon dans `DATABASE_URL_UNPOOLED`; à défaut, Drizzle réutilise `DATABASE_URL`. Gardez ces URL secrètes. Les autres intégrations sont facultatives et restent désactivées si elles ne sont pas configurées. Consultez les commentaires de [`.env.example`](.env.example) pour connaître chaque variable.

Le schéma est défini dans `src/db/schema.ts`. Pour créer les tables d’une base Neon vide avec une migration versionnée :

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

La migration générée dans `drizzle/` doit être commitée avec le changement de schéma. Pour les évolutions suivantes, régénérez puis appliquez la migration :

```bash
npm run db:generate
npm run db:migrate
```

`npm run db:push` applique directement le schéma sans créer de migration versionnée; réservez-le au prototypage et ne le mélangez pas avec l’historique des migrations d’une même base.

Démarrez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

Sans `DATABASE_URL`, les pages de présentation restent consultables avec des listes de contenu vides. Les formulaires ne prétendent pas enregistrer de demandes et `/api/health` renvoie HTTP 503. Une base configurée mais inaccessible reste une erreur explicite.

L’inscription enregistre une demande d’accompagnement. L’espace personnel et la connexion authentifiée ne sont pas encore disponibles.

## Commandes disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur Next.js en développement. |
| `npm run build` | Produit le build de production. |
| `npm run start` | Démarre le build de production. |
| `npm test` | Vérifie les cas de régression serveur sans base externe. |
| `npm run lint` | Vérifie le code avec ESLint. |
| `npm run typecheck` | Vérifie les types TypeScript. |

## Variables et intégrations

Les variables serveur sensibles ne doivent jamais être préfixées par `NEXT_PUBLIC_`. Ne publiez pas votre fichier `.env` ni de clés, jetons ou mots de passe. `.env` est ignoré par Git; seul `.env.example`, sans secrets, est destiné au dépôt.

Intégrations activables selon les besoins :

- Resend pour les notifications et accusés de réception par e-mail.
- WhatsApp Business Cloud API pour les confirmations de contact.
- Webhook CRM signé en HMAC-SHA256.
- Plausible Analytics, vérification Google Search Console et Bing Webmaster Tools.
- API d’administration des leads protégée par un jeton.

Les paramètres requis, règles de validation et comportements lorsque ces variables sont absentes sont documentés dans `.env.example` et validés côté serveur.

## Données et contenu

Les tables PostgreSQL et leurs types sont déclarés dans `src/db/schema.ts`. La configuration Drizzle utilise `DATABASE_URL_UNPOOLED` lorsqu’elle est fournie, sinon `DATABASE_URL`.

Les routes API principales sont :

- `POST /api/leads` pour les demandes et inscriptions liées aux leads.
- `GET /api/admin/leads` pour exporter les leads en CSV avec le jeton d’administration.
- `POST /api/events` pour enregistrer des événements.
- `GET /api/health` pour le contrôle de santé.

## Déploiement

Le site peut être déployé sur une plateforme compatible avec Next.js, par exemple Vercel, avec une base PostgreSQL accessible depuis l’application. Configurez les variables nécessaires dans l’environnement de déploiement avant le build; les valeurs `NEXT_PUBLIC_*` sont intégrées au build et nécessitent une nouvelle compilation après modification.

Définissez notamment `DATABASE_URL` et `NEXT_PUBLIC_SITE_URL` en production. N’activez les intégrations qu’après avoir configuré leurs secrets et vérifié leurs services externes. Avant un déploiement, lancez les vérifications du projet :

```bash
npm run lint
npm run typecheck
npm run build
```

## Dépôt

Le dépôt GitHub associé est [Lavison-E/Carriova](https://github.com/Lavison-E/Carriova).
