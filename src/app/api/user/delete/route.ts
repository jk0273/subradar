import { NextRequest } from "next/server";
import { requireAuth, jsonOk, jsonError } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/gmail";

// RGPD Art. 17 — Right to erasure
export async function DELETE(_req: NextRequest) {
  const { user, error } = await requireAuth();
  if (!user) return jsonError(error ?? "Unauthorized", 401);

  const admin = createAdminClient();

  // Get stripe customer + gmail tokens before deletion
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  const { data: emailAccounts } = await admin
    .from("email_accounts")
    .select("access_token, refresh_token")
    .eq("user_id", user.id);

  // 1. Revoke Gmail OAuth tokens
  if (emailAccounts?.length) {
    const oauth2Client = getOAuth2Client();
    for (const account of emailAccounts) {
      try {
        oauth2Client.setCredentials({ access_token: account.access_token });
        await oauth2Client.revokeToken(account.access_token);
      } catch {
        // Token may already be expired — safe to ignore
      }
    }
  }

  // 2. Cancel Stripe subscription
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      // Continue even if Stripe fails
    }
  }

  // 3. Delete all user data (cascade deletes handle related records)
  await admin.auth.admin.deleteUser(user.id);

  return jsonOk({ message: "Compte et données supprimés avec succès." });
}
