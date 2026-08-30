import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types";
import SubscriptionsList from "@/components/dashboard/SubscriptionsList";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subscriptions }, { data: profile }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("amount_monthly", { ascending: false }),
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
  ]);

  const subs = (subscriptions ?? []) as Subscription[];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Mes abonnements</h1>
        <p className="text-slate-500 text-sm">
          {subs.filter((s) => s.status === "active").length} actifs ·{" "}
          {subs.filter((s) => s.status === "cancelled").length} résiliés
        </p>
      </div>
      <SubscriptionsList subscriptions={subs} plan={profile?.plan ?? "free"} />
    </div>
  );
}
