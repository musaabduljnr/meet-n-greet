import { wrapInBaseEmailLayout } from "./base-layout";
import type { FanCardStatusEmailData, FanCardTrackingEmailData } from "../types";

/**
 * 2. Dedicated Fan Card Tracking Information Email
 */
export function renderFanCardTrackingInfoEmail(data: FanCardTrackingEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `💳 Your Kountry Wayne VIP Fan Card Tracking Code (${data.trackingCode})`;

  const trackingUrl =
    data.trackingUrl ||
    `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(data.trackingCode)}`;

  const text = `
Hello ${data.fanName},

Here is your private tracking code for your commemorative Kountry Wayne VIP Fan Card.

FAN CARD FULFILLMENT OVERVIEW:
- Tracking Code: ${data.trackingCode}
- Current Status: ${data.statusLabel}
- Destination: ${data.cityName}, ${data.cityState}

Track your physical delivery timeline live:
${trackingUrl}

Our tour fulfillment team manually controls and verifies every milestone stage from custom metal embossing through courier delivery.

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${data.fanName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Here is your private access credential to track the fulfillment and delivery of your custom commemorative Kountry Wayne VIP Fan Card.
    </p>

    <!-- Tracking Code Showcase -->
    <div style="text-align: center; background-color: #0E0E12; border: 1px dashed #D4AF37; border-radius: 8px; padding: 22px; margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; font-weight: 700; margin-bottom: 8px;">
        Private Tracking Code
      </div>
      <div style="font-family: monospace; font-size: 26px; font-weight: 800; color: #F8F8FC; letter-spacing: 3px;">
        ${data.trackingCode}
      </div>
      <div style="font-size: 12px; color: #9E9EAF; margin-top: 8px;">
        Current Delivery Stage: <strong style="color: #D4AF37;">${data.statusLabel}</strong> &bull; ${data.cityName}, ${data.cityState}
      </div>
    </div>

    <!-- Fulfillment Notice -->
    <div style="background-color: #1A1A22; border: 1px solid #2A2A38; border-radius: 8px; padding: 16px 20px; font-size: 13px; color: #C8C8DC; line-height: 1.6;">
      Each commemorative card is personally embossed and packaged by tour operations. Click below to view the verified 7-stage delivery milestone tracker.
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Your Fan Card tracking code is ${data.trackingCode}. Current status: ${data.statusLabel}.`,
    badgeText: "FAN CARD TRACKING",
    headline: "Track Your Physical Fan Card",
    subheadline: `Live Delivery Status &bull; ${data.cityName}, ${data.cityState}`,
    contentHtml,
    ctaText: "Track Delivery Progress",
    ctaUrl: trackingUrl,
    footerNotes: "Do not share this tracking code publicly as it is your private delivery access key.",
  });

  return { subject, html, text };
}

// Metadata configuration for all 7 fulfillment statuses + Delivery Issue
interface StatusMeta {
  subject: string;
  badge: string;
  headline: string;
  subheadline: string;
  summary: string;
  isIssue?: boolean;
}

const STATUS_METADATA: Record<FanCardStatusEmailData["status"], StatusMeta> = {
  PROCESSING: {
    subject: "🛠️ Your Kountry Wayne VIP Fan Card is in Processing",
    badge: "STAGE 2 &bull; PROCESSING",
    headline: "Embossing & Verification Started",
    subheadline: "Metal Card Stamping & Inscription",
    summary:
      "Your physical commemorative VIP Fan Card has been queued in our tour manufacturing facility. The card is currently undergoing personalized metal embossing and custom security encoding.",
  },
  PREPARED: {
    subject: "✨ Your Kountry Wayne VIP Fan Card is Prepared",
    badge: "STAGE 3 &bull; PREPARED",
    headline: "Card Manufactured & Packaged",
    subheadline: "Quality Inspection Complete",
    summary:
      "Your custom VIP Fan Card has passed quality inspection, has been encased in protective archival tour packaging, and is staged at the dispatch dock awaiting courier collection.",
  },
  SHIPPED: {
    subject: "📦 Your Kountry Wayne VIP Fan Card has Shipped!",
    badge: "STAGE 4 &bull; SHIPPED",
    headline: "Dispatched from Tour Center",
    subheadline: "Courier Manifest Generated",
    summary:
      "Your commemorative card has been dispatched from our central tour operations fulfillment center and handed off into our regional distribution network.",
  },
  IN_TRANSIT: {
    subject: "🚚 Your Kountry Wayne VIP Fan Card is In Transit",
    badge: "STAGE 5 &bull; IN TRANSIT",
    headline: "En Route to Your Destination",
    subheadline: "Regional Transfer in Progress",
    summary:
      "Your package is moving through our regional courier hubs toward your registered city. Tour dispatch confirms continuous transit progress.",
  },
  OUT_FOR_DELIVERY: {
    subject: "📬 Out for Delivery: Your Kountry Wayne VIP Fan Card",
    badge: "STAGE 6 &bull; OUT FOR DELIVERY",
    headline: "On Courier Vehicle Today",
    subheadline: "Final Mile Delivery in Progress",
    summary:
      "Your commemorative Fan Card is on the courier delivery vehicle for arrival at your registered destination address today.",
  },
  DELIVERED: {
    subject: "🎉 Delivered: Your Kountry Wayne VIP Fan Card Has Arrived!",
    badge: "STAGE 7 &bull; DELIVERED",
    headline: "Successfully Delivered",
    subheadline: "VIP Package Complete",
    summary:
      "Your commemorative VIP Fan Card has been delivered. Please keep this card safe and bring it with you to your tour city Meet & Greet check-in!",
  },
  DELIVERY_ISSUE: {
    subject: "⚠️ Notice: Delivery Exception on Your Kountry Wayne Fan Card",
    badge: "FULFILLMENT EXCEPTION",
    headline: "Delivery Issue Reported",
    subheadline: "Tour Operations Attention Required",
    summary:
      "A delivery exception or address anomaly was reported during the fulfillment of your card. Our guest operations team is currently reviewing your shipment.",
    isIssue: true,
  },
};

/**
 * 5-11. Fan Card Status Update Emails (Processing, Prepared, Shipped, In Transit, Out for Delivery, Delivered, Delivery Issue)
 */
export function renderFanCardStatusEmail(data: FanCardStatusEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const meta = STATUS_METADATA[data.status] || {
    subject: `📦 Status Update: Your Kountry Wayne Fan Card is ${data.statusLabel}`,
    badge: "STATUS UPDATE",
    headline: `Status: ${data.statusLabel}`,
    subheadline: "Fulfillment Update",
    summary: `Your Fan Card status has been updated to ${data.statusLabel}.`,
  };

  const trackingUrl =
    data.trackingUrl ||
    `https://kountrywayne-meetngreet.vercel.app/track?code=${encodeURIComponent(data.trackingCode)}`;

  const text = `
Hello ${data.fanName},

Your Kountry Wayne VIP Fan Card fulfillment status has been updated by tour operations:

CURRENT STATUS: ${data.statusLabel.toUpperCase()}
- Tracking Code: ${data.trackingCode}
- Tour Stop: ${data.cityName}, ${data.cityState}
- Last Updated: ${data.lastUpdated}
${data.courierReference ? `- Courier Reference: ${data.courierReference}\n` : ""}${data.deliveryIssueNote ? `- Notice: ${data.deliveryIssueNote}\n` : ""}
DETAILS:
${meta.summary}

Track your full milestone delivery timeline live:
${trackingUrl}

Best regards,
Kountry Wayne Tour Operations Desk
`.trim();

  const contentHtml = `
    <p style="margin: 0 0 16px 0;">
      Hello <strong style="color: #F8F8FC;">${data.fanName}</strong>,
    </p>

    <!-- Exception Banner if applicable -->
    ${
      meta.isIssue
        ? `
      <div style="background-color: #261616; border: 1px solid #E05252; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FFA3A3; font-weight: 700; margin-bottom: 4px;">
          Delivery Exception Alert
        </div>
        <div style="font-size: 13px; color: #F8F8FC; line-height: 1.5;">
          ${data.deliveryIssueNote || "Courier reported an address or delivery exception. Please contact our tour guest support desk to confirm your physical shipping coordinates."}
        </div>
      </div>
    `
        : ""
    }

    <!-- Status Overview Card -->
    <div style="background-color: #1A1A22; border: 1px solid #2A2A38; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Current Stage:</td>
          <td align="right" style="padding: 6px 0; font-size: 14px; color: ${meta.isIssue ? "#FFA3A3" : "#D4AF37"}; font-weight: 800;">${data.statusLabel}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Tracking Code:</td>
          <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 14px; color: #F8F8FC; font-weight: 700;">${data.trackingCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Tour Stop:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; color: #F8F8FC; font-weight: 600;">${data.cityName}, ${data.cityState}</td>
        </tr>
        ${
          data.courierReference
            ? `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Courier Ref:</td>
          <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 13px; color: #E0E0EC;">${data.courierReference}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #8E8E9E;">Updated:</td>
          <td align="right" style="padding: 6px 0; font-size: 12px; color: #8E8E9E;">${data.lastUpdated}</td>
        </tr>
      </table>
    </div>

    <!-- Explanation Box -->
    <div style="background-color: #0E0E12; border: 1px solid #2A2A38; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 700; margin-bottom: 6px;">
        Fulfillment Stage Notes
      </div>
      <div style="font-size: 13px; color: #C8C8DC; line-height: 1.6;">
        ${meta.summary}
      </div>
    </div>
  `;

  const html = wrapInBaseEmailLayout({
    preheader: `Your Fan Card status is now ${data.statusLabel}. Tracking code: ${data.trackingCode}.`,
    badgeText: meta.badge,
    headline: meta.headline,
    subheadline: `${meta.subheadline} &bull; ${data.cityName}`,
    contentHtml,
    ctaText: "Track Live Delivery Timeline",
    ctaUrl: trackingUrl,
    footerNotes: "All Fan Card fulfillment stages are manually verified by tour operations.",
  });

  return {
    subject: meta.subject,
    html,
    text,
  };
}
