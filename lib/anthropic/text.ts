import type Anthropic from "@anthropic-ai/sdk";

/**
 * Récupère le texte d'une réponse Claude.
 *
 * Ne JAMAIS lire `content[0]` directement : sur les modèles récents le
 * raisonnement adaptatif est actif par défaut, et la réponse commence alors par
 * un bloc `thinking`. `content[0].type === "text"` est faux, on récupère une
 * chaîne vide, et l'échec est silencieux — c'est exactement ce qui empêchait la
 * génération des ghost files.
 *
 * Le raisonnement consomme aussi du budget : prévoir un `max_tokens` large
 * (cf. MAX_TOKENS_JSON) et vérifier `stop_reason` avant de parser.
 */
export function textFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * Budget confortable pour une réponse JSON structurée : le raisonnement peut
 * consommer plus de la moitié du budget avant que la réponse ne commence.
 */
export const MAX_TOKENS_JSON = 8000;

/** Vrai si la réponse a été coupée par la limite de tokens. */
export function wasTruncated(message: Anthropic.Message): boolean {
  return message.stop_reason === "max_tokens";
}
