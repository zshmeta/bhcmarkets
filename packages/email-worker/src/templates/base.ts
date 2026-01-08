/**
 * Base Email Template
 * Provides the HTML layout wrapper for all email templates
 */

export interface BaseTemplateConfig {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  primaryColor?: string;
  logoUrl?: string;
}

const DEFAULT_PRIMARY_COLOR = '#2563eb';

/**
 * Wraps email content in a responsive HTML layout
 */
export function wrapInBaseTemplate(
  content: string,
  config: BaseTemplateConfig
): string {
  const primaryColor = config.primaryColor || DEFAULT_PRIMARY_COLOR;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.platformName}</title>
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
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .email-content {
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      margin: 20px;
    }

    .email-header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 1px solid #e4e4e7;
      margin-bottom: 30px;
    }

    .email-footer {
      text-align: center;
      padding: 20px;
      color: #71717a;
      font-size: 12px;
      line-height: 1.5;
    }

    .email-footer a {
      color: #71717a;
      text-decoration: underline;
    }

    h1 {
      color: #18181b;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }

    p {
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }

    .btn:hover {
      background-color: #1d4ed8;
    }

    .code-box {
      background-color: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }

    .code {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #18181b;
    }

    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid ${primaryColor};
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }

    .info-box p {
      margin: 0;
      color: #0369a1;
      font-size: 14px;
    }

    .warning-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }

    .warning-box p {
      margin: 0;
      color: #b45309;
      font-size: 14px;
    }

    .success-box {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }

    .success-box p {
      margin: 0;
      color: #15803d;
      font-size: 14px;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #e4e4e7;
      font-size: 14px;
    }

    .details-table td:first-child {
      color: #71717a;
      width: 40%;
    }

    .details-table td:last-child {
      color: #18181b;
      font-weight: 500;
    }

    .trade-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .trade-badge.buy {
      background-color: #dcfce7;
      color: #15803d;
    }

    .trade-badge.sell {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .pnl-positive {
      color: #15803d;
    }

    .pnl-negative {
      color: #dc2626;
    }

    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 24px !important;
        margin: 10px !important;
      }

      h1 {
        font-size: 20px !important;
      }

      .code {
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td class="email-content" style="background-color: #ffffff; padding: 40px; border-radius: 8px;">
              <div class="email-header" style="text-align: center; padding-bottom: 30px; border-bottom: 1px solid #e4e4e7; margin-bottom: 30px;">
                ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.platformName}" height="40" style="height: 40px;">` : `<span style="font-size: 24px; font-weight: 700; color: ${primaryColor};">${config.platformName}</span>`}
              </div>

              <!-- Main Content -->
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="text-align: center; padding: 20px; color: #71717a; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px;">
                © ${new Date().getFullYear()} ${config.platformName}. All rights reserved.
              </p>
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px;">
                Need help? Contact us at <a href="mailto:${config.supportEmail}" style="color: #71717a;">${config.supportEmail}</a>
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                This is a transactional email from ${config.platformName}.<br>
                You're receiving this because of activity on your account.
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

/**
 * Creates a plain text version of the email
 */
export function createPlainTextWrapper(
  content: string,
  config: BaseTemplateConfig
): string {
  return `${config.platformName}
${'='.repeat(config.platformName.length)}

${content}

---
© ${new Date().getFullYear()} ${config.platformName}. All rights reserved.
Need help? Contact us at ${config.supportEmail}

This is a transactional email. You're receiving this because of activity on your account.
`;
}
