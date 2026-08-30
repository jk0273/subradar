-- ════════════════════════════════════════════════════════════════════════════
--  SubRadar — Database Schema v1.0
--  Run this in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'solo', 'famille')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  total_savings         DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- ─── EMAIL ACCOUNTS ───────────────────────────────────────────────────────────
CREATE TABLE public.email_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email            TEXT NOT NULL,
  -- Tokens are encrypted at application level before storage
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  last_scanned_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email)
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_accounts" ON public.email_accounts FOR ALL USING (auth.uid() = user_id);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_account_id  UUID REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  service_name      TEXT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency          TEXT NOT NULL DEFAULT 'EUR',
  frequency         TEXT NOT NULL CHECK (frequency IN ('monthly', 'yearly', 'weekly')),
  -- Computed monthly cost for easier comparison
  amount_monthly    DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE frequency
      WHEN 'yearly'  THEN ROUND(amount / 12, 2)
      WHEN 'weekly'  THEN ROUND(amount * 4.33, 2)
      ELSE amount
    END
  ) STORED,
  category          TEXT DEFAULT 'other' CHECK (
    category IN ('streaming','software','fitness','cloud','gaming','music','news','food','finance','other')
  ),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','pending','paused')),
  next_billing_date DATE,
  cancellation_email TEXT,
  logo_url          TEXT,
  confidence        DECIMAL(3,2) DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  source_email_id   TEXT,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for common queries
CREATE INDEX idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- ─── CANCELLATIONS ────────────────────────────────────────────────────────────
CREATE TABLE public.cancellations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  letter_text     TEXT NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('copy_paste', 'email_auto', 'lettre_ar')),
  sent_at         TIMESTAMPTZ,
  amount_saved    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cancellations" ON public.cancellations FOR ALL USING (auth.uid() = user_id);

-- ─── SCAN JOBS ────────────────────────────────────────────────────────────────
CREATE TABLE public.scan_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id    UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  emails_processed    INTEGER NOT NULL DEFAULT 0,
  subscriptions_found INTEGER NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scan_jobs" ON public.scan_jobs FOR ALL USING (auth.uid() = user_id);

-- ─── AUDIT LOG (for security) ─────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  resource   TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Audit log: users can only READ their own, not write
CREATE POLICY "users_read_own_audit" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
-- Only service role can insert audit logs
CREATE POLICY "service_role_insert_audit" ON public.audit_log FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ─── USEFUL VIEWS ─────────────────────────────────────────────────────────────

-- Dashboard stats view
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  user_id,
  SUM(amount_monthly) FILTER (WHERE status = 'active')        AS total_monthly,
  SUM(amount_monthly * 12) FILTER (WHERE status = 'active')   AS total_yearly,
  COUNT(*) FILTER (WHERE status = 'active')                    AS active_count,
  COUNT(*) FILTER (WHERE status = 'cancelled')                 AS cancelled_count,
  COUNT(*) FILTER (
    WHERE status = 'active'
    AND next_billing_date < NOW() + INTERVAL '8 days'
    AND next_billing_date > NOW()
  )                                                             AS renewing_soon
FROM public.subscriptions
GROUP BY user_id;

-- Enable RLS on view
ALTER VIEW public.dashboard_stats OWNER TO authenticated;
