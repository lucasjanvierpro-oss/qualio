// Certification des marques : un poinçon à trois titres.
//
// Les participants gagnent des médailles ; les marques, elles, sont
// poinçonnées — comme l'or et l'argent. Le système est volontairement
// différent : une marque ne se « gamifie » pas, elle prouve qui elle est.
//
//   I   Adresse pro       — l'email du compte est sur le domaine de la société
//   II  Domaine confirmé  — la marque a prouvé qu'elle contrôle cette adresse
//                           (email confirmé, ou connexion Google / LinkedIn)
//   III Maison certifiée  — Rarelyst a vérifié la société (Kbis, appel)
//
// S'inscrire reste rapide : le titre I est immédiat avec une adresse pro, le
// II suit la confirmation, le III ne bloque jamais l'usage.

const WEBMAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.fr", "hotmail.com", "hotmail.fr", "outlook.com",
  "outlook.fr", "live.com", "live.fr", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "neuf.fr", "bbox.fr", "laposte.net", "gmx.fr",
  "gmx.com", "proton.me", "protonmail.com", "yandex.com", "mail.com", "zoho.com",
]);

export function emailDomain(email: string): string {
  return email.split("@")[1]?.trim().toLowerCase() ?? "";
}

export function isProDomain(domain: string): boolean {
  return !!domain && domain.includes(".") && !WEBMAIL.has(domain);
}

/** « lacoste.com » → « Lacoste » : une proposition, que la marque corrige. */
export function companyFromDomain(domain: string): string {
  const base = domain.split(".").slice(-2, -1)[0] ?? "";
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
}

export type CertLevel = 0 | 1 | 2 | 3;

export const CERT_TITLES: Record<CertLevel, { roman: string; name: string; meaning: string }> = {
  0: { roman: "", name: "Compte marque", meaning: "Adresse personnelle : la marque n'est pas encore rattachée à un domaine." },
  1: { roman: "I", name: "Adresse pro", meaning: "Le compte utilise une adresse sur le domaine de la société." },
  2: { roman: "II", name: "Domaine confirmé", meaning: "La marque a prouvé qu'elle contrôle cette adresse." },
  3: { roman: "III", name: "Maison certifiée", meaning: "Société vérifiée par l'équipe Rarelyst." },
};

export type CertInput = { email: string; domainVerifiedAt: Date | string | null; isVerified: boolean };

export function certLevel(b: CertInput): CertLevel {
  if (b.isVerified) return 3;
  const pro = isProDomain(emailDomain(b.email));
  if (pro && b.domainVerifiedAt) return 2;
  return pro ? 1 : 0;
}

export type CertStep = { level: CertLevel; done: boolean; how: string };

export function certSteps(b: CertInput): CertStep[] {
  const lvl = certLevel(b);
  const pro = isProDomain(emailDomain(b.email));
  return [
    { level: 1, done: lvl >= 1, how: pro ? "Adresse sur votre domaine." : "Utilisez une adresse sur le domaine de votre société (pas Gmail ni Outlook)." },
    { level: 2, done: lvl >= 2, how: "Connectez-vous une fois avec Google, LinkedIn ou un code reçu par email : cela prouve que l'adresse est la vôtre." },
    { level: 3, done: lvl >= 3, how: "Nous vérifions votre société (Kbis ou échange de 10 minutes). Écrivez-nous depuis votre adresse pro." },
  ];
}
