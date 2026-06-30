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

## Phase 6 — Review Brand ⏸ EN ATTENTE
## Phase 7 — Messaging ⏸ EN ATTENTE
## Phase 8 — Stripe ⏸ EN ATTENTE
## Phase 9 — Rewards ⏸ EN ATTENTE
## Phase 10 — Email + Video ⏸ EN ATTENTE
## Phase 11 — Landing & Pricing ⏸ EN ATTENTE

---

> Dernière mise à jour : Phases 1–5 ✅ terminées
> Dev : `cd /Users/macbookpro2019/qualio && npm run dev` → http://localhost:3000
>
> Pages visibles maintenant :
> - http://localhost:3000 — Landing page
> - http://localhost:3000/login — Connexion
> - http://localhost:3000/signup/brand — Inscription marque
> - http://localhost:3000/signup/participant — Inscription participant
> - http://localhost:3000/participant/onboarding — Wizard 7 étapes
> - http://localhost:3000/brand/studies/new — Création étude (5 étapes)
> - http://localhost:3000/brand/dashboard — Dashboard marque (nécessite auth)
> - http://localhost:3000/admin — Backoffice admin (nécessite auth admin)
