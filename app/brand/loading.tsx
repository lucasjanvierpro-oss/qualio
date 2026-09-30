import LoupeLoading from "@/components/brand/LoupeLoading";

// Pendant qu'une page de l'espace marque se charge.
export default function Loading() {
  return <LoupeLoading variant="profiles" lines={["On prépare votre espace…", "On rassemble vos profils…"]} />;
}
