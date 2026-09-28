// Types et constantes du brief, sans dépendance serveur : la page de la
// marque les importe aussi.

export const DURATIONS = [30, 45, 60, 90] as const;
export type Duration = (typeof DURATIONS)[number];

export type BriefProfile = { label: string; count: number; details: string };

export type BriefDraft = {
  title: string;
  objective: string;
  profiles: BriefProfile[];
  studyType: "ONE_ON_ONE" | "FOCUS_GROUP";
  duration: Duration;
  language: "fr" | "en";
  ageMin: number | null;
  ageMax: number | null;
  cities: string[];
  brandAffinities: string[];
  exclusions: string;
  decisions: string[];
  guide: string[];
  /** Date limite si le brief en donne une (AAAA-MM-JJ). */
  deadline: string | null;
  /** Ce que le brief ne dit pas et qu'il faudrait préciser. */
  missing: string[];
};

export const EMPTY_DRAFT: BriefDraft = {
  title: "", objective: "", profiles: [{ label: "", count: 6, details: "" }], studyType: "ONE_ON_ONE", duration: 45,
  language: "fr", ageMin: null, ageMax: null, cities: [], brandAffinities: [], exclusions: "", decisions: [], guide: [],
  deadline: null, missing: [],
};
