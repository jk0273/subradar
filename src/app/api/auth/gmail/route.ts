import { NextRequest } from "next/server";
import { generateAuthUrl } from "@/lib/gmail";
import { requireAuth, jsonError } from "@/lib/security";

export async function GET(_req: NextRequest) {
  const { user, error } = await requireAuth();
  if (!user) return jsonError(error ?? "Unauthorized", 401);

  // CSRF: encode userId in state so callback can verify it
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    nonce: crypto.randomUUID(),
    ts: Date.now(),
  })).toString("base64url");

  const url = generateAuthUrl(state);

  return Response.redirect(url);
}
