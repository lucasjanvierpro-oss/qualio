import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <header className="flex items-center px-8 py-5 border-b" style={{ borderColor: "var(--color-border-base)" }}>
        <Link href="/" className="font-display text-2xl font-normal tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Qualio
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
