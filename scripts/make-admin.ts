/**
 * Passe un compte en ADMIN.
 * Run: npx tsx --env-file=.env.local scripts/make-admin.ts
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TARGET_EMAIL = "lucas.janvierpro@gmail.com";

async function main() {
  // 1. Update role in Prisma DB
  const user = await prisma.user.update({
    where: { email: TARGET_EMAIL },
    data: { role: "ADMIN" },
  });
  console.log(`✅ DB: ${TARGET_EMAIL} → role ADMIN`);

  // 2. Update role in Supabase user_metadata (so proxy reads it correctly)
  if (user.supabaseId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
      user_metadata: { role: "ADMIN" },
      email_confirm: true,
    });
    if (error) console.error(`❌ Supabase metadata: ${error.message}`);
    else console.log(`✅ Supabase metadata: role ADMIN`);
  }

  console.log(`\n→ Connecte-toi avec lucas.janvierpro@gmail.com`);
  console.log(`→ Tu seras redirigé vers /admin automatiquement`);

  await prisma.$disconnect();
}

main().catch(console.error);
