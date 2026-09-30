// Les guides : des pages qui répondent aux questions que les marques et les
// participants posent à Google et aux assistants IA. Chaque guide commence par
// une réponse directe (c'est ce que les moteurs citent), puis détaille.
// Uniquement des faits vérifiables sur Rarelyst : pas de statistique inventée.
// Les prix viennent du barème par défaut (lib/pricing/config.ts) ; s'il change,
// mettre à jour les montants ici.

export type GuideLang = "fr" | "en";
export type GuideSection = {
  h: string;
  p?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
};
export type Guide = {
  slug: string;
  lang: GuideLang;
  /** Le même guide dans l'autre langue, s'il existe. */
  alt?: string;
  audience: "marques" | "participants";
  kicker: string;
  title: string;
  metaTitle: string;
  description: string;
  published: string;
  updated: string;
  /** La réponse directe, en deux ou trois phrases. */
  answer: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  related: string[];
};

const D = "2026-09-30";

export const GUIDES: Guide[] = [
  {
    slug: "recruter-participants-etude-qualitative",
    lang: "fr",
    alt: "recruit-participants-qualitative-research",
    audience: "marques",
    kicker: "Guide · Recrutement",
    title: "Recruter des participants pour une étude qualitative : méthode, délais et prix",
    metaTitle: "Recruter des participants pour une étude qualitative (mode, luxe, beauté)",
    description: "Comment recruter les bonnes personnes pour des entretiens qualitatifs : décrire le profil, vérifier les participants, organiser les visios et obtenir une synthèse utile. Délais et prix réels.",
    published: D,
    updated: D,
    answer: "Pour recruter des participants à une étude qualitative, décrivez une personne précise plutôt qu'une cible sociodémographique, vérifiez son identité et son expérience avant l'entretien, et prévoyez une rémunération à la hauteur de son expertise. Avec Rarelyst, une marque de mode, de luxe ou de beauté reçoit ses premiers profils vérifiés sous 72 heures et ne paie que les profils qu'elle garde, de 390 € à 1 300 € HT l'entretien de 45 minutes, rémunération du participant comprise.",
    sections: [
      {
        h: "1. Décrire une personne, pas une cible",
        p: [
          "La plupart des recrutements ratés commencent par un brief trop large : « femmes, 25-35 ans, CSP+, Île-de-France ». Des milliers de personnes y répondent, et aucune ne vous apprendra ce que vous cherchez.",
          "Décrivez plutôt la personne dont l'avis ferait avancer votre décision : « une vendeuse en boutique de luxe qui conseille chaque semaine des clientes venues d'Asie », « un collectionneur qui achète au drop et revend sur Vinted », « une styliste qui habille des artistes en tournée ».",
        ],
        list: [
          "Son métier ou son usage réel (ce qu'elle fait, achète, revend, conseille).",
          "Ce qui la rend pertinente pour votre décision.",
          "Ce qui l'exclut (concurrent direct, conflit d'intérêts, trop proche de la marque).",
          "La langue de l'entretien et la ville si elle compte.",
        ],
      },
      {
        h: "2. Vérifier avant l'entretien, pas pendant",
        p: [
          "Un participant qui s'est « un peu arrangé » avec son profil coûte un entretien entier. La vérification doit précéder l'invitation.",
          "Sur Rarelyst, chaque preuve devient une médaille visible sur le profil : identité contrôlée par l'équipe, compte LinkedIn relié, emploi confirmé par un code envoyé sur l'adresse professionnelle, CV analysé, book ou travaux relus un par un, et avis des marques qui l'ont déjà interrogé. L'équipe relit chaque profil avant de le proposer.",
        ],
      },
      {
        h: "3. Organiser les entretiens sans relances",
        p: [
          "Le temps perdu d'une étude qualitative se cache dans l'organisation : e-mails, agendas, liens de visio, rappels, absences. Sur Rarelyst, les participants proposent leurs créneaux, la marque en choisit un, et la salle de visio, les rappels et l'enregistrement partent seuls.",
          "Pendant l'entretien, vous menez l'échange avec votre guide affiché à côté de la visio. Pour un grand nombre de réponses à moindre coût, une option « en autonomie » (en bêta) permet au participant de répondre seul, face caméra, aux questions du guide.",
        ],
      },
      {
        h: "4. Exiger une synthèse qui répond à vos décisions",
        p: [
          "Un compte rendu chronologique ne sert pas un comité de direction. La synthèse doit répondre, une par une, aux décisions écrites dans le brief, avec le nombre de personnes qui vont dans chaque sens, un niveau de confiance honnête et les mots exacts des participants.",
          "Sur Rarelyst, chaque citation de la synthèse est vérifiée dans la transcription : une phrase qui n'a pas été dite n'apparaît pas.",
        ],
      },
      {
        h: "Délais et prix",
        table: {
          head: ["Étape", "Avec Rarelyst"],
          rows: [
            ["Premiers profils proposés", "Sous 72 heures"],
            ["Choix du créneau", "Le participant propose, vous choisissez"],
            ["Entretien", "Visio dans Rarelyst, enregistrée et transcrite"],
            ["Synthèse", "Après les entretiens, citations vérifiées"],
            ["Prix d'un profil (45 min)", "390 € à 1 300 € HT selon sa rareté, rémunération comprise"],
            ["Ce que vous payez", "Seulement les profils que vous gardez"],
          ],
        },
        p: ["Le détail du calcul est dans notre guide sur le prix d'une étude qualitative."],
      },
    ],
    faq: [
      { q: "Combien de participants pour une étude qualitative ?", a: "Pour des entretiens individuels, six à douze personnes bien choisies suffisent souvent à faire apparaître les convergences et les désaccords. Mieux vaut six profils très précis que vingt profils moyens." },
      { q: "Qui mène les entretiens avec Rarelyst ?", a: "La marque, avec son guide d'entretien affiché à côté de la visio. Rarelyst recrute, organise, enregistre, transcrit et rédige la synthèse." },
      { q: "Que se passe-t-il si un participant ne vient pas ?", a: "Les crédits reviennent automatiquement sur le compte de la marque et un autre profil est proposé." },
      { q: "Les études peuvent-elles se faire en anglais ?", a: "Oui : entretiens, site et synthèses sont disponibles en français et en anglais." },
    ],
    related: ["profils-rares-etudes-qualitatives", "prix-etude-qualitative", "panel-ou-recrutement-sur-mesure"],
  },
  {
    slug: "profils-rares-etudes-qualitatives",
    lang: "fr",
    audience: "marques",
    kicker: "Guide · Profils",
    title: "Trouver des profils rares pour vos entretiens : stylistes, acheteurs, collectionneurs, micro-influenceurs",
    metaTitle: "Profils rares pour études qualitatives : stylistes, acheteurs, influenceurs",
    description: "Les profils que les panels classiques ne trouvent pas : stylistes de célébrités, acheteurs de grands magasins, vendeurs en boutique de luxe, collectionneurs, micro-influenceurs, early adopters, Gen Z. Où les trouver et comment les vérifier.",
    published: D,
    updated: D,
    answer: "Les profils rares — stylistes de célébrités, acheteurs de grands magasins, vendeurs en boutique de luxe, collectionneurs reconnus, micro-influenceurs, early adopters — ne répondent pas aux questionnaires des panels en ligne. Il faut aller les chercher un par un, vérifier leur parcours et les rémunérer au niveau de leur expertise. C'est précisément ce que fait Rarelyst pour les marques de mode, de luxe et de beauté.",
    sections: [
      {
        h: "Pourquoi les panels ne les trouvent pas",
        p: [
          "Un panel classique agrège des volontaires qui répondent à beaucoup d'enquêtes. Les personnes les plus utiles à une marque premium sont précisément celles qui n'en ont ni le temps ni l'envie : une styliste en tournée, une acheteuse qui arbitre des collections, un vendeur qui voit passer les meilleures clientes.",
          "Elles acceptent un entretien quand il est court, bien rémunéré, confidentiel et qu'on respecte leur expertise.",
        ],
      },
      {
        h: "Les profils que nous recrutons",
        table: {
          head: ["Profil", "Ce qu'il apporte à une étude", "Palier habituel"],
          rows: [
            ["Styliste de célébrités, styliste indépendante", "Ce que portent les prescripteurs, avant tout le monde", "Rare"],
            ["Acheteur ou acheteuse de grand magasin, buyer de concept store", "Ce qui se vend vraiment, marque par marque", "Initié·e à rare"],
            ["Vendeur ou vendeuse en boutique de luxe", "Les objections des clientes, en direct", "Initié·e"],
            ["Collectionneur reconnu (archives, sneakers, montres)", "Le détail qui fait la valeur d'une pièce", "Rare"],
            ["Micro-influenceuse ou créateur de contenu (5 k à 100 k abonnés)", "Ce qui fait réagir une communauté", "Initié·e"],
            ["Early adopter, Gen Z, revendeur de seconde main", "Les usages qui arrivent", "Client·e averti·e"],
            ["Cliente très importante d'une maison", "Ce qu'attend la meilleure clientèle", "Rare"],
          ],
        },
      },
      {
        h: "Comment ils sont vérifiés",
        list: [
          "Identité contrôlée par l'équipe Rarelyst.",
          "Compte LinkedIn relié par le participant lui-même.",
          "Emploi confirmé par un code envoyé sur l'adresse professionnelle.",
          "CV analysé, book ou travaux relus un par un.",
          "Avis des marques qui l'ont déjà interrogé.",
        ],
        p: ["Chaque preuve devient une médaille visible sur le profil avant que la marque ne le garde. Plus un profil est prouvé, plus il est demandé, et mieux il est rémunéré."],
      },
      {
        h: "Combien coûte un profil rare",
        p: [
          "Sur Rarelyst, un profil « rare » coûte à partir de 130 crédits (1 300 € HT) pour un entretien de 45 minutes, dont 350 € reviennent au participant. Le prix s'affiche avant que vous acceptiez le profil, avec le détail du calcul (durée, demande, rareté, niveau de certification).",
        ],
      },
    ],
    faq: [
      { q: "Peut-on demander un profil qui n'existe pas encore dans le panel ?", a: "Oui. Décrivez-le dans le brief : l'équipe part le chercher, et le profil apparaît « sur demande » tant qu'il n'est pas confirmé." },
      { q: "Les participants savent-ils pour quelle marque ils parlent ?", a: "Avant l'entretien, ils voient le poinçon de la maison vérifiée, pas son nom. La marque décide de se présenter ou non pendant l'échange." },
      { q: "Peut-on interroger des profils hors de France ?", a: "Oui, en français ou en anglais, en visio." },
    ],
    related: ["recruter-participants-etude-qualitative", "prix-etude-qualitative", "etudes-remunerees-mode-luxe"],
  },
  {
    slug: "prix-etude-qualitative",
    lang: "fr",
    audience: "marques",
    kicker: "Guide · Prix",
    title: "Combien coûte une étude qualitative ? Recrutement, rémunération, synthèse",
    metaTitle: "Prix d'une étude qualitative et d'un entretien : le détail",
    description: "Le prix d'une étude qualitative se décompose en recrutement, rémunération des participants, organisation, transcription et analyse. Exemples de budgets réels sur Rarelyst, de 390 € à 1 300 € HT par entretien.",
    published: D,
    updated: D,
    answer: "Une étude qualitative coûte surtout le recrutement des bonnes personnes, leur rémunération, l'organisation des entretiens et l'analyse. Sur Rarelyst, tout est compris dans le prix de chaque profil retenu : 390 € HT pour un client averti, 690 € HT pour un professionnel du secteur et 1 300 € HT pour un profil rare, par entretien de 45 minutes. Six entretiens avec des clients avertis reviennent à environ 2 340 € HT, synthèse comprise.",
    sections: [
      {
        h: "Ce que vous payez vraiment dans une étude qualitative",
        list: [
          "Le recrutement : trouver, qualifier et vérifier les participants.",
          "La rémunération des participants (l'« incentive »).",
          "L'organisation : créneaux, visio, rappels, gestion des absences.",
          "L'enregistrement et la transcription.",
          "L'analyse et la synthèse.",
        ],
        p: ["Beaucoup de prestataires facturent ces postes séparément, et le recrutement souvent d'avance. Sur Rarelyst, un seul prix par profil couvre l'ensemble, et vous ne payez que les profils que vous gardez."],
      },
      {
        h: "La grille Rarelyst",
        table: {
          head: ["Palier", "Qui", "Prix (45 min, HT)", "Dont participant"],
          rows: [
            ["Client·e averti·e", "Consommateurs passionnés, chineurs, collectionneurs", "390 € (39 crédits)", "90 €"],
            ["Initié·e", "Vendeurs en maison, stylistes, acheteurs, visual merchandisers", "690 € (69 crédits)", "180 €"],
            ["Rare", "Directions artistiques, clientes très importantes, collectionneurs reconnus", "1 300 € (130 crédits)", "350 €"],
          ],
        },
        p: [
          "La durée change le prix : ×0,8 pour 30 minutes, ×1,25 pour 60 minutes, ×1,6 au-delà. La demande, la rareté du profil et son niveau de certification l'ajustent dans une fourchette de ×0,8 à ×1,6. Le prix exact s'affiche avant que vous acceptiez un profil.",
          "1 crédit = 10 € HT. Les packs de crédits sont dégressifs : Studio (150 crédits, −10 %), Maison (400 crédits, −20 %), Grande maison (1 000 crédits, −30 %).",
        ],
      },
      {
        h: "Exemples de budgets",
        table: {
          head: ["Étude", "Composition", "Budget HT"],
          rows: [
            ["Test d'un concept auprès de clients avertis", "6 entretiens de 45 min", "≈ 2 340 €"],
            ["Lancement d'une ligne premium", "4 initiés + 2 profils rares", "≈ 5 360 €"],
            ["Grand nombre d'avis (bêta en autonomie)", "Réponses face caméra, sans rendez-vous", "≈ 35 % du prix d'un entretien"],
          ],
        },
      },
      {
        h: "Les garanties",
        list: [
          "Rien n'est débité avant que vous gardiez un profil.",
          "Participant absent : crédits rendus automatiquement.",
          "Profil qui ne convient pas : refusé sans frais.",
          "Pas d'abonnement ni d'engagement.",
        ],
      },
    ],
    faq: [
      { q: "La rémunération des participants est-elle incluse ?", a: "Oui. Le prix de chaque profil comprend la rémunération du participant, l'organisation, l'enregistrement, la transcription et la synthèse." },
      { q: "Faut-il acheter un abonnement ?", a: "Non. Vous achetez des crédits et ne les dépensez que sur les profils que vous gardez. Le premier pack, Découverte, fait 40 crédits (400 € HT)." },
      { q: "Le prix peut-il changer après avoir accepté un profil ?", a: "Non. Le prix est figé au moment où vous acceptez le profil." },
    ],
    related: ["recruter-participants-etude-qualitative", "panel-ou-recrutement-sur-mesure", "profils-rares-etudes-qualitatives"],
  },
  {
    slug: "panel-ou-recrutement-sur-mesure",
    lang: "fr",
    audience: "marques",
    kicker: "Guide · Comparatif",
    title: "Panel consommateurs ou recrutement sur mesure : que choisir pour une étude qualitative ?",
    metaTitle: "Panel consommateurs ou recrutement sur mesure : que choisir ?",
    description: "Un panel donne du volume et une tranche d'âge ; un recrutement sur mesure donne des personnes précises et vérifiées. Quand choisir l'un ou l'autre pour vos études qualitatives de marque.",
    published: D,
    updated: D,
    answer: "Choisissez un panel consommateurs quand vous avez besoin de volume sur une cible large et facile à trouver. Choisissez un recrutement sur mesure quand la valeur de l'étude dépend de personnes précises — un métier, un usage, une expertise — qu'aucun panel ne contient. Pour les marques de mode, de luxe et de beauté, les décisions importantes relèvent souvent du second cas.",
    sections: [
      {
        h: "La différence en un tableau",
        table: {
          head: ["", "Panel consommateurs", "Recrutement sur mesure (Rarelyst)"],
          rows: [
            ["Ce que vous obtenez", "Une tranche d'âge, un profil sociodémographique", "Une personne précise, avec ses preuves"],
            ["Profils rares", "Rarement présents", "Recherchés un par un"],
            ["Vérification", "Déclarative", "Identité, emploi, LinkedIn, travaux"],
            ["Volume", "Élevé", "Six à quelques dizaines d'entretiens"],
            ["Format idéal", "Questionnaires, tests rapides", "Entretiens individuels en visio"],
            ["Paiement", "Souvent au forfait ou d'avance", "Seulement les profils gardés"],
          ],
        },
      },
      {
        h: "Quand le panel suffit",
        list: [
          "Mesurer une préférence sur une cible large (par exemple « acheteurs de parfum en France »).",
          "Tester rapidement plusieurs visuels sur un grand nombre de répondants.",
          "Suivre un indicateur dans le temps.",
        ],
      },
      {
        h: "Quand il faut du sur-mesure",
        list: [
          "Comprendre ce que pensent les prescripteurs : stylistes, vendeurs, acheteurs.",
          "Tester un lancement premium auprès de la clientèle qui compte vraiment.",
          "Explorer un usage émergent (seconde main, drops, Gen Z) avec ceux qui le vivent.",
          "Arbitrer une décision où un avis d'expert pèse plus que cent avis moyens.",
        ],
      },
    ],
    faq: [
      { q: "Peut-on combiner les deux ?", a: "Oui, et c'est souvent le plus efficace : des entretiens sur mesure pour comprendre, puis un panel pour mesurer ce qui en ressort." },
      { q: "Rarelyst propose-t-il des questionnaires ?", a: "Non : Rarelyst est fait pour les entretiens qualitatifs en visio, en direct avec la marque ou en autonomie (bêta)." },
    ],
    related: ["recruter-participants-etude-qualitative", "prix-etude-qualitative", "profils-rares-etudes-qualitatives"],
  },
  {
    slug: "etudes-remunerees-mode-luxe",
    lang: "fr",
    alt: "paid-research-studies-fashion-luxury",
    audience: "participants",
    kicker: "Guide · Participer",
    title: "Études rémunérées mode et luxe : être payé pour donner son avis aux marques",
    metaTitle: "Études rémunérées mode, luxe, beauté : jusqu'à 560 € l'entretien",
    description: "Stylistes, vendeurs en boutique, acheteurs, collectionneurs, micro-influenceurs, clients passionnés : les marques de mode et de luxe paient 90 € à 350 € (jusqu'à 560 €) pour un entretien en visio. Comment ça marche.",
    published: D,
    updated: D,
    answer: "Sur Rarelyst, les marques de mode, de luxe et de beauté paient des personnes précises pour des entretiens en visio de 45 minutes : de 90 € pour un client passionné à 350 € pour un profil rare, et jusqu'à 560 € pour les profils les plus demandés sur des entretiens longs. L'inscription est gratuite, vous proposez vos créneaux, et vous retirez vos gains par virement dès 50 €.",
    sections: [
      {
        h: "Qui peut participer",
        list: [
          "Professionnels du secteur : stylistes, vendeurs en boutique de luxe, acheteurs, visual merchandisers, maquilleurs.",
          "Créateurs de contenu et micro-influenceurs mode ou beauté.",
          "Collectionneurs, revendeurs de seconde main, amateurs de sneakers.",
          "Clients passionnés, early adopters, Gen Z qui connaissent les marques mieux que leurs équipes.",
        ],
      },
      {
        h: "Combien c'est payé",
        table: {
          head: ["Palier", "Exemples", "Par entretien de 45 min"],
          rows: [
            ["Client·e averti·e", "Clients passionnés, chineurs, early adopters", "90 €"],
            ["Initié·e", "Vendeurs en maison, stylistes, acheteurs, créateurs de contenu", "180 €"],
            ["Rare", "Directions artistiques, clientes très importantes, collectionneurs reconnus", "350 €"],
          ],
        },
        p: ["Plus votre profil est prouvé (médailles) et bien noté par les marques, mieux vous êtes payé. Les entretiens plus longs et les profils très demandés montent jusqu'à 560 €."],
      },
      {
        h: "Comment ça marche",
        list: [
          "Vous créez votre profil (une dizaine de minutes) et gagnez des médailles en prouvant votre parcours.",
          "Quand une étude correspond à votre profil, une marque vous invite. Vous restez libre de refuser.",
          "Vous proposez vos créneaux ; la marque en choisit un.",
          "L'entretien a lieu en visio depuis chez vous, sans rien installer.",
          "Votre rémunération arrive sur votre solde ; vous la retirez par virement dès 50 €.",
        ],
      },
      {
        h: "Parrainage",
        p: ["Vous connaissez d'autres profils rares ? Vous touchez 50 € quand votre filleul termine son premier entretien, puis 30 € à chacun des suivants, jusqu'à 10. Votre filleul reçoit 20 € en plus de sa rémunération."],
      },
    ],
    faq: [
      { q: "L'inscription est-elle payante ?", a: "Non, elle est gratuite, et vous n'êtes jamais obligé d'accepter une invitation." },
      { q: "Les marques voient-elles mon nom ?", a: "Les marques voient un portrait et vos médailles ; votre nom complet et vos coordonnées ne sont pas transmis." },
      { q: "Faut-il déclarer ces revenus ?", a: "Oui, ce sont des revenus à déclarer selon votre situation. Votre portefeuille Rarelyst garde l'historique de tous vos gains." },
    ],
    related: ["profils-rares-etudes-qualitatives", "recruter-participants-etude-qualitative"],
  },
  {
    slug: "recruit-participants-qualitative-research",
    lang: "en",
    alt: "recruter-participants-etude-qualitative",
    audience: "marques",
    kicker: "Guide · Recruitment",
    title: "How to recruit participants for qualitative research: method, timing and cost",
    metaTitle: "Recruit participants for qualitative research (fashion, luxury, beauty)",
    description: "How to recruit the right people for qualitative interviews: describe the person, verify participants, schedule video calls and get a synthesis that answers your decisions. Real timings and prices.",
    published: D,
    updated: D,
    answer: "To recruit participants for qualitative research, describe a specific person rather than a demographic target, verify their identity and experience before the interview, and pay them in line with their expertise. With Rarelyst, a fashion, luxury or beauty brand gets its first verified profiles within 72 hours and only pays for the profiles it keeps: €390 to €1,300 excl. VAT per 45-minute interview, participant incentive included.",
    sections: [
      {
        h: "1. Describe a person, not a target",
        p: [
          "Most failed recruitments start with a brief that is too broad: “women, 25–35, upper-middle class, Paris region”. Thousands of people fit, and none of them will tell you what you need to know.",
          "Describe instead the person whose opinion would move your decision forward: “a luxury boutique associate who advises Asian clients every week”, “a collector who buys on drop day and resells on Vinted”, “a stylist who dresses artists on tour”.",
        ],
      },
      {
        h: "2. Verify before the interview, not during it",
        p: ["On Rarelyst, every proof becomes a medal on the profile: identity checked by the team, LinkedIn account linked, employment confirmed by a code sent to a work email, CV analysed, portfolio reviewed, and ratings from brands that have already interviewed them. The team reviews each profile before suggesting it."],
      },
      {
        h: "3. Run interviews without the back-and-forth",
        p: ["Participants suggest time slots, the brand picks one, and the video room, reminders and recording happen on their own. You run the interview with your guide on screen. A self-guided option (beta) lets participants answer the guide's questions on camera, at a lower cost."],
      },
      {
        h: "4. Demand a synthesis that answers your decisions",
        p: ["The synthesis answers each decision written in the brief, with how many people lean each way, an honest confidence level and participants' exact words. Every quote is checked against the transcript."],
      },
      {
        h: "Timing and price",
        table: {
          head: ["Step", "With Rarelyst"],
          rows: [
            ["First profiles", "Within 72 hours"],
            ["Scheduling", "Participants suggest, you choose"],
            ["Interview", "Video call inside Rarelyst, recorded and transcribed"],
            ["Price per profile (45 min)", "€390 to €1,300 excl. VAT, incentive included"],
            ["What you pay", "Only the profiles you keep"],
          ],
        },
      },
    ],
    faq: [
      { q: "How many participants do I need?", a: "For in-depth interviews, six to twelve well-chosen people are often enough to surface agreement and disagreement. Six very specific profiles beat twenty average ones." },
      { q: "Who runs the interviews?", a: "The brand does, with its interview guide shown next to the video call. Rarelyst recruits, schedules, records, transcribes and writes the synthesis." },
      { q: "Can interviews be in English?", a: "Yes: interviews, website and syntheses are available in French and English." },
    ],
    related: ["paid-research-studies-fashion-luxury"],
  },
  {
    slug: "paid-research-studies-fashion-luxury",
    lang: "en",
    alt: "etudes-remunerees-mode-luxe",
    audience: "participants",
    kicker: "Guide · Join the panel",
    title: "Paid research studies in fashion and luxury: get paid to share your view with brands",
    metaTitle: "Paid research studies in fashion, luxury and beauty: up to €560",
    description: "Stylists, boutique associates, buyers, collectors, micro-influencers and passionate customers: fashion and luxury brands pay €90 to €350 (up to €560) for a video interview. How it works.",
    published: D,
    updated: D,
    answer: "On Rarelyst, fashion, luxury and beauty brands pay specific people for 45-minute video interviews: from €90 for a passionate customer to €350 for a rare profile, and up to €560 for the most in-demand profiles on longer interviews. Joining is free, you suggest your own time slots, and you withdraw your earnings by bank transfer from €50.",
    sections: [
      {
        h: "Who can join",
        list: [
          "Industry professionals: stylists, luxury boutique associates, buyers, visual merchandisers, makeup artists.",
          "Fashion and beauty content creators and micro-influencers.",
          "Collectors, second-hand resellers, sneaker enthusiasts.",
          "Passionate customers, early adopters and Gen Z who know brands better than their own teams.",
        ],
      },
      {
        h: "How much it pays",
        table: {
          head: ["Tier", "Examples", "Per 45-min interview"],
          rows: [
            ["Savvy customer", "Passionate customers, thrifters, early adopters", "€90"],
            ["Insider", "Boutique associates, stylists, buyers, content creators", "€180"],
            ["Rare", "Art directors, top-tier clients, renowned collectors", "€350"],
          ],
        },
      },
      {
        h: "How it works",
        list: [
          "Create your profile (about ten minutes) and earn medals by proving your background.",
          "When a study matches your profile, a brand invites you. You can always say no.",
          "Suggest your time slots; the brand picks one.",
          "The interview happens on a video call from home, nothing to install.",
          "Your earnings go to your balance; withdraw by bank transfer from €50.",
        ],
      },
    ],
    faq: [
      { q: "Is it free to join?", a: "Yes, and you never have to accept an invitation." },
      { q: "Do brands see my name?", a: "Brands see a portrait and your medals; your full name and contact details are not shared." },
    ],
    related: ["recruit-participants-qualitative-research"],
  },
];

export const guidePath = (g: Pick<Guide, "lang" | "slug">) => `${g.lang === "en" ? "/en" : ""}/guides/${g.slug}`;
export const findGuide = (lang: GuideLang, slug: string) => GUIDES.find((g) => g.lang === lang && g.slug === slug) ?? null;
export const guidesIn = (lang: GuideLang) => GUIDES.filter((g) => g.lang === lang);
