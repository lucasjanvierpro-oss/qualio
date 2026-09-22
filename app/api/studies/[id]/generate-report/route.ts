import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getSessionUser } from "@/lib/auth/guards";
import {
  REPORT_MODEL,
  buildUserMessage,
  generateReport,
  type ParticipantInput,
  type VerbatimInput,
} from "@/lib/reports/generate";

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
    include: { brandProfile: { select: { companyName: true } } },
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

  const { raw, structured } = await generateReport(
    buildUserMessage({
      studyObjective,
      brandContext: brandContext || `Étude menée pour ${study.brandProfile.companyName}`,
      participantProfiles,
      studyFormat,
      verbatims,
      additionalContext,
    })
  );

  if (!structured) {
    return NextResponse.json({ error: "Le rapport généré est invalide (JSON). Réessayez." }, { status: 502 });
  }

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
