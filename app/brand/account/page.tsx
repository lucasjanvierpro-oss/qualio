import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BrandAccountClient from "./BrandAccountClient";

export default async function BrandAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      brandProfile: {
        include: {
          creditTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
    },
  });

  const profile = dbUser?.brandProfile;

  return (
    <BrandAccountClient
      isActivated={profile?.isActivated ?? false}
      credits={profile?.credits ?? 0}
      companyName={profile?.companyName ?? ""}
      brandProfileId={profile?.id ?? ""}
      transactions={
        profile?.creditTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          desc: t.description ?? "",
          date: t.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
          balance: t.balanceAfter,
        })) ?? []
      }
    />
  );
}
