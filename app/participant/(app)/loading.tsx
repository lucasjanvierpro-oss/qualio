import LoupeLoading from "@/components/brand/LoupeLoading";

// Pendant qu'une page de l'espace participant se charge.
export default function Loading() {
  return <LoupeLoading lines={["Un instant…", "On prépare votre espace…"]} />;
}
