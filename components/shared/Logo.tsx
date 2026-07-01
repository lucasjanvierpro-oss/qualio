import Link from "next/link";

// Logo pastille — la version officielle de la marque.
// variant "dark"  : pour fonds sombres (hero, admin)
// variant "light" : pour fonds clairs (app, footer)
// variant "solid" : pastille pleine lime (CTA, badges)
export default function Logo({
  variant = "light",
  size = "md",
  href = "/",
}: {
  variant?: "dark" | "light" | "solid";
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const fontSize = size === "lg" ? "22px" : size === "md" ? "17px" : "15px";
  const padding = size === "lg" ? "8px 20px" : size === "md" ? "6px 16px" : "4px 12px";
  const dotSize = size === "lg" ? "8px" : "6px";

  const styles = {
    dark: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "#F8F7F4",
      dot: "var(--color-accent)",
      dotGlow: "0 0 8px var(--color-lime-glow), 0 0 16px var(--color-lime-glow)",
    },
    light: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border-base)",
      color: "var(--color-text-primary)",
      dot: "var(--color-accent)",
      dotGlow: "0 0 6px var(--color-lime-glow)",
    },
    solid: {
      background: "var(--color-lime)",
      border: "1px solid var(--color-lime)",
      color: "var(--color-lime-ink)",
      dot: "var(--color-lime-ink)",
      dotGlow: "none",
    },
  }[variant];

  const inner = (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size === "sm" ? "6px" : "9px",
      padding,
      background: styles.background,
      border: styles.border,
      borderRadius: "999px",
      backdropFilter: variant === "dark" ? "blur(10px)" : undefined,
    }}>
      <span style={{
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: styles.dot,
        boxShadow: styles.dotGlow,
        animation: "pulse-dot 2.4s ease-in-out infinite",
        display: "inline-block",
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize,
        fontStyle: "normal",
        fontWeight: 400,
        color: styles.color,
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}>
        Qualio
      </span>
    </span>
  );

  if (!href) return inner;
  return <Link href={href} style={{ textDecoration: "none", display: "inline-flex" }}>{inner}</Link>;
}
