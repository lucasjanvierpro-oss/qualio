import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminReportClient from "./AdminReportClient";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminStudyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      brandProfile: { select: { companyName: true } },
      report: true,
      applications: {
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        include: {
          participantProfile: {
            select: {
              id: true, firstName: true, lastName: true, dateOfBirth: true,
              profession: true, screenerAnswers: true,
              ghostFile: { select: { profileType: true, primaryExpertise: true } },
            },
          },
          interview: { select: { scheduledAt: true, status: true } },
        },
      },
    },
  });

  if (!study) notFound();

  const serialized = {
    id: study.id,
    title: study.title,
    objective: study.objective,
    brandName: study.brandProfile.companyName,
    studyType: study.studyType,
    interviewDuration: study.interviewDuration,
    targetParticipantCount: study.targetParticipantCount,
    existingReport: study.report ? {
      content: study.report.markdownContent,
      generatedAt: study.report.generatedAt.toISOString(),
    } : null,
    participants: study.applications.map((a) => ({
      id: a.participantProfile.id,
      firstName: a.participantProfile.firstName,
      lastName: a.participantProfile.lastName,
      age: calcAge(a.participantProfile.dateOfBirth),
      profession: a.participantProfile.profession,
      profileType: a.participantProfile.ghostFile?.profileType ?? null,
      primaryExpertise: a.participantProfile.ghostFile?.primaryExpertise ?? null,
      applicationStatus: a.status,
      interviewStatus: a.interview?.status ?? null,
      interviewDate: a.interview?.scheduledAt?.toISOString() ?? null,
    })),
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" }}>
        <Link href="/admin/studies" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Études</Link>
        <span>›</span>
        <Link href={`/admin/studies/${id}`} style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>{study.title}</Link>
        <span>›</span>
        <span>Rapport de synthèse</span>
      </div>

      <AdminReportClient study={serialized} />
    </div>
  );
}
