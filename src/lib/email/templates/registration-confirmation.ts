import { wrapInBaseEmailLayout } from "./base-layout";
import type { RegistrationEmailData } from "../types";

export interface RegistrationConfirmationData {
  recipientName: string;
  cityName: string;
  cityState: string;
  tourDate: string;
  trackingCode: string;
  requestReference: string;
  trackingUrl?: string;
}

export function renderRegistrationConfirmationEmail(
  input: RegistrationConfirmationData | RegistrationEmailData
): {
  subject: string;
  html: string;
  text: string;
} {
  const recipientName = "recipientName" in input ? input.recipientName : input.fanName;
  const cityName = input.cityName;
  const cityState = input.cityState;
  const tourDate = input.tourDate;
  const trackingCode = input.trackingCode;
  const requestReference =
    "requestReference" in input ? input.requestReference : input.referenceId;
  const trackingUrl =
    input.trackingUrl ||
    `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(trackingCode)}`;

  const subject = `VIP Registration Confirmed - Your Kountry Wayne Fan Card Tracking Code (${cityName})`;

  const text = `
Hello ${recipientName},

Your VIP Meet & Greet registration request for Kountry Wayne in ${cityName}, ${cityState} has been received and confirmed.

YOUR REQUEST DETAILS:
- Request Reference: ${requestReference}
- Tour Stop: ${cityName}, ${cityState}
- Tour Date: ${tourDate}

COMMEMORATIVE FAN CARD TRACKING CODE:
${trackingCode}

You can track your physical Fan Card delivery status at:
${trackingUrl}

IMPORTANT MEET & GREET SCHEDULING NOTICE:
This is an intimate, curated VIP experience. Your specific arrival time slot, stage-door check-in coordinates, and event-day guidelines are scheduled by tour coordinators and will be sent to you in a follow-up email leading up to the show.

Please ensure you bring a valid government photo ID matching your registered legal name to venue check-in.

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Your VIP Meet & Greet registration request for Kountry Wayne in <strong style="color: #F8F8FC;">${cityName}, ${cityState}</strong> has been received and confirmed by tour operations.
    </p>

    <!-- Request Details Box -->
    <div style="background-color: #1A1A22; border: 1px solid #2A2A38; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Reference ID:</td>
          <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 13px; color: #F8F8FC; font-weight: 700;">${requestReference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Tour Stop:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #F8F8FC; font-weight: 600;">${cityName}, ${cityState}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Tour Date:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #F8F8FC; font-weight: 600;">${tourDate}</td>
        </tr>
      </table>
    </div>

    <!-- Tracking Code Showcase -->
    <div style="text-align: center; background-color: #0E0E12; border: 1px dashed #D4AF37; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; font-weight: 700; margin-bottom: 8px;">
        Your Private Fan Card Tracking Code
      </div>
      <div style="font-family: monospace; font-size: 26px; font-weight: 800; color: #F8F8FC; letter-spacing: 3px;">
        ${trackingCode}
      </div>
      <div style="font-size: 12px; color: #8E8E9E; margin-top: 8px;">
        Save this private credential. You will use it to track your physical commemorative card fulfillment online.
      </div>
    </div>

    <!-- Scheduling Notice -->
    <div style="border-left: 3px solid #D4AF37; padding-left: 14px; margin-bottom: 8px;">
      <div style="font-size: 13px; font-weight: 700; color: #F8F8FC; margin-bottom: 4px;">
        Important Meet & Greet Notice:
      </div>
      <div style="font-size: 12px; color: #9E9EAF; line-height: 1.5;">
        This is an intimate, curated experience. Your specific call time, secret stage-door coordinates, and entry protocol are scheduled individually by our team and will be delivered in your <strong>Schedule Confirmation</strong> email.
      </div>
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Your VIP registration for ${cityName} is confirmed. Tracking code: ${trackingCode}`,
    badgeText: "REGISTRATION CONFIRMATION",
    headline: "You're Registered for Kountry Wayne VIP",
    subheadline: `Official Tour Request Confirmation &bull; ${cityName}, ${cityState}`,
    contentHtml,
    ctaText: "Track Fan Card Delivery",
    ctaUrl: trackingUrl,
    footerNotes: "Please bring a valid government photo ID matching your registered name to venue check-in.",
  });

  return { subject, html, text };
}
