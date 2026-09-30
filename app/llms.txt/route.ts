import { llmsTxt } from "@/lib/seo/llms";

// /llms.txt : la présentation de Rarelyst pour les assistants IA.
export const revalidate = 3600;

export async function GET() {
  return new Response(await llmsTxt(false), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
