import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import Stage from "@/components/studio/Stage";
import { findComposition } from "@/components/studio/compositions";

export const dynamic = "force-dynamic";

// Un format seul, collé en haut à gauche : c'est ce que filme l'enregistreur.
export default async function StudioFormat({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") notFound();
  const { id } = await params;
  const { lang } = await searchParams;
  if (!findComposition(id)) notFound();
  return (
    <main style={{ margin: 0, padding: 0, background: "#fff", width: "fit-content" }}>
      <Stage id={id} lang={lang === "en" ? "en" : "fr"} />
    </main>
  );
}
