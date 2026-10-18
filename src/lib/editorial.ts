import type { BlogPost } from "@/db/schema";

export type EditorialBlock =
  | { type: "paragraph"; text: string }
  | { type: "callout"; text: string; warning: boolean }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "routine"; items: { label: string; text: string }[] };

export type EditorialArticle = {
  slug: string;
  author: string;
  intro: EditorialBlock[];
  sections: { id: string; kicker: string; title: string; blocks: EditorialBlock[] }[];
  related: { href: string; category: string; title: string }[];
  cta: { title: string; text: string; label: string; href: string };
};

// Contenu éditorial fourni par CARRIOVA le 18 octobre 2026, intégré sans scripts externes.
export const jobSearchArticle: EditorialArticle = {
  "slug": "organiser-sa-recherche-emploi",
  "author": "Par l’équipe éditoriale Carriova",
  "intro": [
    {
      "type": "paragraph",
      "text": "Chercher un emploi peut rapidement devenir épuisant lorsque les candidatures s’accumulent sans réponse. On consulte les annonces, on envoie son CV, on sollicite son réseau et on attend. Pourtant, malgré tous ces efforts, les résultats ne sont pas toujours au rendez-vous."
    },
    {
      "type": "paragraph",
      "text": "La difficulté ne vient pas nécessairement d’un manque de compétences ou de motivation. Il peut aussi manquer une stratégie claire."
    },
    {
      "type": "callout",
      "text": "Une recherche d’emploi efficace ne consiste pas à postuler partout. Elle consiste à identifier les opportunités pertinentes, à préparer des candidatures adaptées et à suivre ses démarches avec méthode.",
      "warning": false
    },
    {
      "type": "paragraph",
      "text": "Voici comment organiser votre recherche pour avancer de manière plus structurée."
    }
  ],
  "sections": [
    {
      "id": "s1",
      "kicker": "ÉTAPE 1",
      "title": "Définissez précisément votre objectif professionnel",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Avant de chercher des offres, prenez le temps de définir le type de poste que vous souhaitez occuper. Interrogez-vous sur trois éléments :"
        },
        {
          "type": "list",
          "items": [
            "Votre profil : quelles sont vos compétences, vos expériences et vos qualifications ?",
            "Votre objectif : quels postes correspondent à votre niveau, à vos intérêts et à vos ambitions ?",
            "Vos critères : quel secteur, quelle localisation et quelles conditions de travail recherchez-vous ?"
          ]
        },
        {
          "type": "callout",
          "text": "Exemple : une personne qui possède des compétences en communication digitale peut cibler des postes de chargé de communication, de community manager ou d’assistant marketing digital.",
          "warning": false
        },
        {
          "type": "paragraph",
          "text": "L’objectif n’est pas de vous limiter à un seul intitulé, mais d’éviter une recherche trop dispersée."
        }
      ]
    },
    {
      "id": "s2",
      "kicker": "ÉTAPE 2",
      "title": "Identifiez les entreprises et les opportunités pertinentes",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Ne dépendez pas d’une seule source d’offres. Consultez les plateformes d’emploi, les pages carrières des entreprises, LinkedIn, les cabinets de recrutement et les réseaux professionnels. En Côte d’Ivoire, pensez aussi à suivre les communications officielles des entreprises qui vous intéressent et à développer vos relations professionnelles."
        },
        {
          "type": "paragraph",
          "text": "Pour chaque opportunité, vérifiez :"
        },
        {
          "type": "list",
          "items": [
            "La crédibilité de l’entreprise et de l’annonce.",
            "Les missions réellement proposées.",
            "Les compétences et qualifications recherchées.",
            "Les modalités et la date limite de candidature.",
            "La cohérence entre le poste et votre projet professionnel."
          ]
        },
        {
          "type": "callout",
          "text": "Restez vigilant. Méfiez-vous des annonces qui exigent des paiements suspects pour accéder à un emploi ou qui demandent des informations personnelles sensibles sans justification.",
          "warning": true
        }
      ]
    },
    {
      "id": "s3",
      "kicker": "ÉTAPE 3",
      "title": "Adaptez votre CV à chaque candidature",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Un CV générique ne permet pas toujours de faire ressortir les éléments les plus pertinents pour un poste donné. Lisez attentivement l’offre et identifiez les missions principales, les compétences attendues et les critères de sélection. Vérifiez ensuite que votre CV présente clairement les expériences et compétences qui répondent à ces besoins."
        },
        {
          "type": "paragraph",
          "text": "Si l’offre insiste sur la gestion de projets, par exemple, mettez en évidence les projets que vous avez effectivement coordonnés, votre rôle et les résultats obtenus lorsque ceux-ci sont mesurables."
        },
        {
          "type": "callout",
          "text": "Ne vous contentez pas de reprendre les mots de l’annonce : démontrez, à partir de votre parcours réel, pourquoi votre profil est pertinent.",
          "warning": false
        }
      ]
    },
    {
      "id": "s4",
      "kicker": "ÉTAPE 4",
      "title": "Préparez une candidature complète et soignée",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Avant d’envoyer votre dossier, vérifiez que votre CV est à jour, que vos coordonnées sont correctes et que votre lettre de motivation, lorsqu’elle est demandée ou pertinente, est adaptée au poste. Respectez les instructions de candidature : format des documents, objet du courriel, canal d’envoi."
        },
        {
          "type": "paragraph",
          "text": "Un message d’accompagnement peut être simple et professionnel. Il précise le poste visé, manifeste votre intérêt et invite le recruteur à consulter les documents joints."
        },
        {
          "type": "paragraph",
          "text": "Relisez l’ensemble avant l’envoi. Une candidature soignée facilite la compréhension de votre profil et témoigne de votre attention aux détails."
        }
      ]
    },
    {
      "id": "s5",
      "kicker": "ÉTAPE 5",
      "title": "Organisez le suivi de vos candidatures",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Envoyer des candidatures sans en conserver la trace complique le suivi et augmente le risque d’oublier une relance ou un entretien. Créez un tableau comme celui-ci et mettez-le à jour après chaque démarche :"
        },
        {
          "type": "table",
          "headers": [
            "Champ",
            "À noter"
          ],
          "rows": [
            [
              "Entreprise",
              "Nom de l’entreprise"
            ],
            [
              "Poste",
              "Intitulé du poste"
            ],
            [
              "Candidature",
              "Date et source de l’offre"
            ],
            [
              "Documents",
              "CV et lettre envoyés"
            ],
            [
              "Statut",
              "Envoyée, entretien, réponse…"
            ],
            [
              "Suivi",
              "Date et action prévues"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Pour relancer un recruteur, tenez compte du délai annoncé dans l’offre ou lors des échanges. En l’absence d’indication, une relance courtoise après quelques jours ouvrés peut être appropriée, selon le contexte. L’objectif : rester organisé et professionnel, sans multiplier les messages."
        }
      ]
    },
    {
      "id": "s6",
      "kicker": "ÉTAPE 6",
      "title": "Développez votre réseau professionnel",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Toutes les opportunités ne sont pas nécessairement diffusées publiquement. Votre réseau peut vous aider à découvrir des informations sur les entreprises, les métiers et les besoins du marché."
        },
        {
          "type": "paragraph",
          "text": "Reprenez contact avec d’anciens collègues, camarades de formation, responsables de stage ou professionnels de votre secteur. Sur LinkedIn, soignez votre profil et participez à des échanges pertinents. Lorsque vous contactez une personne, expliquez brièvement votre démarche et posez une question précise."
        },
        {
          "type": "callout",
          "text": "Le réseautage ne consiste pas uniquement à demander un emploi. Il permet aussi d’apprendre, de mieux comprendre un secteur et de construire des relations dans la durée.",
          "warning": false
        }
      ]
    },
    {
      "id": "s7",
      "kicker": "ÉTAPE 7",
      "title": "Analysez vos résultats et ajustez votre stratégie",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Après plusieurs candidatures, prenez du recul. Recevez-vous des invitations à des entretiens ? Vos candidatures restent-elles sans réponse ? Les offres visées correspondent-elles réellement à votre niveau ?"
        },
        {
          "type": "list",
          "items": [
            "Peu de réponses ? Examinez la pertinence de vos candidatures, la présentation de votre CV et l’adéquation entre votre profil et les postes visés.",
            "Des entretiens sans suite ? Concentrez-vous sur votre préparation, vos exemples professionnels et votre manière de présenter vos compétences."
          ]
        },
        {
          "type": "paragraph",
          "text": "Évitez de tirer des conclusions définitives à partir de quelques candidatures. Utilisez plutôt les retours disponibles et les tendances observées pour progresser."
        }
      ]
    },
    {
      "id": "routine",
      "kicker": "BONUS",
      "title": "Exemple de routine hebdomadaire",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Une organisation indicative, à adapter à votre disponibilité :"
        },
        {
          "type": "routine",
          "items": [
            {
              "label": "Lundi",
              "text": "Définir les priorités et repérer les nouvelles offres."
            },
            {
              "label": "Mardi",
              "text": "Sélectionner les opportunités pertinentes et adapter votre CV."
            },
            {
              "label": "Mercredi",
              "text": "Préparer et envoyer vos candidatures."
            },
            {
              "label": "Jeudi",
              "text": "Développer votre réseau et vous préparer aux entretiens."
            },
            {
              "label": "Vendredi",
              "text": "Mettre à jour le suivi et analyser les démarches de la semaine."
            }
          ]
        },
        {
          "type": "paragraph",
          "text": "Cette routine n’est pas une règle universelle. L’essentiel est de conserver un rythme régulier, réaliste et compatible avec vos autres obligations."
        }
      ]
    },
    {
      "id": "plan",
      "kicker": "SYNTHÈSE",
      "title": "Cherchez un emploi avec méthode, pas au hasard",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Une recherche d’emploi structurée repose sur un objectif clair, des candidatures pertinentes, un suivi rigoureux et une capacité à apprendre de ses démarches. Vous ne contrôlez pas toutes les décisions des recruteurs, mais vous pouvez améliorer la qualité de votre préparation, la cohérence de vos candidatures et la manière dont vous valorisez votre profil."
        },
        {
          "type": "callout",
          "text": "🎯 Votre prochaine action Choisissez trois postes qui correspondent réellement à votre profil. Comparez leurs exigences, identifiez les compétences à mettre en avant et adaptez votre CV en conséquence.",
          "warning": false
        },
        {
          "type": "paragraph",
          "text": "Chaque démarche réfléchie vous aide à mieux comprendre le marché et à avancer vers votre objectif professionnel."
        }
      ]
    }
  ],
  "related": [
    {
      "href": "/solutions/cv",
      "category": "CV",
      "title": "Rédiger un CV professionnel"
    },
    {
      "href": "/solutions/matching",
      "category": "Candidature",
      "title": "Adapter sa candidature à une offre"
    },
    {
      "href": "/solutions/coaching#reserver",
      "category": "Entretien",
      "title": "Préparer un entretien d’embauche"
    }
  ],
  "cta": {
    "title": "Prêt à valoriser votre profil ?",
    "text": "Un CV clair et ciblé fait toute la différence. Découvrez comment Carriova peut vous accompagner dans votre démarche.",
    "label": "Découvrir l’accompagnement Carriova",
    "href": "/solutions"
  }
};

export const editorialPosts: BlogPost[] = [
  {
    ...{
  "id": -1,
  "slug": "organiser-sa-recherche-emploi",
  "title": "Comment organiser sa recherche d’emploi pour obtenir de meilleurs résultats ?",
  "excerpt": "Une recherche d’emploi efficace ne consiste pas à postuler partout. Elle consiste à identifier les opportunités pertinentes, à préparer des candidatures adaptées et à suivre ses démarches avec méthode.",
  "content": "Chercher un emploi peut rapidement devenir épuisant lorsque les candidatures s’accumulent sans réponse. On consulte les annonces, on envoie son CV, on sollicite son réseau et on attend. Pourtant, malgré tous ces efforts, les résultats ne sont pas toujours au rendez-vous.\n\nLa difficulté ne vient pas nécessairement d’un manque de compétences ou de motivation. Il peut aussi manquer une stratégie claire.\n\nUne recherche d’emploi efficace ne consiste pas à postuler partout. Elle consiste à identifier les opportunités pertinentes, à préparer des candidatures adaptées et à suivre ses démarches avec méthode.\n\nVoici comment organiser votre recherche pour avancer de manière plus structurée.\n\n## Définissez précisément votre objectif professionnel\n\nAvant de chercher des offres, prenez le temps de définir le type de poste que vous souhaitez occuper. Interrogez-vous sur trois éléments :\n\n- Votre profil : quelles sont vos compétences, vos expériences et vos qualifications ?\n- Votre objectif : quels postes correspondent à votre niveau, à vos intérêts et à vos ambitions ?\n- Vos critères : quel secteur, quelle localisation et quelles conditions de travail recherchez-vous ?\n\nExemple : une personne qui possède des compétences en communication digitale peut cibler des postes de chargé de communication, de community manager ou d’assistant marketing digital.\n\nL’objectif n’est pas de vous limiter à un seul intitulé, mais d’éviter une recherche trop dispersée.\n\n## Identifiez les entreprises et les opportunités pertinentes\n\nNe dépendez pas d’une seule source d’offres. Consultez les plateformes d’emploi, les pages carrières des entreprises, LinkedIn, les cabinets de recrutement et les réseaux professionnels. En Côte d’Ivoire, pensez aussi à suivre les communications officielles des entreprises qui vous intéressent et à développer vos relations professionnelles.\n\nPour chaque opportunité, vérifiez :\n\n- La crédibilité de l’entreprise et de l’annonce.\n- Les missions réellement proposées.\n- Les compétences et qualifications recherchées.\n- Les modalités et la date limite de candidature.\n- La cohérence entre le poste et votre projet professionnel.\n\nRestez vigilant. Méfiez-vous des annonces qui exigent des paiements suspects pour accéder à un emploi ou qui demandent des informations personnelles sensibles sans justification.\n\n## Adaptez votre CV à chaque candidature\n\nUn CV générique ne permet pas toujours de faire ressortir les éléments les plus pertinents pour un poste donné. Lisez attentivement l’offre et identifiez les missions principales, les compétences attendues et les critères de sélection. Vérifiez ensuite que votre CV présente clairement les expériences et compétences qui répondent à ces besoins.\n\nSi l’offre insiste sur la gestion de projets, par exemple, mettez en évidence les projets que vous avez effectivement coordonnés, votre rôle et les résultats obtenus lorsque ceux-ci sont mesurables.\n\nNe vous contentez pas de reprendre les mots de l’annonce : démontrez, à partir de votre parcours réel, pourquoi votre profil est pertinent.\n\n## Préparez une candidature complète et soignée\n\nAvant d’envoyer votre dossier, vérifiez que votre CV est à jour, que vos coordonnées sont correctes et que votre lettre de motivation, lorsqu’elle est demandée ou pertinente, est adaptée au poste. Respectez les instructions de candidature : format des documents, objet du courriel, canal d’envoi.\n\nUn message d’accompagnement peut être simple et professionnel. Il précise le poste visé, manifeste votre intérêt et invite le recruteur à consulter les documents joints.\n\nRelisez l’ensemble avant l’envoi. Une candidature soignée facilite la compréhension de votre profil et témoigne de votre attention aux détails.\n\n## Organisez le suivi de vos candidatures\n\nEnvoyer des candidatures sans en conserver la trace complique le suivi et augmente le risque d’oublier une relance ou un entretien. Créez un tableau comme celui-ci et mettez-le à jour après chaque démarche :\n\nChamp | À noter\nEntreprise | Nom de l’entreprise\nPoste | Intitulé du poste\nCandidature | Date et source de l’offre\nDocuments | CV et lettre envoyés\nStatut | Envoyée, entretien, réponse…\nSuivi | Date et action prévues\n\nPour relancer un recruteur, tenez compte du délai annoncé dans l’offre ou lors des échanges. En l’absence d’indication, une relance courtoise après quelques jours ouvrés peut être appropriée, selon le contexte. L’objectif : rester organisé et professionnel, sans multiplier les messages.\n\n## Développez votre réseau professionnel\n\nToutes les opportunités ne sont pas nécessairement diffusées publiquement. Votre réseau peut vous aider à découvrir des informations sur les entreprises, les métiers et les besoins du marché.\n\nReprenez contact avec d’anciens collègues, camarades de formation, responsables de stage ou professionnels de votre secteur. Sur LinkedIn, soignez votre profil et participez à des échanges pertinents. Lorsque vous contactez une personne, expliquez brièvement votre démarche et posez une question précise.\n\nLe réseautage ne consiste pas uniquement à demander un emploi. Il permet aussi d’apprendre, de mieux comprendre un secteur et de construire des relations dans la durée.\n\n## Analysez vos résultats et ajustez votre stratégie\n\nAprès plusieurs candidatures, prenez du recul. Recevez-vous des invitations à des entretiens ? Vos candidatures restent-elles sans réponse ? Les offres visées correspondent-elles réellement à votre niveau ?\n\n- Peu de réponses ? Examinez la pertinence de vos candidatures, la présentation de votre CV et l’adéquation entre votre profil et les postes visés.\n- Des entretiens sans suite ? Concentrez-vous sur votre préparation, vos exemples professionnels et votre manière de présenter vos compétences.\n\nÉvitez de tirer des conclusions définitives à partir de quelques candidatures. Utilisez plutôt les retours disponibles et les tendances observées pour progresser.\n\n## Exemple de routine hebdomadaire\n\nUne organisation indicative, à adapter à votre disponibilité :\n\nLundi : Définir les priorités et repérer les nouvelles offres.\nMardi : Sélectionner les opportunités pertinentes et adapter votre CV.\nMercredi : Préparer et envoyer vos candidatures.\nJeudi : Développer votre réseau et vous préparer aux entretiens.\nVendredi : Mettre à jour le suivi et analyser les démarches de la semaine.\n\nCette routine n’est pas une règle universelle. L’essentiel est de conserver un rythme régulier, réaliste et compatible avec vos autres obligations.\n\n## Cherchez un emploi avec méthode, pas au hasard\n\nUne recherche d’emploi structurée repose sur un objectif clair, des candidatures pertinentes, un suivi rigoureux et une capacité à apprendre de ses démarches. Vous ne contrôlez pas toutes les décisions des recruteurs, mais vous pouvez améliorer la qualité de votre préparation, la cohérence de vos candidatures et la manière dont vous valorisez votre profil.\n\n🎯 Votre prochaine action Choisissez trois postes qui correspondent réellement à votre profil. Comparez leurs exigences, identifiez les compétences à mettre en avant et adaptez votre CV en conséquence.\n\nChaque démarche réfléchie vous aide à mieux comprendre le marché et à avancer vers votre objectif professionnel.",
  "category": "Recherche d’emploi",
  "cluster": "emploi",
  "readingTime": 7,
  "seoTitle": null,
  "seoDescription": null,
  "relatedSolution": null,
  "relatedHref": null,
  "isPublished": true
},
    publishedAt: new Date("2026-10-18T00:00:00.000Z"),
  },
];

export type PrivacyBlock =
  | { type: "paragraph" | "subheading"; text: string }
  | { type: "list"; items: string[] };

export const privacyPolicy = {
  title: "Politique de confidentialité de Carriova",
  tagline: "Révélez votre potentiel. Boostez votre carrière.",
  updated: "Dernière mise à jour : 18 octobre 2026",
  downloadHref: "/documents/politique-confidentialite-carriova-2026-10-18.pdf",
  sections: [
  {
    "number": 1,
    "title": "Notre engagement pour la protection de vos données",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Chez Carriova, nous croyons que chaque personne possède un potentiel qui mérite d'être révélé, valorisé et orienté vers de nouvelles opportunités professionnelles."
      },
      {
        "type": "paragraph",
        "text": "Pour vous accompagner dans cette démarche, certaines informations peuvent être nécessaires. Votre CV, votre parcours, vos compétences et vos coordonnées représentent des éléments importants de votre vie professionnelle. Nous considérons que leur communication doit se faire dans un cadre transparent, responsable et respectueux de votre vie privée."
      },
      {
        "type": "paragraph",
        "text": "C'est pourquoi nous nous engageons à traiter les données personnelles qui nous sont confiées avec sérieux, à limiter leur utilisation aux finalités pertinentes et à mettre en œuvre des mesures adaptées pour en assurer la protection."
      },
      {
        "type": "paragraph",
        "text": "Cette politique vous explique quelles données peuvent être collectées lorsque vous utilisez le site de Carriova, pourquoi elles sont utilisées, dans quelles circonstances elles peuvent être partagées et comment vous pouvez exercer vos droits."
      },
      {
        "type": "paragraph",
        "text": "Notre engagement est clair : vous aider à valoriser votre potentiel professionnel tout en respectant votre vie privée."
      }
    ]
  },
  {
    "number": 2,
    "title": "Présentation de Carriova et responsable du traitement",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova est une solution digitale dédiée à l'employabilité et au développement de carrière. Son ambition est d'aider les utilisateurs à mieux présenter leurs compétences, à valoriser leur parcours et à préparer leurs démarches professionnelles."
      },
      {
        "type": "paragraph",
        "text": "Le site public de Carriova est destiné à présenter la marque, ses services et ses informations, ainsi qu'à permettre aux visiteurs de prendre contact avec son équipe."
      },
      {
        "type": "paragraph",
        "text": "Certaines fonctionnalités complémentaires, notamment la création de comptes personnels et l'utilisation d'outils d'intelligence artificielle pour accompagner les candidatures, sont envisagées pour une mise en service ultérieure. Elles ne sont pas présentées dans cette politique comme des fonctionnalités déjà opérationnelles."
      },
      {
        "type": "paragraph",
        "text": "Responsable du traitement : Carriova"
      },
      {
        "type": "paragraph",
        "text": "Site web : https://carriovaci.com Contact relatif à la confidentialité : contact@carriovaci.com Pays de référence : Côte d'Ivoire"
      },
      {
        "type": "paragraph",
        "text": "L'identité juridique complète et les coordonnées professionnelles du responsable du traitement devront être précisées si nécessaire, conformément aux obligations applicables."
      }
    ]
  },
  {
    "number": 3,
    "title": "Quelles données personnelles peuvent être collectées ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Les données traitées dépendent des fonctionnalités effectivement disponibles, des informations que vous choisissez de communiquer et de la nature de votre demande."
      },
      {
        "type": "subheading",
        "text": "3.1. Informations de contact"
      },
      {
        "type": "paragraph",
        "text": "Lorsque vous contactez Carriova ou remplissez un formulaire, les informations communiquées peuvent comprendre votre nom, votre prénom, votre adresse électronique, votre numéro de téléphone et le contenu de votre message."
      },
      {
        "type": "paragraph",
        "text": "Seules les informations nécessaires à la finalité du formulaire ou de l'échange concerné doivent être demandées."
      },
      {
        "type": "subheading",
        "text": "3.2. Informations relatives à votre parcours professionnel"
      },
      {
        "type": "paragraph",
        "text": "Si vous sollicitez un service portant sur votre candidature ou votre parcours professionnel, les informations nécessaires à cette prestation peuvent comprendre :"
      },
      {
        "type": "list",
        "items": [
          "Votre formation et vos certifications.",
          "Vos expériences professionnelles.",
          "Vos compétences et vos réalisations.",
          "Vos objectifs et vos préférences professionnelles.",
          "Les informations contenues dans votre CV ou votre lettre de motivation.",
          "Les éléments d'une offre d'emploi que vous souhaitez utiliser pour adapter votre candidature."
        ]
      },
      {
        "type": "paragraph",
        "text": "Ces données ne sont collectées que dans la mesure nécessaire à la prestation demandée et selon les fonctionnalités effectivement proposées."
      },
      {
        "type": "subheading",
        "text": "3.3. Documents transmis"
      },
      {
        "type": "paragraph",
        "text": "Lorsque vous transmettez volontairement un CV, une lettre de motivation ou un autre document, les informations qu'il contient peuvent être traitées pour répondre à votre demande."
      },
      {
        "type": "paragraph",
        "text": "Nous vous invitons à vérifier vos documents avant leur transmission et à ne pas y inclure de données sensibles qui ne sont pas nécessaires à votre démarche."
      },
      {
        "type": "subheading",
        "text": "3.4. Données techniques de navigation"
      },
      {
        "type": "paragraph",
        "text": "Selon la configuration réelle du site et de son hébergement, certaines informations techniques peuvent être enregistrées, par exemple le type de navigateur, les caractéristiques de l'appareil, les journaux techniques, l'adresse IP ou les informations nécessaires à la sécurité du site."
      },
      {
        "type": "paragraph",
        "text": "Les données effectivement recueillies, les outils utilisés et les durées de conservation correspondantes devront être précisés après vérification de la configuration technique."
      },
      {
        "type": "subheading",
        "text": "3.5. Données relatives aux achats et aux prestations"
      },
      {
        "type": "paragraph",
        "text": "Si vous commandez une prestation payante, les informations nécessaires au suivi de votre commande, à la facturation et au traitement du paiement pourront être traitées."
      },
      {
        "type": "paragraph",
        "text": "Les modalités de traitement des données de paiement dépendront du prestataire utilisé et de l'intégration effectivement mise en place."
      },
      {
        "type": "subheading",
        "text": "3.6. Informations non demandées"
      },
      {
        "type": "paragraph",
        "text": "Carriova ne vous demande pas de transmettre des informations personnelles sans rapport avec votre démarche professionnelle. Évitez notamment de communiquer des données médicales, des informations relatives à votre vie privée ou d'autres données sensibles qui ne seraient pas nécessaires au service demandé."
      }
    ]
  },
  {
    "number": 4,
    "title": "Pourquoi utilisons-nous vos données ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Les données personnelles peuvent être traitées pour les finalités suivantes, lorsqu'elles correspondent à une fonctionnalité effectivement disponible ou à une demande que vous avez formulée :"
      },
      {
        "type": "list",
        "items": [
          "Répondre à vos demandes. Nous pouvons utiliser vos coordonnées et le contenu de vos messages pour vous répondre et assurer le suivi de vos sollicitations.",
          "Fournir les prestations demandées. Les informations professionnelles que vous transmettez peuvent être utilisées pour réaliser une prestation de rédaction, de révision ou de valorisation de candidature lorsque ce service est proposé et que vous l'avez sollicité.",
          "Assurer le suivi des prestations. Les données nécessaires peuvent être utilisées pour gérer une commande, communiquer avec vous au sujet d'un service ou traiter une réclamation."
        ]
      },
      {
        "type": "list",
        "items": [
          "Sécuriser et maintenir le site. Certaines données techniques peuvent être nécessaires au fonctionnement, à la maintenance et à la protection du site contre les utilisations abusives.",
          "Respecter nos obligations légales. Certaines informations peuvent être conservées ou communiquées lorsque la réglementation applicable l'exige.",
          "Améliorer nos services. Si des outils d'analyse sont effectivement mis en place, des informations appropriées pourront être utilisées pour comprendre l'utilisation du site et améliorer l'expérience des visiteurs, dans le respect des règles applicables.",
          "Communiquer sur nos services. Les communications commerciales ou promotionnelles seront encadrées conformément à la réglementation applicable, notamment lorsque le consentement préalable est requis."
        ]
      },
      {
        "type": "paragraph",
        "text": "Carriova ne doit pas réutiliser vos données pour une finalité incompatible avec celle pour laquelle elles ont été collectées sans disposer du fondement juridique approprié."
      }
    ]
  },
  {
    "number": 5,
    "title": "Quelle est la base juridique des traitements ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Chaque traitement doit reposer sur une base juridique appropriée, déterminée en fonction de sa finalité et des circonstances."
      },
      {
        "type": "paragraph",
        "text": "Selon le traitement concerné, cette base peut notamment être :"
      },
      {
        "type": "list",
        "items": [
          "Votre consentement, lorsqu'il est requis.",
          "La nécessité de fournir un service que vous avez demandé ou de prendre des mesures préalables à sa fourniture.",
          "Le respect d'une obligation légale.",
          "Un intérêt légitime, lorsque celui-ci est applicable et compatible avec vos droits et libertés."
        ]
      },
      {
        "type": "paragraph",
        "text": "Lorsque le traitement repose sur votre consentement, vous devez pouvoir le donner librement et être informé de son objet. Vous pouvez le retirer dans les conditions prévues par la réglementation applicable."
      },
      {
        "type": "paragraph",
        "text": "Le retrait du consentement ne remet pas en cause la licéité du traitement effectué avant ce retrait."
      }
    ]
  },
  {
    "number": 6,
    "title": "Intelligence artificielle : une fonctionnalité envisagée",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova prévoit d'envisager des fonctionnalités utilisant l'intelligence artificielle pour accompagner certaines démarches professionnelles, notamment l'analyse de CV, l'amélioration des candidatures et la formulation de recommandations."
      },
      {
        "type": "paragraph",
        "text": "À la date de cette version, ces fonctionnalités sont prévues pour une mise en service ultérieure et ne sont pas présentées comme déjà actives."
      },
      {
        "type": "paragraph",
        "text": "Lorsqu'une fonctionnalité d'intelligence artificielle sera effectivement déployée, Carriova devra informer les utilisateurs des catégories de données traitées, des finalités poursuivies et, lorsque cela est pertinent, des prestataires technologiques impliqués."
      },
      {
        "type": "paragraph",
        "text": "Les données transmises à ces prestataires devront être limitées à ce qui est nécessaire au service concerné et protégées par des garanties adaptées."
      },
      {
        "type": "paragraph",
        "text": "Le recours à l'intelligence artificielle ne devra pas être présenté comme une garantie de recrutement, de sélection ou d'obtention d'un emploi. Les résultats générés pourront nécessiter une vérification et ne devront pas être considérés comme une évaluation définitive de la valeur professionnelle d'une personne."
      },
      {
        "type": "paragraph",
        "text": "Toute utilisation des données à des fins supplémentaires, notamment pour l'entraînement de modèles, devra faire l'objet d'une évaluation juridique préalable et des informations et autorisations nécessaires."
      },
      {
        "type": "paragraph",
        "text": "Cette section devra être actualisée avant la mise en service des fonctionnalités concernées."
      }
    ]
  },
  {
    "number": 7,
    "title": "Comptes utilisateurs : une fonctionnalité envisagée",
    "blocks": [
      {
        "type": "paragraph",
        "text": "La création d'un compte personnel fait partie des fonctionnalités envisagées dans le développement de Carriova."
      },
      {
        "type": "paragraph",
        "text": "À la date de cette version, la création de comptes utilisateurs est prévue, mais n'est pas présentée comme déjà disponible."
      },
      {
        "type": "paragraph",
        "text": "Si cette fonctionnalité est activée, une politique actualisée précisera les données nécessaires à la création et à la gestion du compte, les modalités d'authentification, la gestion des documents, les règles de conservation, ainsi que les procédures permettant de demander la fermeture du compte ou la suppression des données lorsque les conditions légales sont réunies."
      },
      {
        "type": "paragraph",
        "text": "Les informations relatives aux profils, aux CV, aux candidatures, à l'historique ou aux autres fonctionnalités personnelles ne devront être ajoutées à la présente politique comme des traitements opérationnels qu'après vérification de leur mise en œuvre réelle."
      }
    ]
  },
  {
    "number": 8,
    "title": "Avec qui vos données peuvent-elles être partagées ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova ne destine pas vos informations personnelles à une diffusion publique. Un partage ne doit intervenir que lorsqu'il est nécessaire, justifié et conforme à la réglementation applicable."
      },
      {
        "type": "paragraph",
        "text": "Selon les services réellement utilisés, les destinataires peuvent notamment inclure :"
      },
      {
        "type": "list",
        "items": [
          "Les prestataires d'hébergement et de maintenance, lorsqu'ils interviennent dans le fonctionnement ou la sécurisation du site.",
          "Les prestataires techniques, lorsqu'ils fournissent un service effectivement intégré à la plateforme et nécessitent un accès aux données pour exécuter leur mission.",
          "Les prestataires de paiement, si une solution de paiement est mise en place et si une transaction nécessite leur intervention.",
          "Les prestataires d'intelligence artificielle, uniquement lorsqu'une fonctionnalité correspondante est effectivement activée et qu'un traitement externe est nécessaire.",
          "Les partenaires professionnels, lorsqu'un partage est nécessaire à un service que vous avez expressément demandé ou repose sur un autre fondement juridique valable.",
          "Les autorités compétentes, lorsque la communication est imposée par la loi ou intervient dans le cadre d'une procédure légalement applicable."
        ]
      },
      {
        "type": "paragraph",
        "text": "Les intégrations techniques, les prestataires et les partenaires concernés devront être identifiés avant leur mise en service. Cette politique ne signifie pas qu'ils sont tous actuellement connectés au site."
      },
      {
        "type": "paragraph",
        "text": "Carriova ne vend pas vos CV ni vos données personnelles à des tiers à des fins de revente."
      },
      {
        "type": "paragraph",
        "text": "Lorsqu'un prestataire traite des données pour le compte de Carriova, les obligations appropriées de confidentialité, de sécurité et de limitation des usages devront être mises en place."
      }
    ]
  },
  {
    "number": 9,
    "title": "Hébergement et transferts de données",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Les données traitées par un service numérique peuvent, selon l'infrastructure et les prestataires réellement utilisés, être hébergées ou traitées dans différents pays."
      },
      {
        "type": "paragraph",
        "text": "La localisation effective des données de Carriova n'est pas définie dans la présente politique. Elle devra être vérifiée auprès des fournisseurs utilisés avant la mise en production des traitements concernés."
      },
      {
        "type": "paragraph",
        "text": "Si des données sont transférées en dehors de la Côte d'Ivoire, Carriova devra vérifier les conditions légales applicables à ces transferts et mettre en place les formalités et garanties requises."
      },
      {
        "type": "paragraph",
        "text": "Les informations relatives aux prestataires, aux pays concernés et aux garanties applicables devront être précisées lorsque cela est nécessaire."
      }
    ]
  },
  {
    "number": 10,
    "title": "Combien de temps conservons-nous vos données ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova applique le principe selon lequel les données personnelles ne doivent pas être conservées au-delà de la durée nécessaire aux finalités pour lesquelles elles ont été collectées, sous réserve des obligations légales applicables."
      },
      {
        "type": "paragraph",
        "text": "Les durées précises de conservation de Carriova restent à définir. Elles ne sont donc pas indiquées ici sous la forme de délais chiffrés qui ne seraient pas encore validés."
      },
      {
        "type": "paragraph",
        "text": "Avant la mise en service des traitements concernés, Carriova devra établir des durées ou des critères de conservation pour les principales catégories de données, notamment :"
      },
      {
        "type": "list",
        "items": [
          "Les messages reçus par les formulaires de contact.",
          "Les CV et autres documents transmis dans le cadre d'une prestation.",
          "Les données de suivi des prestations et des commandes.",
          "Les données de facturation soumises à des obligations légales.",
          "Les journaux techniques et les données nécessaires à la sécurité.",
          "Les données de compte, si la création de comptes est activée."
        ]
      },
      {
        "type": "paragraph",
        "text": "À l'expiration de la durée applicable, les données devront être supprimées ou anonymisées lorsque cela est approprié, sauf si leur conservation demeure légalement justifiée."
      },
      {
        "type": "paragraph",
        "text": "La durée de conservation devra être documentée et communiquée de manière suffisamment précise aux personnes concernées."
      }
    ]
  },
  {
    "number": 11,
    "title": "Comment protégeons-nous vos données ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova entend mettre en place des mesures techniques et organisationnelles proportionnées à la nature des données traitées et aux risques associés."
      },
      {
        "type": "paragraph",
        "text": "Selon l'architecture et les fonctionnalités effectivement déployées, ces mesures peuvent comprendre :"
      },
      {
        "type": "list",
        "items": [
          "La limitation des accès aux personnes autorisées.",
          "La sécurisation des comptes et des environnements techniques.",
          "La protection des communications et des transferts de données.",
          "La prévention des accès non autorisés et des usages abusifs.",
          "La gestion des autorisations accordées aux prestataires.",
          "Des procédures de maintenance, de sauvegarde et de traitement des incidents."
        ]
      },
      {
        "type": "paragraph",
        "text": "Ces mesures doivent être effectivement mises en œuvre et vérifiées. Leur mention dans cette politique ne constitue pas une affirmation selon laquelle chaque dispositif est déjà opérationnel."
      },
      {
        "type": "paragraph",
        "text": "Aucun système ne peut garantir un risque nul. Carriova devra donc prévoir des procédures appropriées de gestion des incidents et respecter les obligations d'information ou de notification qui lui seraient applicables."
      },
      {
        "type": "paragraph",
        "text": "De votre côté, nous vous recommandons de ne transmettre que les informations nécessaires à votre demande et de protéger vos comptes et vos moyens d'accès lorsque de telles fonctionnalités seront disponibles."
      }
    ]
  },
  {
    "number": 12,
    "title": "Quels sont vos droits ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Dans les conditions prévues par la législation applicable, vous pouvez disposer de droits concernant les données personnelles qui vous concernent."
      },
      {
        "type": "list",
        "items": [
          "Droit à l'information : être informé des traitements réalisés sur vos données.",
          "Droit d'accès : demander si des données vous concernant sont traitées et accéder aux informations communicables.",
          "Droit de rectification : demander la correction de données inexactes ou incomplètes.",
          "Droit d'opposition : vous opposer à certains traitements lorsque les conditions légales sont réunies.",
          "Droit à l'effacement : demander la suppression de vos données lorsque les conditions prévues par la loi sont remplies.",
          "Droit de retrait du consentement : retirer votre consentement lorsque le traitement repose sur celui-ci, pour l'avenir."
        ]
      },
      {
        "type": "paragraph",
        "text": "D'autres droits peuvent être applicables selon la nature du traitement et la réglementation en vigueur."
      },
      {
        "type": "paragraph",
        "text": "L'exercice de ces droits ne dispense pas Carriova de conserver les informations dont la conservation demeure légalement obligatoire. Toute restriction ou tout refus devra reposer sur un fondement applicable."
      }
    ]
  },
  {
    "number": 13,
    "title": "Comment exercer vos droits ?",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Pour toute demande relative à vos données personnelles, vous pouvez écrire à : contact@carriovaci.com"
      },
      {
        "type": "paragraph",
        "text": "Afin de faciliter le traitement de votre demande, indiquez son objet et, si possible, le formulaire, le service ou l'échange auquel elle se rapporte."
      },
      {
        "type": "paragraph",
        "text": "Carriova pourra vous demander des informations complémentaires raisonnablement nécessaires pour vérifier votre identité et empêcher un accès non autorisé à vos données."
      },
      {
        "type": "paragraph",
        "text": "Votre demande sera examinée dans les conditions et délais prévus par la réglementation applicable."
      },
      {
        "type": "paragraph",
        "text": "Si vous estimez que vos droits ne sont pas respectés, vous pourrez également contacter l'autorité ivoirienne compétente en matière de protection des données personnelles, selon les procédures en vigueur."
      }
    ]
  },
  {
    "number": 14,
    "title": "Cookies et technologies similaires",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Les cookies et technologies similaires peuvent servir à assurer le fonctionnement d'un site, à mémoriser des préférences, à mesurer l'audience ou à proposer des fonctionnalités complémentaires."
      },
      {
        "type": "paragraph",
        "text": "Les cookies et outils de suivi effectivement utilisés sur Carriova n'ont pas encore été confirmés dans le cadre de cette politique. Il n'est donc pas possible d'affirmer ici que le site utilise uniquement des cookies nécessaires, ni qu'il utilise ou n'utilise pas des outils d'analyse ou de publicité."
      },
      {
        "type": "paragraph",
        "text": "La configuration réelle devra être examinée avant la mise en ligne définitive de cette section."
      },
      {
        "type": "paragraph",
        "text": "Si des cookies ou traceurs soumis à consentement sont utilisés, Carriova devra prévoir un mécanisme de gestion des préférences conforme aux exigences applicables. Les utilisateurs devront recevoir une information claire sur les finalités, les catégories de traceurs, les choix disponibles et, lorsque cela est requis, les durées de conservation."
      },
      {
        "type": "paragraph",
        "text": "Cette section sera mise à jour après vérification des outils installés sur le site et de leur fonctionnement réel."
      }
    ]
  },
  {
    "number": 15,
    "title": "Communications commerciales",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Carriova pourra proposer des informations relatives à ses services, à ses conseils carrière ou à ses nouveautés lorsque des dispositifs de communication seront effectivement mis en place."
      },
      {
        "type": "paragraph",
        "text": "Les communications promotionnelles devront respecter les règles applicables, notamment celles relatives au consentement préalable lorsqu'il est requis, à l'information des destinataires et à la possibilité de se désinscrire."
      },
      {
        "type": "paragraph",
        "text": "La collecte d'une adresse électronique ou d'un numéro de téléphone pour répondre à une demande ne signifie pas automatiquement que cette personne accepte de recevoir des communications promotionnelles."
      },
      {
        "type": "paragraph",
        "text": "Les canaux de communication, notamment le courrier électronique ou WhatsApp, devront être décrits en fonction des intégrations réellement utilisées."
      }
    ]
  },
  {
    "number": 16,
    "title": "Liens vers des sites tiers",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Le site Carriova peut comporter des liens vers des sites ou plateformes externes."
      },
      {
        "type": "paragraph",
        "text": "Lorsqu'un utilisateur accède à un site tiers, les pratiques de traitement de données de ce site relèvent de ses propres conditions et de sa politique de confidentialité."
      },
      {
        "type": "paragraph",
        "text": "Nous recommandons aux visiteurs de consulter ces documents avant de communiquer des informations personnelles sur une plateforme externe."
      }
    ]
  },
  {
    "number": 17,
    "title": "Données des mineurs",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Les services de Carriova peuvent intéresser des personnes à différents stades de leur parcours éducatif et professionnel."
      },
      {
        "type": "paragraph",
        "text": "Lorsque des données concernant un mineur sont susceptibles d'être traitées, Carriova devra vérifier les règles applicables à son âge, à la nature du service et aux conditions de collecte, notamment les éventuelles exigences d'autorisation ou d'intervention d'un représentant légal."
      },
      {
        "type": "paragraph",
        "text": "Aucune procédure spécifique concernant les mineurs ne doit être considérée comme opérationnelle tant qu'elle n'a pas été définie et mise en place."
      }
    ]
  },
  {
    "number": 18,
    "title": "Modifications de la présente politique",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Cette politique peut être actualisée pour tenir compte de l'évolution des services de Carriova, de nouvelles fonctionnalités, de changements techniques ou de modifications de la réglementation applicable."
      },
      {
        "type": "paragraph",
        "text": "La version en vigueur sera publiée sur cette page avec sa date de mise à jour."
      },
      {
        "type": "paragraph",
        "text": "Lorsque des modifications importantes nécessitent d'informer les utilisateurs, Carriova prendra les mesures appropriées conformément aux obligations applicables."
      },
      {
        "type": "paragraph",
        "text": "Les sections concernant les comptes utilisateurs, l'intelligence artificielle, les cookies, les prestataires et les durées de conservation devront notamment être réexaminées avant le déploiement des fonctionnalités correspondantes."
      }
    ]
  },
  {
    "number": 19,
    "title": "Contact",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Pour toute question concernant cette politique ou le traitement de vos données personnelles, vous pouvez nous contacter à l'adresse suivante :"
      },
      {
        "type": "paragraph",
        "text": "E-mail : contact@carriovaci.com Site web : https://carriovaci.com"
      },
      {
        "type": "paragraph",
        "text": "Chez Carriova, nous voulons que vous puissiez avancer dans votre parcours professionnel avec confiance, en comprenant comment vos informations sont utilisées et quels sont vos droits."
      },
      {
        "type": "paragraph",
        "text": "CARRIOVA — Révélez votre potentiel. Boostez votre carrière."
      }
    ]
  }
]
} satisfies {
  title: string;
  tagline: string;
  updated: string;
  downloadHref: string;
  sections: { number: number; title: string; blocks: PrivacyBlock[] }[];
};
