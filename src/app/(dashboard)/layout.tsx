import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Zap, LayoutDashboard, CreditCard, Plug, Settings, TrendingDown, LogOut } from "lucide-react";

async function signOut() {
  "use server";
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, plan, total_savings")
    .eq("id", user.id)
    .single();

  const planColors: Record<string, string> = {
    free: "bg-slate-100 text-slate-600",
    solo: "bg-blue-100 text-blue-700",
    famille: "bg-purple-100 text-purple-700",
  };

  const nav = [
    { href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "Tableau de bord" },
    { href: "/subscriptions", icon: <CreditCard className="w-4 h-4" />, label: "Mes abonnements" },
    { href: "/connect", icon: <Plug className="w-4 h-4" />, label: "Connexions" },
    { href: "/savings", icon: <TrendingDown className="w-4 h-4" />, label: "Économies" },
    { href: "/settings", icon: <Settings className="w-4 h-4" />, label: "Paramètres" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0f2b5b] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-300" />
            </div>
            <span className="font-bold text-white text-lg">SubRadar</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {(profile?.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.name ?? "Utilisateur"}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[profile?.plan ?? "free"]}`}>
                {(profile?.plan ?? "free").charAt(0).toUpperCase() + (profile?.plan ?? "free").slice(1)}
              </span>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm w-full">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
