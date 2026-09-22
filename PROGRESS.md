# Qualio — Progression du build

## Phase 1 — Foundation ✅ TERMINÉE

| Fichier / Élément | Status |
|---|---|
| Node 22 + npm installés | ✅ |
| Next.js 16 + TypeScript + Tailwind v4 | ✅ `package.json` |
| Prisma schema complet (tous les modèles) | ✅ `prisma/schema.prisma` |
| Client Prisma généré | ✅ `app/generated/prisma/` |
| Supabase client navigateur | ✅ `lib/supabase/client.ts` |
| Supabase client serveur | ✅ `lib/supabase/server.ts` |
| Proxy (auth + routage par rôle) | ✅ `proxy.ts` |
| shadcn/ui initialisé | ✅ `components/ui/button.tsx` |
| Design tokens Qualio (couleurs, typo) | ✅ `app/globals.css` |
| Fonts Instrument Serif + Inter + JetBrains Mono | ✅ `app/layout.tsx` |
| Variables d'environnement template | ✅ `.env.local` |

---

## Phase 2 — Auth ✅ TERMINÉE

| Fichier | Status |
|---|---|
| `/login` — page login partagée | ✅ `app/(public)/login/page.tsx` |
| `/signup/brand` — inscription marque | ✅ `app/(public)/signup/brand/page.tsx` |
| `/signup/participant` — inscription participant | ✅ `app/(public)/signup/participant/page.tsx` |
| Server Actions : création User + BrandProfile | ✅ `app/actions/auth.ts` |
| Server Actions : création User + ParticipantProfile | ✅ `app/actions/auth.ts` |
| LinkedIn OAuth (supabase) | ✅ `app/actions/auth.ts` |
| Callback OAuth `/auth/callback` | ✅ `app/auth/callback/route.ts` |
| Redirection post-login par rôle | ✅ |

---

## Phase 3 — Onboarding participant ✅ TERMINÉE

| Fichier | Status |
|---|---|
| `/participant/onboarding` — wizard 7 étapes | ✅ `app/participant/onboarding/page.tsx` |
| Étape 1 : Infos de base | ✅ `steps/StepBasicInfo.tsx` |
| Étape 2 : Profil & intérêts | ✅ `steps/StepInterests.tsx` |
| Étape 3 : Questions screener | ✅ `steps/StepScreener.tsx` |
| Étape 4 : Réseaux sociaux | ✅ `steps/StepSocials.tsx` |
| Étape 5 : Disponibilités | ✅ `steps/StepAvailability.tsx` |
| Étape 6 : Vérification ID | ✅ `steps/StepVerification.tsx` |
| Étape 7 : Stripe Connect | ✅ `steps/StepStripe.tsx` |
| Server Action : persistance profil | ✅ `app/actions/onboarding.ts` |

---

## Phase 4 — Création d'étude (Brand) ✅ TERMINÉE

| Fichier | Status |
|---|---|
| Layout sidebar brand | ✅ `app/brand/(app)/layout.tsx` |
| `/brand/studies` — liste des études | ✅ `app/brand/studies/page.tsx` |
| `/brand/studies/new` — formulaire 5 étapes | ✅ `app/brand/studies/new/page.tsx` |
| `/brand/studies/[id]` — détail étude + review candidats | ✅ |

---

## Phase 5 — Admin Core ✅ TERMINÉE

| Fichier | Status |
|---|---|
| Layout admin (dark theme) | ✅ `app/admin/layout.tsx` |
| `/admin` — vue d'ensemble | ✅ `app/admin/page.tsx` |
| `/admin/studies` — liste toutes études | ✅ `app/admin/studies/page.tsx` |
| `/admin/participants` — table searchable + filtres | ✅ `app/admin/participants/page.tsx` |
| `/admin/matching` — queue de matching wizard-of-oz | ✅ `app/admin/matching/page.tsx` |
| `/admin/verifications` — file de vérification ID | ✅ `app/admin/verifications/page.tsx` |
| `/admin/payments` — gestion récompenses | ✅ `app/admin/payments/page.tsx` |

---

## Phase 6 — Review Brand ✅ TERMINÉE
`app/brand/studies/[id]/StudyDetailClient.tsx` — onglets par statut, accept/reject, déduction de crédits.

## Phase 7 — Messaging ✅ TERMINÉE
`app/brand/messages/RealtimeChatBrand.tsx` — chat temps réel marque ↔ admin (Supabase Realtime).

## Phase 8 — Stripe ✅ TERMINÉE (code)
`app/api/stripe/*`, `app/api/webhooks/stripe`, `lib/stripe/` — achat de crédits + Connect + webhook.

## Phase 9 — Rewards ✅ TERMINÉE
`app/api/rewards/*`, `app/participant/(app)/wallet` — virement Stripe ou voucher.

## Phase 10 — Email + Video ✅ TERMINÉE
`lib/resend/` (emails transactionnels), `lib/whereby/` (visio embarquée),
`app/api/webhooks/whereby` → transcription native Whereby → rapport IA auto.
Cron de rappels : `app/api/cron/interview-reminders` (déclaré dans `vercel.json`, 9h chaque jour).

## Phase 11 — Landing & Pricing ✅ TERMINÉE
`app/page.tsx`, `app/(public)/pricing`, SEO (`app/robots.ts`, `app/sitemap.ts`).

---

## Phase 12 — Tunnel de qualification (nouveau signup participant) ✅ TERMINÉE

Remplace l'onboarding 7 étapes par un tunnel unique en 12 écrans à `/signup/participant`.

| Élément | Fichier |
|---|---|
| Tunnel 12 écrans, FR/EN, brouillon localStorage | `app/(public)/signup/participant/page.tsx` |
| Écrans : account → gain → demographics → universes → profile_type → behavioral → expert → level → badges → logistics → charter → final | idem |
| Server actions : création compte, sauvegarde progressive, finalisation | `app/actions/funnel.ts` |
| Scoring + niveaux de profil | `lib/onboarding/scoring.ts`, `lib/onboarding/types.ts` |
| Questions expertes à la voix (transcription + synthèse) | `components/onboarding/VoiceInput.tsx`, `app/api/onboarding/synthesize-voice` |
| Badges : upload CV/portfolio, scan LinkedIn | `components/onboarding/BadgeUpload.tsx`, `app/api/onboarding/upload-doc`, `scan-linkedin` |
| Analyse IA du CV/portfolio → `cvAnalysis` | `app/api/onboarding/analyze-document` |
| Ghost file régénéré depuis les données du tunnel + résumé visible marques | `app/api/participants/[id]/generate-ghost-file` |

---

## Phase 13 — Reprise & réparation du pipeline ✅ 16 septembre 2026

Audit complet du code, du build et de l'infra. Build de production ✅ vert.

### 🔴 Découverte majeure : le projet Supabase n'existe plus

`zklwmeismckoyacacwoy.supabase.co` → **NXDOMAIN**. Pas en pause : supprimé
pendant les deux mois d'inactivité. Base, auth, bucket storage : tout est parti.
Le schéma Prisma (`prisma/schema.prisma`, 508 lignes) est intact — il suffit de
le repousser sur un projet neuf.

### Corrigé dans cette session

| Problème | Correction |
|---|---|
| 🔴 **Ghost file jamais généré.** `completeFunnel` faisait un `fetch` serveur→serveur vers `/api/participants/[id]/generate-ghost-file` ; sans cookie, `proxy.ts` le redirigeait vers `/login` (307 reproduit en local). Aucun `aiTags`, aucun `brandSummary`, aucun score — donc `/brand/profiles` et tout le matching tournaient à vide. | Logique extraite dans `lib/participants/ghostFile.ts`, appelée directement via `after()` (Next 16). La route API reste pour la régénération manuelle et gagne un contrôle d'accès (admin ou propriétaire) qu'elle n'avait pas. |
| 🔴 **Routes IA sans contrôle de rôle.** `proxy.ts` protège `/admin` mais pas `/api/admin` — n'importe quel compte connecté pouvait appeler `ai-match` et `ai-batch-match`. | `lib/auth/guards.ts` (`requireAdmin`, `requireBrand`), appliqué à `ai-match`, `ai-batch-match` et `/api/profiles/search` (réservé aux marques). |
| 🟡 **Double chemin d'onboarding.** L'ancien wizard 7 étapes était encore la cible de 8 redirections. | Wizard et `app/actions/onboarding.ts` supprimés ; toutes les redirections pointent sur `/signup/participant`. |
| 🟡 **Le tunnel mentait sur la vérification email.** Le compte est auto-confirmé par l'admin API, mais un bandeau orange et l'écran final réclamaient une vérification inexistante. | Bandeau neutre « compte créé », écran final « votre profil est actif ». |
| 🟡 **Niveau affiché dès l'écran 0** (« 🥉 Bronze » avant la première réponse). | Le niveau n'apparaît qu'à partir de l'écran qui le révèle. |
| 🟡 `normalizeTag` dupliqué en 3 exemplaires, avec risque de divergence entre tags stockés et tags recherchés. | Une seule implémentation, exportée depuis `lib/participants/ghostFile.ts`. |
| 🟡 `completeFunnel` ne persistait que le score et la charte. | Mapping partagé `profileDataFromState()` : la finalisation réécrit tout l'état. |
| 🟡 Liste des écrans dupliquée entre la page et les actions. | `FUNNEL_SCREENS` / `FUNNEL_LAST_STEP` dans `lib/onboarding/types.ts`. |

### Ajouté

- `scripts/seed-panel.ts` — 8 participants de démonstration avec de **vraies**
  réponses qualitatives (le ghost file ne produit rien d'exploitable sur du
  lorem ipsum), 2 marques créditées, 1 étude active. Crée aussi les comptes
  Supabase. `--reset` pour repartir de zéro.
- `scripts/generate-ghost-files.ts` — génère les ghost files manquants
  (`--all` pour tout régénérer). C'est cette étape qui rend un profil visible
  côté marque.

---

## Phase 14 — Base vivante & appels Claude réparés ✅ 17 septembre 2026

### Le projet Supabase est de retour, et les données d'origine aussi

Lucas a restauré le projet (`zklwmeismckoyacacwoy`, `ACTIVE_HEALTHY`, eu-west-1).
Le NXDOMAIN de la veille était bien la mise en pause. Les 14 tables **et** les
3 comptes du 9 juin ont survécu (`lucas.janvierpro@gmail.com` ADMIN,
`lucas.janvier@essec.edu` BRAND, `lucas.janvier28600@gmail.com` PARTICIPANT).
Le `rows: 0` de `list_tables` était une estimation périmée, pas une base vide.

### 🔴 Le réseau local bloque PostgreSQL

Diagnostic : le TCP s'ouvre sur 5432/6543, le paquet `SSLRequest` part, **aucune
réponse**. Un tenant valide et un tenant inventé échouent identiquement — ce
n'est ni Supabase ni les identifiants, c'est un pare-feu (wifi ESSEC).
En plus, `db.<ref>.supabase.co` est désormais **IPv6 uniquement** et cette
machine n'a pas de route IPv6 vers Supabase.

**Conséquence : Prisma ne peut pas se connecter depuis ce réseau.**
`npm run dev` ne sert donc à rien ici tant qu'on n'a pas changé de réseau.
Contournements en place : tout passe par HTTPS (MCP Supabase + PostgREST).

### 🔴 Tous les appels Claude étaient cassés — deux bugs superposés

| Bug | Détail |
|---|---|
| **Le texte n'était jamais lu.** Partout : `content[0].type === "text" ? … : ""`. Or le raisonnement adaptatif est actif par défaut sur les modèles récents : la réponse commence par un bloc `thinking`, donc `content[0]` n'est pas du texte et on récupérait **une chaîne vide**. Échec silencieux, 10 sites concernés. | `lib/anthropic/text.ts` → `textFromMessage()` filtre les blocs texte. Appliqué aux 10 appels. |
| **Budget de tokens trop court.** Ghost file à `max_tokens: 2048` alors que le raisonnement en consommait 1225 → `stop_reason: max_tokens`, JSON tronqué. | `MAX_TOKENS_JSON = 8000` pour les réponses JSON ; rapports 4000 → 16000 ; analyse de document 512 → 4000. |
| **Types instables en sortie.** Le modèle renvoyait parfois un score décimal (8.5) pour une colonne entière → `22P02` à l'insertion, de façon non déterministe. | `parseGhostFile()` coerce : scores en entiers 0-10, listes garanties, chaînes garanties. |

### Structure

- `lib/participants/ghostFilePrompt.ts` — partie **pure** : prompt, extraction,
  parsing, normalisation des tags. Aucun accès base, aucun SDK.
- `lib/participants/ghostFile.ts` — orchestration Prisma (chemin applicatif).
- `scripts/ghost-files-via-api.ts` — orchestration HTTPS (chemin de secours).
  Les deux partagent le prompt : une divergence produirait des tags
  incompatibles avec le moteur de recherche.
- `scripts/panel-data.json` — source unique du panel de démo.
- `scripts/seed-via-api.mjs` — sème en HTTPS (API admin auth + PostgREST).
- `scripts/seed-panel.ts` — même chose via Prisma, quand le réseau le permet.

### État de la base

13 users · 3 marques · 10 participants · 2 études · **8 ghost files complets**
(24-26 tags chacun, `brandSummary` rempli, scores 8-9/10).

Test de matching validé en SQL : la requête « styliste ou DA quiet luxury,
Paris ou Bordeaux » fait remonter Amina D. (3 signaux) puis Sofia L. (3 signaux).
**Le cœur du produit fonctionne pour la première fois.**

Comptes de démo : mot de passe dans `SEED_PASSWORD` (`.env.local`, jamais dans le dépôt).

---

## 🔴 Problèmes identifiés, PAS encore traités

1. **Réseau local bloquant Postgres** → soit changer de réseau (partage de
   connexion téléphone) pour faire tourner `npm run dev`, soit déployer sur
   Vercel où le blocage n'existe pas.
2. **RLS désactivé sur les 14 tables.** Signalé par l'advisor Supabase en
   niveau *critique* : avec la clé anon (publique, embarquée dans le bundle
   navigateur) n'importe qui peut lire et modifier toutes les lignes — emails,
   profils, ghost files, références de pièces d'identité. L'app lit via Prisma
   (rôle `postgres`, non soumis au RLS), donc activer RLS ne casserait
   **qu'une** chose : `hooks/useMessages.ts`, seul endroit qui passe par
   supabase-js sur une table (`messages`, avec Realtime). Il faut donc activer
   RLS partout **et** écrire une policy sur `messages`. À faire avant toute
   donnée réelle de participant.
3. **Deux grilles tarifaires contradictoires** — 65 €/55 € affichés,
   15 €/13 €/12 € facturés par `create-credit-checkout`.
4. **Personne ne paye les récompenses participants** — versées depuis le solde
   Rarelyst, jamais refacturées à la marque.
5. **La landing promet « identité vérifiée »** alors que le tunnel ne demande
   jamais de pièce d'identité.
6. **Modèle commercial non tranché** — session de réflexion dédiée à prévoir.
7. **54 occurrences de « Qualio »** dans l'UI, dont `support@qualio.io`.
8. **Lint : ~104 problèmes**, surtout cosmétiques, mais 7
   `react-hooks/set-state-in-effect` et 6 `react-hooks/purity` réels.

---

## 📍 POINT DE REPRISE — 17 septembre 2026

**Direction visuelle tranchée : utilitaire.** Maquette de référence publiée
(artifact « L'index Rarelyst ») : la landing *est* le moteur de recherche,
une seule couleur (orange) qui ne signifie que « ça correspond », Instrument
Sans + DM Mono, aucun dégradé ni emoji-icône.

### Prochaines étapes

1. Porter la direction utilitaire dans le code : design system réel
   (tokens + primitives) dans `globals.css`, puis `app/page.tsx`. C'est la
   suppression des ~400 lignes de `style={{}}` inline qui tuera le « ça fait IA ».
2. Refonte du tunnel candidat : promesse et preuve **avant** la création de
   compte, vérifications réelles, scoring côté serveur.
3. Activer le RLS + policy `messages`.
4. Session modèle commercial → puis pricing et parcours marque.
5. ~~Déploiement Vercel~~ — **déjà fait** : le site tourne sur https://www.rarelyst.co
   depuis longtemps. Il faut seulement pousser les corrections (commit + push).

> Scripts utiles :
> - `node --env-file=.env.local scripts/seed-via-api.mjs` — panel de démo (HTTPS)
> - `npx tsx --env-file=.env.local scripts/ghost-files-via-api.ts [--all]` — ghost files (HTTPS)
> - Équivalents Prisma : `scripts/seed-panel.ts`, `scripts/generate-ghost-files.ts`
