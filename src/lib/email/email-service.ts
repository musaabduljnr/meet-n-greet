import type {
  EmailEventRecord,
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  EmailStatus,
  EmailType,
  FanCardStatusEmailData,
  FanCardTrackingEmailData,
  RegistrationEmailData,
  ScheduleEmailData,
  ScheduleUpdateEmailData,
  ScheduleCancellationEmailData,
} from "./types";
import { ConsoleProvider } from "./providers/console-provider";
import { TestInboxProvider } from "./providers/test-inbox-provider";
import { ResendProvider } from "./providers/resend-provider";
import { renderRegistrationConfirmationEmail } from "./templates/registration-confirmation";
import {
  renderScheduleConfirmationEmail,
  renderScheduleUpdateEmail,
  renderScheduleCancellationEmail,
} from "./templates/schedule-templates";
import {
  renderFanCardStatusEmail,
  renderFanCardTrackingInfoEmail,
} from "./templates/fancard-templates";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export class EmailService {
  private provider: EmailProvider;
  private events: EmailEventRecord[] = [];

  constructor() {
    this.provider = this.createDefaultProvider();
  }

  private createDefaultProvider(): EmailProvider {
    const providerType = (process.env.EMAIL_PROVIDER || "CONSOLE_TEST").toUpperCase();

    switch (providerType) {
      case "TEST_INBOX":
        return new TestInboxProvider();
      case "RESEND":
        return new ResendProvider();
      case "CONSOLE_TEST":
      default:
        return new ConsoleProvider();
    }
  }

  /**
   * Set the active email provider (useful for tests or environment overrides)
   */
  public setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  /**
   * Get the active email provider
   */
  public getProvider(): EmailProvider {
    return this.provider;
  }

  /**
   * Core send method with non-blocking error handling, database auditing, and idempotency checks.
   */
  public async send(
    message: EmailMessage,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const forceRetry = options?.forceRetry || false;
    const idempotencyKey = message.idempotencyKey;

    // 1. Idempotency Check: prevent duplicate dispatches
    if (idempotencyKey && !forceRetry) {
      const existingSent = this.events.find(
        (e) => e.idempotency_key === idempotencyKey && e.status === "SENT"
      );

      if (existingSent) {
        return {
          success: true,
          provider: this.provider.name,
          messageId: existingSent.provider_message_id,
          eventId: existingSent.id,
          skippedDueToIdempotency: true,
        };
      }
    }

    // 2. Initialize Audit Event Record
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const eventRecord: EmailEventRecord = {
      id: eventId,
      recipient_email: message.to.email,
      fan_id: message.referenceId?.fanId,
      registration_id: message.referenceId?.registrationId,
      fan_card_id: message.referenceId?.fanCardId,
      email_type: message.type,
      status: "QUEUED",
      provider: this.provider.name,
      subject: message.subject,
      payload_snapshot: {
        to: message.to,
        type: message.type,
        subject: message.subject,
        metadata: message.metadata,
        referenceId: message.referenceId,
      },
      created_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    };

    this.events.push(eventRecord);

    // 3. Dispatch Email via Active Provider
    try {
      const sendResult = await this.provider.send(message);

      if (sendResult.success) {
        eventRecord.status = "SENT";
        eventRecord.provider_message_id = sendResult.messageId;
        eventRecord.sent_at = new Date().toISOString();
        eventRecord.error_message = undefined;
      } else {
        eventRecord.status = "FAILED";
        eventRecord.error_message = sendResult.error || "Unknown provider failure";
      }

      // 4. Async Audit Persistence to Supabase (if configured)
      await this.persistEventToDatabase(eventRecord);

      return {
        ...sendResult,
        eventId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to dispatch email";
      console.error("[EmailService Error]", errorMsg);

      eventRecord.status = "FAILED";
      eventRecord.error_message = errorMsg;

      await this.persistEventToDatabase(eventRecord);

      return {
        success: false,
        provider: this.provider.name,
        error: errorMsg,
        eventId,
      };
    }
  }

  /**
   * Alias for send()
   */
  public async sendEmail(
    message: EmailMessage,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    return this.send(message, options);
  }

  /**
   * 1. Send Registration Confirmation Email
   */
  public async sendRegistrationEmail(
    data: RegistrationEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderRegistrationConfirmationEmail(data);
    const idempotencyKey = `reg_confirm:${data.referenceId || data.trackingCode}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: "REGISTRATION_CONFIRMATION",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          registrationId: data.registrationId,
        },
        metadata: {
          referenceId: data.referenceId,
          trackingCode: data.trackingCode,
          cityName: data.cityName,
          tourDate: data.tourDate,
        },
      },
      options
    );
  }

  /**
   * 2. Send Fan Card Tracking Information Email
   */
  public async sendFanCardTrackingEmail(
    data: FanCardTrackingEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderFanCardTrackingInfoEmail(data);
    const idempotencyKey = `fc_track:${data.trackingCode}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: "FAN_CARD_TRACKING_INFO",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          fanCardId: data.fanCardId,
          registrationId: data.registrationId,
        },
        metadata: {
          trackingCode: data.trackingCode,
          currentStatus: data.currentStatus,
          cityName: data.cityName,
        },
      },
      options
    );
  }

  /**
   * 3. Send Meet & Greet Schedule Confirmation Email
   */
  public async sendScheduleEmail(
    data: ScheduleEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderScheduleConfirmationEmail(data);
    const idempotencyKey = `sched_confirm:${data.registrationId || data.fanEmail}:${data.assignedDate}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: "SCHEDULE_CONFIRMATION",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          registrationId: data.registrationId,
        },
        metadata: {
          cityName: data.cityName,
          assignedDate: data.assignedDate,
          arrivalTime: data.arrivalTime,
          venueName: data.venueName,
        },
      },
      options
    );
  }

  /**
   * 4. Send Meet & Greet Schedule Update Email
   */
  public async sendScheduleUpdateEmail(
    data: ScheduleUpdateEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderScheduleUpdateEmail(data);
    const idempotencyKey = `sched_update:${data.registrationId || data.fanEmail}:${data.assignedDate}:${data.arrivalTime}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: "SCHEDULE_UPDATE",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          registrationId: data.registrationId,
        },
        metadata: {
          cityName: data.cityName,
          assignedDate: data.assignedDate,
          arrivalTime: data.arrivalTime,
          updateReason: data.updateReason,
        },
      },
      options
    );
  }

  /**
   * 4b. Send Meet & Greet Schedule Cancellation Email
   */
  public async sendScheduleCancellationEmail(
    data: ScheduleCancellationEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderScheduleCancellationEmail(data);
    const idempotencyKey = `sched_cancel:${data.registrationId || data.fanEmail}:${data.originalDate}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: "SCHEDULE_CANCELLED",
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          registrationId: data.registrationId,
        },
        metadata: {
          cityName: data.cityName,
          originalDate: data.originalDate,
          cancellationReason: data.cancellationReason,
        },
      },
      options
    );
  }

  /**
   * 5-11. Send Fan Card Physical Status Update Email
   * Covers: PROCESSING, PREPARED, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELIVERY_ISSUE
   */
  public async sendStatusUpdateEmail(
    data: FanCardStatusEmailData,
    options?: { forceRetry?: boolean }
  ): Promise<EmailSendResult> {
    const emailContent = renderFanCardStatusEmail(data);

    // Map status enum to dedicated EmailType
    const typeMapping: Record<FanCardStatusEmailData["status"], EmailType> = {
      PROCESSING: "FAN_CARD_PROCESSING",
      PREPARED: "FAN_CARD_PREPARED",
      SHIPPED: "FAN_CARD_SHIPPED",
      IN_TRANSIT: "FAN_CARD_IN_TRANSIT",
      OUT_FOR_DELIVERY: "FAN_CARD_OUT_FOR_DELIVERY",
      DELIVERED: "FAN_CARD_DELIVERED",
      DELIVERY_ISSUE: "FAN_CARD_DELIVERY_ISSUE",
    };

    const emailType = typeMapping[data.status] || "FAN_CARD_STATUS_UPDATE";
    const idempotencyKey = `fc_status:${data.trackingCode}:${data.status}`;

    return this.send(
      {
        to: {
          name: data.fanName,
          email: data.fanEmail,
        },
        type: emailType,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        idempotencyKey,
        referenceId: {
          fanId: data.fanId,
          fanCardId: data.fanCardId,
          registrationId: data.registrationId,
        },
        metadata: {
          trackingCode: data.trackingCode,
          status: data.status,
          statusLabel: data.statusLabel,
          cityName: data.cityName,
          courierReference: data.courierReference,
        },
      },
      options
    );
  }

  /**
   * Admin retry mechanism for failed email events
   */
  public async retryFailedEmailEvent(eventId: string): Promise<EmailSendResult> {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) {
      return {
        success: false,
        provider: this.provider.name,
        error: `Email event with ID ${eventId} not found.`,
      };
    }

    if (event.status === "SENT") {
      return {
        success: true,
        provider: this.provider.name,
        messageId: event.provider_message_id,
        skippedDueToIdempotency: true,
      };
    }

    const payload = event.payload_snapshot as {
      to: { name: string; email: string };
      subject: string;
      type: EmailType;
      metadata?: Record<string, unknown>;
      referenceId?: { fanId?: string; registrationId?: string; fanCardId?: string };
    };

    // Reconstruct message from snapshot or defaults
    const message: EmailMessage = {
      to: payload.to,
      type: event.email_type,
      subject: event.subject,
      html: `<p>Retry dispatch for ${event.subject}</p>`,
      text: `Retry dispatch for ${event.subject}`,
      referenceId: event.fan_id
        ? {
            fanId: event.fan_id,
            registrationId: event.registration_id,
            fanCardId: event.fan_card_id,
          }
        : undefined,
      metadata: payload.metadata,
      idempotencyKey: event.idempotency_key,
    };

    const retryResult = await this.provider.send(message);

    if (retryResult.success) {
      event.status = "SENT";
      event.provider_message_id = retryResult.messageId;
      event.sent_at = new Date().toISOString();
      event.error_message = undefined;
    } else {
      event.status = "FAILED";
      event.error_message = retryResult.error || "Retry failed";
    }

    await this.persistEventToDatabase(event);

    return retryResult;
  }

  /**
   * Audit log query utilities for admin inspection
   */
  public getEmailEvents(filter?: {
    recipient?: string;
    status?: EmailStatus;
    type?: EmailType;
  }): EmailEventRecord[] {
    let list = [...this.events];

    if (filter?.recipient) {
      const email = filter.recipient.toLowerCase().trim();
      list = list.filter((e) => e.recipient_email.toLowerCase() === email);
    }

    if (filter?.status) {
      list = list.filter((e) => e.status === filter.status);
    }

    if (filter?.type) {
      list = list.filter((e) => e.email_type === filter.type);
    }

    return list;
  }

  public getEmailEventById(eventId: string): EmailEventRecord | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  public clearInMemoryEvents(): void {
    this.events = [];
  }

  /**
   * Persists event record to Supabase if configured, silently tolerating DB errors
   */
  private async persistEventToDatabase(event: EmailEventRecord): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      await supabase.from("email_events").upsert({
        id: event.id,
        recipient_email: event.recipient_email,
        fan_id: event.fan_id,
        registration_id: event.registration_id,
        fan_card_id: event.fan_card_id,
        email_type: event.email_type,
        status: event.status,
        provider: event.provider,
        provider_message_id: event.provider_message_id,
        error_message: event.error_message,
        subject: event.subject,
        payload_snapshot: event.payload_snapshot,
        sent_at: event.sent_at,
        created_at: event.created_at,
      });
    } catch (err) {
      console.error("[EmailService DB Audit Error]", err);
    }
  }
}

export const emailService = new EmailService();
