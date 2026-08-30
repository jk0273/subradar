import { google } from "googleapis";

// ─── OAuth2 client factory ─────────────────────────────────────────────────────

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );
}

// ─── Generate auth URL ─────────────────────────────────────────────────────────

export function generateAuthUrl(state: string): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state,
    prompt: "consent", // Force consent to always get refresh_token
  });
}

// ─── Exchange code for tokens ──────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

// ─── Fetch subscription-related emails ────────────────────────────────────────

export interface GmailMessage {
  messageId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

const SUBSCRIPTION_KEYWORDS = [
  "renouvellement",
  "renewal",
  "abonnement",
  "subscription",
  "facture",
  "invoice",
  "receipt",
  "payment confirmation",
  "confirmation de paiement",
  "billing",
  "your receipt",
  "votre reçu",
  "prélèvement",
  "charge",
].join(" OR ");

export async function fetchSubscriptionEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 300
): Promise<GmailMessage[]> {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Auto-refresh token if expired
  const { credentials } = await oauth2.refreshAccessToken();
  oauth2.setCredentials(credentials);

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  // Search last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const after = Math.floor(oneYearAgo.getTime() / 1000);

  const { data: listData } = await gmail.users.messages.list({
    userId: "me",
    q: `(${SUBSCRIPTION_KEYWORDS}) after:${after}`,
    maxResults,
  });

  if (!listData.messages?.length) return [];

  // Fetch message details in parallel (with limit)
  const PARALLEL = 10;
  const messages: GmailMessage[] = [];

  for (let i = 0; i < listData.messages.length; i += PARALLEL) {
    const batch = listData.messages.slice(i, i + PARALLEL);
    const details = await Promise.allSettled(
      batch.map((m) =>
        gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        })
      )
    );

    for (const result of details) {
      if (result.status !== "fulfilled") continue;
      const msg = result.value.data;
      const headers = msg.payload?.headers ?? [];

      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

      messages.push({
        messageId: msg.id!,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        snippet: msg.snippet ?? "",
        date: getHeader("Date"),
      });
    }
  }

  return messages;
}

/** Refresh an expired access token and return new credentials */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  return credentials;
}
