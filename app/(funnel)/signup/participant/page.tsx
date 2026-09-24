"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectLanguage, setLanguage, type Lang } from "@/lib/i18n/detect";
import { EMPTY_ONBOARDING, FUNNEL_SCREENS, type FunnelScreen, type OnboardingState } from "@/lib/onboarding/types";
import {
  SEGMENTS, PRO_ROLES, PRO_SECTORS, PRO_YEARS, TRAITS, TRAIT_SCALE, TRAIT_CLAIMED, PROOF_MIN,
  FACTS, VOICE_Q, LINK_FIELDS, isPro, toUrl, type Segment,
} from "@/lib/onboarding/questions";
import { computeBadges, BADGES, type EarnedBadge } from "@/lib/participants/badges";
import type { LinksAnalysis } from "@/lib/participants/links";
import { createFunnelAccount, saveFunnelStep, completeFunnel, funnelSession } from "@/app/actions/funnel";
import VoiceInput from "@/components/onboarding/VoiceInput";
import BadgeUpload from "@/components/onboarding/BadgeUpload";
import SocialSignIn from "@/components/auth/SocialSignIn";
import Medallion from "@/components/badges/Medallion";
import { BadgeTile } from "@/components/badges/BadgeShelf";
import f from "./funnel.module.css";

// Brouillon local : v2, pour ne jamais restaurer l'ancien tunnel.
const DRAFT = "rarelyst_funnel_v2";

const T = {
  fr: {
    step: "Étape", of: "sur", back: "Retour", continue: "Continuer", finish: "Activer mon profil",
    accountEyebrow: "Rejoindre Rarelyst", accountTitle: "Créez votre compte",
    accountLead: "Une dizaine de minutes en tout. Les marques ne voient jamais votre nom complet ni vos réponses brutes : seulement un portrait et vos médailles.",
    orManual: "ou avec votre email",
    identityEyebrow: "Vous", identityTitle: "Faisons connaissance",
    identityLead: "Google et LinkedIn ne nous donnent que votre nom. Le reste sert à vous proposer les bonnes études : beaucoup visent un âge ou une ville.", firstName: "Prénom", lastName: "Nom", email: "Email", password: "Mot de passe",
    min8: "8 caractères minimum", dob: "Date de naissance", gender: "Genre", city: "Ville", country: "Pays", select: "Sélectionner…",
    genders: ["Homme", "Femme", "Non-binaire", "Homme transgenre", "Femme transgenre", "Je préfère ne pas préciser"],
    signedAs: "Connecté·e avec", under18: "Il faut avoir 18 ans ou plus.",
    segEyebrow: "Pour commencer", segTitle: "Vous venez plutôt en tant que…",
    segLead: "Les marques cherchent deux choses différentes : des gens du métier, et des client·es qui en savent long. On ne vous posera pas les mêmes questions.",
    proEyebrow: "Votre parcours", proTitle: "Votre place dans le secteur",
    proLead: "Comme sur un CV, en plus court. C'est ce qui vous ouvre les études réservées aux initié·es.",
    role: "Métier", sector: "Secteur", years: "Expérience", company: "Maison ou structure (optionnel)",
    companyHint: "Jamais affiché tel quel aux marques : il sert à éviter de vous proposer une étude de votre propre employeur.",
    univEyebrow: "Vos univers", univTitle: "Où vous sentez-vous chez vous ?", univLead: "Plusieurs choix possibles.",
    macroOpts: ["Luxe & Haute couture", "Streetwear & Sneakers premium", "Mode contemporaine française", "Mode contemporaine internationale", "Prêt-à-porter sport premium", "Vintage & Seconde main"],
    brandsTitle: "Les marques que vous connaissez vraiment",
    engageTitle: "Et avec elles, vous…",
    engageOpts: ["Je suis leurs collections et défilés", "J'assiste à leurs événements", "J'achète régulièrement leurs produits", "Je fais de la veille (newsletters, Instagram…)", "Je travaille ou ai travaillé avec elles", "Je revends / collecte leurs pièces", "Je les recommande à mon entourage"],
    min1: "Choisissez au moins un univers.",
    traitsEyebrow: "Questions franches", traitsTitle: "Qui êtes-vous, vraiment ?",
    traitsLead: "Répondez sans modestie ni exagération. Dès « Plutôt oui », donnez un exemple en une ligne : c'est lui qui fait gagner la médaille.",
    proofWaiting: "Un exemple précis débloque la médaille", proofOk: "Médaille à confirmer ✓",
    allTraits: "Répondez aux huit questions pour continuer.",
    factsEyebrow: "Des faits", factsTitle: "Ce que vous avez déjà fait",
    factsLead: "Pas ce que vous aimeriez faire : ce qui vous est déjà arrivé. Cochez tout ce qui est vrai.",
    voiceEyebrow: "À voix haute", voiceTitle: "Trois questions ouvertes",
    voiceLead: "Parlez ou écrivez, comme en entretien. Personne ne note l'orthographe : on écoute ce que vous savez.",
    linksEyebrow: "Vos liens", linksTitle: "Montrez-nous où vous êtes",
    linksLead: "Notre IA lit vos pages publiques pour confirmer vos réponses et affiner votre portrait. Rien n'est publié, rien n'est suivi.",
    otherLink: "Autre lien (YouTube, Substack, boutique Vinted…)", addLink: "+ Ajouter un lien",
    read: "Laisser l'IA lire mes liens", reading: "Lecture en cours…", reread: "Relire mes liens",
    readHead: "Ce que l'IA a lu", readOk: "Lu", readPrivate: "Non lisible publiquement — l'équipe vérifiera à la main",
    readDown: "Injoignable — vérifiez l'adresse", followers: "abonnés",
    cv: "CV récent (optionnel)", portfolio: "Book / portfolio en PDF (optionnel)",
    demoEyebrow: "Pour les quotas", demoTitle: "Quelques repères",
    demoLead: "Les études visent souvent un âge, un statut ou un revenu précis. Tout est optionnel.",
    employment: "Statut d'emploi", education: "Niveau d'études", income: "Revenu annuel du foyer", ethnicity: "Origine (optionnel)",
    employmentOpts: ["Étudiant(e)", "CDI temps plein", "CDI temps partiel", "CDD", "Freelance / Indépendant(e)", "Cadre / Manager", "Directeur(rice) / C-level", "Auto-entrepreneur(e)", "Sans emploi — en recherche", "Sans emploi — pas en recherche", "Retraité(e)", "Autre"],
    educationOpts: ["Bac ou moins", "Bac +2 (BTS, DUT)", "Licence / Bachelor", "Master / Grande École", "Doctorat", "Formation pro / autodidacte"],
    incomeOpts: ["Moins de 20 000 €", "20 000 € – 35 000 €", "35 000 € – 55 000 €", "55 000 € – 80 000 €", "80 000 € – 120 000 €", "Plus de 120 000 €", "Je préfère ne pas répondre"],
    ethnicityOpts: ["Européen(ne) / Blanc(he)", "Afro-descendant(e)", "Maghrébin(e) / Moyen-Oriental(e)", "Asiatique", "Latino(a) / Hispanique", "Métis(se) / Mixte", "Autre", "Je préfère ne pas répondre"],
    logEyebrow: "Organisation", logTitle: "Quand êtes-vous disponible ?",
    availability: "Créneaux habituels", morning: "Matin", afternoon: "Après-midi", evening: "Soir",
    format: "Format", langs: "Langue(s) d'entretien", reward: "Récompense préférée",
    charterEyebrow: "Dernière étape", charterTitle: "La charte",
    charterWarn: "Tout paiement en dehors de Rarelyst est strictement interdit.",
    accept: "J'accepte la charte", scrollToEnd: "Faites défiler la charte jusqu'en bas",
    revealEyebrow: "Profil actif", revealTitle: "Vos premières médailles",
    revealLead: "Les médailles « à confirmer » sont examinées par notre IA à partir de vos exemples et de vos liens. Seules les médailles confirmées apparaissent aux marques.",
    toUnlock: "À débloquer", goDashboard: "Voir les études ouvertes",
    cardTop: "Carte membre", cardMedals: "Médailles", cardFoot: "Les marques verront votre prénom, votre ville, votre portrait et vos médailles confirmées.",
    perk1: "80 à 300 € par entretien", perk1b: "Selon votre profil, virés directement sur votre compte.",
    perk2: "Des événements privés", perk2b: "Avant-premières, lancements, showrooms.",
    perk3: "Les pièces avant leur sortie", perk3b: "Des tests produits réservés au panel.",
    stripMedals: "médailles",
  },
  en: {
    step: "Step", of: "of", back: "Back", continue: "Continue", finish: "Activate my profile",
    accountEyebrow: "Join Rarelyst", accountTitle: "Create your account",
    accountLead: "About ten minutes in total. Brands never see your full name or raw answers: only a portrait and your medals.",
    orManual: "or with your email",
    identityEyebrow: "You", identityTitle: "Let's get acquainted",
    identityLead: "Google and LinkedIn only share your name. The rest helps us offer the right studies: many target an age or a city.", firstName: "First name", lastName: "Last name", email: "Email", password: "Password",
    min8: "8 characters minimum", dob: "Date of birth", gender: "Gender", city: "City", country: "Country", select: "Select…",
    genders: ["Man", "Woman", "Non-binary", "Transgender man", "Transgender woman", "Prefer not to say"],
    signedAs: "Signed in as", under18: "You must be 18 or older.",
    segEyebrow: "To start", segTitle: "You're here mostly as…",
    segLead: "Brands look for two different things: industry people, and customers who know a lot. You won't get the same questions.",
    proEyebrow: "Your career", proTitle: "Your place in the industry",
    proLead: "Like a CV, but shorter. It opens studies reserved for insiders.",
    role: "Role", sector: "Sector", years: "Experience", company: "House or company (optional)",
    companyHint: "Never shown as-is to brands: it avoids offering you a study from your own employer.",
    univEyebrow: "Your universes", univTitle: "Where do you feel at home?", univLead: "Several choices allowed.",
    macroOpts: ["Luxury & Haute couture", "Streetwear & Premium sneakers", "French contemporary fashion", "International contemporary fashion", "Premium sportswear", "Vintage & Resale"],
    brandsTitle: "Brands you really know",
    engageTitle: "And with them, you…",
    engageOpts: ["I follow their collections and shows", "I attend their events", "I buy their products regularly", "I do active trend-watching", "I work or have worked with them", "I resell / collect their pieces", "I recommend them to my network"],
    min1: "Choose at least one universe.",
    traitsEyebrow: "Straight questions", traitsTitle: "Who are you, really?",
    traitsLead: "No modesty, no exaggeration. From \"Mostly\", give a one-line example: that's what earns the medal.",
    proofWaiting: "A precise example unlocks the medal", proofOk: "Medal pending ✓",
    allTraits: "Answer all eight questions to continue.",
    factsEyebrow: "Facts", factsTitle: "What you've actually done",
    factsLead: "Not what you'd like to do: what already happened. Tick everything that's true.",
    voiceEyebrow: "Out loud", voiceTitle: "Three open questions",
    voiceLead: "Speak or type, like in an interview. Nobody grades spelling: we listen to what you know.",
    linksEyebrow: "Your links", linksTitle: "Show us where you are",
    linksLead: "Our AI reads your public pages to confirm your answers and refine your portrait. Nothing is posted, nothing is tracked.",
    otherLink: "Other link (YouTube, Substack, resale shop…)", addLink: "+ Add a link",
    read: "Let the AI read my links", reading: "Reading…", reread: "Read my links again",
    readHead: "What the AI read", readOk: "Read", readPrivate: "Not publicly readable — the team will check by hand",
    readDown: "Unreachable — check the address", followers: "followers",
    cv: "Recent CV (optional)", portfolio: "Portfolio PDF (optional)",
    demoEyebrow: "For quotas", demoTitle: "A few markers",
    demoLead: "Studies often target an age, status or income. Everything is optional.",
    employment: "Employment status", education: "Education level", income: "Annual household income", ethnicity: "Ethnicity (optional)",
    employmentOpts: ["Student", "Full-time employee", "Part-time employee", "Fixed-term contract", "Freelancer / Self-employed", "Manager", "Director / C-level", "Sole trader", "Unemployed, looking", "Unemployed, not looking", "Retired", "Other"],
    educationOpts: ["High school or below", "Associate degree", "Bachelor's degree", "Master's degree", "PhD", "Vocational / Self-taught"],
    incomeOpts: ["Under €20,000", "€20,000 – €35,000", "€35,000 – €55,000", "€55,000 – €80,000", "€80,000 – €120,000", "Over €120,000", "Prefer not to say"],
    ethnicityOpts: ["European / White", "Black / African descent", "North African / Middle Eastern", "Asian", "Latino / Hispanic", "Mixed / Multiracial", "Other", "Prefer not to say"],
    logEyebrow: "Planning", logTitle: "When are you available?",
    availability: "Usual slots", morning: "Morning", afternoon: "Afternoon", evening: "Evening",
    format: "Format", langs: "Interview language(s)", reward: "Preferred reward",
    charterEyebrow: "Last step", charterTitle: "The charter",
    charterWarn: "Any payment outside of Rarelyst is strictly prohibited.",
    accept: "I accept the charter", scrollToEnd: "Scroll the charter to the bottom",
    revealEyebrow: "Profile live", revealTitle: "Your first medals",
    revealLead: "\"Pending\" medals are reviewed by our AI from your examples and links. Only confirmed medals are shown to brands.",
    toUnlock: "To unlock", goDashboard: "See open studies",
    cardTop: "Member card", cardMedals: "Medals", cardFoot: "Brands will see your first name, city, portrait and confirmed medals.",
    perk1: "€80 to €300 per interview", perk1b: "Depending on your profile, wired to your account.",
    perk2: "Private events", perk2b: "Previews, launches, showrooms.",
    perk3: "Pieces before release", perk3b: "Product tests reserved for the panel.",
    stripMedals: "medals",
  },
} as const;

const DAYS: { fr: string; en: string }[] = [
  { fr: "Lun", en: "Mon" }, { fr: "Mar", en: "Tue" }, { fr: "Mer", en: "Wed" },
  { fr: "Jeu", en: "Thu" }, { fr: "Ven", en: "Fri" }, { fr: "Sam", en: "Sat" },
];
const SLOTS = ["morning", "afternoon", "evening"] as const;
const FORMAT_OPTS = [
  { val: "one_on_one", fr: "Entretien individuel en visio", en: "One-to-one video interview" },
  { val: "focus_group", fr: "Focus group en visio (4-8 personnes)", en: "Video focus group (4-8 people)" },
  { val: "both", fr: "Les deux", en: "Both" },
];
const REWARD_OPTS = [
  { val: "cash", fr: "Virement bancaire", en: "Bank transfer" },
  { val: "voucher", fr: "Bon d'achat", en: "Gift card" },
  { val: "products", fr: "Produits de la marque", en: "Brand products" },
  { val: "any", fr: "Peu importe", en: "No preference" },
];
const INTERVIEW_LANGS = ["Français", "English", "Español", "Italiano", "Deutsch"];
const CHARTER_RULES = [
  { fr: "Fournir des informations exactes sur votre identité, parcours et expériences.", en: "Provide accurate information about your identity, background and experiences." },
  { fr: "Répondre honnêtement à toutes les questions des études.", en: "Answer all study questions honestly." },
  { fr: "Ne candidater qu'aux études correspondant réellement à votre profil.", en: "Only apply to studies that genuinely match your profile." },
  { fr: "Respecter la confidentialité totale des sujets abordés en entretien.", en: "Maintain full confidentiality about topics discussed in interviews." },
  { fr: "Ne jamais contacter les marques directement en dehors de la plateforme.", en: "Never contact brands directly outside of the platform." },
  { fr: "Un seul compte par personne — tout doublon entraîne une exclusion définitive.", en: "One account per person — duplicates result in permanent exclusion." },
  { fr: "Communiquer de manière respectueuse avec l'équipe Rarelyst.", en: "Communicate respectfully with the Rarelyst team." },
];
const BRANDS: Record<number, string[]> = {
  0: ["Chanel", "Dior", "Hermès", "Louis Vuitton", "Bottega Veneta", "Céline", "Saint Laurent", "Loewe", "Balenciaga", "Jacquemus", "Rick Owens", "Maison Margiela"],
  1: ["Lacoste", "Nike", "Adidas Originals", "New Balance", "Casablanca", "Ami Paris", "Stone Island", "Represent", "Palace", "Supreme", "Kith", "AWAKE NY"],
  2: ["Jacquemus", "A.P.C.", "Sézane", "Isabel Marant", "Rouje", "Maison Kitsuné", "Officine Générale", "AMI Paris", "Lemaire"],
  3: ["Totême", "Acne Studios", "COS", "Nanushka", "Theory", "Aesop", "Margaret Howell"],
  4: ["Stone Island", "Moncler", "Arc'teryx", "Salomon", "On Running"],
  5: ["Vestiaire Collective", "Vinted", "Grailed", "Depop", "Archive fashion"],
};

// Pictogrammes des segments
const SEG_ICON: Record<Segment, string> = {
  pro: "M4 7h16v12H4z M9 7V5h6v2 M4 12h16",
  consumer: "M6 8h12l-1 12H7z M9 8a3 3 0 0 1 6 0",
  creator: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M6 11a6 6 0 0 0 12 0 M12 17v4",
  hybrid: "M12 3l2.4 5.5 5.6.6-4.2 3.9 1.2 5.6L12 15.8 6.9 18.6l1.3-5.6L4 9.1l5.6-.6z",
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={f.chip} aria-pressed={on} onClick={onClick}>{children}</button>;
}

function Head({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <>
      <p className={f.eyebrow}>{eyebrow}</p>
      <h1 className={f.h1}>{title}</h1>
      {lead && <p className={f.lead}>{lead}</p>}
    </>
  );
}

function ageOf(dob: string): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function ParticipantFunnel() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [cur, setCur] = useState<FunnelScreen>("account");
  const [data, setData] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [account, setAccount] = useState({ email: "", password: "" });
  const [accountCreated, setAccountCreated] = useState(false);
  const [signedEmail, setSignedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrolledCharter, setScrolledCharter] = useState(false);
  const [analysis, setAnalysis] = useState<LinksAnalysis | null>(null);
  const [reading, setReading] = useState(false);
  const [readInputs, setReadInputs] = useState("");

  const t = T[lang];

  // Reprise : brouillon local, puis session (Google / LinkedIn / compte déjà créé).
  useEffect(() => {
    // La langue et le brouillon vivent dans le navigateur : les lire au rendu
    // serveur casserait l'hydratation, d'où cet effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(detectLanguage());
    let draft: { data?: OnboardingState; cur?: FunnelScreen; accountCreated?: boolean; analysis?: LinksAnalysis } | null = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT) ?? "null"); } catch { /* noop */ }
    if (draft?.data) {
      setData({ ...EMPTY_ONBOARDING, ...draft.data });
      if (draft.cur && FUNNEL_SCREENS.includes(draft.cur)) setCur(draft.cur);
      setAccountCreated(!!draft.accountCreated);
      if (draft.analysis) setAnalysis(draft.analysis);
    }
    funnelSession().then((s) => {
      if (!s.signedIn) return;
      if (s.complete && !draft?.data) { router.replace("/participant/dashboard"); return; }
      setAccountCreated(true);
      setSignedEmail(s.email);
      // Le compte existe déjà (Google, LinkedIn, ou créé plus tôt) : rien à refaire.
      setCur((c) => (c === "account" ? "identity" : c));
      setData((d) => ({
        ...d,
        firstName: d.firstName || s.firstName,
        lastName: d.lastName || s.lastName,
        dateOfBirth: d.dateOfBirth || s.dateOfBirth,
        gender: d.gender || s.gender,
        city: d.city || s.city,
      }));
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    try { localStorage.setItem(DRAFT, JSON.stringify({ data, cur, accountCreated, analysis })); } catch { /* noop */ }
  }, [data, cur, accountCreated, analysis]);

  // L'écran « parcours pro » n'existe que pour les pros et les profils hybrides.
  const screens = useMemo(
    () => FUNNEL_SCREENS.filter((s) => s !== "pro" || isPro(data.segment)),
    [data.segment]
  );
  const idx = Math.max(0, screens.indexOf(cur));
  const counted = screens.filter((s) => s !== "final");

  // Médailles en direct : ce que la personne vient de déclarer et de prouver.
  const links = [data.linkedinUrl, data.instagramUrl, data.tiktokUrl, data.websiteUrl, ...data.otherLinks].filter(Boolean);
  const badges = useMemo(() => computeBadges({
    createdAt: new Date(),
    segment: data.segment || null,
    proRole: data.proRole,
    selfTraits: data.selfTraits,
    traitProofs: data.traitProofs,
    behaviours: null,
    idVerified: false,
    linkedinVerified: false,
    links: { given: links.length, read: analysis?.links.filter((l) => l.status === "read").length ?? 0 },
    interviewsDone: 0, noShow: 0, ratings: [],
  }), [data.segment, data.proRole, data.selfTraits, data.traitProofs, links.length, analysis]);
  const won = badges.filter((b) => b.state !== "locked");

  function up(patch: Partial<OnboardingState>) { setData((d) => ({ ...d, ...patch })); }
  function toggle(key: "macroUniverses" | "brandAffinities" | "engagementTypes" | "behavioralChecklist" | "interviewLanguages", val: string) {
    setData((d) => {
      const arr = d[key];
      return { ...d, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }
  function toggleSlot(day: number, slot: string) {
    setData((d) => {
      const k = String(day);
      const c = d.availability[k] ?? [];
      return { ...d, availability: { ...d.availability, [k]: c.includes(slot) ? c.filter((x) => x !== slot) : [...c, slot] } };
    });
  }

  const traitsAnswered = TRAITS.every((tr) => data.selfTraits[tr.key] !== undefined);
  const accountOk = accountCreated || (account.email.includes("@") && account.password.length >= 8);
  const identityOk = !!(data.firstName.trim() && data.lastName.trim() && data.dateOfBirth && data.gender && data.city.trim());

  const canContinue: Record<FunnelScreen, boolean> = {
    account: accountOk,
    identity: identityOk,
    segment: !!data.segment,
    pro: !!(data.proRole && data.proSector && data.proYears),
    universes: data.macroUniverses.length > 0,
    traits: traitsAnswered,
    facts: true, voice: true, links: true, demographics: true, logistics: true,
    charter: data.agreedToCodeOfConduct,
    final: true,
  };

  function linkPayload() {
    return [
      ...LINK_FIELDS.map((l) => ({ kind: l.kind, url: data[`${l.kind}Url` as const] })),
      ...data.otherLinks.map((u) => ({ kind: "other" as const, url: u })),
    ].filter((l) => l.url?.trim());
  }

  async function readLinks() {
    const payload = linkPayload();
    if (!payload.length) return;
    setReading(true);
    // Les déclarations doivent être en base avant la lecture : l'IA confronte
    // les pages à ce que la personne dit d'elle.
    await saveFunnelStep(FUNNEL_SCREENS.indexOf("links"), data).catch(() => {});
    try {
      const res = await fetch("/api/onboarding/analyze-links", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links: payload }),
      });
      if (res.ok) {
        setAnalysis(await res.json());
        setReadInputs(JSON.stringify(payload));
      }
    } finally {
      setReading(false);
    }
  }

  function go(to: FunnelScreen) {
    setError("");
    setCur(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function next() {
    setError("");
    if (cur === "account") {
      if (!accountCreated) {
        setLoading(true);
        const res = await createFunnelAccount({ email: account.email, password: account.password });
        setLoading(false);
        if ("error" in res) { setError(res.error); return; }
        setAccountCreated(true);
        setSignedEmail(account.email.trim().toLowerCase());
      }
      go("identity");
      return;
    }
    if (cur === "identity") {
      const age = ageOf(data.dateOfBirth);
      if (age !== null && age < 18) { setError(t.under18); return; }
      setLoading(true);
      const res = await saveFunnelStep(FUNNEL_SCREENS.indexOf("identity"), data).catch(() => null);
      setLoading(false);
      if (res && "error" in res) { setError(res.error); return; }
      go(screens[idx + 1]);
      return;
    }
    if (cur === "universes" && data.macroUniverses.length === 0) { setError(t.min1); return; }
    if (cur === "traits" && !traitsAnswered) { setError(t.allTraits); return; }

    // Des liens saisis mais pas encore lus : on lance la lecture sans attendre.
    if (cur === "links" && linkPayload().length && readInputs !== JSON.stringify(linkPayload()) && !reading) {
      readLinks();
    }

    if (cur === "charter") {
      setLoading(true);
      await completeFunnel({ ...data, agreedToCodeOfConduct: true }).catch(() => {});
      setLoading(false);
      go("final");
      return;
    }

    if (accountCreated) saveFunnelStep(FUNNEL_SCREENS.indexOf(cur), data).catch(() => {});
    if (idx < screens.length - 1) go(screens[idx + 1]);
  }

  const segLabel = SEGMENTS.find((s) => s.id === data.segment)?.title[lang];
  const shortName = data.firstName ? `${data.firstName} ${data.lastName ? `${data.lastName[0]}.` : ""}` : "";

  return (
    <div className={f.root}>
      <header className={f.top}>
        <div className={f.topInner}>
          <Link href="/" className={f.brand}>Rarelyst</Link>
          {cur !== "final" && <span className={f.stepCount}>{t.step} {Math.min(idx + 1, counted.length)} {t.of} {counted.length}</span>}
          <div className={f.langs}>
            {(["fr", "en"] as Lang[]).map((l) => (
              <button key={l} type="button" className={f.lang} aria-pressed={lang === l}
                onClick={() => { setLang(l); setLanguage(l); }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {cur !== "final" && (
          <div className={f.bar} aria-hidden="true">
            {counted.map((s, i) => <i key={s} data-on={i < idx} data-cur={i === idx} />)}
          </div>
        )}
      </header>

      {cur !== "final" && won.length > 0 && (
        <div className={f.strip}>
          {won.slice(0, 6).map((b) => <Medallion key={b.id} id={b.id} state={b.state} size={26} />)}
          <span>{won.length} {t.stripMedals}</span>
        </div>
      )}

      <div className={f.layout} style={cur === "final" ? { gridTemplateColumns: "1fr" } : undefined}>
        <main className={f.main} style={cur === "final" ? { maxWidth: 760, margin: "0 auto" } : undefined}>
          <div key={cur} className={f.screen}>

            {/* ── Compte : Google, LinkedIn ou email, rien d'autre ── */}
            {cur === "account" && (
              <>
                <Head eyebrow={t.accountEyebrow} title={t.accountTitle} lead={t.accountLead} />
                <div className={f.stack}>
                  {accountCreated ? (
                    <div className={f.signedAs}>✓ {t.signedAs} {signedEmail ?? account.email}</div>
                  ) : (
                    <>
                      <SocialSignIn role="PARTICIPANT" label={lang === "fr" ? "En un clic" : "One click"} />
                      <div className={f.divider}><span>{t.orManual}</span></div>
                      <div><label className={f.label} htmlFor="f-email">{t.email}</label><input id="f-email" type="email" className={f.input} value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} autoComplete="email" /></div>
                      <div><label className={f.label} htmlFor="f-pw">{t.password}</label><input id="f-pw" type="password" className={f.input} value={account.password} onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))} placeholder={t.min8} autoComplete="new-password" /></div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Identité : ce qu'aucun fournisseur ne transmet ── */}
            {cur === "identity" && (
              <>
                <Head eyebrow={t.identityEyebrow} title={t.identityTitle} lead={t.identityLead} />
                <div className={f.stack}>
                  <div className={f.grid2}>
                    <div><label className={f.label} htmlFor="f-first">{t.firstName}</label><input id="f-first" className={f.input} value={data.firstName} onChange={(e) => up({ firstName: e.target.value })} autoComplete="given-name" /></div>
                    <div><label className={f.label} htmlFor="f-last">{t.lastName}</label><input id="f-last" className={f.input} value={data.lastName} onChange={(e) => up({ lastName: e.target.value })} autoComplete="family-name" /></div>
                  </div>
                  <div className={f.grid2}>
                    <div><label className={f.label} htmlFor="f-dob">{t.dob}</label><input id="f-dob" type="date" className={f.input} value={data.dateOfBirth} onChange={(e) => up({ dateOfBirth: e.target.value })} /></div>
                    <div><label className={f.label} htmlFor="f-gender">{t.gender}</label>
                      <select id="f-gender" className={f.select} value={data.gender} onChange={(e) => up({ gender: e.target.value })}>
                        <option value="">{t.select}</option>{t.genders.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={f.grid2}>
                    <div><label className={f.label} htmlFor="f-city">{t.city}</label><input id="f-city" className={f.input} value={data.city} onChange={(e) => up({ city: e.target.value })} autoComplete="address-level2" /></div>
                    <div><label className={f.label} htmlFor="f-country">{t.country}</label><input id="f-country" className={f.input} value={data.country} onChange={(e) => up({ country: e.target.value })} /></div>
                  </div>
                </div>
              </>
            )}

            {/* ── Segment ── */}
            {cur === "segment" && (
              <>
                <Head eyebrow={t.segEyebrow} title={t.segTitle} lead={t.segLead} />
                <div className={f.segments}>
                  {SEGMENTS.map((s) => (
                    <button key={s.id} type="button" className={f.segment} aria-pressed={data.segment === s.id}
                      onClick={() => up({ segment: s.id })}>
                      <span className={f.segIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={SEG_ICON[s.id]} /></svg>
                      </span>
                      <span className={f.segTitle}>{s.title[lang]}</span>
                      <span className={f.segSub}>{s.sub[lang]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Parcours pro ── */}
            {cur === "pro" && (
              <>
                <Head eyebrow={t.proEyebrow} title={t.proTitle} lead={t.proLead} />
                <label className={f.label}>{t.role}</label>
                <div className={f.chips}>
                  {PRO_ROLES.map((r) => <Chip key={r.fr} on={data.proRole === r.fr} onClick={() => up({ proRole: r.fr })}>{r[lang]}</Chip>)}
                </div>
                <h2 className={f.h2}>{t.sector}</h2>
                <div className={f.chips}>
                  {PRO_SECTORS.map((r) => <Chip key={r.fr} on={data.proSector === r.fr} onClick={() => up({ proSector: r.fr })}>{r[lang]}</Chip>)}
                </div>
                <h2 className={f.h2}>{t.years}</h2>
                <div className={f.chips}>
                  {PRO_YEARS.map((r) => <Chip key={r.fr} on={data.proYears === r.fr} onClick={() => up({ proYears: r.fr })}>{r[lang]}</Chip>)}
                </div>
                <h2 className={f.h2}>{t.company}</h2>
                <input className={f.input} value={data.proCompany} onChange={(e) => up({ proCompany: e.target.value })} placeholder="Maison, boutique, agence, école…" />
                <p className={f.hint}>{t.companyHint}</p>
              </>
            )}

            {/* ── Univers ── */}
            {cur === "universes" && (
              <>
                <Head eyebrow={t.univEyebrow} title={t.univTitle} lead={t.univLead} />
                <div className={f.chips}>
                  {t.macroOpts.map((u, i) => <Chip key={u} on={data.macroUniverses.includes(String(i))} onClick={() => toggle("macroUniverses", String(i))}>{u}</Chip>)}
                </div>
                {data.macroUniverses.length > 0 && (
                  <>
                    <h2 className={f.h2}>{t.brandsTitle}</h2>
                    <div className={f.chips}>
                      {[...new Set(data.macroUniverses.flatMap((i) => BRANDS[Number(i)] ?? []))].map((b) => (
                        <Chip key={b} on={data.brandAffinities.includes(b)} onClick={() => toggle("brandAffinities", b)}>{b}</Chip>
                      ))}
                    </div>
                  </>
                )}
                <h2 className={f.h2}>{t.engageTitle}</h2>
                <div className={f.chips}>
                  {t.engageOpts.map((e) => <Chip key={e} on={data.engagementTypes.includes(e)} onClick={() => toggle("engagementTypes", e)}>{e}</Chip>)}
                </div>
              </>
            )}

            {/* ── Questions explicites + preuve ── */}
            {cur === "traits" && (
              <>
                <Head eyebrow={t.traitsEyebrow} title={t.traitsTitle} lead={t.traitsLead} />
                <div className={f.stack}>
                  {TRAITS.map((tr) => {
                    const v = data.selfTraits[tr.key];
                    const claimed = (v ?? 0) >= TRAIT_CLAIMED;
                    const proof = data.traitProofs[tr.key] ?? "";
                    const proven = claimed && proof.trim().length >= PROOF_MIN;
                    return (
                      <div key={tr.key} className={f.trait} data-claimed={claimed} data-proven={proven}>
                        <div className={f.traitQ}>{tr.q[lang]}</div>
                        <span className={f.traitMedal}>
                          <Medallion id={tr.key} state={proven ? "pending" : "locked"} size={52} lang={lang} />
                        </span>
                        <div className={f.traitDef}>{tr.def[lang]}</div>
                        <div className={f.scale} role="radiogroup" aria-label={tr.q[lang]}>
                          {TRAIT_SCALE.map((s, i) => (
                            <button key={i} type="button" className={f.scaleBtn} role="radio" aria-checked={v === i}
                              onClick={() => up({ selfTraits: { ...data.selfTraits, [tr.key]: i } })}>{s[lang]}</button>
                          ))}
                        </div>
                        {claimed && (
                          <div className={f.proof}>
                            <div className={f.proofLabel}>
                              <span>{tr.proof[lang]}</span>
                              <span className={f.proofState} data-ok={proven}>{proven ? t.proofOk : t.proofWaiting}</span>
                            </div>
                            <textarea className={f.textarea} rows={2} value={proof}
                              onChange={(e) => up({ traitProofs: { ...data.traitProofs, [tr.key]: e.target.value } })} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Faits ── */}
            {cur === "facts" && (
              <>
                <Head eyebrow={t.factsEyebrow} title={t.factsTitle} lead={t.factsLead} />
                <div className={f.chips}>
                  {FACTS.filter((x) => x.for !== "pro" || isPro(data.segment)).map((x) => (
                    <Chip key={x.tag} on={data.behavioralChecklist.includes(x.tag)} onClick={() => toggle("behavioralChecklist", x.tag)}>{x[lang]}</Chip>
                  ))}
                </div>
              </>
            )}

            {/* ── Réponses ouvertes ── */}
            {cur === "voice" && (
              <>
                <Head eyebrow={t.voiceEyebrow} title={t.voiceTitle} lead={t.voiceLead} />
                <div className={f.stack} style={{ gap: 26 }}>
                  {VOICE_Q[isPro(data.segment) ? "pro" : "other"].map((q, i) => (
                    <div key={q.id}>
                      <label className={f.label} style={{ fontSize: 15, color: "var(--ink)", fontWeight: 700, marginBottom: 10 }}>{i + 1}. {q[lang]}</label>
                      <VoiceInput lang={lang} minChars={q.min} value={data.expertAnswers[q.id] ?? ""}
                        onChange={(v) => up({ expertAnswers: { ...data.expertAnswers, [q.id]: v } })} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Liens ── */}
            {cur === "links" && (
              <>
                <Head eyebrow={t.linksEyebrow} title={t.linksTitle} lead={t.linksLead} />
                <div className={f.stack}>
                  {LINK_FIELDS.map((l) => {
                    const key = `${l.kind}Url` as "linkedinUrl" | "instagramUrl" | "tiktokUrl" | "websiteUrl";
                    return (
                      <div key={l.kind} className={f.linkRow}>
                        <div><div className={f.linkName}>{l.label}</div><div className={f.linkHint}>{l.hint[lang]}</div></div>
                        <input className={f.input} placeholder={l.placeholder} value={data[key]}
                          onChange={(e) => up({ [key]: e.target.value } as Partial<OnboardingState>)}
                          onBlur={(e) => e.target.value && up({ [key]: toUrl(l.kind, e.target.value) } as Partial<OnboardingState>)} />
                      </div>
                    );
                  })}
                  {data.otherLinks.map((u, i) => (
                    <div key={i} className={f.linkRow}>
                      <div className={f.linkName}>{lang === "fr" ? "Autre" : "Other"}</div>
                      <input className={f.input} value={u} placeholder="https://…"
                        onChange={(e) => up({ otherLinks: data.otherLinks.map((x, j) => (j === i ? e.target.value : x)) })}
                        onBlur={(e) => e.target.value && up({ otherLinks: data.otherLinks.map((x, j) => (j === i ? toUrl("other", e.target.value) : x)) })} />
                    </div>
                  ))}
                  {data.otherLinks.length < 2 && (
                    <button type="button" className={f.chip} style={{ alignSelf: "flex-start" }}
                      onClick={() => up({ otherLinks: [...data.otherLinks, ""] })} title={t.otherLink}>{t.addLink}</button>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <button type="button" className={f.readBtn} disabled={reading || !linkPayload().length} onClick={readLinks}>
                      {reading && <span className={f.scan} />}
                      {reading ? t.reading : analysis ? t.reread : t.read}
                    </button>
                  </div>

                  {analysis && !reading && (
                    <div className={f.readout}>
                      <span className={f.readoutHead}>{t.readHead}</span>
                      {analysis.headline && <span className={f.readoutLine}>{analysis.headline}</span>}
                      {analysis.links.map((l) => (
                        <div key={l.url} className={f.readItem}>
                          <span className={f.dot} data-s={l.status}>{l.status === "read" ? "✓" : l.status === "private" ? "…" : "!"}</span>
                          <span>
                            <b>{LINK_FIELDS.find((x) => x.kind === l.kind)?.label ?? new URL(l.url).hostname}</b>
                            {" — "}{l.status === "read" ? (l.summary ?? t.readOk) : l.status === "private" ? t.readPrivate : t.readDown}
                            {l.status === "read" && (l.signals?.length || l.followers) ? (
                              <small>{[...(l.signals ?? []), l.followers ? `${l.followers.toLocaleString(lang)} ${t.followers}` : null].filter(Boolean).join(" · ")}</small>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 10 }} className={f.stack}>
                    <BadgeUpload kind="cv" label={t.cv} value={data.cvUrl} onChange={(url) => up({ cvUrl: url })} lang={lang} />
                    <BadgeUpload kind="portfolio" label={t.portfolio} value={data.portfolioUrl} onChange={(url) => up({ portfolioUrl: url })} lang={lang} />
                  </div>
                </div>
              </>
            )}

            {/* ── Démographie ── */}
            {cur === "demographics" && (
              <>
                <Head eyebrow={t.demoEyebrow} title={t.demoTitle} lead={t.demoLead} />
                <div className={f.stack}>
                  {([
                    [t.employment, t.employmentOpts, "employmentStatus"],
                    [t.education, t.educationOpts, "educationLevel"],
                    [t.income, t.incomeOpts, "householdIncome"],
                    [t.ethnicity, t.ethnicityOpts, "ethnicity"],
                  ] as const).map(([label, opts, key]) => (
                    <div key={key}>
                      <label className={f.label}>{label}</label>
                      <select className={f.select} value={data[key]} onChange={(e) => up({ [key]: e.target.value } as Partial<OnboardingState>)}>
                        <option value="">{t.select}</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Logistique ── */}
            {cur === "logistics" && (
              <>
                <Head eyebrow={t.logEyebrow} title={t.logTitle} />
                <label className={f.label}>{t.availability}</label>
                <div className={f.week}>
                  <span />
                  <span className={f.weekHead}>{t.morning}</span>
                  <span className={f.weekHead}>{t.afternoon}</span>
                  <span className={f.weekHead}>{t.evening}</span>
                  {DAYS.map((d, di) => (
                    <Fragment key={di}>
                      <span className={f.weekDay}>{d[lang]}</span>
                      {SLOTS.map((s) => {
                        const on = (data.availability[String(di)] ?? []).includes(s);
                        return <button key={s} type="button" className={f.slot} aria-pressed={on} aria-label={`${d[lang]} ${s}`} onClick={() => toggleSlot(di, s)}>✓</button>;
                      })}
                    </Fragment>
                  ))}
                </div>
                <h2 className={f.h2}>{t.format}</h2>
                <div className={f.chips}>{FORMAT_OPTS.map((o) => <Chip key={o.val} on={data.preferredFormat === o.val} onClick={() => up({ preferredFormat: o.val })}>{o[lang]}</Chip>)}</div>
                <h2 className={f.h2}>{t.langs}</h2>
                <div className={f.chips}>{INTERVIEW_LANGS.map((l) => <Chip key={l} on={data.interviewLanguages.includes(l)} onClick={() => toggle("interviewLanguages", l)}>{l}</Chip>)}</div>
                <h2 className={f.h2}>{t.reward}</h2>
                <div className={f.chips}>{REWARD_OPTS.map((o) => <Chip key={o.val} on={data.rewardPreference === o.val} onClick={() => up({ rewardPreference: o.val })}>{o[lang]}</Chip>)}</div>
              </>
            )}

            {/* ── Charte ── */}
            {cur === "charter" && (
              <>
                <Head eyebrow={t.charterEyebrow} title={t.charterTitle} />
                <div className={f.charter} onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) setScrolledCharter(true);
                }} ref={(el) => { if (el && el.scrollHeight <= el.clientHeight + 30) setScrolledCharter(true); }}>
                  <div className={f.charterWarn}>{t.charterWarn}</div>
                  <ol>{CHARTER_RULES.map((r, i) => <li key={i}>{r[lang]}</li>)}</ol>
                </div>
                <label className={f.check} data-disabled={!scrolledCharter}>
                  <input type="checkbox" disabled={!scrolledCharter} checked={data.agreedToCodeOfConduct}
                    onChange={(e) => up({ agreedToCodeOfConduct: e.target.checked })} />
                  {scrolledCharter ? t.accept : t.scrollToEnd}
                </label>
              </>
            )}

            {/* ── Révélation ── */}
            {cur === "final" && <Reveal badges={badges} lang={lang} t={t} onGo={() => {
              try { localStorage.removeItem(DRAFT); } catch { /* noop */ }
              router.push("/participant/dashboard");
            }} />}

            {error && <p className={f.error}>{error}</p>}

            {cur !== "final" && (
              <div className={f.nav}>
                {idx > 0 && !(cur === "identity" && accountCreated) && <button type="button" className={`${f.btn} ${f.btnGhost}`} onClick={() => go(screens[idx - 1])}>{t.back}</button>}
                <button type="button" className={f.btn} onClick={next} disabled={loading || !canContinue[cur]}>
                  {loading ? "…" : cur === "charter" ? t.finish : t.continue}
                </button>
              </div>
            )}
          </div>
        </main>

        {cur !== "final" && (
          <aside className={f.aside}>
            <MemberCard name={shortName} city={data.city} segment={segLabel} universes={data.macroUniverses.map((i) => t.macroOpts[Number(i)]).filter(Boolean)} won={won} t={t} />
            {cur === "account" && (
              <div className={f.perks}>
                {[[t.perk1, t.perk1b], [t.perk2, t.perk2b], [t.perk3, t.perk3b]].map(([a, b]) => (
                  <div key={a} className={f.perk}><span><b>{a}</b>{b}</span></div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

type Dict = (typeof T)[Lang];

/** La carte se remplit au fil des réponses : nom, univers, médailles. */
function MemberCard({ name, city, segment, universes, won, t }: {
  name: string; city: string; segment?: string; universes: string[]; won: EarnedBadge[]; t: Dict;
}) {
  const SLOTS_SHOWN = 8;
  return (
    <div className={f.card}>
      <div className={f.cardTop}><span>Rarelyst</span><span>{t.cardTop}</span></div>
      <div className={f.cardName}>{name || "—"}</div>
      <div className={f.cardMeta}>{[city, universes.slice(0, 2).join(" · ")].filter(Boolean).join(" — ")}</div>
      {segment && <span className={f.cardSeg}>{segment}</span>}
      <div className={f.cardMedals}>
        <div className={f.cardMedalsHead}><span>{t.cardMedals}</span><span>{won.length} / {Object.keys(BADGES).length}</span></div>
        <div className={f.cardMedalsRow}>
          {won.map((b) => <Medallion key={b.id} id={b.id} state={b.state} size={40} />)}
          {Array.from({ length: Math.max(0, SLOTS_SHOWN - won.length) }, (_, i) => <span key={i} className={f.emptySlot} />)}
        </div>
      </div>
      <p className={f.cardFoot}>{t.cardFoot}</p>
    </div>
  );
}

function Reveal({ badges, lang, t, onGo }: { badges: EarnedBadge[]; lang: Lang; t: Dict; onGo: () => void }) {
  const got = badges.filter((b) => b.state !== "locked");
  const next = badges.filter((b) => b.state === "locked" && ["verifie", "relie", "premier", "recommande", "ponctuel"].includes(b.id));
  return (
    <div className={f.reveal}>
      <p className={f.eyebrow}>{t.revealEyebrow}</p>
      <h1 className={f.h1}>{t.revealTitle}</h1>
      <div className={f.revealStage}>
        {got.map((b, i) => <BadgeTile key={b.id} b={b} lang={lang} size={i === 0 ? 132 : 104} reveal delay={200 + i * 180} />)}
      </div>
      <p className={f.revealNote}>{t.revealLead}</p>
      {next.length > 0 && (
        <>
          <p className={f.lockedTitle}>{t.toUnlock}</p>
          <div className={f.lockedRow}>
            {next.map((b) => <BadgeTile key={b.id} b={b} lang={lang} size={64} />)}
          </div>
        </>
      )}
      <div className={f.nav} style={{ justifyContent: "center", marginTop: 40 }}>
        <button type="button" className={f.btn} style={{ flex: "none", padding: "14px 28px" }} onClick={onGo}>{t.goDashboard} →</button>
      </div>
    </div>
  );
}
