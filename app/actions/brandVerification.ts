"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { searchCompanies, companyBySiren, nameMatches, type Company } from "@/lib/brands/registry";
import { emailDomain, isProDomain } from "@/lib/brands/certification";

// Titre III du poinçon : rattacher le compte marque à une société réelle.

async function myBrand() {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return null;
  return prisma.brandProfile.findUnique({
    where: { id: me.brandProfileId },
    select: { id: true, companyName: true, domainVerifiedAt: true, user: { select: { email: true } } },
  });
}

export async function findCompanies(q: string): Promise<{ results: Company[] } | { error: string }> {
  if (!(await myBrand())) return { error: "Session expirée, reconnectez-vous." };
  try {
    return { results: await searchCompanies(q) };
  } catch {
    return { error: "Le registre ne répond pas. Réessayez dans un instant." };
  }
}

/**
 * La marque désigne sa société. Si le nom légal concorde avec son domaine et
 * que ce domaine est prouvé, elle est vérifiée sur-le-champ ; sinon l'équipe
 * tranche (homonyme, holding au nom différent…).
 */
export async function claimCompany(siren: string) {
  const b = await myBrand();
  if (!b) return { error: "Session expirée, reconnectez-vous." };
  const company = await companyBySiren(siren).catch(() => null);
  if (!company) return { error: "Société introuvable au registre." };
  if (!company.active) return { error: "Cette société est fermée au registre." };

  const domain = emailDomain(b.user.email);
  const match = isProDomain(domain) && nameMatches(company.name, b.companyName, domain);
  const verified = match && !!b.domainVerifiedAt;

  await prisma.brandProfile.update({
    where: { id: b.id },
    data: {
      siren: company.siren,
      legalName: company.name,
      companyInfo: { ...company, match, checkedAt: new Date().toISOString() },
      companyVerifiedAt: verified ? new Date() : null,
      companyVerifyMethod: verified ? "registre+domaine" : match ? "registre (domaine à prouver)" : "à vérifier par l'équipe",
    },
  });
  revalidatePath("/brand/account");
  revalidatePath("/brand/onboarding");
  return { ok: true as const, verified, match };
}

/** Société hors de France : l'équipe vérifie à la main. */
export async function declareForeignCompany(input: { legalName: string; country: string; website: string }) {
  const b = await myBrand();
  if (!b) return { error: "Session expirée, reconnectez-vous." };
  const legalName = input.legalName.trim().slice(0, 120);
  const country = input.country.trim().slice(0, 60);
  if (legalName.length < 2 || country.length < 2) return { error: "Indiquez le nom de la société et son pays." };
  await prisma.brandProfile.update({
    where: { id: b.id },
    data: {
      siren: null,
      legalName,
      companyInfo: { foreign: true, country, website: input.website.trim().slice(0, 200), checkedAt: new Date().toISOString() },
      companyVerifiedAt: null,
      companyVerifyMethod: "à vérifier par l'équipe",
    },
  });
  revalidatePath("/brand/onboarding");
  return { ok: true as const };
}
