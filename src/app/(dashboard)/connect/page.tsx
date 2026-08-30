import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Mail, CheckCircle, Trash2, RefreshCw, Shield, Eye, Lock } from "lucide-react";
import type { EmailAccount } from "@/types";

export default async function ConnectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  const emailAccounts = (accounts ?? []) as EmailAccount[];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Connexions email</h1>
        <p className="text-slate-500 text-sm">Connecte tes boîtes mail pour que SubRadar puisse détecter tes abonnements.</p>
      </div>

      {/* Security note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-blue-900 text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Ton email est entre de bonnes mains
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs text-blue-800">
          <div className="flex items-start gap-1.5">
            <Eye className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Lecture seule — aucune modification possible</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Tes emails ne sont jamais stockés sur nos serveurs</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Accès révocable à tout moment depuis Google</span>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      {emailAccounts.length > 0 && (
        <div className="card mb-6 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Comptes connectés</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {emailAccounts.map((account) => (
              <div key={account.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{account.email}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {account.provider} · Dernier scan : {
                      account.last_scanned_at
                        ? new Date(account.last_scanned_at).toLocaleDateString("fr-FR")
                        : "jamais"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Connecté</span>
                  <Link
                    href={`/api/scan/start?account=${account.id}`}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Relancer un scan"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Link>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Déconnecter">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add account buttons */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm mb-3">Ajouter une boîte mail</h2>

        <a
          href="/api/auth/gmail"
          className="card flex items-center gap-4 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#EA4335"/>
              <path d="M20 4l-8 8-8-8" stroke="#fff" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Gmail (Google)</p>
            <p className="text-sm text-slate-500">Connexion sécurisée via OAuth Google</p>
          </div>
          <span className="text-sm text-blue-600 font-medium">Connecter →</span>
        </a>

        <div className="card flex items-center gap-4 p-5 opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Outlook / Hotmail</p>
            <p className="text-sm text-slate-500">Microsoft Graph API — Disponible bientôt</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Bientôt</span>
        </div>
      </div>
    </div>
  );
}
