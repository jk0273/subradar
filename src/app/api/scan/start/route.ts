import { NextRequest } from "next/server";
import { requireAuth, jsonOk, jsonError } from "@/lib/security";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchSubscriptionEmails } from "@/lib/gmail";
import { processEmailBatch } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (!user) return jsonError(authError ?? "Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const emailAccountId = body.email_account_id as string;
  if (!emailAccountId) return jsonError("email_account_id required", 400);

  const supabase = await createClient();

  // Verify account belongs to user
  const { data: account } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", emailAccountId)
    .eq("user_id", user.id)
    .single();

  if (!account) return jsonError("Email account not found", 404);

  // Check plan limits (free: max 1 scan per account)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const { count: scanCount } = await supabase
    .from("scan_jobs")
    .select("*", { count: "exact", head: true })
    .eq("email_account_id", emailAccountId)
    .eq("status", "completed");

  if (profile?.plan === "free" && (scanCount ?? 0) >= 1) {
    return jsonError("Plan gratuit : 1 scan par compte. Passe au plan Solo pour des scans illimités.", 403);
  }

  // Create scan job
  const { data: job } = await supabase
    .from("scan_jobs")
    .insert({
      email_account_id: emailAccountId,
      user_id: user.id,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!job) return jsonError("Could not create scan job", 500);

  // Run scan asynchronously (fire and forget)
  // In production, use a queue (Supabase Edge Functions or Vercel Background Functions)
  runScan(job.id, account, user.id, profile?.plan ?? "free").catch((e) =>
    console.error("[Scan] Error:", e)
  );

  return jsonOk({ job_id: job.id, status: "running" });
}

async function runScan(
  jobId: string,
  account: { id: string; access_token: string; refresh_token: string | null },
  userId: string,
  plan: string
) {
  const admin = createAdminClient();
  const supabase = await createClient();
  const maxEmails = plan === "free" ? 100 : 300;

  try {
    // Fetch emails
    const emails = await fetchSubscriptionEmails(
      account.access_token,
      account.refresh_token ?? "",
      maxEmails
    );

    await admin.from("scan_jobs").update({ emails_processed: emails.length }).eq("id", jobId);

    let subscriptionsFound = 0;

    // Process with Claude AI
    for await (const result of processEmailBatch(emails)) {
      if (!result.is_subscription || !result.service_name) continue;
      if ((result.confidence ?? 0) < 0.7) continue;

      // Check for duplicates
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("service_name", result.service_name)
        .eq("status", "active")
        .maybeSingle();

      if (existing) continue; // Skip duplicate

      await admin.from("subscriptions").insert({
        user_id: userId,
        email_account_id: account.id,
        service_name: result.service_name,
        amount: result.amount ?? 0,
        currency: result.currency ?? "EUR",
        frequency: result.frequency ?? "monthly",
        category: result.category ?? "other",
        cancellation_email: result.cancellation_email ?? null,
        next_billing_date: result.next_billing_date ?? null,
        confidence: result.confidence ?? 0.8,
        source_email_id: (result as Record<string, unknown>).messageId as string ?? null,
      });

      subscriptionsFound++;
    }

    // Mark job completed
    await admin.from("scan_jobs").update({
      status: "completed",
      subscriptions_found: subscriptionsFound,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Update last_scanned_at
    await admin.from("email_accounts").update({
      last_scanned_at: new Date().toISOString(),
    }).eq("id", account.id);

  } catch (err) {
    await admin.from("scan_jobs").update({
      status: "failed",
      error_message: err instanceof Error ? err.message : "Unknown error",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}
