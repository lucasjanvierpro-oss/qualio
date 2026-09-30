import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getSessionUser } from "@/lib/auth/guards";
import {
  REPORT_MODEL,
  buildUserMessage,
  generateReport,
  houseContext,
  type ParticipantInput,
  type VerbatimInput,
} from "@/lib/reports/generate";
import { checkAndRepairQuotes } from "@/lib/reports/quality";

// Le rapport complet demande plus de 100 s à Claude.
// Sans cette ligne, Vercel coupe la fonction bien avant la réponse.
export const maxDuration = 300;

// Génération manuelle d'un rapport, depuis l'espace admin : l'admin fournit
// lui-même les verbatims, sans passer par les transcriptions automatiques.
// Le prompt et l'appel au modèle viennent de lib/reports/generate.ts — cette
// route en a longtemps gardé une copie, qui avait fini par diverger.
type RequestBody = {
  studyObjective?: string;
  brandContext?: string;
  participantProfiles?: ParticipantInput[];
  verbatims?: VerbatimInput[];
  studyFormat?: string;
  additionalContext?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: { brandProfile: { select: { companyName: true, houseNotes: true } } },
  });
  if (!study) return NextResponse.json({ error: "Study not found" }, { status: 404 });

  const body: RequestBody = await req.json();
  const {
    studyObjective = study.objective,
    brandContext = "",
    participantProfiles = [],
    verbatims = [],
    studyFormat = `${study.targetParticipantCount} entretiens ${study.studyType === "ONE_ON_ONE" ? "1:1" : "focus group"} de ${study.interviewDuration} minutes, en visio`,
    additionalContext = "",
  } = body;

  if (!verbatims.length) {
    return NextResponse.json({ error: "Au moins un verbatim est requis" }, { status: 400 });
  }

  const house = await houseContext(study.brandProfileId, study.id);
  const { raw, structured } = await generateReport(
    buildUserMessage({
      studyObjective,
      brandContext: brandContext || house.brandContext,
      participantProfiles,
      studyFormat,
      verbatims,
      additionalContext,
      decisions: study.decisions,
      brief: study.brief,
      guide: study.guide,
      houseNotes: study.brandProfile.houseNotes,
      previousLearnings: house.previousLearnings,
      language: study.preferredLanguage === "en" ? "en" : "fr",
    })
  );

  if (!structured) {
    return NextResponse.json({ error: "Le rapport généré est invalide (JSON). Réessayez." }, { status: 502 });
  }
  // Les citations doivent exister dans les verbatims fournis.
  const q = await checkAndRepairQuotes(structured, verbatims.map((v) => v.content));
  structured.qualite = { citations: q.total, verifiees: q.verified, corrigees: q.repaired, retirees: q.removed };

  const report = await prisma.studyReport.upsert({
    where: { studyId: id },
    create: {
      studyId: id,
      markdownContent: raw,
      structuredContent: structured as Prisma.InputJsonValue,
      generatedByAdminId: admin.id,
      aiModelUsed: REPORT_MODEL,
    },
    update: {
      markdownContent: raw,
      structuredContent: structured as Prisma.InputJsonValue,
      generatedAt: new Date(),
      generatedByAdminId: admin.id,
    },
  });

  return NextResponse.json({ ok: true, reportId: report.id, structured, content: raw });
}
