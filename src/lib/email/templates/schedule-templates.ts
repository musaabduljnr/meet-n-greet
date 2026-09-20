import { wrapInBaseEmailLayout } from "./base-layout";
import type { ScheduleEmailData, ScheduleUpdateEmailData } from "../types";

/**
 * 3. Meet & Greet Schedule Confirmation Email
 */
export function renderScheduleConfirmationEmail(data: ScheduleEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `⭐ Your Kountry Wayne Meet & Greet Schedule is Confirmed! (${data.cityName})`;

  const trackingUrl =
    data.trackingUrl ||
    (data.trackingCode
      ? `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(data.trackingCode)}`
      : "https://kountrywayne-meetngreet.vercel.app/track");

  const text = `
Hello ${data.fanName},

Your VIP Meet & Greet schedule with Kountry Wayne in ${data.cityName}, ${data.cityState} has been officially confirmed by our tour coordinator.

CONFIRMED VIP APPOINTMENT:
- Date: ${data.assignedDate}
- Mandatory Check-In Time: ${data.arrivalTime}
- Venue Name: ${data.venueName}
- Location / Address: ${data.venueAddress}

CHECK-IN & ARRIVAL INSTRUCTIONS:
${data.arrivalInstructions}

IMPORTANT GUIDELINES:
1. Valid Government Photo ID required at stage door check-in.
2. Arrival times are strict to preserve Wayne's intimate schedule with fans.
${data.coordinatorContact ? `3. VIP Coordinator Desk: ${data.coordinatorContact}\n` : ""}
Track your commemorative Fan Card delivery anytime:
${trackingUrl}

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${data.fanName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Your personal VIP Meet & Greet schedule with Kountry Wayne in <strong style="color: #F8F8FC;">${data.cityName}, ${data.cityState}</strong> has been confirmed by our tour coordinator.
    </p>

    <!-- Schedule Card -->
    <div style="background-color: #1A1A22; border: 1px solid #D4AF37; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Date:</td>
          <td align="right" style="padding: 6px 0; font-size: 14px; color: #F8F8FC; font-weight: 700;">${data.assignedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Check-In Time:</td>
          <td align="right" style="padding: 6px 0; font-size: 14px; color: #D4AF37; font-weight: 800;">${data.arrivalTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Venue:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #F8F8FC; font-weight: 600;">${data.venueName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Address:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #E0E0EC;">${data.venueAddress}</td>
        </tr>
      </table>
    </div>

    <!-- Instructions Box -->
    <div style="background-color: #0E0E12; border: 1px solid #2A2A38; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 700; margin-bottom: 8px;">
        Arrival & Stage-Door Instructions
      </div>
      <div style="font-size: 13px; color: #C8C8DC; line-height: 1.6;">
        ${data.arrivalInstructions}
      </div>
    </div>

    <!-- Protocol Notes -->
    <div style="border-left: 3px solid #D4AF37; padding-left: 14px; margin-bottom: 8px;">
      <div style="font-size: 13px; font-weight: 700; color: #F8F8FC; margin-bottom: 4px;">
        VIP Guest Requirements:
      </div>
      <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #9E9EAF; line-height: 1.6;">
        <li>Bring a valid government-issued photo ID matching your registered name.</li>
        <li>Arrive promptly at your designated check-in time (${data.arrivalTime}).</li>
        ${data.coordinatorContact ? `<li>Day-of coordinator contact: <strong>${data.coordinatorContact}</strong></li>` : ""}
      </ul>
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Your VIP schedule for ${data.cityName} is confirmed for ${data.assignedDate} at ${data.arrivalTime}.`,
    badgeText: "VIP SCHEDULE CONFIRMED",
    headline: "Your Meet & Greet is Scheduled",
    subheadline: `Official Appointment &bull; ${data.venueName} (${data.cityName})`,
    contentHtml,
    ctaText: "View Schedule & Fan Card Status",
    ctaUrl: trackingUrl,
    footerNotes: "Late arrivals cannot be guaranteed entry due to stage production timelines.",
  });

  return { subject, html, text };
}

/**
 * 4. Meet & Greet Schedule Update Email
 */
export function renderScheduleUpdateEmail(data: ScheduleUpdateEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `⚠️ Schedule Update for Your Kountry Wayne Meet & Greet (${data.cityName})`;

  const trackingUrl =
    data.trackingUrl ||
    (data.trackingCode
      ? `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(data.trackingCode)}`
      : "https://kountrywayne-meetngreet.vercel.app/track");

  const text = `
Hello ${data.fanName},

Please be advised of an operational update to your VIP Meet & Greet schedule with Kountry Wayne in ${data.cityName}, ${data.cityState}.

${data.updateReason ? `REASON FOR REVISION:\n${data.updateReason}\n` : ""}
UPDATED VIP APPOINTMENT:
- Date: ${data.assignedDate}
- Revised Check-In Time: ${data.arrivalTime}
- Venue: ${data.venueName}
- Address: ${data.venueAddress}

REVISED ARRIVAL INSTRUCTIONS:
${data.arrivalInstructions}

${data.changesSummary ? `SUMMARY OF CHANGES:\n${data.changesSummary}\n` : ""}
Please verify your updated schedule and Fan Card status online:
${trackingUrl}

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${data.fanName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Please note an operational schedule update for your upcoming VIP Meet & Greet in <strong style="color: #F8F8FC;">${data.cityName}, ${data.cityState}</strong>.
    </p>

    <!-- Reason Box -->
    ${
      data.updateReason
        ? `
      <div style="background-color: #241D12; border: 1px solid #D4AF37; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
          Update Notice:
        </span>
        <span style="font-size: 13px; color: #F3E5AB;">
          ${data.updateReason}
        </span>
      </div>
    `
        : ""
    }

    <!-- Updated Schedule Card -->
    <div style="background-color: #1A1A22; border: 1px solid #2A2A38; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Date:</td>
          <td align="right" style="padding: 6px 0; font-size: 14px; color: #F8F8FC; font-weight: 700;">${data.assignedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Revised Check-In:</td>
          <td align="right" style="padding: 6px 0; font-size: 14px; color: #E5C07B; font-weight: 800;">${data.arrivalTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Venue:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #F8F8FC; font-weight: 600;">${data.venueName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Address:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #E0E0EC;">${data.venueAddress}</td>
        </tr>
      </table>
    </div>

    <!-- Instructions -->
    <div style="background-color: #0E0E12; border: 1px solid #2A2A38; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 700; margin-bottom: 8px;">
        Updated Instructions
      </div>
      <div style="font-size: 13px; color: #C8C8DC; line-height: 1.6;">
        ${data.arrivalInstructions}
      </div>
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Important update to your VIP schedule for ${data.cityName}. New call time: ${data.arrivalTime}.`,
    badgeText: "VIP SCHEDULE REVISION",
    headline: "Your Schedule Has Been Updated",
    subheadline: `Revised Coordinates &bull; ${data.venueName} (${data.cityName})`,
    contentHtml,
    ctaText: "Confirm Updated Schedule",
    ctaUrl: trackingUrl,
    footerNotes: "Please review these revised call times carefully before departing for the venue.",
  });

  return { subject, html, text };
}

/**
 * 4b. Meet & Greet Schedule Cancellation Email
 */
export function renderScheduleCancellationEmail(data: import("../types").ScheduleCancellationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Notice: VIP Meet & Greet Schedule Cancellation (${data.cityName})`;

  const trackingUrl =
    data.trackingUrl ||
    (data.trackingCode
      ? `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(data.trackingCode)}`
      : "https://kountrywayne-meetngreet.vercel.app/track");

  const displayDate = data.originalDate || data.assignedDate || "your scheduled tour stop";

  const text = `
Hello ${data.fanName},

We regret to inform you that your scheduled VIP Meet & Greet appointment with Kountry Wayne in ${data.cityName}, ${data.cityState} for ${displayDate} has been cancelled by tour operations.

REASON FOR CANCELLATION:
${data.cancellationReason}

IMPORTANT NOTICE REGARDING YOUR COMMEMORATIVE FAN CARD:
Your commemorative physical Fan Card production order remains safe and is still being fulfilled. You can continue to track your package delivery online at:
${trackingUrl}

If you have any questions or require guest support, please reply directly to this notice.

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${data.fanName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      We regret to inform you that your VIP Meet & Greet appointment in <strong style="color: #F8F8FC;">${data.cityName}, ${data.cityState}</strong> originally scheduled for <strong style="color: #F8F8FC;">${displayDate}</strong> has been cancelled by tour operations.
    </p>

    <!-- Cancellation Reason Box -->
    <div style="background-color: #241414; border: 1px solid #EF4444; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #EF4444; font-weight: 700; margin-bottom: 8px;">
        Reason for Cancellation
      </div>
      <div style="font-size: 13px; color: #FCA5A5; line-height: 1.6;">
        ${data.cancellationReason}
      </div>
    </div>

    <!-- Fan Card Reassurance Box -->
    <div style="background-color: #0E0E12; border: 1px solid #2A2A38; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #D4AF37; margin-bottom: 6px;">
        Physical Fan Card Production Notice
      </div>
      <p style="font-size: 13px; color: #9E9EAF; margin: 0; line-height: 1.6;">
        Your commemorative VIP Fan Card production order is unaffected by this schedule change and continues on its fulfillment trajectory. You can monitor your physical card's delivery anytime using your private code.
      </p>
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Important notice: Your VIP Meet & Greet schedule for ${data.cityName} has been cancelled.`,
    badgeText: "VIP SCHEDULE CANCELLED",
    headline: "VIP Schedule Cancelled",
    subheadline: `Official Notice &bull; ${data.cityName}, ${data.cityState}`,
    contentHtml,
    ctaText: "Track Your Physical Fan Card",
    ctaUrl: trackingUrl,
    footerNotes: "If you have questions regarding this notice, please contact tour operations.",
  });

  return { subject, html, text };
}

