import Link from "next/link";
import { Zap, Shield, Bell, TrendingDown, Check, ArrowRight, Mail, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0f2b5b] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-300" />
            </div>
            <span className="font-bold text-[#0f2b5b] text-lg">SubRadar</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Connexion</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#0f2b5b] text-white pt-20 pb-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-200 rounded-full px-4 py-1.5 text-sm mb-6">
            <Star className="w-3.5 h-3.5 fill-current" />
            62% des gens ont au moins 1 abonnement oublié
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            Retrouve les{" "}
            <span className="text-blue-300">300 €/an</span>
            <br />que tu ne savais pas perdre
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            SubRadar scanne ta boîte mail, détecte tous tes abonnements actifs et les résilie en 1 clic.
            Zéro effort. Résultats immédiats.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-3.5">
              Scanner mes emails gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5 bg-transparent text-white border-blue-400 hover:bg-blue-900/30">
              Voir comment ça marche
            </a>
          </div>
          <p className="mt-4 text-blue-300 text-sm">
            ✓ Gratuit pour commencer &nbsp;·&nbsp; ✓ Lecture seule &nbsp;·&nbsp; ✓ RGPD
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { num: "300 €", label: "économisés en moyenne par an" },
            { num: "62%", label: "des gens ont un abonnement oublié" },
            { num: "< 60s", label: "pour scanner 12 mois d'emails" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{s.num}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Comment ça marche</h2>
            <p className="text-slate-500 text-lg">En 3 étapes, tu récupères le contrôle total de tes abonnements</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <Mail className="w-6 h-6" />, title: "Connecte ta boîte mail", desc: "En un clic via Google OAuth. SubRadar obtient un accès en lecture seule. Aucun email stocké." },
              { step: "02", icon: <Zap className="w-6 h-6" />, title: "L'IA détecte tout", desc: "Notre IA analyse tes emails et identifie automatiquement tous tes abonnements actifs en moins d'une minute." },
              { step: "03", icon: <TrendingDown className="w-6 h-6" />, title: "Résilie en 1 clic", desc: "Une lettre de résiliation légale générée par IA, envoyée automatiquement. Tu ne fais littéralement rien." },
            ].map((item) => (
              <div key={item.step} className="card p-8">
                <div className="text-xs font-bold text-blue-400 tracking-widest mb-4">{item.step}</div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Tout ce dont tu as besoin</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "100% sécurisé & RGPD", desc: "Accès lecture seule. Tes emails ne sont jamais stockés. Données hébergées en Europe. Suppression en 1 clic." },
              { icon: <Bell className="w-5 h-5" />, title: "Alertes avant les renouvellements", desc: "Reçois un email 7 jours avant chaque prélèvement. Tu décides de garder ou résilier avant d'être débité(e)." },
              { icon: <Zap className="w-5 h-5" />, title: "Lettres de résiliation IA", desc: "Une lettre professionnelle générée automatiquement par IA, conforme au droit français. Envoi automatique inclus." },
              { icon: <TrendingDown className="w-5 h-5" />, title: "Compteur d'économies", desc: "Vois en temps réel combien tu as récupéré. Le montant affiché motive à continuer d'optimiser son budget." },
            ].map((f) => (
              <div key={f.title} className="card p-6 flex gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Tarifs simples et transparents</h2>
            <p className="text-slate-500">Le plan Solo se rembourse dès le premier abonnement résilié.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Gratuit", price: "0 €", period: "/mois", features: ["1 boîte mail", "Scan des 3 derniers mois", "5 abonnements max", "Génération de lettres"], cta: "Commencer gratuitement", href: "/register", highlight: false },
              { name: "Solo", price: "9 €", period: "/mois", features: ["2 boîtes mail", "Scan 12 mois illimité", "Résiliations automatiques", "Alertes de renouvellement", "Compteur d'économies"], cta: "Essayer Solo", href: "/register?plan=solo", highlight: true },
              { name: "Famille", price: "15 €", period: "/mois", features: ["5 boîtes mail", "Mode foyer unifié", "Tout le plan Solo", "Rapport mensuel PDF", "Support prioritaire"], cta: "Essayer Famille", href: "/register?plan=famille", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`card p-8 relative ${plan.highlight ? "border-blue-500 border-2 shadow-lg shadow-blue-100" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.highlight ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "SubRadar stocke-t-il mes emails ?", a: "Non. Nous utilisons uniquement un accès en lecture seule à ta boîte mail. Seules les données extraites (nom du service, montant, date) sont stockées. Aucun email complet n'est conservé sur nos serveurs." },
              { q: "Est-ce que c'est vraiment sécurisé ?", a: "Oui. Connexion via OAuth officiel Google/Microsoft (aucun mot de passe partagé). Données hébergées sur des serveurs européens (RGPD). Toutes les connexions sont chiffrées (HTTPS). Accès révocable à tout moment depuis ton compte Google." },
              { q: "Quels types d'abonnements sont détectés ?", a: "Netflix, Spotify, Adobe, Apple, Amazon, Gym, VPN, logiciels SaaS, applications mobiles, presse en ligne, cloud, gaming... Tout service qui envoie un email de renouvellement ou de confirmation de paiement." },
              { q: "La lettre de résiliation est-elle légalement valable ?", a: "La lettre générée par SubRadar est conforme au droit français et mentionne la résiliation immédiate et le droit RGPD à l'oubli. Pour les cas complexes (assurance, téléphonie), nous générons également les instructions pour l'envoi en lettre recommandée." },
              { q: "Puis-je supprimer mes données ?", a: "Oui, à tout moment. Dans Paramètres > Compte > Supprimer mon compte, toutes tes données sont supprimées définitivement et les accès OAuth révoqués dans les 24 heures." },
            ].map((faq) => (
              <details key={faq.q} className="card p-6 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-slate-400 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0f2b5b] py-20 px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Commence à économiser maintenant
        </h2>
        <p className="text-blue-200 mb-8 text-lg">Premier scan gratuit. Résultats en moins d'une minute.</p>
        <Link href="/register" className="btn-primary text-base px-10 py-4">
          Scanner ma boîte mail gratuitement
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0f2b5b] rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-300" />
            </div>
            <span className="font-bold text-white">SubRadar</span>
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/legal/mentions" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
          <p className="text-slate-500 text-sm">© 2026 SubRadar. Fait avec ❤️ en France.</p>
        </div>
      </footer>
    </div>
  );
}
