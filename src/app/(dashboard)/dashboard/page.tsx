import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingDown, CreditCard, AlertCircle, Plus, Zap, Bell } from "lucide-react";
import type { Subscription } from "@/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    streaming: "bg-red-100 text-red-700",
    software: "bg-blue-100 text-blue-700",
    fitness: "bg-green-100 text-green-700",
    cloud: "bg-sky-100 text-sky-700",
    gaming: "bg-purple-100 text-purple-700",
    music: "bg-pink-100 text-pink-700",
    other: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`badge ${colors[category] ?? colors.other}`}>
      {category}
    </span>
  );
}

function getRenewalStatus(date: string | null) {
  if (!date) return null;
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return { label: "Expiré", color: "text-red-600" };
  if (days <= 7) return { label: `Dans ${days}j`, color: "text-orange-600" };
  return { label: `Dans ${days}j`, color: "text-slate-400" };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscriptions }, { data: emailAccounts }] = await Promise.all([
    supabase.from("profiles").select("name, plan, total_savings").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").order("amount_monthly", { ascending: false }),
    supabase.from("email_accounts").select("id, email, provider, last_scanned_at").eq("user_id", user.id),
  ]);

  const subs = (subscriptions ?? []) as Subscription[];
  const totalMonthly = subs.reduce((s, sub) => s + (sub.amount_monthly ?? 0), 0);
  const renewingSoon = subs.filter((s) => {
    if (!s.next_billing_date) return false;
    const days = Math.ceil((new Date(s.next_billing_date).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 7;
  });

  const hasAccounts = (emailAccounts?.length ?? 0) > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour {profile?.name ?? "👋"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {hasAccounts ? `${subs.length} abonnement${subs.length > 1 ? "s" : ""} actif${subs.length > 1 ? "s" : ""} détecté${subs.length > 1 ? "s" : ""}` : "Connecte ta boîte mail pour commencer"}
          </p>
        </div>
        {hasAccounts && (
          <Link href="/subscriptions" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Nouveau scan
          </Link>
        )}
      </div>

      {/* No account connected CTA */}
      {!hasAccounts && (
        <div className="card p-10 text-center mb-8 border-dashed border-2">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Connecte ta boîte mail pour commencer</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            SubRadar va scanner tes emails et détecter tous tes abonnements actifs en moins d'une minute.
            Accès lecture seule, 100% sécurisé.
          </p>
          <Link href="/connect" className="btn-primary">
            Connecter Gmail →
          </Link>
        </div>
      )}

      {/* Stats */}
      {hasAccounts && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Dépense mensuelle</span>
                <CreditCard className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalMonthly)}</div>
              <div className="text-xs text-slate-400 mt-1">{formatCurrency(totalMonthly * 12)} par an</div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Économies réalisées</span>
                <TrendingDown className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(profile?.total_savings ?? 0)}</div>
              <div className="text-xs text-slate-400 mt-1">grâce à SubRadar</div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Renouvellements proches</span>
                <Bell className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{renewingSoon.length}</div>
              <div className="text-xs text-slate-400 mt-1">dans les 7 prochains jours</div>
            </div>
          </div>

          {/* Renewal alerts */}
          {renewingSoon.length > 0 && (
            <div className="card p-5 mb-6 border-orange-200 bg-orange-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-800 text-sm">
                  {renewingSoon.length} renouvellement{renewingSoon.length > 1 ? "s" : ""} dans 7 jours
                </span>
              </div>
              <div className="space-y-2">
                {renewingSoon.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-orange-900">{sub.service_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-700 font-bold">{formatCurrency(sub.amount)}</span>
                      <Link href={`/subscriptions?cancel=${sub.id}`} className="text-xs bg-orange-200 hover:bg-orange-300 text-orange-800 px-2 py-1 rounded-md transition-colors font-medium">
                        Gérer →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions list */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Abonnements actifs</h2>
              <Link href="/subscriptions" className="text-sm text-blue-600 hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {subs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Aucun abonnement détecté. Lance un scan pour commencer.
                </div>
              ) : (
                subs.slice(0, 8).map((sub) => {
                  const renewal = getRenewalStatus(sub.next_billing_date);
                  return (
                    <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                      {/* Logo */}
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-600">
                        {sub.service_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 text-sm">{sub.service_name}</span>
                          <CategoryBadge category={sub.category ?? "other"} />
                        </div>
                        {renewal && (
                          <span className={`text-xs ${renewal.color}`}>{renewal.label}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900 text-sm">{formatCurrency(sub.amount_monthly)}/mois</div>
                        {sub.frequency !== "monthly" && (
                          <div className="text-xs text-slate-400">
                            {formatCurrency(sub.amount)}/{sub.frequency === "yearly" ? "an" : "sem."}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
