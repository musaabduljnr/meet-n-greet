import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***.***";
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => (p.length <= 1 ? p : `${p[0]}***`)).join(" ");
}

export class ConsoleProvider implements EmailProvider {
  public readonly name = "CONSOLE_TEST" as const;

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const messageId = `console-msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const isProd = process.env.NODE_ENV === "production";
    const recipientDisplay = isProd
      ? `${maskName(message.to.name)} <${maskEmail(message.to.email)}>`
      : `${message.to.name} <${message.to.email}>`;

    console.log("==================== [OUTGOING TRANSACTIONAL EMAIL] ====================");
    console.log(`[Provider] ConsoleProvider (${isProd ? "Production Fallback - PII Masked" : "Local Development / Testing"})`);
    console.log(`[Message ID] ${messageId}`);
    console.log(`[To] ${recipientDisplay}`);
    console.log(`[Type] ${message.type}`);
    console.log(`[Subject] ${message.subject}`);
    if (!isProd) {
      console.log("------------------------------- PLAIN TEXT -------------------------------");
      console.log(message.text);
    } else {
      console.log("[Notice] Email body content suppressed in production logs to prevent PII exposure.");
    }
    console.log("========================================================================");

    return {
      success: true,
      provider: "CONSOLE_TEST",
      messageId,
    };
  }
}
