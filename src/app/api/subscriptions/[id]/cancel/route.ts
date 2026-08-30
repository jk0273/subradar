import { NextRequest } from "next/server";
import { requireAuth, verifySubscriptionOwner, jsonOk, jsonError } from "@/lib/security";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateCancellationLetter } from "@/lib/claude";
import { resend, sendCancellationConfirmation } from "@/lib/resend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: subscriptionId } = await params;
  const { user, error: authError } = await requireAuth();
  if (!user) return jsonError(authError ?? "Unauthorized", 401);

  // Verify ownership (prevents IDOR attacks)
  const sub = await verifySubscriptionOwner(subscriptionId, user.id);
  if (!sub) return jsonError("Subscription not found", 404);

  const body = await req.json().catch(() => ({}));
  const method = body.method ?? "copy_paste";
  const providedLetter = body.letter as string | undefined;

  const supabase = await createClient();
  const admin = createAdminClient();

  // Get full subscription + user profile
  const [{ data: subscription }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("id", subscriptionId).single(),
    supabase.from("profiles").select("name, plan, total_savings").eq("id", user.id).single(),
  ]);

  if (!subscription) return jsonError("Subscription not found", 404);
  if (subscription.status === "cancelled") return jsonError("Already cancelled", 400);

  // Plan check for auto-send
  if (method === "email_auto" && profile?.plan === "free") {
    return jsonError("L'envoi automatique nécessite le plan Solo", 403);
  }

  // Generate letter if not provided
  let letter = providedLetter;
  if (!letter) {
    letter = await generateCancellationLetter({
      serviceName: subscription.service_name,
      cancellationEmail: subscription.cancellation_email ?? "support@" + subscription.service_name.toLowerCase().replace(/\s/g, "") + ".com",
      userName: profile?.name ?? user.email ?? "Utilisateur",
      userEmail: user.email!,
      amount: subscription.amount,
      currency: subscription.currency,
      frequency: subscription.frequency,
    });
  }

  const amountSaved = subscription.amount_monthly;

  // Record cancellation
  await admin.from("cancellations").insert({
    subscription_id: subscriptionId,
    user_id: user.id,
    letter_text: letter,
    method,
    sent_at: method !== "copy_paste" ? new Date().toISOString() : null,
    amount_saved: amountSaved,
  });

  // Update subscription status
  await admin.from("subscriptions").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  }).eq("id", subscriptionId);

  // Update total savings
  const newTotal = (profile?.total_savings ?? 0) + amountSaved;
  await admin.from("profiles").update({ total_savings: newTotal }).eq("id", user.id);

  // Auto-send email if plan allows
  if (method === "email_auto" && subscription.cancellation_email) {
    try {
      await resend.emails.send({
        from: `${profile?.name ?? "Utilisateur"} <noreply@subradar.fr>`,
        to: subscription.cancellation_email,
        subject: `Résiliation de mon abonnement — ${subscription.service_name}`,
        text: letter,
        replyTo: user.email!,
      });
    } catch (e) {
      console.error("[Cancel] Email send failed:", e);
      // Don't fail the request — letter was still generated
    }
  }

  // Confirmation email to user
  try {
    await sendCancellationConfirmation({
      to: user.email!,
      userName: profile?.name ?? "Utilisateur",
      serviceName: subscription.service_name,
      amountSaved,
      totalSavings: newTotal,
    });
  } catch (e) {
    console.error("[Cancel] Confirmation email failed:", e);
  }

  return jsonOk({ letter, amount_saved: amountSaved, total_savings: newTotal });
}
