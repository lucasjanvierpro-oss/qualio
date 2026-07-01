# ✅ CHECKLIST DE LANCEMENT — Qualio V1 (POC Lacoste)

> **Comment l'utiliser :** coche `[x]` au fur et à mesure. Chaque item a une priorité :
> 🔴 **CRITIQUE** = bloquant pour le POC Lacoste · 🟡 **IMPORTANT** = doit marcher pour la V1 · ⚪ **NICE-TO-HAVE** = peut attendre V2

---

## A. CONFIGURATION & DÉPLOIEMENT

- [ ] 🔴 Projet Supabase actif (⚠️ actuellement **en pause** — le réveiller sur supabase.com avant tout)
- [ ] 🔴 `npx prisma db push` exécuté après réveil de Supabase (ajoute le champ `aiTags`)
- [ ] 🔴 Bucket Supabase Storage `id-documents` créé en mode **privé** (Dashboard → Storage → New bucket)
- [ ] 🔴 Toutes les variables d'environnement remplies dans `.env.local` (voir `.env.local.example`) :
  - [ ] 🔴 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] 🔴 `DATABASE_URL` + `DIRECT_URL`
  - [ ] 🔴 `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
  - [ ] 🔴 `ANTHROPIC_API_KEY` (ghost file, tags, rapport IA, recherche NL — rien ne marche sans)
  - [ ] 🟡 `RESEND_API_KEY` (emails)
  - [ ] 🟡 `WHEREBY_API_KEY` (visio — fallback placeholder sinon)
  - [ ] 🟡 `CRON_SECRET` (générer avec `openssl rand -hex 32`)
  - [ ] 🔴 `NEXT_PUBLIC_APP_URL` (localhost en dev, URL Vercel en prod)
- [ ] 🔴 Code poussé sur GitHub
- [ ] 🔴 Projet importé sur Vercel + variables d'env copiées + déploiement vert
- [ ] 🟡 Webhook Stripe créé pointant sur l'URL de prod (3 événements : `checkout.session.completed`, `account.updated`, `account.application.deauthorized`)
- [ ] 🟡 Vercel Cron visible dans le dashboard Vercel (Settings → Cron Jobs)
- [ ] ⚪ Domaine custom branché

## B. AUTHENTIFICATION

- [ ] 🔴 Inscription marque `/signup/brand` → compte créé → arrive sur le dashboard
- [ ] 🔴 Inscription participant `/signup/participant` → arrive sur l'onboarding
- [ ] 🔴 Connexion `/login` → redirection selon rôle (brand / participant / admin)
- [ ] 🔴 Compte admin créé (script `scripts/make-admin.ts`) et accès à `/admin` OK
- [ ] 🔴 Un participant ne peut PAS accéder à `/brand/*` ni `/admin/*` (et inversement)
- [ ] 🟡 Déconnexion fonctionne
- [ ] ⚪ OAuth LinkedIn configuré dans Supabase (email/password suffit pour le POC)

## C. ONBOARDING PARTICIPANT (7 étapes)

- [ ] 🔴 Étape 1 — Infos personnelles enregistrées
- [ ] 🔴 Étape 2 — Intérêts + affinités marques enregistrés
- [ ] 🔴 Étape 3 — Screener : 3 réponses libres, minimum 30 caractères imposé
- [ ] 🟡 Étape 4 — Réseaux sociaux (optionnel)
- [ ] 🟡 Étape 5 — Disponibilités
- [ ] 🔴 Étape 6 — Upload pièce d'identité → fichier visible dans le bucket Supabase → statut PENDING
- [ ] 🟡 Étape 7 — Stripe Connect (peut être sauté)
- [ ] 🔴 Fin d'onboarding → **ghost file + tags générés automatiquement** (vérifier dans `/admin/participants/[id]`)

## D. CRÉATION D'ÉTUDE (MARQUE — 5 étapes)

- [ ] 🔴 Étapes 1 à 5 complètes, validation des champs obligatoires
- [ ] 🔴 Soumission → étude visible en ACTIVE dans `/admin/studies`
- [ ] 🟡 Email "Nouvelle étude reçue" arrive à l'admin
- [ ] 🟡 Récap étape 5 affiche bien tout ce qui a été saisi

## E. FLUX ADMIN — MATCHING & GESTION

- [ ] 🔴 `/admin/studies` — liste + statuts corrects
- [ ] 🔴 `/admin/studies/[id]` — brief complet + panneau matching
- [ ] 🔴 Shortlister un participant → il apparaît côté marque en "En attente de review"
- [ ] 🔴 Proposer 1-3 créneaux → participant reçoit l'email + les voit dans son espace
- [ ] 🔴 `/admin/participants` — table + filtres (ville, intérêts, statut)
- [ ] 🔴 `/admin/participants/[id]` — profil complet + ghost file (7 scores) + **tags invisibles**
- [ ] 🔴 `/admin/verifications` — document ID affiché (URL signée), Valider / Refuser avec raison
- [ ] 🟡 `/admin/payments` — récompenses listées, virement Stripe déclenchable, voucher assignable
- [ ] 🟡 `/admin/matching` — file d'attente triée par urgence
- [ ] 🟡 Backfill tags : `POST /api/admin/backfill-tags` (relancer jusqu'à `remaining: 0`)

## F. MOTEUR DE RECHERCHE PROFILS (TAGS INVISIBLES)

- [ ] 🔴 `/brand/profiles` — recherche en langage naturel fonctionne (ex : "acheteurs Lacoste jeunes à Paris")
- [ ] 🔴 La recherche matche via les tags invisibles (résultats pertinents, tri par pertinence)
- [ ] 🔴 Les tags ne sont JAMAIS visibles côté marque ni côté participant
- [ ] 🟡 Fallback : si aucun profil ne matche les tags, la recherche élargit automatiquement
- [ ] 🟡 Filtres structurés (ville, type de profil, score min) fonctionnent

## G. FLUX MARQUE — REVIEW & CONFIRMATION

- [ ] 🔴 `/brand/studies/[id]` — onglets par statut + cartes participant
- [ ] 🔴 Accepter → 1 crédit déduit + transaction visible dans `/brand/account`
- [ ] 🔴 Refuser → participant passe en Rejeté (pas de crédit déduit)
- [ ] 🔴 Solde insuffisant → message "Rechargez vos crédits" (pas de crash)
- [ ] 🟡 Chat marque ↔ admin en temps réel (`/brand/messages`)

## H. FLUX PARTICIPANT — INVITATION & ENTRETIEN

- [ ] 🔴 Dashboard : études proposées + prochain entretien visibles
- [ ] 🔴 Choix d'un créneau → confirmation → room Whereby créée → lien visible
- [ ] 🔴 Le nom de la marque n'est PAS visible par le participant
- [ ] 🟡 `/participant/verification` — re-upload après refus fonctionne
- [ ] 🟡 `/participant/wallet` — soldes corrects, révélation voucher avec animation

## I. STRIPE — ARGENT RÉEL

- [ ] 🔴 Achat Pack M en mode test (carte `4242 4242 4242 4242`) → crédits ajoutés automatiquement
- [ ] 🔴 Webhook reçu et traité (vérifier dans Stripe Dashboard → Webhooks → logs)
- [ ] 🟡 Stripe Connect participant : onboarding test → statut passe à "active" au retour
- [ ] 🟡 Virement admin → transfert visible dans Stripe Dashboard → statut PAID
- [ ] 🔴 Passage en clés LIVE (sk_live_) avant le premier vrai paiement Lacoste

## J. EMAILS — RESEND

- [ ] 🟡 Domaine vérifié dans Resend (sinon les emails partent de onboarding@resend.dev)
- [ ] 🔴 Email invitation participant (le plus important du flow)
- [ ] 🔴 Email confirmation entretien avec lien visio (participant + marque)
- [ ] 🟡 Rappels 24h / 1h (cron)
- [ ] 🟡 Email récompense disponible
- [ ] ⚪ Email bienvenue marque

## K. IA — RAPPORT & GHOST FILE & TAGS

- [ ] 🔴 Ghost file généré à la fin de l'onboarding (7 scores + classification + **15-25 tags**)
- [ ] 🔴 Rapport de synthèse généré par l'admin → visible côté marque (LE différenciateur Lacoste)
- [ ] 🟡 Recherche en langage naturel (extraction de filtres + tags Haiku)
- [ ] 🟡 Ghost file jamais visible par la marque ni le participant

## L. POC LACOSTE — SCÉNARIO DE BOUT EN BOUT

- [ ] 🔴 1. Lacoste crée son compte et soumet un brief en < 10 min
- [ ] 🔴 2. Lucas reçoit l'email et ouvre le matching
- [ ] 🔴 3. Lucas shortliste 10-15 profils depuis la base
- [ ] 🔴 4. Lacoste review et accepte 5-8 profils → crédits déduits
- [ ] 🔴 5. Participants reçoivent l'invitation + choisissent leur créneau
- [ ] 🔴 6. Rooms Whereby créées + liens distribués par email
- [ ] 🔴 7. Entretiens réalisés sous 72h
- [ ] 🔴 8. Lucas marque les entretiens "complétés" → récompenses créées
- [ ] 🔴 9. Rapport IA généré et partagé à Lacoste
- [ ] 🔴 10. Récompenses versées aux participants (virement ou voucher)

---

## 🧭 ORDRE DE TEST RECOMMANDÉ

1. **Infrastructure d'abord** (section A) — rien ne marche sans. Commencer par réveiller Supabase + `db push`.
2. **Créer 3 comptes de test** : 1 admin (script), 1 marque, 2-3 participants avec onboarding complet (section B + C).
3. **Vérifier l'IA** : ghost files + tags générés pour les participants test (section K).
4. **Créer une étude test** côté marque (section D).
5. **Dérouler le matching** : shortlist → review marque → créneaux → confirmation (sections E, F, G, H).
6. **Argent en mode test** : achat crédits, Connect, virement (section I).
7. **Emails** : vérifier chaque déclencheur pendant les étapes précédentes (section J).
8. **Répétition générale** : dérouler le scénario L complet avec un faux "Lacoste" et un vrai téléphone/ordinateur différent pour le participant.
9. **Passage en production** : clés Stripe live, domaine Resend vérifié, re-test du paiement.

---
*Dernière mise à jour : juillet 2026 — généré depuis la session de build.*
