import { rlFont } from "@/components/rl/font";

// Les server actions du tunnel tournent sous ce segment : à la finalisation,
// la lecture des liens puis le ghost file (Claude) prennent une à deux minutes
// après la réponse. Sans cette ligne, Vercel les couperait en route.
export const maxDuration = 300;

// Le tunnel participant a sa propre mise en page plein écran : pas l'en-tête
// centré des pages publiques, qui l'enfermait dans une colonne étroite.
export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return <div className={rlFont.className}>{children}</div>;
}
