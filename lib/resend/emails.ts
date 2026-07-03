import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Qualio <noreply@qualio.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://qualio.io";

export async function sendReportReady(to: string, contactFirstName: string, studyTitle: string, studyId: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Votre rapport de synthèse est prêt — ${studyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 22px; color: #3A2E44;">Votre rapport est disponible${contactFirstName ? `, ${contactFirstName}` : ""}</h1>
        <p style="color: #69527A; line-height: 1.6;">
          La synthèse analytique de votre étude <strong>${studyTitle}</strong> a été générée à partir des entretiens. Insights, verbatims, personas et recommandations vous attendent.
        </p>
        <a href="${APP_URL}/brand/studies/${studyId}/report" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #8765D7; color: #fff; border-radius: 999px; text-decoration: none; font-weight: 600;">
          Voir le rapport →
        </a>
      </div>
    `,
  });
}

export async function sendWelcomeBrand(to: string, companyName: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Bienvenue sur Qualio",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 24px; color: #141311;">Bienvenue sur Qualio, ${companyName} 👋</h1>
        <p style="color: #6B6760; line-height: 1.6;">Votre compte marque est prêt. Créez votre première étude et recevez des participants qualifiés en 72h.</p>
        <a href="${APP_URL}/brand/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Accéder au dashboard →
        </a>
      </div>
    `,
  });
}

export async function sendStudySubmittedAdmin(studyTitle: string, brandName: string) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "lucas@qualio.io";
  return getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Nouvelle étude reçue : ${studyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #141311;">Nouvelle étude soumise</h2>
        <p><strong>${brandName}</strong> vient de soumettre une étude : <strong>${studyTitle}</strong></p>
        <a href="${APP_URL}/admin/studies" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none;">
          Voir l'étude →
        </a>
      </div>
    `,
  });
}

export async function sendParticipantInvited(to: string, firstName: string, studyDescription: string, deadline: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Vous avez été sélectionné(e) pour une étude",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 22px; color: #141311;">Bonne nouvelle, ${firstName} !</h1>
        <p style="color: #6B6760; line-height: 1.6;">Vous avez été sélectionné(e) pour participer à une étude : <strong>${studyDescription}</strong></p>
        <p style="color: #6B6760;">Date limite pour confirmer : <strong>${deadline}</strong></p>
        <a href="${APP_URL}/participant/studies" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Voir l'invitation →
        </a>
      </div>
    `,
  });
}

export async function sendInterviewConfirmed(
  to: string,
  firstName: string,
  studyTitle: string,
  scheduledAt: Date,
  videoLink: string,
  isParticipant: boolean
) {
  const dateStr = scheduledAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Entretien confirmé — ${studyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 22px; color: #141311;">Entretien confirmé ✓</h1>
        <p style="color: #6B6760; line-height: 1.6;">
          ${isParticipant ? `Votre entretien pour l'étude` : `Un entretien pour`} <strong>${studyTitle}</strong> est confirmé.
        </p>
        <p style="background: #E6EDE9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          📅 <strong>${dateStr}</strong><br/>
          🎥 <a href="${videoLink}" style="color: #1B3D2A;">${videoLink}</a>
        </p>
        <a href="${videoLink}" style="display: inline-block; padding: 12px 24px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Rejoindre l'entretien →
        </a>
      </div>
    `,
  });
}

export async function sendInterviewReminder(to: string, firstName: string, scheduledAt: Date, videoLink: string, hoursUntil: 24 | 1) {
  const dateStr = scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Rappel : entretien dans ${hoursUntil}h`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 20px; color: #141311;">Rappel : votre entretien est dans ${hoursUntil}h</h1>
        <p style="color: #6B6760;">Bonjour ${firstName}, votre entretien commence à <strong>${dateStr}</strong>.</p>
        <a href="${videoLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          🎥 Rejoindre maintenant
        </a>
      </div>
    `,
  });
}

export async function sendRewardAvailable(to: string, firstName: string, amount: number, type: "CASH" | "VOUCHER") {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Votre récompense vous attend",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 22px; color: #141311;">Merci pour votre participation, ${firstName} 🎉</h1>
        <p style="color: #6B6760; line-height: 1.6;">
          Votre récompense de <strong>${amount / 100}€</strong> ${type === "CASH" ? "est disponible pour retrait" : "voucher est prête à être révélée"}.
        </p>
        <a href="${APP_URL}/participant/wallet" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #1B3D2A; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Récupérer ma récompense →
        </a>
      </div>
    `,
  });
}
