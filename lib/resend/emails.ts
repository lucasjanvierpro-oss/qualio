import { Resend } from "resend";
import { appUrl } from "@/lib/appUrl";

// ── Réglages ──────────────────────────────────────────────────────────
// L'expéditeur doit appartenir à un domaine vérifié dans Resend, sinon aucun
// email ne part. Par défaut : rarelyst.co (à vérifier dans le tableau de bord).
const FROM = process.env.EMAIL_FROM ?? "Rarelyst <noreply@rarelyst.co>";
const APP_URL = appUrl();
// Les serveurs Vercel tournent en UTC : sans fuseau explicite, un entretien à
// 10 h à Paris serait annoncé à 8 h.
const TZ = "Europe/Paris";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Tout texte saisi par un utilisateur (titre d'étude, prénom…) passe par ici
// avant d'entrer dans le HTML.
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d);
}
function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
}

// ── Mise en page commune ──────────────────────────────────────────────
const INK = "#1C1624";
const INK_2 = "#5F5868";
const ACCENT = "#6A43DB";
const SOFT = "#F6F4F8";

function layout(opts: { title: string; body: string; cta?: { label: string; href: string }; aside?: string }): string {
  const cta = opts.cta
    ? `<a href="${opts.cta.href}" style="display:inline-block;margin-top:26px;padding:13px 22px;background:${INK};color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${esc(opts.cta.label)} →</a>`
    : "";
  const aside = opts.aside
    ? `<div style="margin-top:22px;padding:16px 18px;background:${SOFT};border-radius:12px;font-size:15px;line-height:1.55;color:${INK};">${opts.aside}</div>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#fff;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;padding:40px 24px;color:${INK};">
    <div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;margin-bottom:28px;"><span style="color:${ACCENT};">●</span> Rarelyst</div>
    <h1 style="font-size:24px;line-height:1.2;letter-spacing:-0.03em;margin:0 0 14px;">${opts.title}</h1>
    <div style="font-size:16px;line-height:1.6;color:${INK_2};">${opts.body}</div>
    ${aside}
    ${cta}
    <p style="margin-top:40px;font-size:13px;color:#9C95A4;">Rarelyst · Recrutement pour études qualitatives mode et luxe</p>
  </div></body></html>`;
}

async function send(to: string, subject: string, html: string, extra: { scheduledAt?: string; attachments?: { filename: string; content: string; contentType?: string }[] } = {}) {
  return getResend().emails.send({ from: FROM, to, subject, html, ...extra });
}

// ── Invitation d'agenda (.ics) ────────────────────────────────────────
// Jointe à la confirmation : l'entretien s'ajoute au calendrier en un clic,
// ce qui réduit mieux les absences que n'importe quel rappel.
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
export function buildIcs(opts: { uid: string; title: string; start: Date; durationMinutes: number; url: string; description: string }): string {
  const end = new Date(opts.start.getTime() + opts.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rarelyst//Entretiens//FR", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@rarelyst.co`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(opts.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(opts.title)}`,
    `DESCRIPTION:${icsText(opts.description)}`,
    `URL:${opts.url}`,
    `LOCATION:${opts.url}`,
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Entretien dans 15 minutes", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

// ── Emails ────────────────────────────────────────────────────────────

export async function sendReportReady(to: string, contactFirstName: string, studyTitle: string, studyId: string) {
  return send(to, `Votre synthèse est prête : ${studyTitle}`, layout({
    title: `Votre synthèse est prête${contactFirstName ? `, ${esc(contactFirstName)}` : ""}.`,
    body: `La synthèse de l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong> est disponible : enseignements clés, verbatims, profils types et pistes de réflexion.`,
    cta: { label: "Lire la synthèse", href: `${APP_URL}/brand/studies/${studyId}/report` },
  }));
}

export async function sendWelcomeBrand(to: string, companyName: string) {
  return send(to, "Bienvenue sur Rarelyst", layout({
    title: `Bienvenue, ${esc(companyName)}.`,
    body: "Votre espace est prêt. Décrivez qui vous voulez entendre : nous vous présentons les premiers profils sous 72 heures.",
    cta: { label: "Créer une étude", href: `${APP_URL}/brand/studies/new` },
  }));
}

export async function sendStudySubmittedAdmin(studyTitle: string, brandName: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  return send(adminEmail, `Nouvelle étude : ${studyTitle}`, layout({
    title: "Nouvelle étude reçue",
    body: `<strong style="color:${INK}">${esc(brandName)}</strong> vient de soumettre l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>. Le compte à rebours des 72 heures commence.`,
    cta: { label: "Ouvrir l'étude", href: `${APP_URL}/admin/studies` },
  }));
}

export async function sendParticipantInvited(to: string, firstName: string, studyDescription: string, deadline: string) {
  return send(to, "Une marque veut vous entendre", layout({
    title: `Bonne nouvelle, ${esc(firstName)}.`,
    body: `Votre profil a été retenu pour l'étude <strong style="color:${INK}">${esc(studyDescription)}</strong>. Choisissez le créneau qui vous convient.`,
    aside: `À confirmer avant le <strong>${esc(deadline)}</strong>.`,
    cta: { label: "Choisir mon créneau", href: `${APP_URL}/participant/studies` },
  }));
}

export async function sendInterviewConfirmed(
  to: string,
  firstName: string,
  studyTitle: string,
  scheduledAt: Date,
  joinUrl: string,
  isParticipant: boolean,
  opts: { interviewId?: string; durationMinutes?: number } = {},
) {
  const when = fmtDateTime(scheduledAt);
  const ics = opts.interviewId
    ? buildIcs({
        uid: `${opts.interviewId}-${isParticipant ? "p" : "b"}`,
        title: `Entretien Rarelyst · ${studyTitle}`,
        start: scheduledAt,
        durationMinutes: opts.durationMinutes ?? 45,
        url: joinUrl,
        description: `Rejoindre l'entretien : ${joinUrl}`,
      })
    : null;
  return send(
    to,
    `Entretien confirmé · ${studyTitle}`,
    layout({
      title: isParticipant ? `C'est confirmé, ${esc(firstName)}.` : "Un entretien est confirmé.",
      body: isParticipant
        ? `Votre entretien pour l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong> est confirmé. Vous le rejoindrez directement depuis votre espace, sans rien installer.`
        : `Un participant a confirmé son entretien pour <strong style="color:${INK}">${esc(studyTitle)}</strong>. Sa fiche est disponible dans la salle d'entretien.`,
      aside: `<strong style="text-transform:capitalize">${esc(when)}</strong><br/>Visio dans votre espace Rarelyst`,
      cta: { label: "Ouvrir la salle d'entretien", href: joinUrl },
    }),
    ics ? { attachments: [{ filename: "entretien-rarelyst.ics", content: Buffer.from(ics).toString("base64"), contentType: "text/calendar" }] } : {},
  );
}

export async function sendInterviewReminder(
  to: string,
  firstName: string,
  scheduledAt: Date,
  joinUrl: string,
  hoursUntil: 24 | 1,
  opts: { scheduledFor?: Date } = {},
) {
  const title = hoursUntil === 1 ? "Votre entretien commence dans une heure." : "Votre entretien a lieu demain.";
  return send(
    to,
    hoursUntil === 1 ? `Dans une heure : votre entretien` : `Demain : votre entretien`,
    layout({
      title,
      body: `Bonjour ${esc(firstName)}, rendez-vous à <strong style="color:${INK}">${fmtTime(scheduledAt)}</strong>. Pensez à vous installer au calme, caméra et micro prêts.`,
      cta: { label: "Ouvrir la salle d'entretien", href: joinUrl },
    }),
    opts.scheduledFor ? { scheduledAt: opts.scheduledFor.toISOString() } : {},
  );
}

/**
 * Programme les rappels (la veille et une heure avant) au moment où
 * l'entretien est confirmé. Resend les envoie lui-même à l'heure dite : pas
 * besoin d'une tâche planifiée qui tournerait toutes les 30 minutes.
 */
export async function scheduleInterviewReminders(opts: {
  to: string; firstName: string; scheduledAt: Date; joinUrl: string;
}) {
  const now = Date.now();
  const jobs: Promise<unknown>[] = [];
  for (const hours of [24, 1] as const) {
    const at = new Date(opts.scheduledAt.getTime() - hours * 3600_000);
    // Inutile de rappeler un créneau déjà trop proche.
    if (at.getTime() - now < 10 * 60_000) continue;
    jobs.push(sendInterviewReminder(opts.to, opts.firstName, opts.scheduledAt, opts.joinUrl, hours, { scheduledFor: at }));
  }
  return Promise.allSettled(jobs);
}

export async function sendRewardAvailable(to: string, firstName: string, amount: number, type: "CASH" | "VOUCHER") {
  return send(to, "Votre récompense vous attend", layout({
    title: `Merci, ${esc(firstName)}.`,
    body: `Votre avis a compté. Votre récompense de <strong style="color:${INK}">${(amount / 100).toLocaleString("fr-FR")} €</strong> ${type === "CASH" ? "est disponible." : "vous attend sous forme de bon d'achat."}`,
    cta: { label: "Récupérer ma récompense", href: `${APP_URL}/participant/wallet` },
  }));
}

export async function sendAvailabilityProposed(to: string, contactFirstName: string, participantFirstName: string, studyTitle: string, studyId: string, slots: Date[]) {
  const list = slots.map((d) => `<li style="margin:4px 0;text-transform:capitalize">${esc(fmtDateTime(d))}</li>`).join("");
  return send(to, `${participantFirstName} propose ses disponibilités`, layout({
    title: `${esc(participantFirstName)} propose ${slots.length} créneau${slots.length > 1 ? "x" : ""}.`,
    body: `${contactFirstName ? `Bonjour ${esc(contactFirstName)}, p` : "P"}our l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>, choisissez celui qui vous convient : l'entretien est confirmé immédiatement.`,
    aside: `<ul style="margin:0;padding-left:18px">${list}</ul>`,
    cta: { label: "Choisir un créneau", href: `${APP_URL}/brand/studies/${studyId}` },
  }));
}

export async function sendAvailabilityRequested(to: string, firstName: string, studyTitle: string, applicationId: string) {
  return send(to, "Une marque veut vous entendre", layout({
    title: `Bonne nouvelle, ${esc(firstName)}.`,
    body: `Une marque a retenu votre profil pour l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>. Indiquez quand vous êtes disponible : elle s'adapte à vous.`,
    cta: { label: "Proposer mes créneaux", href: `${APP_URL}/participant/studies/${applicationId}` },
  }));
}
