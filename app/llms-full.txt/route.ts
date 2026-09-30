import { llmsTxt } from "@/lib/seo/llms";

// /llms-full.txt : la même chose, avec le texte complet des guides.
export const revalidate = 3600;

export async function GET() {
  return new Response(await llmsTxt(true), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
