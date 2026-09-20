export interface BaseEmailLayoutOptions {
  preheader: string;
  badgeText?: string;
  headline: string;
  subheadline?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNotes?: string;
}

/**
 * Wraps content in the responsive VIP Kountry Wayne dark obsidian & gold email shell.
 */
export function wrapInBaseEmailLayout(options: BaseEmailLayoutOptions): string {
  const {
    preheader,
    badgeText = "VIP MEET & GREET OPERATIONS",
    headline,
    subheadline,
    contentHtml,
    ctaText,
    ctaUrl,
    footerNotes,
  } = options;

  const ctaButtonHtml =
    ctaText && ctaUrl
      ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #D4AF37; background: linear-gradient(135deg, #E5C07B 0%, #D4AF37 50%, #AA820A 100%); color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 14px 32px; border-radius: 8px; border: 1px solid #F3E5AB; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.25);">
              ${ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; padding: 12px !important; }
      .content-cell { padding: 24px 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F8FC;">
  <!-- Preview Preheader Text -->
  <div style="display: none; font-size: 1px; color: #0A0A0C; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0A0C;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">
          
          <!-- VIP HEADER -->
          <tr>
            <td align="center" style="padding: 16px 0 24px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 900; letter-spacing: 3px; color: #F8F8FC; text-transform: uppercase;">
                      KOUNTRY WAYNE
                    </span>
                    <span style="display: inline-block; margin-left: 6px; padding: 2px 6px; background-color: #1A1A22; border: 1px solid #D4AF37; border-radius: 4px; font-size: 10px; font-weight: 700; color: #D4AF37; letter-spacing: 1.5px;">
                      VIP
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background-color: #141418; border: 1px solid #2A2A38; border-top: 3px solid #D4AF37; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);" class="content-cell">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 32px 28px;">
                <!-- Badge -->
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 8px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>

                <!-- Headline -->
                <tr>
                  <td style="padding-bottom: ${subheadline ? '8px' : '20px'};">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #F8F8FC; letter-spacing: -0.5px; line-height: 1.25;">
                      ${headline}
                    </h1>
                  </td>
                </tr>

                ${
                  subheadline
                    ? `
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #9E9EAF; line-height: 1.5;">
                      ${subheadline}
                    </p>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Content Body -->
                <tr>
                  <td style="font-size: 14px; color: #E0E0EC; line-height: 1.6;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- CTA Button -->
                ${
                  ctaButtonHtml
                    ? `
                <tr>
                  <td align="center">
                    ${ctaButtonHtml}
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Optional Footnotes inside card -->
                ${
                  footerNotes
                    ? `
                <tr>
                  <td style="padding-top: 20px; border-top: 1px solid #22222E; font-size: 12px; color: #828294; line-height: 1.5;">
                    ${footerNotes}
                  </td>
                </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>

          <!-- TRANSACTIONAL & LEGAL FOOTER -->
          <tr>
            <td style="padding: 28px 16px 12px 16px; text-align: center; font-size: 11px; color: #626274; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">
                Questions about your Meet & Greet or Fan Card? Contact our Guest Operations Desk at
                <a href="mailto:vip@kountrywaynetour.com" style="color: #D4AF37; text-decoration: underline;">vip@kountrywaynetour.com</a>.
              </p>
              <p style="margin: 0 0 12px 0;">
                <strong>Transactional Service Notice:</strong> This email was dispatched to provide mandatory schedule confirmation and Fan Card delivery updates regarding your request. You cannot unsubscribe from active fulfillment notifications.
              </p>
              <p style="margin: 0; color: #424250;">
                &copy; ${new Date().getFullYear()} Kountry Wayne Tour Operations. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
