/**
 * La confirmation d'adresse email n'est exigée que lorsqu'un vrai expéditeur
 * existe.
 *
 * Sans SMTP configuré, Supabase envoie depuis son adresse partagée : quelques
 * messages par heure au maximum, et une réputation d'expéditeur qui les classe
 * presque toujours en indésirables. Exiger la confirmation dans ces conditions
 * reviendrait à bloquer chaque nouvel inscrit devant une porte fermée, sans
 * qu'il reçoive jamais la clé.
 *
 * Le jour où Resend est branché, il suffit de poser REQUIRE_EMAIL_CONFIRMATION
 * à « true » dans Vercel : le code est déjà là.
 */
export function emailConfirmationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_CONFIRMATION === "true";
}
