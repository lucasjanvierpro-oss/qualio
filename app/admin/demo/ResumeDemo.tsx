"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finishDemo, interviewDemo } from "@/app/actions/demoSessions";
import a from "../admin.module.css";

/** Reprend une démo dont la synthèse n'a pas abouti, sans refaire le brief. */
export default function ResumeDemo({ id, hasInterviews }: { id: string; hasInterviews: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  async function resume() {
    setState("busy");
    const iv = hasInterviews ? { ok: true as const } : await interviewDemo(id);
    const r = "error" in iv ? iv : await finishDemo(id);
    setState("error" in r ? "error" : "idle");
    router.refresh();
  }
  return (
    <button type="button" className={`${a.btn} ${a.btnGhost}`} onClick={resume} disabled={state === "busy"}>
      {state === "busy" ? "Synthèse en cours… (2 à 3 min)" : state === "error" ? "Échec, réessayer" : "Terminer la synthèse"}
    </button>
  );
}
