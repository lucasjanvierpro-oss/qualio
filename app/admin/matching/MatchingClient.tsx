"use client";

import { useState, useTransition } from "react";
import { shortlistParticipant } from "@/app/actions/studies";

type Criteria = {
  ageMin?: number;
  ageMax?: number;
  cities?: string[];
  interests?: string[];
  brandAffinities?: string[];
  profession?: string;
  custom?: string;
};

type Study = {
  id: string;
  brand: string;
  title: string;
  objective?: string;
  deadline: string | null;
  confirmed: number;
  target: number;
  criteria: Criteria;
  shortlistedIds: string[];
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  age: number | null;
  profession: string | null;
  interests: string[];
  brandAffinities: string[];
  bio: string | null;
  screenerAnswers: Record<string, string> | null;
};

type AiResult = { id: string; score: number; reason: string };

function heuristicScore(p: Participant, criteria: Criteria): number {
  let score = 0;
  if (criteria.ageMin && p.age && p.age >= criteria.ageMin) score++;
  if (criteria.ageMax && p.age && p.age <= criteria.ageMax) score++;
  if (criteria.cities?.length && p.city && criteria.cities.some((c) => p.city!.toLowerCase().includes(c.toLowerCase()))) score++;
  const iMatch = criteria.interests?.filter((i) => p.interests.some((pi) => pi.toLowerCase().includes(i.toLowerCase()))) ?? [];
  score += Math.min(2, iMatch.length);
  const bMatch = criteria.brandAffinities?.filter((b) => p.brandAffinities.some((pb) => pb.toLowerCase().includes(b.toLowerCase()))) ?? [];
  score += Math.min(2, bMatch.length);
  return Math.min(5, score);
}

const SCORE_COLOR: Record<number, { text: string; bg: string }> = {
  5: { text: "#4ADE80", bg: "#1A7A4A20" },
  4: { text: "#86EFAC", bg: "#1A7A4A15" },
  3: { text: "#FBBF24", bg: "#9A670020" },
  2: { text: "#F87171", bg: "#B91C1C15" },
  1: { text: "#6B6760", bg: "#2A292620" },
};

export default function MatchingClient({
  studies,
  participants,
}: {
  studies: Study[];
  participants: Participant[];
}) {
  const [activeStudyId, setActiveStudyId] = useState(studies[0]?.id ?? "");
  const [localShortlisted, setLocalShortlisted] = useState<Record<string, string[]>>(
    Object.fromEntries(studies.map((s) => [s.id, s.shortlistedIds]))
  );
  const [selected, setSelected] = useState<Participant | null>(null);
  const [isPending, startTransition] = useTransition();

  const [aiScores, setAiScores] = useState<Record<string, AiResult>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRanked, setAiRanked] = useState(false);

  const activeStudy = studies.find((s) => s.id === activeStudyId);

  function switchStudy(id: string) {
    setActiveStudyId(id);
    setSelected(null);
    setAiScores({});
    setAiRanked(false);
    setAiError(null);
  }

  async function runBatchMatch() {
    if (!activeStudy) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const shortlistedForStudy = localShortlisted[activeStudy.id] ?? [];
      const available = participants.filter((p) => !shortlistedForStudy.includes(p.id));
      const res = await fetch("/api/admin/ai-batch-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study: activeStudy, participants: available }),
      });
      const data = await res.json();
      const map: Record<string, AiResult> = {};
      for (const r of data.results ?? []) map[r.id] = r;
      setAiScores(map);
      setAiRanked(true);
    } catch {
      setAiError("Erreur lors de l'analyse — vérifiez votre clé API Anthropic.");
    } finally {
      setAiLoading(false);
    }
  }

  function doShortlist(p: Participant) {
    setLocalShortlisted((prev) => ({ ...prev, [activeStudy!.id]: [...(prev[activeStudy!.id] ?? []), p.id] }));
    setSelected(null);
    startTransition(async () => {
      await shortlistParticipant(activeStudy!.id, p.id);
    });
  }

  if (!activeStudy) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "#F9F8F6", margin: "0 0 24px" }}>File de matching</h1>
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#6B6760" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
          <div style={{ fontSize: "16px", color: "#9E9B95" }}>Aucune étude active à matcher pour le moment.</div>
        </div>
      </div>
    );
  }

  const shortlistedForStudy = localShortlisted[activeStudy.id] ?? [];
  const available = participants.filter((p) => !shortlistedForStudy.includes(p.id));
  const shortlisted = participants.filter((p) => shortlistedForStudy.includes(p.id));

  // Sort: if AI ranked, use AI scores; else heuristic
  const sortedAvailable = [...available].sort((a, b) => {
    const sa = aiRanked ? (aiScores[a.id]?.score ?? 0) : heuristicScore(a, activeStudy.criteria);
    const sb = aiRanked ? (aiScores[b.id]?.score ?? 0) : heuristicScore(b, activeStudy.criteria);
    return sb - sa;
  });

  // Split into matched (score >= 3 from AI, or all if not ranked) and weak
  const matched = aiRanked ? sortedAvailable.filter((p) => (aiScores[p.id]?.score ?? 0) >= 3) : sortedAvailable;
  const weak = aiRanked ? sortedAvailable.filter((p) => (aiScores[p.id]?.score ?? 0) < 3) : [];

  const selectedAi = selected ? aiScores[selected.id] : null;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "#F9F8F6", margin: "0 0 24px" }}>
        File de matching
      </h1>

      {/* Study selector */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        {studies.map((s) => {
          const days = s.deadline ? Math.ceil((new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          return (
            <button
              key={s.id}
              onClick={() => switchStudy(s.id)}
              style={{
                padding: "14px 18px", borderRadius: "10px", border: "1px solid",
                borderColor: activeStudyId === s.id ? "#573E69" : "#2A2926",
                background: activeStudyId === s.id ? "#573E6920" : "#1A1917",
                textAlign: "left", cursor: "pointer", minWidth: "220px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#9E9B95", marginBottom: "2px" }}>{s.brand}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#F9F8F6", marginBottom: "6px" }}>{s.title}</div>
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#6B6760" }}>
                <span style={{ color: s.confirmed >= s.target ? "#4ADE80" : "#FBBF24", fontFamily: "monospace", fontWeight: 700 }}>{s.confirmed}/{s.target}</span>
                {days !== null && <span>J-{days}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Criteria + AI button */}
      <div style={{ padding: "16px 20px", background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Critères de l'étude
          </div>
          <button
            onClick={runBatchMatch}
            disabled={aiLoading}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 18px", borderRadius: "8px", border: "none",
              background: aiRanked ? "#573E69" : "linear-gradient(135deg, #573E69, #2A5C40)",
              color: "#fff", fontSize: "13px", fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer",
              opacity: aiLoading ? 0.8 : 1, whiteSpace: "nowrap",
            }}
          >
            {aiLoading ? (
              <>
                <span style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>⟳</span>
                Analyse en cours…
              </>
            ) : aiRanked ? (
              <>✨ Re-analyser</>
            ) : (
              <>✨ Générer le top matching IA</>
            )}
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "#9E9B95" }}>
          {activeStudy.criteria.ageMin && <span>📅 <strong style={{ color: "#F9F8F6" }}>{activeStudy.criteria.ageMin}–{activeStudy.criteria.ageMax} ans</strong></span>}
          {activeStudy.criteria.cities?.length ? <span>📍 <strong style={{ color: "#F9F8F6" }}>{activeStudy.criteria.cities.join(", ")}</strong></span> : null}
          {activeStudy.criteria.interests?.length ? <span>✨ <strong style={{ color: "#F9F8F6" }}>{activeStudy.criteria.interests.join(", ")}</strong></span> : null}
          {activeStudy.criteria.brandAffinities?.length ? <span>👜 <strong style={{ color: "#F9F8F6" }}>{activeStudy.criteria.brandAffinities.join(", ")}</strong></span> : null}
          {activeStudy.criteria.profession && <span>💼 <strong style={{ color: "#F9F8F6" }}>{activeStudy.criteria.profession}</strong></span>}
        </div>
        {activeStudy.criteria.custom && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "#111110", borderRadius: "8px", fontSize: "13px", color: "#9E9B95" }}>
            {activeStudy.criteria.custom}
          </div>
        )}
        {aiError && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "#B91C1C15", border: "1px solid #B91C1C40", borderRadius: "8px", fontSize: "13px", color: "#F87171" }}>
            {aiError}
          </div>
        )}
      </div>

      {/* AI ranking notice */}
      {aiRanked && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#573E6920", border: "1px solid #573E69", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", color: "#4ADE80" }}>
          <span style={{ fontSize: "18px" }}>✨</span>
          <span>
            <strong>{matched.length} profil{matched.length > 1 ? "s" : ""}</strong> correspondants trouvés par Claude IA
            {weak.length > 0 && <span style={{ color: "#6B6760" }}> · {weak.length} faibles</span>}
          </span>
          <button
            onClick={() => { setAiRanked(false); setAiScores({}); }}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#6B6760", cursor: "pointer", fontSize: "12px" }}
          >
            ✕ Effacer
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: "20px" }}>
        <div>
          {/* Shortlisted section */}
          {shortlisted.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                Shortlistés ({shortlisted.length}) — en attente review marque
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {shortlisted.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", background: "#1A7A4A10", border: "1px solid #1A7A4A30", borderRadius: "8px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#2A2926", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "#9E9B95", flexShrink: 0 }}>{p.firstName[0]}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#F9F8F6" }}>{p.firstName} {p.lastName}</span>
                      <span style={{ fontSize: "12px", color: "#6B6760", marginLeft: "8px" }}>{p.city}{p.age ? `, ${p.age} ans` : ""} · {p.profession}</span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#4ADE80" }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidates header */}
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            {aiRanked ? `Meilleures correspondances (${matched.length})` : `Candidats (${available.length})`}
          </div>

          {/* Matched candidates */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: aiRanked && weak.length > 0 ? "20px" : "0" }}>
            {matched.length === 0 && !aiLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6B6760", fontSize: "14px", background: "#1A1917", borderRadius: "8px", border: "1px solid #2A2926" }}>
                {aiRanked ? "Aucun profil ne correspond suffisamment aux critères." : "Tous les participants ont été shortlistés."}
              </div>
            ) : (
              matched.map((p) => {
                const ai = aiScores[p.id];
                const sc = ai?.score ?? heuristicScore(p, activeStudy.criteria);
                const colors = SCORE_COLOR[sc] ?? SCORE_COLOR[1];
                const isSelected = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(isSelected ? null : p)}
                    style={{
                      display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                      gap: "14px", padding: "14px 16px",
                      background: isSelected ? "#573E6920" : "#1A1917",
                      border: `1px solid ${isSelected ? "#573E69" : "#2A2926"}`,
                      borderRadius: "8px", cursor: "pointer", textAlign: "left", alignItems: "center",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2A2926", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "#9E9B95", flexShrink: 0 }}>
                      {p.firstName[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#F9F8F6", marginBottom: "2px" }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: "12px", color: "#6B6760" }}>
                        {p.city ?? "—"}{p.age ? `, ${p.age} ans` : ""}{p.profession ? ` · ${p.profession}` : ""}
                      </div>
                      {ai?.reason && (
                        <div style={{ fontSize: "11px", color: "#9E9B95", marginTop: "4px", fontStyle: "normal" }}>"{ai.reason}"</div>
                      )}
                      {!ai && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                          {p.interests.slice(0, 4).map((interest) => (
                            <span key={interest} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "999px", background: activeStudy.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "#573E69" : "#2A2926", color: activeStudy.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "#E6EDE9" : "#9E9B95" }}>{interest}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score badge */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: colors.text, background: colors.bg, borderRadius: "6px", padding: "4px 8px", minWidth: "36px", textAlign: "center" }}>
                        {sc}/5
                      </span>
                      {ai && <span style={{ fontSize: "9px", color: "#6B6760", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>IA</span>}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); doShortlist(p); }}
                      disabled={isPending}
                      style={{ padding: "7px 14px", background: "#573E69", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: isPending ? 0.7 : 1 }}
                    >
                      + Shortlist
                    </button>
                  </button>
                );
              })
            )}
          </div>

          {/* Weak matches (AI only) */}
          {aiRanked && weak.length > 0 && (
            <>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingTop: "4px", borderTop: "1px solid #2A2926" }}>
                Faibles correspondances ({weak.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", opacity: 0.6 }}>
                {weak.map((p) => {
                  const sc = aiScores[p.id]?.score ?? 1;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", background: "#1A1917", border: "1px solid #2A2926", borderRadius: "8px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#2A2926", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "#6B6760", flexShrink: 0 }}>{p.firstName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "13px", color: "#9E9B95" }}>{p.firstName} {p.lastName}</span>
                        <span style={{ fontSize: "12px", color: "#6B6760", marginLeft: "8px" }}>{p.city}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#6B6760" }}>{sc}/5</span>
                      <button
                        onClick={() => doShortlist(p)}
                        disabled={isPending}
                        style={{ padding: "5px 10px", background: "transparent", color: "#6B6760", border: "1px solid #2A2926", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                      >
                        Shortlister quand même
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Side panel */}
        {selected && (
          <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", padding: "20px", alignSelf: "start", position: "sticky", top: "20px", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#F9F8F6" }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize: "13px", color: "#6B6760", marginTop: "2px" }}>{selected.city ?? "—"}{selected.age ? `, ${selected.age} ans` : ""}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#6B6760", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>

            {/* AI score panel */}
            {selectedAi && (
              <div style={{ padding: "12px 14px", background: `${SCORE_COLOR[selectedAi.score]?.bg ?? "#2A292620"}`, border: `1px solid ${SCORE_COLOR[selectedAi.score]?.text ?? "#6B6760"}40`, borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 700, color: SCORE_COLOR[selectedAi.score]?.text }}>{selectedAi.score}/5</span>
                  <span style={{ fontSize: "11px", color: "#6B6760", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score Claude IA</span>
                </div>
                <p style={{ fontSize: "12px", color: "#9E9B95", margin: 0, fontStyle: "normal" }}>"{selectedAi.reason}"</p>
              </div>
            )}

            {selected.profession && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Métier</div>
                <p style={{ fontSize: "14px", color: "#F9F8F6", margin: "0 0 14px" }}>{selected.profession}</p>
              </>
            )}
            {selected.bio && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Bio</div>
                <p style={{ fontSize: "13px", color: "#9E9B95", margin: "0 0 14px", lineHeight: 1.5 }}>{selected.bio}</p>
              </>
            )}
            {selected.interests.length > 0 && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Intérêts</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                  {selected.interests.map((i) => (
                    <span key={i} style={{ fontSize: "12px", padding: "3px 9px", borderRadius: "999px", background: activeStudy.criteria.interests?.some((ci) => i.toLowerCase().includes(ci.toLowerCase())) ? "#573E69" : "#2A2926", color: activeStudy.criteria.interests?.some((ci) => i.toLowerCase().includes(ci.toLowerCase())) ? "#E6EDE9" : "#9E9B95" }}>{i}</span>
                  ))}
                </div>
              </>
            )}
            {selected.brandAffinities.length > 0 && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Affinités marques</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                  {selected.brandAffinities.map((b) => (
                    <span key={b} style={{ fontSize: "12px", padding: "3px 9px", borderRadius: "999px", background: activeStudy.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? "#573E69" : "#2A2926", color: activeStudy.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? "#E6EDE9" : "#9E9B95", fontWeight: activeStudy.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? 600 : 400 }}>{b}</span>
                  ))}
                </div>
              </>
            )}
            {selected.screenerAnswers && (
              <>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Screener</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "14px" }}>
                  {(["q1","q2","q3","q4"] as const).map((k) => selected.screenerAnswers?.[k] ? (
                    <div key={k} style={{ padding: "9px 12px", background: "#111110", borderRadius: "7px", fontSize: "12px", color: "#9E9B95", lineHeight: 1.5 }}>
                      {selected.screenerAnswers[k]}
                    </div>
                  ) : null)}
                </div>
              </>
            )}
            <button
              onClick={() => doShortlist(selected)}
              disabled={isPending}
              style={{ display: "block", width: "100%", padding: "12px", background: "#573E69", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: isPending ? 0.7 : 1 }}
            >
              Shortlister pour cette étude →
            </button>
            <p style={{ fontSize: "12px", color: "#6B6760", margin: "8px 0 0", textAlign: "center" }}>Profil envoyé à la marque pour review</p>
          </div>
        )}
      </div>
    </div>
  );
}
