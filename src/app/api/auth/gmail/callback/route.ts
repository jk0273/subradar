import { NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/security";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return Response.redirect(new URL("/connect?error=access_denied", req.url));
  }

  if (!code || !state) return jsonError("Missing code or state", 400);

  // Decode and validate state
  let stateData: { userId: string; nonce: string; ts: number };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return jsonError("Invalid state", 400);
  }

  // State must be fresh (< 10 minutes)
  if (Date.now() - stateData.ts > 600_000) {
    return Response.redirect(new URL("/connect?error=state_expired", req.url));
  }

  // Verify user is still authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== stateData.userId) {
    return Response.redirect(new URL("/login", req.url));
  }

  // Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return Response.redirect(new URL("/connect?error=token_exchange", req.url));
  }

  if (!tokens.access_token) {
    return Response.redirect(new URL("/connect?error=no_token", req.url));
  }

  // Get user's Gmail address
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  );
  oauth2.setCredentials(tokens);
  const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
  const { data: userInfo } = await oauth2Api.userinfo.get();
  const gmailEmail = userInfo.email!;

  // Store encrypted tokens in DB
  // Note: In production, encrypt tokens before storage using pgsodium or similar
  const { error: dbError } = await supabase.from("email_accounts").upsert({
    user_id: user.id,
    provider: "gmail",
    email: gmailEmail,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null,
  }, { onConflict: "user_id,email" });

  if (dbError) {
    console.error("[Gmail Callback] DB error:", dbError);
    return Response.redirect(new URL("/connect?error=db", req.url));
  }

  // Immediately start a scan
  return Response.redirect(new URL("/connect?connected=true&scan=true", req.url));
}
