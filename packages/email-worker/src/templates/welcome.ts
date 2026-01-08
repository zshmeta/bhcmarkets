/**
 * Welcome Email Template
 */

import type { WelcomePayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderWelcome(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as WelcomePayload;
  const firstName = payload.firstName || 'there';
  const platformName = payload.platformName || config.platformName;
  const loginUrl = payload.loginUrl || config.platformUrl;

  const subject = `Welcome to ${platformName}! 🎉`;

  const htmlContent = `
    <h1>Welcome to ${platformName}!</h1>

    <p>Hi ${firstName},</p>

    <p>Thank you for joining ${platformName}! We're excited to have you on board.</p>

    <p>Your account has been created successfully, and you're now ready to start trading on our platform.</p>

    <div class="info-box">
      <p><strong>What's next?</strong></p>
      <p>• Complete your profile for enhanced security</p>
      <p>• Enable two-factor authentication (2FA)</p>
      <p>• Make your first deposit to start trading</p>
    </div>

    <p style="text-align: center;">
      <a href="${loginUrl}" class="btn">Get Started</a>
    </p>

    <p>If you have any questions, our support team is here to help 24/7.</p>

    <p>Welcome aboard!<br>The ${platformName} Team</p>
  `;

  const textContent = `Welcome to ${platformName}!

Hi ${firstName},

Thank you for joining ${platformName}! We're excited to have you on board.

Your account has been created successfully, and you're now ready to start trading on our platform.

What's next?
• Complete your profile for enhanced security
• Enable two-factor authentication (2FA)
• Make your first deposit to start trading

Get Started: ${loginUrl}

If you have any questions, our support team is here to help 24/7.

Welcome aboard!
The ${platformName} Team`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
