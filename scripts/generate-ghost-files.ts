/**
 * Génère (ou régénère) les ghost files des participants dont l'onboarding est
 * terminé : scores internes, tags de recherche, résumé visible par les marques.
 *
 * Sans ghost file, un profil est invisible dans `/brand/profiles` et dans le
 * matching — c'est cette étape qui fait exister un participant côté produit.
 *
 * Run : npx tsx --env-file=.env.local scripts/generate-ghost-files.ts
 *       npx tsx --env-file=.env.local scripts/generate-ghost-files.ts --all
 *
 * Par défaut, seuls les profils sans ghost file « done » sont traités.
 * `--all` force la régénération de tous.
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateGhostFile } from "@/lib/participants/ghostFile";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ALL = process.argv.includes("--all");

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY absente — rien à faire.");
    process.exit(1);
  }

  const profiles = await prisma.participantProfile.findMany({
    where: {
      onboardingStatus: "complete",
      ...(ALL ? {} : { OR: [{ ghostFile: null }, { ghostFile: { processingStatus: { not: "done" } } }] }),
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: "asc" },
  });

  if (profiles.length === 0) {
    console.log("Aucun profil à traiter.");
    return;
  }

  console.log(`${profiles.length} profil(s) à traiter.\n`);

  let ok = 0;
  for (const p of profiles) {
    const label = `${p.firstName} ${p.lastName}`.padEnd(26);
    process.stdout.write(`  ${label} `);
    const res = await generateGhostFile(p.id);
    if (res.ok) {
      const gf = await prisma.participantGhostFile.findUnique({
        where: { participantProfileId: p.id },
        select: { overallQualityScore: true, primaryExpertise: true, aiTags: true },
      });
      console.log(`✓ score ${gf?.overallQualityScore ?? "?"}/10 · ${gf?.primaryExpertise ?? "?"} · ${gf?.aiTags.length ?? 0} tags`);
      ok++;
    } else {
      console.log(`✗ ${res.reason}`);
    }
  }

  console.log(`\n✓ ${ok}/${profiles.length} ghost files générés.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
