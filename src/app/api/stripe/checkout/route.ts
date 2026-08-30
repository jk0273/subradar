import { NextRequest } from "next/server";
import { requireAuth, parseBody, checkoutSchema, jsonOk, jsonError } from "@/lib/security";
import { stripe, getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (!user) return jsonError(error ?? "Unauthorized", 401);

  const parsed = await parseBody(req, checkoutSchema);
  if ("error" in parsed) return jsonError(parsed.error, parsed.status);

  const { price_id } = parsed.data;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  try {
    const customerId = profile?.stripe_customer_id
      ?? await getOrCreateStripeCustomer(user.id, user.email!, profile?.name ?? undefined);

    const session = await createCheckoutSession(customerId, price_id, user.id);

    return jsonOk({ url: session.url });
  } catch (err) {
    console.error("[Stripe Checkout]", err);
    return jsonError("Payment initialization failed", 500);
  }
}
