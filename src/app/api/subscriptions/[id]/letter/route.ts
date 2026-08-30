import { NextRequest } from "next/server";
import { requireAuth, verifySubscriptionOwner, jsonOk, jsonError } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { generateCancellationLetter } from "@/lib/claude";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: subscriptionId } = await params;
  const { user, error } = await requireAuth();
  if (!user) return jsonError(error ?? "Unauthorized", 401);

  const sub = await verifySubscriptionOwner(subscriptionId, user.id);
  if (!sub) return jsonError("Not found", 404);

  const supabase = await createClient();
  const [{ data: subscription }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("id", subscriptionId).single(),
    supabase.from("profiles").select("name").eq("id", user.id).single(),
  ]);

  if (!subscription) return jsonError("Not found", 404);

  const letter = await generateCancellationLetter({
    serviceName: subscription.service_name,
    cancellationEmail: subscription.cancellation_email ?? "contact@" + subscription.service_name.toLowerCase() + ".com",
    userName: profile?.name ?? user.email ?? "Utilisateur",
    userEmail: user.email!,
    amount: subscription.amount,
    currency: subscription.currency,
    frequency: subscription.frequency,
  });

  return jsonOk({ letter });
}
