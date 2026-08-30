// ─── Database types ────────────────────────────────────────────────────────────

export type Plan = "free" | "solo" | "famille";
export type SubscriptionStatus = "active" | "cancelled" | "pending" | "paused";
export type EmailProvider = "gmail" | "outlook";
export type ScanStatus = "pending" | "running" | "completed" | "failed";
export type CancellationMethod = "copy_paste" | "email_auto" | "lettre_ar";
export type SubscriptionFrequency = "monthly" | "yearly" | "weekly";
export type SubscriptionCategory =
  | "streaming"
  | "software"
  | "fitness"
  | "cloud"
  | "gaming"
  | "music"
  | "news"
  | "food"
  | "finance"
  | "other";

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  total_savings: number;
  created_at: string;
  updated_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  provider: EmailProvider;
  email: string;
  last_scanned_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  email_account_id: string;
  service_name: string;
  amount: number;
  amount_monthly: number;
  currency: string;
  frequency: SubscriptionFrequency;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  next_billing_date: string | null;
  cancellation_email: string | null;
  logo_url: string | null;
  confidence: number;
  source_email_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cancellation {
  id: string;
  subscription_id: string;
  user_id: string;
  letter_text: string;
  method: CancellationMethod;
  sent_at: string | null;
  amount_saved: number;
  created_at: string;
}

export interface ScanJob {
  id: string;
  email_account_id: string;
  user_id: string;
  status: ScanStatus;
  emails_processed: number;
  subscriptions_found: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── API Response types ────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Claude extraction types ───────────────────────────────────────────────────

export interface ExtractedSubscription {
  is_subscription: boolean;
  service_name?: string;
  amount?: number;
  currency?: string;
  frequency?: SubscriptionFrequency;
  next_billing_date?: string;
  category?: SubscriptionCategory;
  cancellation_email?: string;
  confidence?: number;
}

// ─── Dashboard types ───────────────────────────────────────────────────────────

export interface DashboardStats {
  total_monthly: number;
  total_yearly: number;
  active_count: number;
  cancelled_count: number;
  total_savings: number;
  potentially_unused: number;
}
