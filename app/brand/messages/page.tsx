import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RealtimeChatBrand from "./RealtimeChatBrand";

export default async function BrandMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      brandProfile: {
        include: {
          studies: {
            orderBy: { updatedAt: "desc" },
            select: { id: true, title: true, status: true, updatedAt: true },
          },
        },
      },
    },
  });

  const studies = dbUser?.brandProfile?.studies ?? [];

  const threads = studies.map((s) => ({
    id: s.id,
    study: s.title,
    status: s.status,
    updatedAt: s.updatedAt.toISOString(),
  }));

  return <RealtimeChatBrand threads={threads} />;
}
