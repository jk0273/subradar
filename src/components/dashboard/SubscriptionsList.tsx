"use client";

import { useState } from "react";
import { XCircle, CheckCircle, Clock, Copy, Send, AlertTriangle, TrendingDown, Filter } from "lucide-react";
import type { Subscription } from "@/types";

interface Props {
  subscriptions: Subscription[];
  plan: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

type Filter = "all" | "active" | "cancelled";
type SortBy = "amount" | "renewal" | "name";

export default function SubscriptionsList({ subscriptions, plan }: Props) {
  const [filter, setFilter] = useState<Filter>("active");
  const [sortBy, setSortBy] = useState<SortBy>("amount");
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [letter, setLetter] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  const filtered = subscriptions
    .filter((s) => filter === "all" || s.status === filter)
    .sort((a, b) => {
      if (sortBy === "amount") return b.amount_monthly - a.amount_monthly;
      if (sortBy === "name") return a.service_name.localeCompare(b.service_name);
      if (sortBy === "renewal" && a.next_billing_date && b.next_billing_date)
        return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
      return 0;
    });

  async function openCancel(sub: Subscription) {
    setCancelTarget(sub);
    setLetter("");
    setSuccess(false);
    setCopied(false);
    setLetterLoading(true);

    try {
      const res = await fetch(`/api/subscriptions/${sub.id}/letter`, { method: "POST" });
      if (res.ok) {
        const { data } = await res.json();
        setLetter(data.letter);
      }
    } catch {
      setLetter("Erreur lors de la génération. Réessaie.");
    } finally {
      setLetterLoading(false);
    }
  }

  async function handleCancel(method: "copy_paste" | "email_auto") {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/subscriptions/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, letter }),
      });
      if (res.ok) setSuccess(true);
    } finally {
      setCancelling(false);
    }
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canAutoSend = plan === "solo" || plan === "famille";

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
          {(["all", "active", "cancelled"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {f === "all" ? "Tous" : f === "active" ? "Actifs" : "Résiliés"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700">
            <option value="amount">Par montant</option>
            <option value="renewal">Par renouvellement</option>
            <option value="name">Par nom</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      {filter === "active" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-sm text-slate-500 mb-1">Total mensuel</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(filtered.reduce((s, sub) => s + sub.amount_monthly, 0))}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500 mb-1">Total annuel</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(filtered.reduce((s, sub) => s + sub.amount_monthly * 12, 0))}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun abonnement dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((sub) => {
              const daysUntil = sub.next_billing_date
                ? Math.ceil((new Date(sub.next_billing_date).getTime() - Date.now()) / 86_400_000)
                : null;

              return (
                <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-slate-600">
                    {sub.service_name[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{sub.service_name}</span>
                      {sub.status === "cancelled" && (
                        <span className="badge bg-slate-100 text-slate-500">Résilié</span>
                      )}
                      {daysUntil !== null && daysUntil <= 7 && sub.status === "active" && (
                        <span className="badge bg-orange-100 text-orange-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Dans {daysUntil}j
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">{sub.category}</span>
                      {sub.next_billing_date && (
                        <span className="text-xs text-slate-400">
                          · Prochain : {new Date(sub.next_billing_date).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <div className="font-bold text-slate-900">{formatCurrency(sub.amount_monthly)}/mois</div>
                    {sub.frequency !== "monthly" && (
                      <div className="text-xs text-slate-400">
                        {formatCurrency(sub.amount)}/{sub.frequency === "yearly" ? "an" : "sem."}
                      </div>
                    )}
                  </div>

                  {sub.status === "active" && (
                    <button onClick={() => openCancel(sub)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                      Résilier
                    </button>
                  )}
                  {sub.status === "cancelled" && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => { if (e.target === e.currentTarget && !cancelling) setCancelTarget(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Résilier {cancelTarget.service_name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Tu vas économiser{" "}
                <strong className="text-green-600">{formatCurrency(cancelTarget.amount_monthly)}/mois</strong>
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {success ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Résiliation envoyée !</h3>
                  <p className="text-slate-500 text-sm">
                    Ta lettre a été transmise à {cancelTarget.service_name}. L&apos;abonnement sera résilié sous peu.
                  </p>
                </div>
              ) : (
                <>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Lettre de résiliation générée par IA
                  </label>
                  {letterLoading ? (
                    <div className="bg-slate-50 rounded-xl p-6 flex items-center justify-center min-h-40">
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Génération de la lettre...</span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={letter}
                      onChange={(e) => setLetter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 min-h-48 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="La lettre apparaîtra ici..."
                    />
                  )}
                  {cancelTarget.cancellation_email && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      Sera envoyée à : {cancelTarget.cancellation_email}
                    </p>
                  )}
                </>
              )}
            </div>

            {!success && (
              <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
                <button onClick={copyLetter} disabled={letterLoading || !letter}
                  className="btn-secondary justify-center gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? "Copié !" : "Copier la lettre"}
                </button>
                {canAutoSend ? (
                  <button onClick={() => handleCancel("email_auto")} disabled={cancelling || letterLoading || !letter}
                    className="btn-primary justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {cancelling ? "Envoi en cours..." : "Envoyer automatiquement"}
                  </button>
                ) : (
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-700 mb-2">
                      L&apos;envoi automatique est disponible avec le plan Solo (9 €/mois)
                    </p>
                    <a href="/pricing" className="text-xs text-blue-600 font-semibold underline">
                      Passer au plan Solo →
                    </a>
                  </div>
                )}
                <button onClick={() => setCancelTarget(null)} className="text-sm text-slate-400 hover:text-slate-600 text-center">
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
