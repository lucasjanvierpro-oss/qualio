import { prisma } from "@/lib/prisma";
import AdminAccessClient from "./AdminAccessClient";

export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  const [codes, pendingBrands] = await Promise.all([
    prisma.inviteCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.brandProfile.findMany({
      where: { isActivated: false },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandProfile.findMany({
      where: { isActivated: true },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activatedBrands = await prisma.brandProfile.findMany({
    where: { isActivated: true },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminAccessClient
      codes={codes.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label ?? "",
        usedAt: c.usedAt?.toLocaleDateString("fr-FR") ?? null,
        expiresAt: c.expiresAt?.toLocaleDateString("fr-FR") ?? null,
        createdAt: c.createdAt.toLocaleDateString("fr-FR"),
      }))}
      pendingBrands={pendingBrands.map((b) => ({
        id: b.id,
        companyName: b.companyName,
        email: b.user.email,
        createdAt: b.createdAt.toLocaleDateString("fr-FR"),
      }))}
      activatedBrands={activatedBrands.map((b) => ({
        id: b.id,
        companyName: b.companyName,
        email: b.user.email,
        createdAt: b.createdAt.toLocaleDateString("fr-FR"),
      }))}
    />
  );
}
