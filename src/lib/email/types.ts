export type EmailType =
  | "REGISTRATION_CONFIRMATION"
  | "FAN_CARD_TRACKING_INFO"
  | "SCHEDULE_NOTIFICATION"
  | "SCHEDULE_CONFIRMATION"
  | "SCHEDULE_UPDATE"
  | "SCHEDULE_CANCELLED"
  | "FAN_CARD_STATUS_UPDATE"
  | "FAN_CARD_PROCESSING"
  | "FAN_CARD_PREPARED"
  | "FAN_CARD_SHIPPED"
  | "FAN_CARD_IN_TRANSIT"
  | "FAN_CARD_OUT_FOR_DELIVERY"
  | "FAN_CARD_DELIVERED"
  | "FAN_CARD_DELIVERY_ISSUE"
  | "ADMIN_ALERT";

export type EmailStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "BOUNCED";

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailMessage {
  to: EmailRecipient;
  type: EmailType;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  referenceId?: {
    fanId?: string;
    registrationId?: string;
    fanCardId?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface EmailSendResult {
  success: boolean;
  provider: "CONSOLE_TEST" | "TEST_INBOX" | "SMTP" | "RESEND";
  messageId?: string;
  error?: string;
  eventId?: string;
  skippedDueToIdempotency?: boolean;
}

export interface EmailProvider {
  name: "CONSOLE_TEST" | "TEST_INBOX" | "SMTP" | "RESEND";
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export interface EmailEventRecord {
  id: string;
  recipient_email: string;
  fan_id?: string;
  registration_id?: string;
  fan_card_id?: string;
  email_type: EmailType;
  status: EmailStatus;
  provider: string;
  provider_message_id?: string;
  error_message?: string;
  subject: string;
  payload_snapshot?: Record<string, unknown>;
  sent_at?: string;
  created_at: string;
  idempotency_key?: string;
}

// ============================================================================
// TYPED TEMPLATE INPUT DATA (SOURCED DIRECTLY FROM DATABASE ENTITIES)
// ============================================================================

export interface RegistrationEmailData {
  fanName: string;
  fanEmail: string;
  fanId?: string;
  registrationId?: string;
  referenceId: string;
  cityName: string;
  cityState: string;
  tourDate: string;
  trackingCode: string;
  trackingUrl: string;
}

export interface FanCardTrackingEmailData {
  fanName: string;
  fanEmail: string;
  fanId?: string;
  fanCardId?: string;
  registrationId?: string;
  trackingCode: string;
  currentStatus: string;
  statusLabel: string;
  cityName: string;
  cityState: string;
  trackingUrl: string;
}

export interface ScheduleEmailData {
  fanName: string;
  fanEmail: string;
  fanId?: string;
  registrationId?: string;
  cityName: string;
  cityState: string;
  assignedDate: string;
  arrivalTime: string;
  venueName: string;
  venueAddress: string;
  arrivalInstructions: string;
  coordinatorContact?: string;
  trackingCode?: string;
  trackingUrl?: string;
}

export interface ScheduleUpdateEmailData extends ScheduleEmailData {
  updateReason?: string;
  changesSummary?: string;
}

export interface ScheduleCancellationEmailData {
  fanName: string;
  fanEmail: string;
  fanId?: string;
  registrationId?: string;
  cityName: string;
  cityState: string;
  originalDate?: string;
  assignedDate?: string;
  cancellationReason: string;
  trackingCode?: string;
  trackingUrl?: string;
}

export interface FanCardStatusEmailData {
  fanName: string;
  fanEmail: string;
  fanId?: string;
  fanCardId?: string;
  registrationId?: string;
  trackingCode: string;
  status:
    | "PROCESSING"
    | "PREPARED"
    | "SHIPPED"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "DELIVERY_ISSUE";
  statusLabel: string;
  cityName: string;
  cityState: string;
  lastUpdated: string;
  trackingUrl: string;
  courierReference?: string;
  deliveryIssueNote?: string;
}
