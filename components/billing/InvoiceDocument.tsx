import type { Customer, InvoiceLine, Issuer } from "@/lib/billing/invoices";
import { eurFmt } from "@/lib/billing/invoices";
import s from "./invoice.module.css";

// La facture telle qu'elle s'imprime. Mentions d'une micro-entreprise en
// franchise de TVA, vendant à des professionnels.
type Props = {
  number: string | null; status: string; issuedAt: string | null; paidAt: string | null;
  issuer: Issuer; customer: Customer; lines: InvoiceLine[]; amountCents: number; totalCents: number;
};

const d = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(iso)) : "—");

export default function InvoiceDocument(p: Props) {
  const draft = p.status !== "issued";
  return (
    <article className={s.sheet}>
      <header className={s.head}>
        <div>
          <div className={s.brand}>{p.issuer.tradeName}</div>
          <div className={s.small}>Recrutement de participants pour études qualitatives</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 className={s.title}>Facture</h1>
          <div>{draft ? <span className={s.draft}>Brouillon, sans numéro</span> : <strong>N° {p.number}</strong>}</div>
          <div className={s.small}>Date d&apos;émission : {d(p.issuedAt)}</div>
          <div className={s.small}>Date de la prestation : {d(p.paidAt)}</div>
        </div>
      </header>

      <section className={s.parties}>
        <div className={s.party}>
          <h3>Émetteur</h3>
          <strong>{p.issuer.name} {p.issuer.legalForm.includes("EI") ? "EI" : ""}</strong>
          <div className={s.muted}>{p.issuer.legalForm} · nom commercial {p.issuer.tradeName}</div>
          <div className={`${s.pre} ${s.muted}`}>{p.issuer.address || "Adresse à renseigner"}</div>
          <div className={s.muted}>SIRET : {p.issuer.siret || "à renseigner"}{p.issuer.ape ? ` · APE ${p.issuer.ape}` : ""}</div>
          <div className={s.muted}>{p.issuer.email}</div>
        </div>
        <div className={s.party}>
          <h3>Client</h3>
          <strong>{p.customer.name}</strong>
          {p.customer.legalName && p.customer.legalName !== p.customer.name && <div className={s.muted}>{p.customer.legalName}</div>}
          {p.customer.address && <div className={`${s.pre} ${s.muted}`}>{p.customer.address}</div>}
          {p.customer.siren && <div className={s.muted}>SIREN : {p.customer.siren}</div>}
          {p.customer.contact && <div className={s.muted}>À l&apos;attention de {p.customer.contact}</div>}
          {p.customer.email && <div className={s.muted}>{p.customer.email}</div>}
        </div>
      </section>

      <table className={s.table}>
        <thead><tr><th>Désignation</th><th className={s.num}>Qté</th><th className={s.num}>Prix unitaire HT</th><th className={s.num}>Total HT</th></tr></thead>
        <tbody>
          {p.lines.map((l, i) => (
            <tr key={i}><td>{l.label}<div className={s.small}>Catégorie : prestation de services</div></td><td className={s.num}>{l.quantity}</td><td className={s.num}>{eurFmt(l.unitCents)}</td><td className={s.num}>{eurFmt(l.totalCents)}</td></tr>
          ))}
        </tbody>
      </table>

      <div className={s.totals}>
        <div><span>Total HT</span><span>{eurFmt(p.amountCents)}</span></div>
        <div><span>TVA</span><span>0,00 €</span></div>
        <div className={s.grand}><span>Total à payer</span><span>{eurFmt(p.totalCents)}</span></div>
      </div>

      <footer className={s.legal}>
        <div><strong>{p.issuer.vatMention}.</strong></div>
        <div>{p.paidAt ? `Payée le ${d(p.paidAt)} par carte bancaire (Stripe).` : "Paiement à réception."} Pas d&apos;escompte pour paiement anticipé.</div>
        <div>En cas de retard de paiement : pénalités au taux de trois fois le taux d&apos;intérêt légal, et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 du Code de commerce).</div>
      </footer>
    </article>
  );
}
