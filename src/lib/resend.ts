import { Resend } from "resend";
import { escapeHtml } from "./security";

export const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@subradar.fr";

// ─── Renewal alert email ───────────────────────────────────────────────────────

export async function sendRenewalAlert(params: {
  to: string;
  userName: string;
  serviceName: string;
  amount: number;
  currency: string;
  renewalDate: string;
  subscriptionId: string;
}) {
  const { to, userName, serviceName, amount, currency, renewalDate, subscriptionId } = params;
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions?highlight=${subscriptionId}`;

  return resend.emails.send({
    from: `SubRadar <${FROM}>`,
    to,
    subject: `⏰ ${escapeHtml(serviceName)} se renouvelle dans 7 jours — ${amount} ${currency}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#0f2b5b;padding:28px 32px">
      <p style="color:#93c5fd;margin:0;font-size:13px;letter-spacing:.05em">SUBRADAR</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Renouvellement imminent</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#475569;margin:0 0 20px">Bonjour ${escapeHtml(userName ?? "")},</p>
      <div style="background:#fef3e6;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-weight:600;color:#0f2b5b;font-size:18px">${escapeHtml(serviceName)}</p>
        <p style="margin:0;color:#c0560a;font-size:22px;font-weight:700">${amount} ${currency}</p>
        <p style="margin:8px 0 0;color:#64748b;font-size:13px">Prélèvement prévu le ${escapeHtml(renewalDate)}</p>
      </div>
      <p style="color:#475569;margin:0 0 24px;font-size:14px">
        Tu as encore 7 jours pour décider de garder ou résilier cet abonnement avant d'être débité(e).
      </p>
      <a href="${actionUrl}" style="display:inline-block;background:#1a73e8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Gérer cet abonnement →
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #e2e8f0">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Tu reçois cet email car tu as activé les alertes de renouvellement dans SubRadar.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#94a3b8">Gérer mes notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ─── Cancellation confirmation ─────────────────────────────────────────────────

export async function sendCancellationConfirmation(params: {
  to: string;
  userName: string;
  serviceName: string;
  amountSaved: number;
  totalSavings: number;
}) {
  const { to, userName, serviceName, amountSaved, totalSavings } = params;

  return resend.emails.send({
    from: `SubRadar <${FROM}>`,
    to,
    subject: `✅ Résiliation envoyée pour ${escapeHtml(serviceName)} — Tu économises ${amountSaved} €/mois`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#0f2b5b;padding:28px 32px">
      <p style="color:#93c5fd;margin:0;font-size:13px">SUBRADAR</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Résiliation envoyée ! 🎉</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#475569;margin:0 0 20px">Bravo ${escapeHtml(userName ?? "")} !</p>
      <div style="background:#e6f5ee;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 4px;color:#1a7a4a;font-weight:600">Ta lettre de résiliation a été envoyée à</p>
        <p style="margin:0;font-weight:700;color:#0f2b5b;font-size:18px">${escapeHtml(serviceName)}</p>
        <p style="margin:12px 0 0;color:#64748b;font-size:14px">Tu vas économiser <strong style="color:#1a7a4a">${amountSaved} €/mois</strong></p>
      </div>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;text-align:center">
        <p style="margin:0;color:#64748b;font-size:13px">Total économisé grâce à SubRadar</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#1a7a4a">${totalSavings} €</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  });
}
