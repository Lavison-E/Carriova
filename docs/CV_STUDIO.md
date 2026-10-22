# Studio CV Carriova

Configuration et sources vérifiées le 18 octobre 2026.

Le Studio CV utilise les comptes clients existants, conserve les CV privés dans Neon et produit des PDF avec `@react-pdf/renderer`. L’assistance rédactionnelle facultative appelle Groq depuis le serveur Vercel. L’éditeur et l’export PDF restent utilisables lorsque l’IA est désactivée ou indisponible.

## Configuration sur Vercel

Ajouter les variables dans les paramètres du projet, pour l’environnement concerné, puis redéployer. Pour un développement local, utiliser `.env.local`, ignoré par Git. Ne jamais préfixer la clé par `NEXT_PUBLIC_`, la placer dans le navigateur, un document partagé ou un journal.

| Variable | Valeur ou rôle |
| --- | --- |
| `GROQ_API_KEY` | Clé du projet Groq, nécessaire seulement pour l’assistance IA. Conserver la valeur dans les secrets serveur. |
| `GROQ_CV_MODEL` | Modèle utilisé ; défaut : `openai/gpt-oss-120b`. La configuration accepte aussi `openai/gpt-oss-20b` ; toute autre valeur désactive l’aide. |
| `CV_AI_ENABLED` | Facultatif : avec une clé et un modèle pris en charge, l’IA est autorisée par défaut. `false` coupe les nouveaux appels ; `true` permet de rendre cette intention explicite. |
| `CV_AI_DAILY_LIMIT` | Plafond global des tentatives IA : `200` sur 24 heures glissantes par défaut, partagé entre les clients. Entier de 1 à 10 000 ; valeur invalide remplacée par 200. |

Chaque client dispose aussi d’un plafond de 10 tentatives IA sur 24 heures glissantes, avec une seule réservation en cours pendant 90 secondes au maximum. Les échecs comptent dans ces plafonds. Les métadonnées de tentative sont conservées pour gérer l’usage, sans y enregistrer le prompt ni le CV. Ces limites applicatives complètent celles de Groq ; elles ne garantissent ni une disponibilité continue ni une consommation gratuite.

Les comptes clients et la connexion `DATABASE_URL` restent ceux de Carriova. Appliquer la migration `migrations/20261018_cv.sql` via le runner existant, sur une base de test avant la production ; ne pas exécuter le seed historique pour initialiser ce module.

Le coupe-circuit à conserver pour interrompre les appels est :

```dotenv
CV_AI_ENABLED=false
```

Il s’applique aux nouveaux appels après prise en compte du déploiement. Une requête déjà transmise au fournisseur peut avoir été traitée.

## Contrat Groq à conserver

L’appel utilise `POST https://api.groq.com/openai/v1/chat/completions`, avec authentification serveur. `openai/gpt-oss-120b` accepte une réponse structurée :

```json
{
  "model": "openai/gpt-oss-120b",
  "stream": false,
  "reasoning_effort": "low",
  "include_reasoning": false,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "cv_suggestion",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": { "summary": { "type": "string" } },
        "required": ["summary"],
        "additionalProperties": false
      }
    }
  }
}
```

Cet extrait illustre le format ; le schéma applicatif complet et les messages sont définis dans le code. En mode strict, tous les champs doivent être requis et chaque objet doit refuser les propriétés supplémentaires. Les outils et le streaming ne sont pas compatibles avec ce mode. Valider aussi la réponse côté application et vérifier les refus, erreurs HTTP, contenu absent et fins de réponse interrompues. [Structured Outputs](https://console.groq.com/docs/structured-outputs).

Pour GPT-OSS, `reasoning_effort` accepte `low`, `medium` ou `high` ; `medium` est le défaut fournisseur. `include_reasoning: false` masque le raisonnement dans la réponse. Ne pas envoyer `reasoning_format`, non pris en charge pour GPT-OSS. [Raisonnement](https://console.groq.com/docs/reasoning).

Borner `max_completion_tokens` et le délai réseau. Ne pas utiliser `max_tokens`, déprécié, ni présenter `store: false` comme une garantie : `store` n’est pas pris en charge par cette API. Un changement de `GROQ_CV_MODEL` demande de revérifier la compatibilité du schéma strict et des paramètres. [Référence API](https://console.groq.com/docs/api-reference).

## Données et confidentialité

L’accord du client précède l’appel IA. La requête ne doit contenir que les éléments professionnels nécessaires : les champs d’identité et de coordonnées, cookies, identifiants de session et pièces jointes du dossier n’ont pas à être transmis. Les contenus libres restent susceptibles de contenir des informations personnelles ; cette minimisation n’est pas une anonymisation garantie. Le client relit les propositions avant de les appliquer. Les erreurs et métriques techniques ne doivent pas enregistrer de CV, prompts, réponses privées ou clés.

Groq indique pouvoir conserver des contenus jusqu’à 30 jours pour fiabilité ou investigation d’abus, davantage si une obligation légale l’impose ; les contenus conservés sont aux États-Unis. L’option Zero Data Retention est un réglage de l’organisation à vérifier dans sa console. Ce document ne confirme pas son activation et ne promet pas une conservation nulle. [Politique technique Groq](https://console.groq.com/docs/your-data).

Le complément public figure dans `/legal/confidentialite`. Le PDF historique reste inchangé. Toute évolution des données transmises, des sauvegardes ou du fournisseur doit être répercutée dans cette information avant son utilisation.

## Coûts et limites fournisseur

À la date de vérification, le tarif public standard du modèle est de **0,15 USD par million de tokens d’entrée** et **0,60 USD par million de tokens de sortie**, hors éventuels tarifs de cache ou autres modes de service. Exemple arithmétique : 3 000 tokens d’entrée et 1 500 tokens de sortie facturés représentent 0,00135 USD ; le coût réel dépend de l’usage mesuré. [Modèle et prix](https://console.groq.com/docs/model/openai/gpt-oss-120b).

Le tableau public gratuit indique 30 requêtes/minute, 1 000/jour, 8 000 tokens/minute et 200 000 tokens/jour pour ce modèle. Les limites exactes de l’organisation dans la console font foi. Un plafond Carriova de 200 demandes/jour peut donc dépasser le quota gratuit de tokens bien avant 200 CV. Respecter les réponses HTTP `429` et `Retry-After` ; éviter les relances immédiates automatiques. Régler et surveiller aussi le budget fournisseur. [Limites Groq](https://console.groq.com/docs/rate-limits).

## Licences et périmètre

Le moteur PDF `react-pdf` est sous [licence MIT](https://github.com/diegomura/react-pdf/blob/master/LICENSE). Les poids du modèle GPT-OSS sont sous [Apache-2.0](https://huggingface.co/openai/gpt-oss-120b), avec le [texte officiel de licence](https://github.com/openai/gpt-oss/blob/main/LICENSE). L’accès hébergé par Groq reste soumis à ses conditions et à sa facturation. Aucun service Reactive Resume séparé ni serveur GPU n’est nécessaire à ce parcours.

## Vérification du déploiement

- Sans clé ou avec le coupe-circuit : édition, sauvegarde privée et PDF fonctionnent ; l’assistance explique son indisponibilité.
- Avec un fournisseur simulé : accord requis, contrôle du propriétaire, quotas concurrents, erreurs et délais dépassés ne détruisent pas le CV existant.
- Vérifier le PDF sur des CV français courts et longs : accents, pagination, débordements et extraction du texte.
- Une vérification réelle du fournisseur utilise uniquement un profil synthétique autorisé, sans coordonnées ni parcours d’une personne réelle. Les tests automatisés ne doivent appeler ni Groq ni la base de production.
