import Link from "next/link";
import type { Metadata } from "next";
import ResendButton from "./ResendButton";

export const metadata: Metadata = { title: "Vérifiez votre adresse — Rarelyst" };

/**
 * Écran d'attente après inscription, lorsque la confirmation par email est
 * exigée. Il doit répondre aux trois questions que se pose quelqu'un devant une
 * boîte de réception vide : est-ce parti, à quelle adresse, et que faire si rien
 * n'arrive.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email = "", next = "" } = await searchParams;

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="font-display text-3xl" style={{ color: "var(--color-text-primary)" }}>
          Vérifiez votre adresse
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Nous venons d&apos;envoyer un lien de confirmation
          {email ? <> à <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong></> : null}.
          Cliquez dessus pour activer votre compte.
        </p>
      </div>

      <div
        className="rounded-lg border p-4 text-left text-sm"
        style={{
          borderColor: "var(--color-border-base)",
          background: "var(--color-surface)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p className="m-0">
          Le message arrive en général en moins d&apos;une minute. S&apos;il ne vient pas,
          regardez dans vos indésirables : c&apos;est la première fois que nous vous écrivons,
          et les messageries se méfient des expéditeurs qu&apos;elles ne connaissent pas encore.
        </p>
      </div>

      <ResendButton email={email} next={next} />

      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Mauvaise adresse ?{" "}
        <Link
          href={next === "brand" ? "/signup/brand" : "/signup/participant"}
          className="font-medium underline underline-offset-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          Recommencer
        </Link>
      </p>
    </div>
  );
}
