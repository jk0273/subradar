import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedSubscription } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Email → Subscription extraction ──────────────────────────────────────────

export async function extractSubscriptionFromEmail(
  emailSubject: string,
  emailSnippet: string,
  emailFrom: string
): Promise<ExtractedSubscription> {
  const prompt = `Tu es un analyseur d'emails spécialisé dans la détection d'abonnements payants.

Analyse cet email et extrais les informations d'abonnement si présentes.
Réponds UNIQUEMENT avec un objet JSON valide, rien d'autre (pas de markdown, pas de texte avant ou après).

Email à analyser:
- De: ${emailFrom}
- Sujet: ${emailSubject}
- Contenu: ${emailSnippet.slice(0, 800)}

Format de réponse JSON exact:
{
  "is_subscription": true ou false,
  "service_name": "nom du service (ex: Netflix, Spotify)",
  "amount": montant en nombre décimal (ex: 15.99),
  "currency": "EUR" ou "USD" etc,
  "frequency": "monthly" ou "yearly" ou "weekly",
  "next_billing_date": "YYYY-MM-DD" ou null,
  "category": "streaming" | "software" | "fitness" | "cloud" | "gaming" | "music" | "news" | "food" | "finance" | "other",
  "cancellation_email": "email de contact pour résilier" ou null,
  "confidence": nombre entre 0 et 1 (ex: 0.95)
}

Si ce n'est PAS un email d'abonnement (reçu, renouvellement, confirmation, facture récurrente), retourne:
{"is_subscription": false}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    const parsed = JSON.parse(text.trim()) as ExtractedSubscription;
    return parsed;
  } catch (err) {
    console.error("[Claude] Extraction error:", err);
    return { is_subscription: false };
  }
}

// ─── Cancellation letter generation ───────────────────────────────────────────

interface LetterParams {
  serviceName: string;
  cancellationEmail: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  frequency: string;
}

export async function generateCancellationLetter(
  params: LetterParams
): Promise<string> {
  const { serviceName, cancellationEmail, userName, userEmail, amount, currency, frequency } = params;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const freqLabel = frequency === "monthly" ? "mensuel" : frequency === "yearly" ? "annuel" : "hebdomadaire";

  const prompt = `Tu es un expert en rédaction de lettres de résiliation professionnelles en France.

Génère une lettre de résiliation pour l'abonnement suivant:
- Service: ${serviceName}
- Email destinataire: ${cancellationEmail}
- Nom de l'abonné: ${userName}
- Email de l'abonné: ${userEmail}
- Montant: ${amount} ${currency} (abonnement ${freqLabel})
- Date: ${today}

Règles de la lettre:
1. Ton professionnel et direct, en français parfait
2. Demander la résiliation IMMÉDIATE avec effet à la date de réception
3. Demander confirmation de résiliation par email
4. Mentionner la suppression des données personnelles (RGPD art. 17)
5. Mentionner l'arrêt de tout prélèvement futur
6. Maximum 180 mots
7. Format: Objet, puis corps de lettre (sans entête ni signature — ceux-ci seront ajoutés automatiquement)

Réponds UNIQUEMENT avec la lettre, rien d'autre.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const letter = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  return letter.trim();
}

// ─── Batch processing helper ───────────────────────────────────────────────────

/** Process emails in small batches to respect Claude API limits */
export async function* processEmailBatch(
  emails: Array<{ subject: string; snippet: string; from: string; messageId: string }>,
  batchSize = 5
) {
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) =>
        extractSubscriptionFromEmail(email.subject, email.snippet, email.from)
          .then((result) => ({ ...result, messageId: email.messageId }))
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        yield result.value;
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < emails.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
