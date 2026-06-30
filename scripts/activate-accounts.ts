/**
 * Activates all existing brand accounts (for Lucas's test accounts).
 * Run: npx tsx --env-file=.env.local scripts/activate-accounts.ts
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.brandProfile.updateMany({
    data: { isActivated: true },
  });
  console.log(`✅ Activated ${result.count} brand account(s)`);

  const brands = await prisma.brandProfile.findMany({
    include: { user: { select: { email: true } } },
  });
  for (const b of brands) {
    console.log(`  → ${b.user.email} — ${b.companyName} (activated: ${b.isActivated})`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
