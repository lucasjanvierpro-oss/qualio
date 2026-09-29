// Drapeaux ronds, dessinés en SVG : les émojis de drapeaux ne s'affichent pas
// sous Windows (deux lettres à la place). Versions simplifiées, lisibles à 36 px.

export type FlagCode = "fr" | "gb" | "it" | "es" | "de" | "cn" | "jp" | "kr" | "ae";

const FLAGS: Record<FlagCode, React.ReactNode> = {
  fr: <><rect width="12" height="36" fill="#1f3fa0" /><rect x="12" width="12" height="36" fill="#fff" /><rect x="24" width="12" height="36" fill="#e1343f" /></>,
  it: <><rect width="12" height="36" fill="#1e9447" /><rect x="12" width="12" height="36" fill="#fff" /><rect x="24" width="12" height="36" fill="#d8323c" /></>,
  de: <><rect width="36" height="12" fill="#1c1c1c" /><rect y="12" width="36" height="12" fill="#dd1f26" /><rect y="24" width="36" height="12" fill="#ffcc00" /></>,
  es: <><rect width="36" height="36" fill="#c8102e" /><rect y="9" width="36" height="18" fill="#ffc400" /><rect x="8" y="14" width="5" height="8" rx="1" fill="#c8102e" opacity=".7" /></>,
  jp: <><rect width="36" height="36" fill="#fff" /><circle cx="18" cy="18" r="7.5" fill="#d7263d" /></>,
  cn: <><rect width="36" height="36" fill="#de2910" /><path d="M10 7l1.4 4.3h4.5l-3.6 2.7 1.4 4.3-3.7-2.7-3.6 2.7 1.4-4.3L4.2 11.3h4.4z" fill="#ffde00" /><circle cx="19" cy="7" r="1.2" fill="#ffde00" /><circle cx="22" cy="11" r="1.2" fill="#ffde00" /><circle cx="22" cy="16" r="1.2" fill="#ffde00" /><circle cx="19" cy="20" r="1.2" fill="#ffde00" /></>,
  kr: <>
    <rect width="36" height="36" fill="#fff" />
    <path d="M11.5 18a6.5 6.5 0 0 1 13 0 3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 0-6.5 0z" fill="#cd2e3a" />
    <path d="M24.5 18a6.5 6.5 0 0 1-13 0 3.25 3.25 0 0 1 6.5 0 3.25 3.25 0 0 0 6.5 0z" fill="#0047a0" />
    <g stroke="#1c1c1c" strokeWidth="1.3"><path d="M6 10l3-3M7.5 11.5l3-3M27 26l3-3M25.5 24.5l3-3M6 26l3 3M25.5 11.5l3-3M27 13l3-3" /></g>
  </>,
  ae: <><rect width="36" height="12" fill="#00843d" /><rect y="12" width="36" height="12" fill="#fff" /><rect y="24" width="36" height="12" fill="#1c1c1c" /><rect width="10" height="36" fill="#e0262f" /></>,
  gb: <>
    <rect width="36" height="36" fill="#1f3a8a" />
    <path d="M0 0l36 36M36 0L0 36" stroke="#fff" strokeWidth="7" />
    <path d="M0 0l36 36M36 0L0 36" stroke="#d52b3a" strokeWidth="2.4" />
    <path d="M18 0v36M0 18h36" stroke="#fff" strokeWidth="10" />
    <path d="M18 0v36M0 18h36" stroke="#d52b3a" strokeWidth="6" />
  </>,
};

export function Flag({ code, size = 36 }: { code: FlagCode; size?: number }) {
  const id = `flag-${code}`;
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
      <defs><clipPath id={id}><circle cx="18" cy="18" r="18" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{FLAGS[code]}</g>
      <circle cx="18" cy="18" r="17.5" fill="none" stroke="rgba(28,22,36,.12)" />
    </svg>
  );
}

export const LANG_FLAGS: { code: FlagCode; live: boolean }[] = [
  { code: "fr", live: true }, { code: "gb", live: true },
  { code: "it", live: false }, { code: "es", live: false }, { code: "de", live: false },
  { code: "cn", live: false }, { code: "jp", live: false }, { code: "kr", live: false }, { code: "ae", live: false },
];
