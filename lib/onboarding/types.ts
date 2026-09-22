export type ProfileLevel = "bronze" | "silver" | "gold" | "platine";

export type SelfProfileType =
  | "industry_insider"
  | "advanced_consumer"
  | "early_adopter"
  | "collector_reseller"
  | "tastemaker"
  | "analyst";

// État complet du tunnel — sauvegardé progressivement en DB.
export type OnboardingState = {
  step: number;

  // Étape 0 — compte
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  country: string;

  // Étape 1 — démographie
  employmentStatus: string;
  educationLevel: string;
  householdIncome: string;
  ethnicity: string;

  // Étape 2 — univers mode
  macroUniverses: string[];
  brandAffinities: string[];
  engagementTypes: string[];

  // Étape 3 — type de profil
  selfProfileType: SelfProfileType | "";

  // Étape 4 — preuves comportementales
  behavioralChecklist: string[];
  adaptiveAnswers: Record<string, string>;

  // Étape 5 — questions expertes
  expertAnswers: Record<string, string>;

  // Étape 6 — badges
  linkedinUrl: string;
  cvUrl: string;
  portfolioUrl: string;
  instagramUrl: string;

  // Étape 7 — logistique
  availability: Record<string, string[]>;
  preferredFormat: string;
  interviewLanguages: string[];
  rewardPreference: string;

  // Étape 8 — code de conduite
  agreedToCodeOfConduct: boolean;
};

export const EMPTY_ONBOARDING: OnboardingState = {
  step: 0,
  firstName: "", lastName: "", dateOfBirth: "", gender: "", city: "", country: "FR",
  employmentStatus: "", educationLevel: "", householdIncome: "", ethnicity: "",
  macroUniverses: [], brandAffinities: [], engagementTypes: [],
  selfProfileType: "",
  behavioralChecklist: [], adaptiveAnswers: {},
  expertAnswers: {},
  linkedinUrl: "", cvUrl: "", portfolioUrl: "", instagramUrl: "",
  availability: {}, preferredFormat: "", interviewLanguages: [], rewardPreference: "",
  agreedToCodeOfConduct: false,
};

// Écrans du tunnel, dans l'ordre. Source unique de vérité — la page et les
// server actions s'y réfèrent plutôt que de compter les écrans à la main.
export const FUNNEL_SCREENS = [
  "account", "gain", "demographics", "universes", "profile_type",
  "behavioral", "expert", "level", "badges", "logistics", "charter", "final",
] as const;

export type FunnelScreen = (typeof FUNNEL_SCREENS)[number];

// Index du dernier écran atteint quand le profil est finalisé.
export const FUNNEL_LAST_STEP = FUNNEL_SCREENS.indexOf("final");
