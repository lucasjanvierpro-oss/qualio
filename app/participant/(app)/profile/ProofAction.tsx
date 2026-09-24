"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BadgeId } from "@/lib/participants/badges";
import { sendWorkCode, verifyWorkCode, saveProofDocument } from "@/app/actions/proofs";
import { signInWithProvider } from "@/app/actions/auth";
import css from "./proofs.module.css";

type Links = { linkedin: string; instagram: string; tiktok: string; website: string };

/** Le geste qui fait gagner une médaille, au plus près de la médaille. */
export default function ProofAction({ id, links }: { id: BadgeId; links: Links }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  if (id === "verifie") return <Link href="/participant/verification" className={css.btn}>Envoyer ma pièce d&apos;identité</Link>;

  if (id === "linkedin") {
    return (
      <button type="button" className={css.btn} disabled={pending}
        onClick={() => start(async () => { await signInWithProvider("linkedin_oidc", "PARTICIPANT"); })}>
        Vérifier avec LinkedIn
      </button>
    );
  }

  if (id === "cv" || id === "portfolio") {
    return (
      <label className={css.btn} aria-disabled={pending}>
        {pending ? "Envoi…" : id === "cv" ? "Déposer mon CV" : "Déposer mon book"}
        <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            start(async () => {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("kind", id);
              const r = await fetch("/api/onboarding/upload-doc", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({}));
              if (!r.url) { setMsg({ ok: false, text: r.error === "too_large" ? "Fichier trop lourd (10 Mo max)." : "L'envoi a échoué." }); return; }
              // L'analyse nourrit le portrait vu par les marques.
              fetch("/api/onboarding/analyze-document", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: r.url }) }).catch(() => {});
              const saved = await saveProofDocument(id, r.url);
              if ("error" in saved) setMsg({ ok: false, text: saved.error ?? "Erreur" });
              else { setMsg({ ok: true, text: "Reçu. L'analyse prend une minute." }); router.refresh(); }
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
    if (!payload.length) return <span className={css.hint}>Ajoutez Instagram ou TikTok dans « Réseaux sociaux », plus bas.</span>;
    return (
      <>
        <button type="button" className={css.btn} disabled={pending}
          onClick={() => start(async () => {
            const r = await fetch("/api/onboarding/analyze-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links: payload }) }).catch(() => null);
            setMsg(r?.ok ? { ok: true, text: "Lu. La médaille apparaît si vos pages sont publiques." } : { ok: false, text: "Lecture impossible pour l'instant." });
            router.refresh();
          })}>
          {pending ? "Lecture…" : "Faire lire mes réseaux"}
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
            <input className={css.input} type="email" placeholder="prenom@maison.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Adresse professionnelle" />
            <button type="button" className={css.btn} disabled={pending || !email.includes("@")}
              onClick={() => start(async () => {
                const r = await sendWorkCode(email);
                if ("error" in r) setMsg({ ok: false, text: r.error ?? "Erreur" });
                else { setMsg({ ok: true, text: "Code envoyé. Il est valable 15 minutes." }); setStep("code"); }
              })}>
              Recevoir un code
            </button>
          </>
        ) : (
          <>
            <input className={css.input} inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code reçu" />
            <button type="button" className={css.btn} disabled={pending || code.replace(/\D/g, "").length !== 6}
              onClick={() => start(async () => {
                const r = await verifyWorkCode(code);
                if ("error" in r) setMsg({ ok: false, text: r.error ?? "Erreur" });
                else { setMsg({ ok: true, text: "Emploi vérifié." }); router.refresh(); }
              })}>
              Valider
            </button>
          </>
        )}
        {msg && <span className={msg.ok ? css.ok : css.err}>{msg.text}</span>}
      </div>
    );
  }

  return msg ? <span className={msg.ok ? css.ok : css.err}>{msg.text}</span> : null;
}
