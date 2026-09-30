import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { yearEarnings } from "@/lib/participants/tax";
import PrintButton from "@/components/billing/PrintButton";
import s from "@/components/billing/invoice.module.css";

export const dynamic = "force-dynamic";

const eur = (c: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);
const d = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(iso));

// Relevé annuel des gains (art. 242 bis du CGI), imprimable en PDF.
export default async function Releve({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const me = await getSessionUser();
  if (!me?.participantProfileId) redirect("/login");
  const now = new Date().getFullYear();
  const y = Number((await searchParams).year) || now;
  const year = Math.min(now, Math.max(2025, y));
  const [p, e] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { id: me.participantProfileId }, select: { firstName: true, lastName: true, addressLine: true, postalCode: true, city: true, taxId: true, dateOfBirth: true } }),
    yearEarnings(me.participantProfileId, year),
  ]);
  if (!p) redirect("/login");
  return (
    <div style={{ padding: "32px 16px 64px" }}>
      <div className={s.actions} style={{ justifyContent: "space-between" }}>
        <span style={{ display: "flex", gap: 10, fontSize: 14 }}>
          {[now, now - 1].filter((x) => x >= 2025).map((x) => <Link key={x} href={`/participant/wallet/releve?year=${x}`} style={{ fontWeight: x === year ? 700 : 500 }}>{x}</Link>)}
        </span>
        <PrintButton />
      </div>
      <article className={s.sheet}>
        <header className={s.head}>
          <div><div className={s.brand}>Rarelyst</div><div className={s.small}>Relevé des sommes perçues par l&apos;intermédiaire de la plateforme</div></div>
          <div style={{ textAlign: "right" }}><h1 className={s.title}>Relevé {year}</h1><div className={s.small}>Établi le {d(new Date().toISOString())}</div></div>
        </header>
        <section className={s.parties}>
          <div className={s.party}>
            <h3>Participant</h3>
            <strong>{p.firstName} {p.lastName}</strong>
            {p.dateOfBirth && <div className={s.muted}>Né(e) le {d(p.dateOfBirth.toISOString())}</div>}
            {(p.addressLine || p.city) && <div className={`${s.muted} ${s.pre}`}>{[p.addressLine, [p.postalCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join("\n")}</div>}
            {p.taxId && <div className={s.muted}>Numéro fiscal : {p.taxId}</div>}
          </div>
          <div className={s.party}>
            <h3>Plateforme</h3>
            <strong>Rarelyst</strong>
            <div className={s.muted}>rarelyst.co · contact@rarelyst.co</div>
          </div>
        </section>
        <table className={s.table}>
          <thead><tr><th>Date</th><th>Nature</th><th className={s.num}>Montant brut</th></tr></thead>
          <tbody>
            {e.items.length === 0 && <tr><td colSpan={3} className={s.muted}>Aucune somme perçue en {year}.</td></tr>}
            {e.items.map((it, i) => <tr key={i}><td>{d(it.date)}</td><td>{it.kind === "entretien" ? "Rémunération d'un entretien" : "Prime de parrainage"}</td><td className={s.num}>{eur(it.amountCents)}</td></tr>)}
          </tbody>
        </table>
        <div className={s.totals}>
          <div><span>Nombre d&apos;opérations</span><span>{e.count}</span></div>
          <div className={s.grand}><span>Total brut {year}</span><span>{eur(e.totalCents)}</span></div>
        </div>
        <footer className={s.legal}>
          <div>Relevé établi en application de l&apos;article 242 bis du Code général des impôts. Ces montants sont également déclarés à l&apos;administration fiscale (directive européenne DAC7).</div>
          <div>Les sommes perçues peuvent être imposables et soumises à cotisations sociales selon votre situation. Informations : impots.gouv.fr (rubrique « économie collaborative ») et urssaf.fr.</div>
        </footer>
      </article>
    </div>
  );
}
