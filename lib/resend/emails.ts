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

// Langue du destinataire (préférence enregistrée sur son profil). Les emails
// envoyés à l'admin restent en français.
export type Lang = "fr" | "en";
const pick = (lang: Lang, fr: string, en: string) => (lang === "en" ? en : fr);
/** La langue enregistrée sur un profil (« fr » par défaut). */
export const langOf = (v: string | null | undefined): Lang => (v === "en" ? "en" : "fr");
const loc = (lang: Lang) => (lang === "en" ? "en-GB" : "fr-FR");
const eur = (cents: number, lang: Lang) => (lang === "en" ? `€${(cents / 100).toLocaleString("en-GB")}` : `${(cents / 100).toLocaleString("fr-FR")} €`);

function fmtDateTime(d: Date, lang: Lang = "fr"): string {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d)
    + (lang === "en" ? " (Paris time)" : "");
}
function fmtTime(d: Date, lang: Lang = "fr"): string {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d) + (lang === "en" ? " (Paris time)" : "");
}

// ── Mise en page commune ──────────────────────────────────────────────
const INK = "#1C1624";
const INK_2 = "#5F5868";
const ACCENT = "#6A43DB";
const SOFT = "#F6F4F8";

function layout(opts: { title: string; body: string; cta?: { label: string; href: string }; aside?: string; lang?: Lang }): string {
  const lang = opts.lang ?? "fr";
  const cta = opts.cta
    ? `<a href="${opts.cta.href}" style="display:inline-block;margin-top:26px;padding:13px 22px;background:${INK};color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${esc(opts.cta.label)} →</a>`
    : "";
  const aside = opts.aside
    ? `<div style="margin-top:22px;padding:16px 18px;background:${SOFT};border-radius:12px;font-size:15px;line-height:1.55;color:${INK};">${opts.aside}</div>`
    : "";
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#fff;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;padding:40px 24px;color:${INK};">
    <div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;margin-bottom:28px;"><span style="color:${ACCENT};">●</span> Rarelyst</div>
    <h1 style="font-size:24px;line-height:1.2;letter-spacing:-0.03em;margin:0 0 14px;">${opts.title}</h1>
    <div style="font-size:16px;line-height:1.6;color:${INK_2};">${opts.body}</div>
    ${aside}
    ${cta}
    <p style="margin-top:40px;font-size:13px;color:#9C95A4;">${lang === "en" ? "Rarelyst · Recruitment for fashion and luxury qualitative research" : "Rarelyst · Recrutement pour études qualitatives mode et luxe"}</p>
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

export async function sendReportReady(to: string, contactFirstName: string, studyTitle: string, studyId: string, lang: Lang = "fr") {
  return send(to, pick(lang, `Votre synthèse est prête : ${studyTitle}`, `Your report is ready: ${studyTitle}`), layout({
    lang,
    title: pick(lang, `Votre synthèse est prête${contactFirstName ? `, ${esc(contactFirstName)}` : ""}.`, `Your report is ready${contactFirstName ? `, ${esc(contactFirstName)}` : ""}.`),
    body: pick(lang,
      `La synthèse de l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong> est disponible : enseignements clés, verbatims, profils types et pistes de réflexion.`,
      `The report for <strong style="color:${INK}">${esc(studyTitle)}</strong> is available: key insights, quotes, personas and ideas to consider.`),
    cta: { label: pick(lang, "Lire la synthèse", "Read the report"), href: `${APP_URL}/brand/studies/${studyId}/report` },
  }));
}

export async function sendWelcomeBrand(to: string, companyName: string, lang: Lang = "fr") {
  return send(to, pick(lang, "Bienvenue sur Rarelyst", "Welcome to Rarelyst"), layout({
    lang,
    title: pick(lang, `Bienvenue, ${esc(companyName)}.`, `Welcome, ${esc(companyName)}.`),
    body: pick(lang, "Votre espace est prêt. Décrivez qui vous voulez entendre : nous vous présentons les premiers profils sous 72 heures.", "Your space is ready. Describe who you want to hear: we'll present the first profiles within 72 hours."),
    cta: { label: pick(lang, "Créer une étude", "Create a study"), href: `${APP_URL}/brand/studies/new` },
  }));
}

export async function sendStudySubmittedAdmin(studyTitle: string, brandName: string, studyId?: string, suggested = 0) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  return send(adminEmail, `Nouvelle étude : ${studyTitle}`, layout({
    title: "Nouvelle étude reçue",
    body: `<strong style="color:${INK}">${esc(brandName)}</strong> vient de soumettre l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>. Le compte à rebours des 72 heures commence.`,
    aside: suggested ? `L'IA a déjà présélectionné <strong>${suggested} profil${suggested > 1 ? "s" : ""}</strong>, avec pour chacun la raison du choix. Validez-les en un clic.` : undefined,
    cta: { label: suggested ? "Valider les profils" : "Ouvrir l'étude", href: studyId ? `${APP_URL}/admin/studies/${studyId}` : `${APP_URL}/admin/studies` },
  }));
}

/**
 * Une marque demande l'accès à un profil « sur demande ».
 * Ces profils ne s'achètent pas : la demande arrive chez Lucas, qui décide.
 */
export async function sendProfileRequested(participantName: string, brandProfileId: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  return send(adminEmail, `Demande d'accès : ${participantName}`, layout({
    title: "Demande d'accès à un profil",
    body: `Une marque souhaite rencontrer <strong style="color:${INK}">${esc(participantName)}</strong>. Aucun crédit n'a été débité : c'est à vous d'accepter, de refuser, ou de proposer un tarif.`,
    aside: `Marque : <strong>${esc(brandProfileId)}</strong>`,
    cta: { label: "Voir les demandes", href: `${APP_URL}/admin` },
  }));
}

export async function sendParticipantInvited(to: string, firstName: string, studyDescription: string, deadline: string, lang: Lang = "fr") {
  return send(to, pick(lang, "Une marque veut vous entendre", "A brand wants to hear from you"), layout({
    lang,
    title: pick(lang, `Bonne nouvelle, ${esc(firstName)}.`, `Good news, ${esc(firstName)}.`),
    body: pick(lang,
      `Votre profil a été retenu pour l'étude <strong style="color:${INK}">${esc(studyDescription)}</strong>. Choisissez le créneau qui vous convient.`,
      `Your profile has been selected for the study <strong style="color:${INK}">${esc(studyDescription)}</strong>. Choose the slot that suits you.`),
    aside: pick(lang, `À confirmer avant le <strong>${esc(deadline)}</strong>.`, `To confirm before <strong>${esc(deadline)}</strong>.`),
    cta: { label: pick(lang, "Choisir mon créneau", "Choose my slot"), href: `${APP_URL}/participant/studies` },
  }));
}

export async function sendInterviewConfirmed(
  to: string,
  firstName: string,
  studyTitle: string,
  scheduledAt: Date,
  joinUrl: string,
  isParticipant: boolean,
  opts: { interviewId?: string; durationMinutes?: number; lang?: Lang } = {},
) {
  const lang = opts.lang ?? "fr";
  const when = fmtDateTime(scheduledAt, lang);
  const ics = opts.interviewId
    ? buildIcs({
        uid: `${opts.interviewId}-${isParticipant ? "p" : "b"}`,
        title: pick(lang, `Entretien Rarelyst · ${studyTitle}`, `Rarelyst interview · ${studyTitle}`),
        start: scheduledAt,
        durationMinutes: opts.durationMinutes ?? 45,
        url: joinUrl,
        description: pick(lang, `Rejoindre l'entretien : ${joinUrl}`, `Join the interview: ${joinUrl}`),
      })
    : null;
  return send(
    to,
    pick(lang, `Entretien confirmé · ${studyTitle}`, `Interview confirmed · ${studyTitle}`),
    layout({
      lang,
      title: isParticipant ? pick(lang, `C'est confirmé, ${esc(firstName)}.`, `It's confirmed, ${esc(firstName)}.`) : pick(lang, "Un entretien est confirmé.", "An interview is confirmed."),
      body: isParticipant
        ? pick(lang,
          `Votre entretien pour l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong> est confirmé. Vous le rejoindrez directement depuis votre espace, sans rien installer.`,
          `Your interview for <strong style="color:${INK}">${esc(studyTitle)}</strong> is confirmed. You'll join it straight from your space, nothing to install.`)
        : pick(lang,
          `Un participant a confirmé son entretien pour <strong style="color:${INK}">${esc(studyTitle)}</strong>. Sa fiche est disponible dans la salle d'entretien.`,
          `A participant has confirmed their interview for <strong style="color:${INK}">${esc(studyTitle)}</strong>. Their profile is available in the interview room.`),
      aside: `<strong style="text-transform:capitalize">${esc(when)}</strong><br/>${pick(lang, "Visio dans votre espace Rarelyst", "Video call in your Rarelyst space")}`,
      cta: { label: pick(lang, "Ouvrir la salle d'entretien", "Open the interview room"), href: joinUrl },
    }),
    ics ? { attachments: [{ filename: pick(lang, "entretien-rarelyst.ics", "rarelyst-interview.ics"), content: Buffer.from(ics).toString("base64"), contentType: "text/calendar" }] } : {},
  );
}

export async function sendInterviewReminder(
  to: string,
  firstName: string,
  scheduledAt: Date,
  joinUrl: string,
  hoursUntil: 24 | 1,
  opts: { scheduledFor?: Date; lang?: Lang } = {},
) {
  const lang = opts.lang ?? "fr";
  const title = hoursUntil === 1
    ? pick(lang, "Votre entretien commence dans une heure.", "Your interview starts in one hour.")
    : pick(lang, "Votre entretien a lieu demain.", "Your interview is tomorrow.");
  return send(
    to,
    hoursUntil === 1 ? pick(lang, "Dans une heure : votre entretien", "In one hour: your interview") : pick(lang, "Demain : votre entretien", "Tomorrow: your interview"),
    layout({
      lang,
      title,
      body: pick(lang,
        `Bonjour ${esc(firstName)}, rendez-vous à <strong style="color:${INK}">${fmtTime(scheduledAt)}</strong>. Pensez à vous installer au calme, caméra et micro prêts.`,
        `Hello ${esc(firstName)}, see you at <strong style="color:${INK}">${fmtTime(scheduledAt, lang)}</strong>. Find a quiet spot, with your camera and microphone ready.`),
      cta: { label: pick(lang, "Ouvrir la salle d'entretien", "Open the interview room"), href: joinUrl },
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
  to: string; firstName: string; scheduledAt: Date; joinUrl: string; lang?: Lang;
}) {
  const now = Date.now();
  const jobs: Promise<unknown>[] = [];
  for (const hours of [24, 1] as const) {
    const at = new Date(opts.scheduledAt.getTime() - hours * 3600_000);
    // Inutile de rappeler un créneau déjà trop proche.
    if (at.getTime() - now < 10 * 60_000) continue;
    jobs.push(sendInterviewReminder(opts.to, opts.firstName, opts.scheduledAt, opts.joinUrl, hours, { scheduledFor: at, lang: opts.lang }));
  }
  return Promise.allSettled(jobs);
}

const TAX_NOTE: Record<Lang, string> = {
  fr: "Ces sommes peuvent être imposables selon votre situation : impots.gouv.fr (économie collaborative). Votre relevé annuel est disponible dans votre portefeuille.",
  en: "These amounts may be taxable depending on your situation. Your annual statement is available in your wallet.",
};

export async function sendRewardAvailable(to: string, firstName: string, amount: number, type: "CASH" | "VOUCHER", lang: Lang = "fr") {
  return send(to, pick(lang, "Votre récompense vous attend", "Your reward is waiting"), layout({
    lang,
    title: pick(lang, `Merci, ${esc(firstName)}.`, `Thank you, ${esc(firstName)}.`),
    body: pick(lang,
      `Votre avis a compté. Votre récompense de <strong style="color:${INK}">${eur(amount, lang)}</strong> ${type === "CASH" ? "est disponible." : "vous attend sous forme de bon d'achat."}`,
      `Your opinion counted. Your reward of <strong style="color:${INK}">${eur(amount, lang)}</strong> ${type === "CASH" ? "is available." : "is waiting for you as a voucher."}`)
      + `<br/><br/><span style="font-size:13px;color:#9C95A4">${TAX_NOTE[lang]}</span>`,
    cta: { label: pick(lang, "Récupérer ma récompense", "Collect my reward"), href: `${APP_URL}/participant/wallet` },
  }));
}

export async function sendPayoutSent(to: string, firstName: string, amountCents: number, lang: Lang = "fr") {
  return send(to, pick(lang, `${eur(amountCents, lang)} en route vers votre compte`, `${eur(amountCents, lang)} on its way to your account`), layout({
    lang,
    title: pick(lang, `C'est parti, ${esc(firstName)}.`, `On its way, ${esc(firstName)}.`),
    body: pick(lang,
      `Votre retrait de <strong style="color:${INK}">${eur(amountCents, lang)}</strong> a été envoyé. Il arrive sur votre compte bancaire sous 1 à 3 jours ouvrés.`,
      `Your withdrawal of <strong style="color:${INK}">${eur(amountCents, lang)}</strong> has been sent. It reaches your bank account within 1 to 3 business days.`)
      + `<br/><br/><span style="font-size:13px;color:#9C95A4">${TAX_NOTE[lang]}</span>`,
    cta: { label: pick(lang, "Voir mes gains", "See my earnings"), href: `${APP_URL}/participant/wallet` },
  }));
}

/** Un retrait n'a pas pu partir : Lucas doit relancer depuis l'admin. */
export async function sendPayoutFailedAdmin(participantName: string, amountCents: number, reason: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  return send(adminEmail, `Retrait bloqué : ${participantName}`, layout({
    title: "Un retrait n'est pas parti",
    body: `Le retrait de <strong style="color:${INK}">${(amountCents / 100).toLocaleString("fr-FR")} €</strong> de ${esc(participantName)} a échoué. Le participant voit « en cours de traitement ».`,
    aside: esc(reason),
    cta: { label: "Relancer le virement", href: `${APP_URL}/admin/payments` },
  }));
}

/** Une demande de démo arrive depuis la page d'accueil. */
export async function sendDemoRequestAdmin(d: { firstName: string; lastName?: string | null; email: string; company: string; role?: string | null; topic?: string | null; timing?: string | null; lang: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  const rows = [
    ["Qui", `${d.firstName} ${d.lastName ?? ""}`.trim()],
    ["Email", d.email],
    ["Maison", d.company],
    ["Fonction", d.role || "—"],
    ["Quand", d.timing || "—"],
    ["Langue", d.lang === "en" ? "anglais" : "français"],
  ].map(([k, v]) => `<div><span style="color:${INK_2}">${k} :</span> <strong>${esc(v)}</strong></div>`).join("");
  return send(adminEmail, `Démo demandée : ${d.company}`, layout({
    title: `${esc(d.firstName)} veut une démo`,
    body: d.topic ? `Son sujet : <strong style="color:${INK}">${esc(d.topic)}</strong>` : "Pas de sujet précisé.",
    aside: rows,
    cta: { label: "Voir les demandes", href: `${APP_URL}/admin/demos` },
  }));
}

/** Accusé de réception envoyé à la personne qui demande une démo. */
export async function sendDemoConfirmation(to: string, firstName: string, lang: "fr" | "en") {
  return lang === "en"
    ? send(to, "Your Rarelyst demo", layout({
      title: `Thank you, ${esc(firstName)}.`,
      body: "We've received your request. We'll write to you shortly to set a time for a twenty-minute video call, on your own topic.",
    }))
    : send(to, "Votre démo Rarelyst", layout({
      title: `Merci, ${esc(firstName)}.`,
      body: "Votre demande est bien arrivée. Nous vous écrivons très vite pour caler vingt minutes en visio, sur votre propre sujet.",
    }));
}

/** Entretien en autonomie : le participant répond quand il veut, face caméra. */
export async function sendAsyncInvitation(to: string, firstName: string, studyTitle: string, interviewId: string, questions: number, deadline: Date | null, lang: Lang = "fr") {
  const day = deadline ? new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(deadline) : "";
  const until = deadline ? pick(lang, ` avant le ${day}`, ` before ${day}`) : "";
  return send(to, pick(lang, "Une marque attend vos réponses", "A brand is waiting for your answers"), layout({
    lang,
    title: pick(lang, `À vous, ${esc(firstName)}.`, `Over to you, ${esc(firstName)}.`),
    body: pick(lang,
      `Une marque a retenu votre profil pour l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>. Pas de rendez-vous à caler : vous répondez seul(e), face caméra, à ${questions} questions qui s'affichent une par une. Comptez une quinzaine de minutes, quand vous voulez${until}.`,
      `A brand has selected your profile for the study <strong style="color:${INK}">${esc(studyTitle)}</strong>. No appointment to arrange: you answer ${questions} questions on your own, on camera, shown one at a time. It takes about fifteen minutes, whenever you like${until}.`),
    aside: pick(lang, "Installez-vous au calme, avec une bonne lumière. Vos réponses sont enregistrées et transcrites pour la marque.", "Find a quiet spot with good light. Your answers are recorded and transcribed for the brand."),
    cta: { label: pick(lang, "Commencer quand je veux", "Start whenever I want"), href: `${APP_URL}/participant/interview/${interviewId}` },
  }));
}

export async function sendAvailabilityProposed(to: string, contactFirstName: string, participantFirstName: string, studyTitle: string, studyId: string, slots: Date[], lang: Lang = "fr") {
  const list = slots.map((d) => `<li style="margin:4px 0;text-transform:capitalize">${esc(fmtDateTime(d, lang))}</li>`).join("");
  return send(to, pick(lang, `${participantFirstName} propose ses disponibilités`, `${participantFirstName} has suggested times`), layout({
    lang,
    title: pick(lang,
      `${esc(participantFirstName)} propose ${slots.length} créneau${slots.length > 1 ? "x" : ""}.`,
      `${esc(participantFirstName)} suggests ${slots.length} slot${slots.length > 1 ? "s" : ""}.`),
    body: pick(lang,
      `${contactFirstName ? `Bonjour ${esc(contactFirstName)}, p` : "P"}our l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>, choisissez celui qui vous convient : l'entretien est confirmé immédiatement.`,
      `${contactFirstName ? `Hello ${esc(contactFirstName)}, f` : "F"}or the study <strong style="color:${INK}">${esc(studyTitle)}</strong>, pick the one that suits you: the interview is confirmed right away.`),
    aside: `<ul style="margin:0;padding-left:18px">${list}</ul>`,
    cta: { label: pick(lang, "Choisir un créneau", "Choose a slot"), href: `${APP_URL}/brand/studies/${studyId}` },
  }));
}

export async function sendAvailabilityRequested(to: string, firstName: string, studyTitle: string, applicationId: string, lang: Lang = "fr") {
  return send(to, pick(lang, "Une marque veut vous entendre", "A brand wants to hear from you"), layout({
    lang,
    title: pick(lang, `Bonne nouvelle, ${esc(firstName)}.`, `Good news, ${esc(firstName)}.`),
    body: pick(lang,
      `Une marque a retenu votre profil pour l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong>. Indiquez quand vous êtes disponible : elle s'adapte à vous.`,
      `A brand has selected your profile for the study <strong style="color:${INK}">${esc(studyTitle)}</strong>. Tell us when you're available: they'll fit around you.`),
    cta: { label: pick(lang, "Proposer mes créneaux", "Suggest my slots"), href: `${APP_URL}/participant/studies/${applicationId}` },
  }));
}

export async function sendWorkEmailCode(to: string, firstName: string, code: string, lang: Lang = "fr") {
  const html = layout({
    lang,
    title: pick(lang, "Votre code de vérification", "Your verification code"),
    body: pick(lang,
      `Bonjour ${esc(firstName || "")},<br>Voici le code qui confirme que vous travaillez bien ici. Il est valable 15 minutes.`,
      `Hello ${esc(firstName || "")},<br>Here is the code that confirms you work here. It is valid for 15 minutes.`),
    aside: `<div style="font-size:30px;font-weight:700;letter-spacing:.3em;text-align:center;">${esc(code)}</div>`,
  });
  return send(to, pick(lang, `${code} · votre code Rarelyst`, `${code} · your Rarelyst code`), html);
}

// ── Fiabilité des entretiens : absences, reports, problèmes techniques ──

/** Annule des emails programmés (rappels d'un entretien reporté). */
export async function cancelScheduledEmails(ids: string[]) {
  const r = getResend();
  return Promise.allSettled(ids.map((id) => r.emails.cancel(id)));
}

export async function sendRescheduleNotice(to: string, firstName: string, studyTitle: string, opts: { byWhom: string; self: boolean; reason: string; forParticipant: boolean; href: string; lang?: Lang }) {
  const lang = opts.lang ?? "fr";
  const asked = opts.self
    ? pick(lang, "Vous avez demandé", "You asked")
    : pick(lang, `${esc(opts.byWhom)} a demandé`, `${esc(opts.byWhom)} asked`);
  const study = `<strong style="color:${INK}">${esc(studyTitle)}</strong>`;
  return send(to, pick(lang, `Entretien reporté · ${studyTitle}`, `Interview rescheduled · ${studyTitle}`), layout({
    lang,
    title: pick(lang, `L'entretien est reporté${firstName ? `, ${esc(firstName)}` : ""}.`, `The interview is rescheduled${firstName ? `, ${esc(firstName)}` : ""}.`),
    body: opts.forParticipant
      ? pick(lang,
        `${asked} à reporter l'entretien pour ${study}. Proposez de nouveaux créneaux : la marque en choisira un. Les rappels de l'ancien créneau sont annulés.`,
        `${asked} to reschedule the interview for ${study}. Suggest new slots: the brand will pick one. Reminders for the old slot are cancelled.`)
      : pick(lang,
        `${asked} à reporter l'entretien pour ${study}. Le participant va proposer de nouveaux créneaux ; vous choisirez celui qui vous convient. Vos crédits restent réservés.`,
        `${asked} to reschedule the interview for ${study}. The participant will suggest new slots; you'll choose the one that suits you. Your credits stay reserved.`),
    aside: opts.reason ? pick(lang, `Raison indiquée : « ${esc(opts.reason)} »`, `Reason given: “${esc(opts.reason)}”`) : undefined,
    cta: { label: opts.forParticipant ? pick(lang, "Proposer de nouveaux créneaux", "Suggest new slots") : pick(lang, "Voir l'étude", "See the study"), href: opts.href },
  }));
}

/** Les vidéos d'une étude seront bientôt effacées : la marque peut les télécharger avant. */
export async function sendVideoExpiryNotice(to: string, firstName: string, studyTitle: string, studyId: string, count: number, deleteOn: Date, lang: Lang = "fr") {
  const day = new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, day: "numeric", month: "long" }).format(deleteOn);
  return send(to, pick(lang, `Vos vidéos seront effacées le ${day} · ${studyTitle}`, `Your videos will be deleted on ${day} · ${studyTitle}`), layout({
    lang,
    title: pick(lang, `Téléchargez vos vidéos avant le ${day}${firstName ? `, ${esc(firstName)}` : ""}.`, `Download your videos before ${day}${firstName ? `, ${esc(firstName)}` : ""}.`),
    body: pick(lang,
      `${count > 1 ? `Les ${count} vidéos` : "La vidéo"} de l'étude <strong style="color:${INK}">${esc(studyTitle)}</strong> ${count > 1 ? "seront effacées" : "sera effacée"} le ${day} : nous ne gardons les enregistrements que 90 jours, par respect pour les participants. Les transcriptions et la synthèse restent disponibles.`,
      `${count > 1 ? `The ${count} videos` : "The video"} from <strong style="color:${INK}">${esc(studyTitle)}</strong> will be deleted on ${day}: we only keep recordings for 90 days, out of respect for participants. Transcripts and the report stay available.`),
    aside: pick(lang, "Ouvrez chaque vidéo depuis la synthèse, onglet « Entretiens », puis enregistrez-la sur votre ordinateur.", "Open each video from the report, “Interviews” tab, then save it to your computer."),
    cta: { label: pick(lang, "Ouvrir la synthèse", "Open the report"), href: `${APP_URL}/brand/studies/${studyId}/report` },
  }));
}

export async function sendIncidentAdmin(d: { kind: "reschedule" | "technical" | "no_show" | "brand_absent"; studyTitle: string; who: string; reason?: string; details?: string; studyId: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  const label = { reschedule: "Report demandé", technical: "Problème technique", no_show: "Absence du participant", brand_absent: "Marque absente" }[d.kind];
  return send(adminEmail, `${label} · ${d.studyTitle}`, layout({
    title: label,
    body: `<strong style="color:${INK}">${esc(d.who)}</strong> · étude <strong style="color:${INK}">${esc(d.studyTitle)}</strong>.`,
    aside: [d.reason ? `« ${esc(d.reason)} »` : "", d.details ? esc(d.details) : ""].filter(Boolean).join("<br/>") || undefined,
    cta: { label: "Ouvrir l'étude", href: `${APP_URL}/admin/studies/${d.studyId}` },
  }));
}

export async function sendTechnicalIssueToOther(to: string, firstName: string, studyTitle: string, who: string, problem: string, href: string, lang: Lang = "fr") {
  return send(to, pick(lang, `Souci technique signalé · ${studyTitle}`, `Technical issue reported · ${studyTitle}`), layout({
    lang,
    title: pick(lang, `${esc(who)} rencontre un souci technique.`, `${esc(who)} is having a technical issue.`),
    body: pick(lang,
      `Pour l'entretien <strong style="color:${INK}">${esc(studyTitle)}</strong>${firstName ? `, ${esc(firstName)}` : ""} : ${esc(problem)}. Restez dans la salle quelques minutes ; si l'entretien ne peut pas avoir lieu, il pourra être reporté sans frais.`,
      `For the interview <strong style="color:${INK}">${esc(studyTitle)}</strong>${firstName ? `, ${esc(firstName)}` : ""}: ${esc(problem)}. Stay in the room for a few minutes; if the interview can't happen, it can be rescheduled at no cost.`),
    cta: { label: pick(lang, "Ouvrir la salle", "Open the room"), href },
  }));
}

export async function sendNoShowNotice(to: string, firstName: string, studyTitle: string, forBrand: boolean, opts: { participantName?: string; credits?: number; href: string; lang?: Lang }) {
  const lang = opts.lang ?? "fr";
  const study = `<strong style="color:${INK}">${esc(studyTitle)}</strong>`;
  return send(to, forBrand ? pick(lang, `Absence constatée · ${studyTitle}`, `No-show · ${studyTitle}`) : pick(lang, `Entretien manqué · ${studyTitle}`, `Missed interview · ${studyTitle}`), layout({
    lang,
    title: forBrand
      ? pick(lang, "Le participant n'est pas venu.", "The participant didn't show up.")
      : pick(lang, `Vous avez manqué votre entretien${firstName ? `, ${esc(firstName)}` : ""}.`, `You missed your interview${firstName ? `, ${esc(firstName)}` : ""}.`),
    body: forBrand
      ? pick(lang,
        `${esc(opts.participantName ?? "Le participant")} ne s'est pas connecté à l'entretien pour ${study}.${opts.credits ? ` Vos ${opts.credits} crédits sont revenus sur votre compte.` : ""} Nous pouvons vous proposer un autre profil.`,
        `${esc(opts.participantName ?? "The participant")} didn't join the interview for ${study}.${opts.credits ? ` Your ${opts.credits} credits are back in your account.` : ""} We can suggest another profile.`)
      : pick(lang,
        `Vous ne vous êtes pas connecté(e) à l'entretien pour ${study}. S'il s'agit d'une erreur, répondez à cet email : nous regardons avec vous.`,
        `You didn't join the interview for ${study}. If this is a mistake, reply to this email and we'll look into it with you.`),
    cta: { label: forBrand ? pick(lang, "Voir l'étude", "See the study") : pick(lang, "Mon espace", "My space"), href: opts.href },
  }));
}
