# Catalogue d’emploi

La page `/emploi`, ses fiches et les offres de l’accueil utilisent `src/lib/job-catalog.ts`.

- Flux public officiel Accor / SmartRecruiters pour la Côte d’Ivoire, relu toutes les 15 minutes à la prochaine consultation. Chaque fiche est contrôlée : recruteur attendu, visibilité publique, `active=true`, pays CI, date non future et publication dans les 60 derniers jours. Les annonces avec échéance explicite dépassée (ou non interprétable) sont exclues. Les réponses en cache de plus de 24 heures ne sont plus exposées.
- Sélection éditoriale UNFPA/UNICEF dans `src/lib/selected-opportunities.ts`, vérifiée sur les annonces officielles le 18 octobre 2026. Les heures de clôture sont converties en UTC. Une annonce est masquée à sa clôture ou après sept jours sans revue. Pour en ajouter, vérifier la fiche et les modalités chez le recruteur, renseigner l’URL officielle, la date de vérification réelle et l’échéance exacte. Laisser la date de publication nulle quand elle n’est pas communiquée. Ne jamais repousser une date de vérification sans relire la source.
- Les offres provenant d’un autre site n’impliquent aucun partenariat. Les candidatures restent sur le site du recruteur ; aucun achat Carriova n’est nécessaire.
- Les anciens enregistrements de la table `jobs` sont préservés, mais ne sont plus publiés sans preuve de source. La table était vide au raccordement de ce catalogue. Il n’y a ni écrasement ni réensemencement de la base.
- Le site ne promet ni couverture exhaustive, ni salaire, ni résultat de recrutement. Les champs contradictoires (par exemple temps plein/partiel) ne sont pas résolus par supposition.
- Une panne de flux laisse les autres sources disponibles. L’interface indique quand la sélection est incomplète. Aucune clé API ni variable supplémentaire n’est nécessaire pour ce flux public.

Sources techniques : https://developers.smartrecruiters.com/docs/endpoints
Sources des sélections : https://www.unfpa.org/jobs et https://jobs.unicef.org/en-us/filter/?location=cote+d%27ivoire

Validation : tests de normalisation, fermeture, vieillissement, filtrage, URLs autorisées et panne de source dans `tests/opportunities.test.cjs`. Vérifier également les fiches et le lien « Postuler chez le recruteur » en navigateur après chaque évolution de source.
