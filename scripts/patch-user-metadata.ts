/**
 * Script to backfill role into Supabase user_metadata for existing accounts.
 * Run once: npx tsx scripts/patch-user-metadata.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ select: { supabaseId: true, role: true, email: true } });
  console.log(`Found ${users.length} users to patch`);

  for (const user of users) {
    if (!user.supabaseId) continue;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
      user_metadata: { role: user.role },
      email_confirm: true,
    });
    if (error) {
      console.error(`❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`✅ ${user.email} → role: ${user.role}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
