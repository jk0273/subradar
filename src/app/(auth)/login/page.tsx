"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Email ou mot de passe incorrect."); setLoading(false); return; }
    router.push(redirectTo); router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }

  return (
    <div className="card p-8">
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
      <button onClick={handleGoogleLogin} disabled={loading} className="btn-secondary w-full justify-center mb-6 gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </button>
      <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-slate-200" /><span className="text-xs text-slate-400">ou par email</span><div className="flex-1 h-px bg-slate-200" /></div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="toi@exemple.fr" /></div>
        <div><label className="label" htmlFor="password">Mot de passe</label>
          <div className="relative"><input id="password" type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? "Connexion..." : "Se connecter"}</button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">Pas encore de compte ? <Link href="/register" className="text-blue-600 font-medium hover:underline">Créer un compte</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#0f2b5b] rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-blue-300" /></div>
            <span className="font-bold text-[#0f2b5b] text-xl">SubRadar</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Bon retour !</h1>
          <p className="text-slate-500 text-sm mt-1">Connecte-toi a ton compte</p>
        </div>
        <Suspense fallback={<div className="card p-8 text-center text-slate-400">Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
