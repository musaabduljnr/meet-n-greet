import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

export interface StoredInboxEmail {
  id: string;
  message: EmailMessage;
  timestamp: string;
}

/**
 * TestInboxProvider: In-memory test inbox for automated unit/integration tests
 * and development inspection without external API or SMTP dependencies.
 */
export class TestInboxProvider implements EmailProvider {
  public readonly name = "TEST_INBOX" as const;

  private inbox: StoredInboxEmail[] = [];
  private shouldFailNext = false;
  private failErrorMessage = "Simulated email provider network failure";

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (this.shouldFailNext) {
      this.shouldFailNext = false;
      return {
        success: false,
        provider: "TEST_INBOX",
        error: this.failErrorMessage,
      };
    }

    const messageId = `test-inbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.inbox.push({
      id: messageId,
      message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      provider: "TEST_INBOX",
      messageId,
    };
  }

  // Test inspection utilities
  public getAll(): StoredInboxEmail[] {
    return [...this.inbox];
  }

  public getLast(): StoredInboxEmail | undefined {
    return this.inbox[this.inbox.length - 1];
  }

  public getByRecipient(email: string): StoredInboxEmail[] {
    const normalized = email.toLowerCase().trim();
    return this.inbox.filter((item) => item.message.to.email.toLowerCase() === normalized);
  }

  public getByType(type: EmailMessage["type"]): StoredInboxEmail[] {
    return this.inbox.filter((item) => item.message.type === type);
  }

  public count(): number {
    return this.inbox.length;
  }

  public clear(): void {
    this.inbox = [];
    this.shouldFailNext = false;
  }

  public simulateError(fail: boolean, message = "Simulated email provider network failure"): void {
    this.shouldFailNext = fail;
    this.failErrorMessage = message;
  }
}
