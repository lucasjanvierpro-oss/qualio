"use client";

/** Imprimer la facture (ou l'enregistrer en PDF depuis la fenêtre d'impression). */
export default function PrintButton({ label = "Télécharger en PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} style={{ font: "inherit", fontWeight: 600, fontSize: 14, padding: "9px 16px", borderRadius: 10, border: 0, background: "#1c1624", color: "#fff", cursor: "pointer" }}>
      {label}
    </button>
  );
}
