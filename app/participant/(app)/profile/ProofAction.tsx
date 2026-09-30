"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BadgeId } from "@/lib/participants/badges";
import { sendWorkCode, verifyWorkCode, saveProofDocument } from "@/app/actions/proofs";
import { signInWithProvider } from "@/app/actions/auth";
import { useTT } from "@/lib/i18n/client";
import css from "./proofs.module.css";

type Links = { linkedin: string; instagram: string; tiktok: string; website: string };

/** Le geste qui fait gagner une médaille, au plus près de la médaille. */
export default function ProofAction({ id, links }: { id: BadgeId; links: Links }) {
  const router = useRouter();
  const tt = useTT();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  if (id === "verifie") return <Link href="/participant/verification" className={css.btn}>{tt("Envoyer ma pièce d'identité", "Upload my ID")}</Link>;

  if (id === "linkedin") {
    return (
      <button type="button" className={css.btn} disabled={pending}
        onClick={() => start(async () => { await signInWithProvider("linkedin_oidc", "PARTICIPANT"); })}>
        {tt("Vérifier avec LinkedIn", "Verify with LinkedIn")}
      </button>
    );
  }

  if (id === "cv" || id === "portfolio") {
    return (
      <label className={css.btn} aria-disabled={pending}>
        {pending ? tt("Envoi…", "Uploading…") : id === "cv" ? tt("Déposer mon CV", "Upload my CV") : tt("Déposer mon book", "Upload my portfolio")}
        <input type="file" hidden accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            start(async () => {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("kind", id);
              const r = await fetch("/api/onboarding/upload-doc", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({}));
              if (!r.url) { setMsg({ ok: false, text: r.error === "too_large" ? tt("Fichier trop lourd (10 Mo max).", "File too large (10 MB max).") : r.error === "invalid_type" ? tt("Format non pris en charge : PDF, Word ou photo.", "Unsupported format: PDF, Word or photo.") : tt("L'envoi a échoué.", "Upload failed.") }); return; }
              // L'analyse nourrit le portrait vu par les marques.
              fetch("/api/onboarding/analyze-document", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: r.url }) }).catch(() => {});
              const saved = await saveProofDocument(id, r.url);
              if ("error" in saved) setMsg({ ok: false, text: saved.error ?? "Erreur" });
              else { setMsg({ ok: true, text: tt("Reçu. L'analyse prend une minute.", "Received. The analysis takes a minute.") }); router.refresh(); }
            });
          }} />
      </label>
    );
  }

  if (id === "reseaux") {
    const payload = [
      links.instagram && { kind: "instagram", url: links.instagram },
      links.tiktok && { kind: "tiktok", url: links.tiktok },
      links.website && { kind: "website", url: links.website },
      links.linkedin && { kind: "linkedin", url: links.linkedin },
    ].filter(Boolean);
    if (!payload.length) return <span className={css.hint}>{tt("Ajoutez Instagram ou TikTok dans « Réseaux sociaux », plus bas.", "Add Instagram or TikTok under “Social media” below.")}</span>;
    return (
      <>
        <button type="button" className={css.btn} disabled={pending}
          onClick={() => start(async () => {
            const r = await fetch("/api/onboarding/analyze-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links: payload }) }).catch(() => null);
            setMsg(r?.ok ? { ok: true, text: tt("Lu. La médaille apparaît si vos pages sont publiques.", "Done. The medal appears if your pages are public.") } : { ok: false, text: tt("Lecture impossible pour l'instant.", "Could not read them right now.") });
            router.refresh();
          })}>
          {pending ? tt("Lecture…", "Reading…") : tt("Faire lire mes réseaux", "Check my social media")}
        </button>
        {msg && <span className={msg.ok ? css.ok : css.err}>{msg.text}</span>}
      </>
    );
  }

  if (id === "emploi") {
    return (
      <div className={css.form}>
        {step === "email" ? (
          <>
            <input className={css.input} type="email" placeholder="prenom@maison.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label={tt("Adresse professionnelle", "Work email")} />
            <button type="button" className={css.btn} disabled={pending || !email.includes("@")}
              onClick={() => start(async () => {
                const r = await sendWorkCode(email);
                if ("error" in r) setMsg({ ok: false, text: r.error ?? "Erreur" });
                else { setMsg({ ok: true, text: tt("Code envoyé. Il est valable 15 minutes.", "Code sent. It is valid for 15 minutes.") }); setStep("code"); }
              })}>
              {tt("Recevoir un code", "Get a code")}
            </button>
          </>
        ) : (
          <>
            <input className={css.input} inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} aria-label={tt("Code reçu", "Code received")} />
            <button type="button" className={css.btn} disabled={pending || code.replace(/\D/g, "").length !== 6}
              onClick={() => start(async () => {
                const r = await verifyWorkCode(code);
                if ("error" in r) setMsg({ ok: false, text: r.error ?? "Erreur" });
                else { setMsg({ ok: true, text: tt("Emploi vérifié.", "Job verified.") }); router.refresh(); }
              })}>
              {tt("Valider", "Confirm")}
            </button>
          </>
        )}
        {msg && <span className={msg.ok ? css.ok : css.err}>{msg.text}</span>}
      </div>
    );
  }

  return msg ? <span className={msg.ok ? css.ok : css.err}>{msg.text}</span> : null;
}
