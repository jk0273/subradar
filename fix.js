const fs = require('fs');

const login = `"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Email ou mot de passe incorrect."); setLoading(false); return; }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback" } });
  }

  return (
    <div className="card p-8">
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <button onClick={handleGoogle} disabled={loading} className="btn-secondary w-full justify-center mb-4">
        Continuer avec Google
      </button>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="text-center text-sm mt-4">
        Pas de compte? <Link href="/register" className="text-blue-600">Creer un compte</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#0f2b5b] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-300" />
            </div>
            <span className="font-bold text-[#0f2b5b] text-xl">SubRadar</span>
          </Link>
          <h1 className="text-2xl font-bold">Bon retour!</h1>
        </div>
        <Suspense fallback={<div>Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/app/(auth)/login/page.tsx', login);
console.log('Login OK!');