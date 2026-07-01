"use client";

import { useState, useEffect, useCallback } from "react";

type GhostSummary = {
  overallQualityScore: number | null;
  profileType: string | null;
  primaryExpertise: string | null;
  secondaryExpertises: string[];
  generationTag: string | null;
  influenceTier: string | null;
  aiStrengths: string[];
  aiRecommendedBrands: string[];
};

type ProfileCard = {
  id: string;
  firstName: string;
  lastInitial: string;
  city: string | null;
  country: string;
  profession: string | null;
  professionalBio: string | null;
  brandAffinities: string[];
  followerRange: string | null;
  ghostFile: GhostSummary | null;
};

const PROFILE_TYPES = ["expert", "insider", "influencer", "creative", "enthusiast"];
const EXPERTISE = ["luxe", "streetwear", "mode contemporaine", "beauté", "retail", "styling", "accessories"];
const INFLUENCE_TIERS = [
  { value: "none", label: "Pas d'influence (<1k)" },
  { value: "nano", label: "Nano (1k–10k)" },
  { value: "micro", label: "Micro (10k–50k)" },
  { value: "macro", label: "Macro (50k+)" },
];
const GENERATIONS = ["Gen Z", "Millennial", "Gen X"];

const SCORE_COLOR = (s: number | null) => {
  if (!s) return "var(--color-text-tertiary)";
  if (s >= 7) return "#1A7A4A";
  if (s >= 5) return "#9A6700";
  return "#B91C1C";
};

const SCORE_BG = (s: number | null) => {
  if (!s) return "var(--color-surface-2)";
  if (s >= 7) return "#E6F4EC";
  if (s >= 5) return "#FDF3DC";
  return "#FEE2E2";
};

type Filters = {
  profileType: string;
  primaryExpertise: string;
  minScore: string;
  influenceTier: string;
  generationTag: string;
  city: string;
};

const EMPTY_FILTERS: Filters = {
  profileType: "", primaryExpertise: "", minScore: "",
  influenceTier: "", generationTag: "", city: "",
};

function ProfileCard({ p, onClick }: { p: ProfileCard; onClick: () => void }) {
  const score = p.ghostFile?.overallQualityScore ?? null;
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "12px", padding: "20px", cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(27,61,42,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "2px" }}>
            {p.firstName} {p.lastInitial}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {p.profession ?? ""}{p.city ? ` · ${p.city}` : ""}
          </div>
        </div>
        {score !== null && (
          <div style={{ textAlign: "center", padding: "6px 10px", borderRadius: "8px", background: SCORE_BG(score) }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: SCORE_COLOR(score), lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: "9px", color: SCORE_COLOR(score), fontWeight: 600, marginTop: "2px" }}>QUALIO</div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
        {p.ghostFile?.profileType && (
          <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "var(--color-accent)", color: "#fff" }}>
            {p.ghostFile.profileType}
          </span>
        )}
        {p.ghostFile?.primaryExpertise && (
          <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>
            {p.ghostFile.primaryExpertise}
          </span>
        )}
        {p.ghostFile?.generationTag && (
          <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            {p.ghostFile.generationTag}
          </span>
        )}
        {p.ghostFile?.influenceTier && p.ghostFile.influenceTier !== "none" && (
          <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "11px", background: "#DBEAFE", color: "#1D4ED8" }}>
            {p.ghostFile.influenceTier}
          </span>
        )}
      </div>

      {/* Bio */}
      {p.professionalBio && (
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.professionalBio}
        </p>
      )}

      {/* Strengths */}
      {(p.ghostFile?.aiStrengths ?? []).length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          {p.ghostFile!.aiStrengths.slice(0, 2).map((s, i) => (
            <div key={i} style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", alignItems: "flex-start", gap: "5px", marginBottom: "3px" }}>
              <span style={{ color: "#1A7A4A", flexShrink: 0, marginTop: "1px" }}>✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Brand affinities */}
      {p.brandAffinities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {p.brandAffinities.slice(0, 4).map((b) => (
            <span key={b} style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "11px", background: "var(--color-surface-2)", color: "var(--color-text-tertiary)", border: "1px solid var(--color-border)" }}>{b}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandProfilesClient() {
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<ProfileCard | null>(null);
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const load = useCallback(async (q: string, f: Filters, p: number) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { page: p };
      if (q.trim()) body.query = q;
      const activeFilters: Record<string, unknown> = {};
      if (f.profileType) activeFilters.profileType = f.profileType;
      if (f.primaryExpertise) activeFilters.primaryExpertise = f.primaryExpertise;
      if (f.minScore) activeFilters.minScore = parseInt(f.minScore);
      if (f.influenceTier) activeFilters.influenceTier = f.influenceTier;
      if (f.generationTag) activeFilters.generationTag = f.generationTag;
      if (f.city) activeFilters.city = f.city;
      if (Object.keys(activeFilters).length > 0) body.filters = activeFilters;

      const res = await fetch("/api/profiles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { results: ProfileCard[]; total: number };
      if (p === 0) {
        setProfiles(data.results ?? []);
      } else {
        setProfiles((prev) => [...prev, ...(data.results ?? [])]);
      }
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("", EMPTY_FILTERS, 0); }, [load]);

  function handleSearch() {
    setPage(0);
    load(query, filters, 0);
  }

  function updateFilter(k: keyof Filters, v: string) {
    const next = { ...filters, [k]: v };
    setFilters(next);
    setPage(0);
    load(query, next, 0);
  }

  function clearAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setPage(0);
    load("", EMPTY_FILTERS, 0);
  }

  const hasFilters = query.trim() || Object.values(filters).some(Boolean);

  const selectSel = { padding: "9px 12px", width: "100%", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", background: "var(--color-surface)", color: "var(--color-text-primary)", cursor: "pointer" };
  const inpStyle = { ...selectSel, outline: "none" };

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "calc(100vh - 60px)" }}>
      {/* Filter sidebar */}
      <div style={{
        width: filtersOpen ? "240px" : "0", flexShrink: 0, overflow: "hidden",
        transition: "width 0.2s ease", borderRight: "1px solid var(--color-border)",
        background: "var(--color-surface)", position: "relative",
      }}>
        <div style={{ width: "240px", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filtres</span>
            {hasFilters && <button onClick={clearAll} style={{ fontSize: "12px", color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}>Tout effacer</button>}
          </div>

          {/* Type de profil */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Type de profil</label>
            <select style={selectSel} value={filters.profileType} onChange={(e) => updateFilter("profileType", e.target.value)}>
              <option value="">Tous les types</option>
              {PROFILE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {/* Expertise */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Expertise principale</label>
            <select style={selectSel} value={filters.primaryExpertise} onChange={(e) => updateFilter("primaryExpertise", e.target.value)}>
              <option value="">Toutes les expertises</option>
              {EXPERTISE.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>

          {/* Score minimum */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Score Qualio minimum</label>
            <select style={selectSel} value={filters.minScore} onChange={(e) => updateFilter("minScore", e.target.value)}>
              <option value="">Tous les scores</option>
              {[5, 6, 7, 8, 9].map((s) => <option key={s} value={String(s)}>{s}+/10</option>)}
            </select>
          </div>

          {/* Influence */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Niveau d'influence</label>
            <select style={selectSel} value={filters.influenceTier} onChange={(e) => updateFilter("influenceTier", e.target.value)}>
              <option value="">Tous</option>
              {INFLUENCE_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Génération */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Génération</label>
            <select style={selectSel} value={filters.generationTag} onChange={(e) => updateFilter("generationTag", e.target.value)}>
              <option value="">Toutes les générations</option>
              {GENERATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Ville */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Ville</label>
            <input
              style={inpStyle}
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              placeholder="Paris, Lyon…"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Top bar */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{ padding: "8px 14px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {filtersOpen ? "← Masquer filtres" : "→ Filtres"}
          </button>

          {/* NL Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder='Recherche naturelle — ex: "Je cherche un buyer senior spécialisé luxe japonais"'
              style={{
                width: "100%", padding: "10px 16px",
                border: "1px solid var(--color-border)", borderRadius: "8px",
                fontSize: "14px", background: "var(--color-background)",
                color: "var(--color-text-primary)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ padding: "10px 20px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "…" : "Rechercher"}
          </button>
        </div>

        {/* Results header */}
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {loading ? "Recherche…" : `${total} profil${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
          </span>
          {hasFilters && (
            <button onClick={clearAll} style={{ fontSize: "12px", color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Profile grid */}
        <div style={{ padding: "0 24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {profiles.map((p) => (
            <ProfileCard key={p.id} p={p} onClick={() => setSelected(p)} />
          ))}
          {!loading && profiles.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "60px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: "var(--color-text-primary)" }}>Aucun profil trouvé</div>
              <div style={{ fontSize: "13px" }}>Modifiez vos critères ou élargissez votre recherche.</div>
            </div>
          )}
        </div>

        {/* Load more */}
        {profiles.length < total && !loading && (
          <div style={{ textAlign: "center", padding: "16px 24px 32px" }}>
            <button
              onClick={() => { const next = page + 1; setPage(next); load(query, filters, next); }}
              style={{ padding: "10px 28px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
            >
              Charger plus ({profiles.length}/{total})
            </button>
          </div>
        )}
      </div>

      {/* Profile detail modal */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 1000, padding: "0" }}
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "480px", height: "100vh", background: "var(--color-surface)", overflowY: "auto", padding: "32px 28px", borderLeft: "1px solid var(--color-border)", boxShadow: "-8px 0 40px rgba(0,0,0,0.1)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, margin: "0 0 4px" }}>
                  {selected.firstName} {selected.lastInitial}
                </h2>
                <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                  {selected.profession ?? ""}{selected.city ? ` · ${selected.city}` : ""}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--color-text-tertiary)", lineHeight: 1 }}>×</button>
            </div>

            {/* Score */}
            {selected.ghostFile?.overallQualityScore !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", background: SCORE_BG(selected.ghostFile?.overallQualityScore ?? null), borderRadius: "10px", marginBottom: "20px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "40px", fontWeight: 700, color: SCORE_COLOR(selected.ghostFile?.overallQualityScore ?? null), lineHeight: 1 }}>
                  {selected.ghostFile?.overallQualityScore}
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Score Qualio</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>Évaluation qualitative de l'expertise</div>
                </div>
              </div>
            )}

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
              {selected.ghostFile?.profileType && <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "#fff" }}>{selected.ghostFile.profileType}</span>}
              {selected.ghostFile?.primaryExpertise && <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>{selected.ghostFile.primaryExpertise}</span>}
              {selected.ghostFile?.secondaryExpertises?.map((e) => (
                <span key={e} style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{e}</span>
              ))}
              {selected.ghostFile?.generationTag && <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{selected.ghostFile.generationTag}</span>}
            </div>

            {/* Bio */}
            {selected.professionalBio && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Profil</div>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{selected.professionalBio}</p>
              </div>
            )}

            {/* Points forts */}
            {(selected.ghostFile?.aiStrengths ?? []).length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Points forts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selected.ghostFile!.aiStrengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                      <span style={{ color: "#1A7A4A", flexShrink: 0 }}>✓</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affinités marques */}
            {selected.brandAffinities.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Affinités marques</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selected.brandAffinities.map((b) => (
                    <span key={b} style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "12px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Marques recommandées */}
            {(selected.ghostFile?.aiRecommendedBrands ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Études idéales pour ce profil</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selected.ghostFile!.aiRecommendedBrands.map((b) => (
                    <span key={b} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contacter l'équipe */}
            <div style={{ marginTop: "28px", padding: "18px 20px", background: "var(--color-surface-2)", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>Intéressé par ce profil ?</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Créez une étude ou contactez notre équipe — nous nous chargeons de shortlister ce profil pour vous.
              </div>
              <a href="/brand/studies/new" style={{ display: "inline-block", marginTop: "12px", padding: "9px 18px", background: "var(--color-accent)", color: "#fff", borderRadius: "7px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Créer une étude →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
