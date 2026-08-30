# SubRadar 🎯

> L'IA qui détecte et résilie tes abonnements oubliés — économise jusqu'à 300 €/an

## Stack

- **Frontend** : Next.js 15 (App Router) · TypeScript · Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **IA** : Claude API (claude-sonnet-4-6)
- **Email OAuth** : Gmail API (Google OAuth 2.0)
- **Paiements** : Stripe
- **Emails transac.** : Resend
- **Déploiement** : Vercel + Cron Jobs

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone https://github.com/TON_USERNAME/subradar.git
cd subradar
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute `supabase/migrations/001_init.sql`
3. Active **Google** dans Authentication > Providers
4. Copie l'URL et les clés dans `.env.local`

### 3. Google OAuth (Gmail)

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet → Active **Gmail API** et **Google+ API**
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. URI de redirection autorisé : `http://localhost:3000/api/auth/gmail/callback`
5. Copie `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

### 4. Stripe

1. Crée un compte [stripe.com](https://stripe.com)
2. Crée 2 produits : **SubRadar Solo** (9 €/mois) et **SubRadar Famille** (15 €/mois)
3. Copie les price IDs dans `.env.local`
4. Installe Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
5. Copie le webhook secret généré

### 5. Autres services

| Service | Utilisation | Lien |
|---------|------------|------|
| Anthropic | Claude API | [anthropic.com](https://anthropic.com) |
| Resend | Emails | [resend.com](https://resend.com) |

### 6. Lancer en dev

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (auth)/               # Login / Register
│   ├── (dashboard)/          # App protégée
│   └── api/                  # Routes API
│       ├── auth/gmail/       # OAuth Gmail
│       ├── scan/             # Scanner les emails
│       ├── subscriptions/    # CRUD abonnements
│       ├── stripe/           # Paiements
│       └── cron/             # Jobs automatiques
├── lib/
│   ├── supabase/             # Client Supabase (browser + server)
│   ├── claude.ts             # Intégration IA
│   ├── gmail.ts              # OAuth + scan Gmail
│   ├── stripe.ts             # Paiements Stripe
│   ├── resend.ts             # Emails transactionnels
│   └── security.ts           # Rate limiting, validation, auth
├── components/
│   └── dashboard/            # Composants UI
└── types/                    # Types TypeScript
```

## Sécurité intégrée

- ✅ **Rate limiting** — Protection contre les abus (100 req/10s global, seuils par route)
- ✅ **CSRF Protection** — State OAuth signé avec nonce et timestamp
- ✅ **RLS Supabase** — Chaque utilisateur ne voit que ses données
- ✅ **Auth guard** — Middleware Next.js sur toutes les routes protégées
- ✅ **Validation Zod** — Validation stricte de toutes les entrées API
- ✅ **Security headers** — CSP, HSTS, X-Frame-Options, etc.
- ✅ **IDOR protection** — Double vérification propriété des ressources
- ✅ **Secrets server-only** — Clés sensibles jamais exposées côté client
- ✅ **OAuth lecture seule** — scope `gmail.readonly` uniquement
- ✅ **RGPD** — Suppression complète des données + révocation OAuth (Art. 17)

## Déploiement Vercel

```bash
vercel deploy --prod
```

Configure les variables d'environnement dans le dashboard Vercel.

Le cron job de rappels (9h quotidien) est automatiquement configuré via `vercel.json`.

---

*SubRadar — Fait avec ❤️ et IA en France*
