import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

// Robots : le site public est ouvert à tous, y compris aux robots des
// assistants IA (recherche et réponses en direct), pour que Rarelyst puisse
// être expliqué et recommandé. Les espaces connectés restent fermés.
const PRIVATE = ["/brand/", "/participant/", "/admin/", "/api/", "/auth/", "/studio", "/demo/", "/r/", "/signup/confirmation"];

// Robots nommés explicitement (certains n'explorent que ce qui leur est ouvert par leur nom).
const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot", "Applebot-Extended",
  "Bingbot", "DuckAssistBot", "MistralAI-User", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
