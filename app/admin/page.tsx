import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { priceProfiles, getPricingConfig } from "@/lib/pricing/quotes";
import { BADGES, CERTIFICATIONS } from "@/lib/participants/badges";
import { TIERS } from "@/lib/pricing/config";
import RequestAnswer from "./RequestAnswer";
import a from "./admin.module.css";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const fmtEur = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

/**
 * Pilotage : ce qui attend une action, les chiffres du mois, l'état du panel.
 * Chaque tuile mène là où l'on agit.
 */
// Rendu serveur, à chaque requête : l'heure fait partie des données.
const requestTime = () => Date.now();

export default async function AdminCockpit() {
  const now = requestTime();
  const d30 = new Date(now - 30 * DAY);
  const d7 = new Date(now - 7 * DAY);

  const [
    idPending, requests, activeStudies, withLinks, ghostErrors, rewardsPending, brandsPending,
    studiesNoReport, abandons, txs, accepted30, signups30, completed30, interviews30, noShow30, cfg,
    panelIds, housesToCheck,
  ] = await Promise.all([
    prisma.participantProfile.count({ where: { idVerificationStatus: "PENDING", idDocumentUrl: { not: null } } }),
    prisma.profileRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, message: true, createdAt: true,
        brandProfile: { select: { companyName: true } },
        participantProfile: { select: { id: true, firstName: true, lastName: true } },
        study: { select: { title: true } },
      },
    }),
    prisma.study.findMany({
      where: { status: { in: ["ACTIVE", "MATCHING", "IN_PROGRESS"] } },
      orderBy: { deadlineAt: "asc" },
      select: {
        id: true, title: true, deadlineAt: true, targetParticipantCount: true, status: true,
        brandProfile: { select: { companyName: true } },
        applications: { select: { status: true } },
      },
    }),
    prisma.participantProfile.findMany({
      where: { linksAnalysis: { not: Prisma.DbNull } },
      select: { id: true, firstName: true, lastName: true, linksAnalysis: true },
    }),
    prisma.participantGhostFile.findMany({
      where: { processingStatus: "error" },
      select: { participantProfile: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.reward.aggregate({ where: { status: "PENDING" }, _count: true, _sum: { amountCents: true } }),
    prisma.brandProfile.count({ where: { isActivated: false } }),
    prisma.study.count({ where: { report: null, applications: { some: { status: "COMPLETED" } } } }),
    prisma.participantProfile.count({ where: { onboardingStatus: "incomplete", createdAt: { gte: d7 } } }),
    prisma.creditTransaction.groupBy({ by: ["type"], where: { createdAt: { gte: d30 } }, _sum: { amount: true } }),
    prisma.application.aggregate({
      where: { priceCredits: { not: null }, status: { in: ["INVITED", "CONFIRMED", "COMPLETED"] }, updatedAt: { gte: d30 } },
      _count: true, _sum: { priceCredits: true, participantPayCents: true },
    }),
    prisma.participantProfile.count({ where: { createdAt: { gte: d30 } } }),
    prisma.participantProfile.count({ where: { createdAt: { gte: d30 }, onboardingStatus: "complete" } }),
    prisma.application.count({ where: { status: "COMPLETED", updatedAt: { gte: d30 } } }),
    prisma.application.count({ where: { status: "NO_SHOW", updatedAt: { gte: d30 } } }),
    getPricingConfig(),
    prisma.participantProfile.findMany({
      where: { onboardingStatus: "complete", isBlacklisted: false },
      select: { id: true },
      take: 500,
    }),
    // Sociétés déclarées mais pas encore vérifiées automatiquement.
    prisma.brandProfile.findMany({
      where: { legalName: { not: null }, companyVerifiedAt: null, isVerified: false },
      select: { id: true, domainVerifiedAt: true, companyInfo: true },
    }),
  ]);
  const houses = housesToCheck.filter((b) => !((b.companyInfo as { match?: boolean } | null)?.match && b.domainVerifiedAt));

  // Liens que le robot n'a pas pu lire : à vérifier à la main.
  type Rep = { links?: { status?: string }[] };
  const unreadLinks = withLinks.filter((p) => ((p.linksAnalysis as Rep | null)?.links ?? []).some((l) => l.status !== "read"));

  const studyRows = activeStudies.map((s) => {
    const proposed = s.applications.filter((x) => ["SHORTLISTED", "PENDING"].includes(x.status)).length;
    const booked = s.applications.filter((x) => ["INVITED", "CONFIRMED", "COMPLETED"].includes(x.status)).length;
    const days = s.deadlineAt ? Math.ceil((s.deadlineAt.getTime() - now) / DAY) : null;
    return { ...s, proposed, booked, days };
  });
  const noProfiles = studyRows.filter((s) => s.proposed + s.booked === 0);
  const late = studyRows.filter((s) => s.days !== null && s.days <= 3 && s.booked < s.targetParticipantCount);

  const sum = (t: string) => txs.find((x) => x.type === t)?._sum.amount ?? 0;
  const sold = sum("PURCHASE");
  const consumed = -sum("CONSUME") - sum("REFUND");
  const revenueCents = (accepted30._sum.priceCredits ?? 0) * cfg.creditValueCents;
  const payCents = accepted30._sum.participantPayCents ?? 0;
  const noShowRate = interviews30 + noShow30 ? Math.round((noShow30 / (interviews30 + noShow30)) * 100) : null;

  // L'état du panel : paliers, certification, preuves les plus fréquentes.
  const pricing = await priceProfiles(panelIds.map((p) => p.id));
  const all = [...pricing.values()];
  const byTier = TIERS.map((t) => ({ t, n: all.filter((p) => p.quote.tier === t).length }));
  const avgCert = all.length ? Math.round(all.reduce((s, p) => s + p.certScore, 0) / all.length) : 0;
  const byCert = CERTIFICATIONS.filter((c) => !BADGES[c].soon).map((c) => ({
    c, n: all.filter((p) => p.badges.some((b) => b.id === c && b.state === "earned")).length,
  }));
  const max = Math.max(1, all.length);

  const tasks = [
    { n: idPending, title: "Identités à vérifier", text: "Pièces reçues, en attente de ton contrôle.", href: "/admin/verifications", urgent: idPending > 0 },
    { n: requests.length, title: "Profils sur demande", text: "Des marques attendent ta réponse (sous 48 h promis).", href: "#demandes", urgent: requests.length > 0 },
    { n: noProfiles.length, title: "Études sans profil proposé", text: "Rien n'a encore été présenté à la marque.", href: noProfiles[0] ? `/admin/studies/${noProfiles[0].id}` : "/admin/studies", urgent: noProfiles.length > 0 },
    { n: late.length, title: "Études en retard", text: "Échéance dans 3 jours ou moins, pas assez d'entretiens.", href: late[0] ? `/admin/studies/${late[0].id}` : "/admin/studies", urgent: late.length > 0 },
    { n: rewardsPending._count, title: "Participants à payer", text: `${fmtEur(rewardsPending._sum.amountCents ?? 0)} à verser.`, href: "/admin/payments", urgent: rewardsPending._count > 0 },
    { n: studiesNoReport, title: "Synthèses à produire", text: "Des entretiens sont faits, pas encore de rapport.", href: "/admin/studies", urgent: false },
    { n: unreadLinks.length, title: "Liens à vérifier à la main", text: "LinkedIn ou Instagram privés, le robot n'a pas pu lire.", href: unreadLinks[0] ? `/admin/participants/${unreadLinks[0].id}` : "/admin/participants", urgent: false },
    { n: ghostErrors.length, title: "Analyses IA en échec", text: "Portrait et traits non générés : à relancer.", href: ghostErrors[0]?.participantProfile ? `/admin/participants/${ghostErrors[0].participantProfile.id}` : "/admin/participants", urgent: ghostErrors.length > 0 },
    { n: houses.length, title: "Maisons à vérifier", text: "Société hors de France ou nom qui ne colle pas au domaine.", href: "/admin/access", urgent: houses.length > 0 },
    { n: brandsPending, title: "Marques sans accès", text: "Comptes créés, pas encore activés.", href: "/admin/access", urgent: false },
    { n: abandons, title: "Inscriptions abandonnées", text: "Participants partis en cours de tunnel cette semaine.", href: "/admin/participants", urgent: false },
  ];

  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Pilotage</p>
      <h1 className={a.h1}>Bonjour Lucas</h1>
      <p className={a.sub} style={{ textTransform: "capitalize" }}>{dateStr}</p>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>À traiter</h2></div>
        <div className={a.todo}>
          {[...tasks].sort((x, y) => Number(y.urgent) - Number(x.urgent) || y.n - x.n).map((t) => (
            <Link key={t.title} href={t.href} className={a.task} data-level={t.n === 0 ? "ok" : t.urgent ? "urgent" : "normal"}>
              <span className={a.count}>{t.n}</span>
              <span><span className={a.taskTitle}>{t.title}</span><span className={a.taskText} style={{ display: "block" }}>{t.text}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Les 30 derniers jours</h2><Link href="/admin/prix">Régler les prix →</Link></div>
        <div className={a.kpis}>
          <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{fmtEur(revenueCents)}</div><div className={a.kpiLabel}>Facturé aux marques</div><div className={a.kpiNote}>{accepted30._count} profils acceptés</div></div>
          <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{fmtEur(revenueCents - payCents)}</div><div className={a.kpiLabel}>Marge brute</div><div className={a.kpiNote}>{revenueCents ? Math.round(((revenueCents - payCents) / revenueCents) * 100) : 0} % · avant frais</div></div>
          <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{sold}<small>cr.</small></div><div className={a.kpiLabel}>Crédits vendus</div><div className={a.kpiNote}>{consumed} consommés</div></div>
          <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{signups30}</div><div className={a.kpiLabel}>Inscriptions</div><div className={a.kpiNote}>{signups30 ? Math.round((completed30 / signups30) * 100) : 0} % vont au bout du tunnel</div></div>
          <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{interviews30}</div><div className={a.kpiLabel}>Entretiens menés</div><div className={a.kpiNote}>{noShowRate === null ? "Aucune absence mesurée" : `${noShowRate} % d'absences`}</div></div>
        </div>
      </section>

      {requests.length > 0 && (
        <section className={a.section} id="demandes">
          <div className={a.sectionHead}><h2 className={a.h2}>Profils demandés par les marques</h2></div>
          <div className={`${a.card} ${a.rows}`}>
            {requests.map((r) => (
              <div key={r.id} className={a.row} style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,2fr)" }}>
                <span className={a.rowMain}>{r.brandProfile.companyName}<small>{r.study?.title ?? "Hors étude"} · {r.createdAt.toLocaleDateString("fr-FR")}</small></span>
                <Link href={`/admin/participants/${r.participantProfile.id}`} className={a.rowMain} style={{ textDecoration: "none" }}>{r.participantProfile.firstName} {r.participantProfile.lastName}<small>{r.message ?? "Sans message"}</small></Link>
                <RequestAnswer id={r.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Études en cours</h2><Link href="/admin/studies">Toutes les études →</Link></div>
        <div className={`${a.card} ${a.rows}`}>
          <div className={`${a.row} ${a.rowHead}`}><span>Étude</span><span>Échéance</span><span>Proposés</span><span>Réservés</span><span>Objectif</span><span /></div>
          {studyRows.length === 0 && <div className={a.row}><span className={a.muted}>Aucune étude en cours.</span></div>}
          {studyRows.map((s) => (
            <Link key={s.id} href={`/admin/studies/${s.id}`} className={a.row}>
              <span className={a.rowMain}>{s.title}<small>{s.brandProfile.companyName}</small></span>
              <span className={`${a.num} ${s.days !== null && s.days <= 3 ? a.warn : ""}`}>{s.days === null ? "—" : s.days < 0 ? "Dépassée" : `J−${s.days}`}</span>
              <span className={a.num}>{s.proposed}</span>
              <span className={`${a.num} ${s.booked >= s.targetParticipantCount ? a.good : ""}`}>{s.booked}</span>
              <span className={a.num}>{s.targetParticipantCount}</span>
              <span className={a.pill}>Gérer →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Le panel · {all.length} profils actifs</h2><Link href="/admin/prix">Prix par profil →</Link></div>
        <div className={a.split}>
          <div className={`${a.card} ${a.bars}`}>
            <div className={a.kpiLabel} style={{ marginTop: 0 }}>Par palier</div>
            {byTier.map((b) => (
              <div key={b.t} className={a.bar}><span>{cfg.tiers[b.t].label}</span><i><b style={{ width: `${(b.n / max) * 100}%` }} /></i><span>{b.n}</span></div>
            ))}
            <div className={a.kpiNote}>Certification moyenne : {avgCert} %</div>
          </div>
          <div className={`${a.card} ${a.bars}`}>
            <div className={a.kpiLabel} style={{ marginTop: 0 }}>Preuves obtenues</div>
            {byCert.map((b) => (
              <div key={b.c} className={a.bar}><span>{BADGES[b.c].name.fr}</span><i><b style={{ width: `${(b.n / max) * 100}%` }} /></i><span>{b.n}</span></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
