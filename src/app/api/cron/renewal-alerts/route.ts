import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRenewalAlert } from "@/lib/resend";

// Triggered daily at 9:00 AM by Vercel Cron
// Protected by CRON_SECRET in middleware

export async function GET(_req: NextRequest) {
  const admin = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];

  // Find subscriptions renewing in exactly 7 days
  const { data: subscriptions, error } = await admin
    .from("subscriptions")
    .select(`
      id, service_name, amount, currency, next_billing_date, user_id,
      profiles!inner(email:id, name)
    `)
    .eq("status", "active")
    .gte("next_billing_date", today)
    .lte("next_billing_date", sevenDaysFromNow);

  if (error) {
    console.error("[Cron] DB error:", error);
    return Response.json({ error: "DB error" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (sub: Record<string, unknown>) => {
      const profile = (sub.profiles as Record<string, unknown>[] | Record<string, unknown>);
      const p = Array.isArray(profile) ? profile[0] : profile;

      if (!p || !p.email) return;

      await sendRenewalAlert({
        to: p.email as string,
        userName: (p.name as string | null) ?? "Utilisateur",
        serviceName: sub.service_name as string,
        amount: sub.amount as number,
        currency: (sub.currency as string) ?? "EUR",
        renewalDate: new Date(sub.next_billing_date as string).toLocaleDateString("fr-FR"),
        subscriptionId: sub.id as string,
      });
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[Cron] Renewal alerts: ${sent} sent, ${failed} failed`);
  return Response.json({ sent, failed, total: subscriptions?.length ?? 0 });
}
