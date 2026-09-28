import type { Lang } from "@/lib/i18n/detect";
import type { LandingTier } from "./Landing";

// Textes de la page d'accueil, en français et en anglais.

type Faq = { q: string; a: string };

export type LandingCopy = {
  locale: string;
  nav: { how: string; profiles: string; pricing: string; join: string; faq: string; login: string; cta: string };
  hero: { pill: string; pillValue: string; text: string; cta: string; join: string; h1: [string, string, string] };
  lanes: { foot: string; rare: string; unfindable: string; aria: string };
  how: { kicker: string; h2: string; lead: string };
  profiles: { kicker: string; h2: string; lead: string; usual: string; boxes: string[]; verdict: string; here: string; proofsTitle: string; proofsLead: string };
  deliver: {
    kicker: string; h2: string; lead: string; included: [string, string][];
    kickerDoc: string;
    answers: { q: string; a: string; n: number; v: string; who: string }[];
    support: (n: number) => string;
    quote: (s: string) => string;
  };
  pricing: {
    kicker: string; h2: string; lead: string; credits: string; euros: (e: string) => string; features: [string, string, string];
    guarantees: [string, string, string]; cta: string; all: string;
    /** Noms des paliers en anglais ; en français, ceux réglés dans l'admin. */
    tierText?: Record<string, { label: string; who: string }>;
  };
  privacy: { kicker: string; h2: string; items: [string, string][] };
  people: { kicker: string; h2: string; lead: string; pay: (a: number, b: number) => string; payLabel: string; paid: string; paidLabel: string; ref: string; refLabel: string; cta: string };
  faqTitle: { kicker: string; h2: string };
  faq: (tiers: LandingTier[]) => Faq[];
  footer: { h2: string; lead: string; links: { pricing: string; login: string; contact: string; privacy: string; terms: string; legal: string } };
};

const FR: LandingCopy = {
  locale: "fr-FR",
  nav: { how: "Comment ça marche", profiles: "Profils", pricing: "Tarifs", join: "Participer", faq: "Questions", login: "Connexion", cta: "Demander une étude" },
  hero: {
    h1: ["Qui", "voulez-vous", "entendre"],
    pill: "Vos premiers profils qualifiés", pillValue: "72 h",
    text: "Stylistes, acheteurs, collectionneurs, vendeuses en boutique. Nous trouvons les personnes précises que votre étude demande, et nous organisons les entretiens.",
    cta: "Demander une étude pilote", join: "Rejoindre le panel",
  },
  lanes: { foot: "Le genre de profils que nous recrutons.", rare: "Rare", unfindable: "Introuvable", aria: "Le genre de profils que nous recrutons" },
  how: {
    kicker: "Comment ça marche", h2: "Du brief à la décision, sans rien organiser.",
    lead: "Vous dites qui vous voulez entendre. Nous trouvons les personnes, organisons les visios et vous rendons une synthèse qui répond à vos questions.",
  },
  profiles: {
    kicker: "Les profils", h2: "Un panel vous donne une tranche d'âge. Nous, une personne.",
    lead: "Chaque profil arrive avec ses preuves : ce qui a été vérifié, et pourquoi il répond à votre brief.",
    usual: "Ce qu'on vous livre d'habitude", boxes: ["Femme", "25–35 ans", "CSP+", "Île-de-France", "Intéressée par la mode"],
    verdict: "Cinq cases cochées. Aucune idée de ce que cette personne sait, achète ou pense.",
    here: "Ce qu'on vous livre ici",
    proofsTitle: "Ce que prouvent les médailles",
    proofsLead: "Un profil ne se déclare pas certifié : il le devient, preuve après preuve. Plus il est prouvé, plus il est demandé.",
  },
  deliver: {
    kicker: "Le livrable", h2: "Une synthèse qui répond à vos questions.",
    lead: "Dans le brief, vous dites ce que l'étude doit trancher. La synthèse y répond, avec le nombre de personnes qui vont dans ce sens et leurs mots exacts.",
    included: [
      ["La vidéo de chaque entretien", "Disponible à la fin de l'appel."],
      ["La transcription horodatée", "Pour retrouver une phrase en un instant."],
      ["La synthèse de l'étude", "Réponses, enseignements, profils types."],
      ["Les verbatims classés", "Par thème et par tonalité."],
      ["L'export PDF", "Prêt pour votre comité."],
    ],
    kickerDoc: "Synthèse · Maroquinerie en cuir recyclé",
    answers: [
      { q: "Faut-il lancer en trois ou cinq coloris ?", a: "Trois. Le noir porte les ventes ; les coloris en plus finiraient soldés.", n: 5, v: "Trois coloris, pas cinq : le noir partira.", who: "Acheteuse luxe, 34 ans" },
      { q: "Faut-il écrire « recyclé » sur l'étiquette ?", a: "Pas en premier. Le mot rassure l'acheteuse de seconde main, pas la cliente du neuf.", n: 4, v: "Si c'est écrit recyclé, je pense seconde main.", who: "Vendeuse en boutique, 8 ans" },
    ],
    support: (n) => `${n} entretiens sur 6`,
    quote: (s) => `« ${s} »`,
  },
  pricing: {
    kicker: "Tarifs", h2: "Vous payez un profil. Pas un abonnement.",
    lead: "Un client averti ne coûte pas ce que coûte une ancienne acheteuse de grand magasin. Le prix de chaque profil s'affiche avant que vous le gardiez.",
    credits: "crédits", euros: (e) => `soit ${e} € HT l'entretien de 45 min`,
    features: ["Profil vérifié et relu par l'équipe", "Visio enregistrée et transcrite", "Synthèse de l'étude comprise"],
    guarantees: ["Rien n'est débité avant que vous gardiez un profil.", "Participant absent : vos crédits reviennent tout seuls.", "Un profil qui ne vous convient pas ? Vous le déclinez, sans frais."],
    cta: "Demander une étude pilote", all: "Tous les tarifs et les packs de crédits",
  },
  privacy: {
    kicker: "Confidentialité", h2: "Vos projets restent entre vous et nous.",
    items: [
      ["Anonyme jusqu'à l'entretien.", "Les participants voient le poinçon d'une maison vérifiée, pas votre nom."],
      ["Votre brief n'entraîne aucune IA.", "Le service que nous utilisons l'exclut par contrat."],
      ["90 jours, puis plus rien.", "Les vidéos ne sont plus accessibles après ce délai."],
    ],
  },
  people: {
    kicker: "Pour les participants", h2: "Votre œil vaut quelque chose.",
    lead: "Styliste, acheteuse, vendeuse en boutique, collectionneur : les marques vous paient pour votre regard, avant leurs lancements. Plus votre profil est prouvé et bien noté, mieux vous êtes payé.",
    pay: (a, b) => `${a} à ${b} €`, payLabel: "par entretien de 45 min", paid: "48 h", paidLabel: "pour être payé",
    ref: "50 €", refLabel: "par ami qui fait son premier entretien", cta: "Rejoindre le panel",
  },
  faqTitle: { kicker: "Questions", h2: "Ce qu'on nous demande." },
  faq: (tiers) => [
    { q: "Qui mène les entretiens ?", a: "Vous, avec votre guide d'entretien affiché à côté de la visio. Nous recrutons, organisons, enregistrons, transcrivons et rédigeons la synthèse." },
    { q: "Comment savez-vous qu'un profil est réel ?", a: "Chaque profil porte ses preuves : identité, LinkedIn, emploi confirmé par un code sur l'adresse professionnelle, CV, book. L'équipe relit chaque profil avant de vous le proposer." },
    { q: "Combien coûte une étude ?", a: `Le prix de chaque profil retenu, de ${tiers[0].credits} à ${tiers[tiers.length - 1].credits} crédits pour 45 minutes (1 crédit = 10 € HT). Six entretiens avec des clients avertis reviennent à environ ${(Math.round((6 * tiers[0].euros) / 100) * 100).toLocaleString("fr-FR")} € HT, synthèse comprise.` },
    { q: "Et si un participant ne vient pas ?", a: "Vos crédits reviennent automatiquement sur votre compte, et nous vous proposons un autre profil." },
    { q: "Mes projets restent-ils confidentiels ?", a: "Les participants voient votre poinçon de maison vérifiée, pas votre nom, avant l'entretien. Votre brief ne sert jamais à entraîner une IA, et les vidéos ne sont plus accessibles après 90 jours." },
    { q: "En combien de temps ?", a: "Vos premiers profils sous 72 heures. Les participants proposent leurs créneaux, vous en choisissez un : l'entretien peut avoir lieu dans la semaine." },
    { q: "Quels secteurs ?", a: "Mode, luxe, beauté, sneakers, seconde main, lifestyle. En français ou en anglais." },
    { q: "Faut-il s'engager ?", a: "Non. Pas d'abonnement : vous achetez des crédits et ne les dépensez que sur les profils que vous gardez." },
  ],
  footer: {
    h2: "Dites-nous qui vous voulez entendre.",
    lead: "Quelques phrases suffisent. Vous créez votre compte, votre brief vous attend, et vos premiers profils arrivent sous 72 heures.",
    links: { pricing: "Tarifs", login: "Connexion", contact: "Contact", privacy: "Confidentialité", terms: "Conditions", legal: "Mentions légales" },
  },
};

const EN: LandingCopy = {
  locale: "en-GB",
  nav: { how: "How it works", profiles: "Profiles", pricing: "Pricing", join: "Join the panel", faq: "FAQ", login: "Log in", cta: "Start a study" },
  hero: {
    h1: ["Who", "do you want to", "hear from"],
    pill: "Your first qualified profiles", pillValue: "72 h",
    text: "Stylists, buyers, collectors, boutique associates. We find the exact people your study needs, and we organise the interviews.",
    cta: "Start a pilot study", join: "Join the panel",
  },
  lanes: { foot: "The kind of people we recruit.", rare: "Rare", unfindable: "Unfindable", aria: "The kind of people we recruit" },
  how: {
    kicker: "How it works", h2: "From brief to decision, with nothing to organise.",
    lead: "Tell us who you want to hear from. We find the people, set up the video calls and hand you a synthesis that answers your questions.",
  },
  profiles: {
    kicker: "The profiles", h2: "A panel gives you an age bracket. We give you a person.",
    lead: "Every profile comes with its proof: what was verified, and why it fits your brief.",
    usual: "What you usually get", boxes: ["Woman", "25–35", "Upper-middle class", "Paris region", "Interested in fashion"],
    verdict: "Five boxes ticked. No idea what this person knows, buys or thinks.",
    here: "What you get here",
    proofsTitle: "What the medals prove",
    proofsLead: "A profile doesn't claim to be certified: it earns it, one proof at a time. The more proven, the more in demand.",
  },
  deliver: {
    kicker: "The deliverable", h2: "A synthesis that answers your questions.",
    lead: "In your brief, you say what the study must decide. The synthesis answers it, with how many people lean that way and their exact words.",
    included: [
      ["The video of every interview", "Ready when the call ends."],
      ["A timestamped transcript", "Find any sentence in seconds."],
      ["The study synthesis", "Answers, insights, personas."],
      ["Sorted verbatims", "By theme and by tone."],
      ["PDF export", "Ready for your committee."],
    ],
    kickerDoc: "Synthesis · Recycled leather goods",
    answers: [
      { q: "Should we launch in three or five colours?", a: "Three. Black drives sales; extra colours would end up on sale.", n: 5, v: "Three colours, not five: black will sell.", who: "Luxury shopper, 34" },
      { q: "Should the label say \"recycled\"?", a: "Not upfront. The word reassures second-hand buyers, not full-price customers.", n: 4, v: "If it says recycled, I think second-hand.", who: "Boutique associate, 8 yrs" },
    ],
    support: (n) => `${n} of 6 interviews`,
    quote: (s) => `“${s}”`,
  },
  pricing: {
    kicker: "Pricing", h2: "You pay per profile. Not a subscription.",
    lead: "A savvy customer doesn't cost what a former department store buyer does. Each profile's price is shown before you keep it.",
    credits: "credits", euros: (e) => `i.e. €${e} excl. VAT per 45-min interview`,
    features: ["Profile verified and reviewed by our team", "Recorded and transcribed video call", "Study synthesis included"],
    guarantees: ["Nothing is charged until you keep a profile.", "Participant no-show: your credits come back automatically.", "Profile not right for you? Decline it, free of charge."],
    cta: "Start a pilot study", all: "Full pricing and credit packs",
    tierText: {
      averti: { label: "Savvy customer", who: "Passionate shoppers, thrifters, collectors" },
      initie: { label: "Insider", who: "In-house sales associates, stylists, buyers, visual merchandisers" },
      rare: { label: "Rare", who: "Art directors, top clients, renowned collectors" },
    },
  },
  privacy: {
    kicker: "Confidentiality", h2: "Your projects stay between you and us.",
    items: [
      ["Anonymous until the interview.", "Participants see a verified house's hallmark, not your name."],
      ["Your brief trains no AI.", "Our provider rules it out contractually."],
      ["90 days, then gone.", "Videos are no longer accessible after that."],
    ],
  },
  people: {
    kicker: "For participants", h2: "Your eye is worth something.",
    lead: "Stylist, buyer, boutique associate, collector: brands pay for your perspective before they launch. The more proven and well-rated your profile, the better you're paid.",
    pay: (a, b) => `€${a} to €${b}`, payLabel: "per 45-min interview", paid: "48 h", paidLabel: "to get paid",
    ref: "€50", refLabel: "per friend who does their first interview", cta: "Join the panel",
  },
  faqTitle: { kicker: "FAQ", h2: "What people ask us." },
  faq: (tiers) => [
    { q: "Who runs the interviews?", a: "You do, with your interview guide shown next to the video call. We recruit, schedule, record, transcribe and write the synthesis." },
    { q: "How do you know a profile is real?", a: "Every profile carries its proof: ID, LinkedIn, employment confirmed by a code sent to a work email, CV, portfolio. Our team reviews each profile before suggesting it." },
    { q: "How much does a study cost?", a: `The price of each profile you keep, from ${tiers[0].credits} to ${tiers[tiers.length - 1].credits} credits for 45 minutes (1 credit = €10 excl. VAT). Six interviews with savvy customers come to about €${(Math.round((6 * tiers[0].euros) / 100) * 100).toLocaleString("en-GB")} excl. VAT, synthesis included.` },
    { q: "What if a participant doesn't show up?", a: "Your credits come back to your account automatically, and we suggest another profile." },
    { q: "Do my projects stay confidential?", a: "Before the interview, participants see your verified house's hallmark, not your name. Your brief never trains an AI, and videos are no longer accessible after 90 days." },
    { q: "How fast?", a: "Your first profiles within 72 hours. Participants suggest time slots and you pick one: the interview can happen the same week." },
    { q: "Which sectors?", a: "Fashion, luxury, beauty, sneakers, second-hand, lifestyle. In French or English." },
    { q: "Is there a commitment?", a: "No. No subscription: you buy credits and only spend them on the profiles you keep." },
  ],
  footer: {
    h2: "Tell us who you want to hear from.",
    lead: "A few sentences will do. Create your account, your brief will be waiting, and your first profiles arrive within 72 hours.",
    links: { pricing: "Pricing", login: "Log in", contact: "Contact", privacy: "Privacy", terms: "Terms", legal: "Legal notice" },
  },
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { fr: FR, en: EN };
