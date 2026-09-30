"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";

// La marque décrit sa maison : l'IA qui écrit les synthèses le lit avant les
// entretiens, pour parler sa langue et relier l'étude à ce qu'elle sait déjà.
export async function saveHouse(input: { industry: string; website: string; houseNotes: string }): Promise<{ ok: true } | { error: string }> {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return { error: "Session expirée : reconnectez-vous." };
  const website = input.website.trim().slice(0, 200);
  if (website && !/^https?:\/\/|^[\w-]+(\.[\w-]+)+/.test(website)) return { error: "Adresse du site invalide." };
  await prisma.brandProfile.update({
    where: { id: me.brandProfileId },
    data: {
      industry: input.industry.trim().slice(0, 120) || null,
      website: website || null,
      houseNotes: input.houseNotes.trim().slice(0, 6000) || null,
    },
  });
  revalidatePath("/brand/account");
  return { ok: true as const };
}
