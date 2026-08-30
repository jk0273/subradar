import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ─── Input sanitization ────────────────────────────────────────────────────────

/** Strip HTML tags and dangerous chars */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"]/g, "")
    .trim()
    .slice(0, 10_000);
}

/** Escape for use in email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Zod schemas ───────────────────────────────────────────────────────────────

export const cancelSchema = z.object({
  subscription_id: z.string().uuid(),
  method: z.enum(["copy_paste", "email_auto", "lettre_ar"]),
});

export const scanSchema = z.object({
  email_account_id: z.string().uuid(),
  max_emails: z.number().int().min(50).max(500).default(300),
});

export const checkoutSchema = z.object({
  price_id: z.enum([
    process.env.STRIPE_SOLO_PRICE_ID ?? "price_solo",
    process.env.STRIPE_FAMILLE_PRICE_ID ?? "price_famille",
  ]),
});

// ─── Auth guard for API routes ─────────────────────────────────────────────────

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Unauthorized" };
  }

  return { user, error: null };
}

/** Also checks the user's plan */
export async function requirePlan(plan: "solo" | "famille") {
  const { user, error } = await requireAuth();
  if (!user || error) return { user: null, profile: null, error: "Unauthorized" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const PLAN_ORDER = { free: 0, solo: 1, famille: 2 };
  const required = PLAN_ORDER[plan];
  const current = PLAN_ORDER[(profile?.plan ?? "free") as keyof typeof PLAN_ORDER];

  if (current < required) {
    return { user, profile, error: `Plan ${plan} requis. Mets à jour ton abonnement.` };
  }

  return { user, profile, error: null };
}

// ─── Request validation helper ─────────────────────────────────────────────────

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: string; status: number }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return { error: `Validation error: ${msg}`, status: 422 };
  }

  return { data: parsed.data };
}

// ─── Standard JSON responses ──────────────────────────────────────────────────

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function jsonError(error: string, status = 400) {
  return Response.json({ error }, { status });
}

// ─── Subscription ownership check ─────────────────────────────────────────────

export async function verifySubscriptionOwner(
  subscriptionId: string,
  userId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("id", subscriptionId)
    .eq("user_id", userId)  // RLS + double check
    .single();

  if (error || !data) return null;
  return data;
}
