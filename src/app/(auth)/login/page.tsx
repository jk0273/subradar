import { Suspense, useState } from "react";
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
          <h1 className="text-2xl font-bold text-slate-900">Bon retour !</h1>
          <p className="text-slate-500 text-sm mt-1">Connecte-toi à ton compte</p>
        </div>
        <Suspense fallback={<div className="card p-8 text-center text-slate-400">Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}