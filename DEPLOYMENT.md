# 🚀 GUIDE DE MISE EN LIGNE — Qualio

> Guide pas-à-pas pour publier le site **maintenant** tout en pouvant continuer à le modifier.
> Temps total estimé : 20-30 minutes.

---

## Comment ça marche (à comprendre une fois)

```
Ton Mac                GitHub                  Vercel
(le code)      →      (sauvegarde         →   (publie le site
                       en ligne)               sur internet)
```

- **Tu modifies le code sur ton Mac** (avec Claude Code, comme d'habitude)
- **Tu "pousses" sur GitHub** (1 commande)
- **Vercel republie automatiquement** le site en ~2 minutes, tout seul

👉 C'est ça la magie : une fois branché, **chaque modification poussée sur GitHub met à jour le site en ligne automatiquement**. Tu ne refais jamais la procédure.

---

## ÉTAPE 1 — Créer le repo GitHub (5 min)

1. Va sur **github.com** → connecte-toi (ou crée un compte)
2. Clique le **+** en haut à droite → **New repository**
3. Nom : `qualio` · Visibilité : **Private** · Ne coche rien d'autre
4. Clique **Create repository**
5. Copie l'URL affichée : `https://github.com/TON_PSEUDO/qualio.git`

Puis dans le terminal (ou demande à Claude Code de le faire) :

```bash
cd /Users/macbookpro2019/qualio
git remote add origin https://github.com/TON_PSEUDO/qualio.git
git push -u origin main
```

> Si GitHub demande un mot de passe : il faut un "Personal Access Token"
> (github.com → Settings → Developer settings → Personal access tokens → Generate new token (classic) → cocher "repo")

## ÉTAPE 2 — Déployer sur Vercel (10 min)

1. Va sur **vercel.com** → **Sign up** → choisis **"Continue with GitHub"** (important : ça lie les deux)
2. Clique **Add New… → Project**
3. Ton repo `qualio` apparaît dans la liste → clique **Import**
4. AVANT de cliquer Deploy : ouvre la section **Environment Variables**
5. Copie-colle **chaque ligne de ton fichier `.env.local`** (nom + valeur, une par une)
   - ⚠️ Change `NEXT_PUBLIC_APP_URL` → mets `https://qualio.vercel.app` (ou le nom que Vercel te donnera)
6. Clique **Deploy** → attends ~2 min → 🎉 ton site est en ligne

## ÉTAPE 3 — Après le premier déploiement (10 min)

1. **Webhook Stripe** (les paiements ne marchent pas sans) :
   - stripe.com → Developers → Webhooks → **Add endpoint**
   - URL : `https://TON-SITE.vercel.app/api/stripe/webhook`
   - Événements à cocher : `checkout.session.completed`, `account.updated`, `account.application.deauthorized`
   - Copie le **Signing secret** (`whsec_...`) → Vercel → Settings → Environment Variables → mets à jour `STRIPE_WEBHOOK_SECRET` → **Redeploy**
2. **URL Stripe du profil marchand** : mets ton URL Vercel dans les infos de ton compte Stripe
3. **Vérifie le cron** : Vercel → ton projet → Settings → **Cron Jobs** → tu dois voir `/api/cron/interview-reminders` toutes les 30 min

---

## 🔁 MODIFIER LE SITE APRÈS LA MISE EN LIGNE

C'est le workflow de tous les jours :

1. Tu travailles avec Claude Code sur ton Mac, comme d'habitude
2. Quand t'es content du résultat, tu demandes à Claude Code :
   > *"Commit et pousse sur GitHub"*
3. Vercel détecte le changement et **republie automatiquement en ~2 min**

Tu peux voir chaque déploiement (et revenir en arrière si besoin) dans Vercel → Deployments.

---

## 🔌 TOUTES LES API À CONNECTER

| API | À quoi ça sert | Ce que tu dois faire | Statut code |
|---|---|---|---|
| **Supabase** | Base de données + comptes + stockage ID | ✅ Déjà configuré. Juste créer le bucket `id-documents` (privé) dans Dashboard → Storage | ✅ Branché |
| **Stripe** | Paiements crédits + virements participants | Créer compte stripe.com → copier les 2 clés dans `.env.local` / Vercel → créer le webhook (étape 3) | ✅ Branché |
| **Anthropic** | Ghost file, tags invisibles, rapport IA, recherche | console.anthropic.com → créer une clé API → `ANTHROPIC_API_KEY` | ✅ Branché |
| **Whereby** | Visio des entretiens | Voir section dédiée ci-dessous ⬇️ | ✅ Branché |
| **Resend** | Tous les emails (invitations, rappels…) | resend.com → créer compte → vérifier ton domaine (ou utiliser leur domaine test) → `RESEND_API_KEY` | ✅ Branché |

> "Branché" = le code sait parler à l'API. Il ne manque **que ta clé** dans les variables d'environnement.

### 🎥 Whereby (visio) — ce qu'il faut faire exactement

1. Va sur **whereby.com/information/embedded** (l'offre API, pas l'offre visio classique)
2. Crée un compte → choisis le plan **Build** (il y a un essai gratuit)
3. Dans le dashboard Whereby → **API keys** → **Generate key**
4. Colle la clé dans `WHEREBY_API_KEY` (`.env.local` en local + Vercel en prod)

**C'est tout.** Le code fait déjà le reste automatiquement :
- Quand un participant confirme son créneau → une room est créée via l'API
- Le participant reçoit le lien invité, la marque reçoit le lien hôte
- La room expire après l'entretien (+1h de marge)
- **Sans clé** : le site marche quand même, avec un lien placeholder (pratique pour tester le reste)

### 📧 Resend (emails) — précision importante

Sans domaine vérifié, Resend n'envoie que vers **ton propre email**. Pour envoyer aux vrais participants :
1. resend.com → Domains → **Add domain** → suis les instructions DNS
2. Si tu n'as pas encore de domaine : achètes-en un (ex : qualio.fr chez OVH/Namecheap, ~10€/an) — tu en auras besoin de toute façon pour faire pro

---

## ⚠️ Rappels avant le POC Lacoste

- [ ] Passer les clés Stripe de `sk_test_` à `sk_live_` (vrais paiements)
- [ ] Domaine Resend vérifié (vrais emails)
- [ ] Bucket `id-documents` créé dans Supabase
- [ ] Dérouler la checklist complète : voir `LAUNCH_CHECKLIST.md`
