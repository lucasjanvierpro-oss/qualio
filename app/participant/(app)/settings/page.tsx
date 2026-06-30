import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParticipantSettingsClient from "./ParticipantSettingsClient";

export default async function ParticipantSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ParticipantSettingsClient email={user.email ?? ""} />;
}
