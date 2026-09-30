// Données structurées (schema.org) pour Google et les assistants IA. Le « < »
// est échappé : un texte ne peut pas refermer la balise script.
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
