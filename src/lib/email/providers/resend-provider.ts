import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

/**
 * ResendProvider: Production-grade transactional email dispatch via Resend REST API.
 * Uses native fetch without requiring external dependencies, with strict secret masking.
 */
export class ResendProvider implements EmailProvider {
  public readonly name = "RESEND" as const;

  private apiKey?: string;
  private defaultFrom: string;

  constructor(apiKey?: string, defaultFrom?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY;
    this.defaultFrom =
      defaultFrom ||
      process.env.EMAIL_FROM ||
      "Kountry Wayne VIP <vip@kountrywaynetour.com>";
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const key = this.apiKey || process.env.RESEND_API_KEY;

    if (!key) {
      return {
        success: false,
        provider: "RESEND",
        error: "RESEND_API_KEY is not configured on the server.",
      };
    }

    // Production safety guard: Development & staging must never blast real user inboxes
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_REAL_USER_TEST_EMAILS !== "true") {
      const isTestDomain = /@(example\.com|test\.com|localhost|sample\.com|kountrywayne\.com)$/i.test(message.to.email);
      if (!isTestDomain) {
        console.warn(`[EMAIL SAFEGUARD] Intercepted outbound email to non-test domain (${message.to.email}) in ${process.env.NODE_ENV || "development"} mode. Suppressing delivery.`);
        return {
          success: true,
          provider: "RESEND",
          messageId: `safeguard-diverted-${Date.now()}`,
        };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.defaultFrom,
          to: [`${message.to.name} <${message.to.email}>`],
          subject: message.subject,
          html: message.html,
          text: message.text,
          tags: [
            { name: "category", value: "transactional" },
            { name: "email_type", value: message.type.toLowerCase() },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
        return {
          success: false,
          provider: "RESEND",
          error: `Resend API error: ${errorMsg}`,
        };
      }

      return {
        success: true,
        provider: "RESEND",
        messageId: data.id,
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Resend API connection timed out"
            : err.message
          : "Unknown network error connecting to Resend";

      return {
        success: false,
        provider: "RESEND",
        error: errorMsg,
      };
    }
  }
}
