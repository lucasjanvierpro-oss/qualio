import LoupeLoading from "@/components/brand/LoupeLoading";

// Pendant qu'une page de l'admin se charge.
export default function Loading() {
  return <LoupeLoading tone="dark" variant="profiles" lines={["Chargement…"]} />;
}
