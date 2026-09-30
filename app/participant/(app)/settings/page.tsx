import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ParticipantSettingsClient from "./ParticipantSettingsClient";
import TaxInfoForm from "./TaxInfoForm";

export default async function ParticipantSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const p = await prisma.participantProfile.findFirst({
    where: { user: { supabaseId: user.id } },
    select: { addressLine: true, postalCode: true, city: true, country: true, taxCountry: true, taxId: true, dateOfBirth: true },
  });

  return (
    <>
      <ParticipantSettingsClient email={user.email ?? ""} />
      {p && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px 48px" }}>
          <TaxInfoForm initial={{
            addressLine: p.addressLine ?? "", postalCode: p.postalCode ?? "", city: p.city ?? "",
            taxCountry: p.taxCountry ?? p.country ?? "FR", taxId: p.taxId ?? "",
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
          }} />
        </div>
      )}
    </>
  );
}
