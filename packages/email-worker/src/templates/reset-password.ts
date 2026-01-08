/**
 * Reset Password Email Template
 */

import type { ResetPasswordPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderResetPassword(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as ResetPasswordPayload;
  const firstName = payload.firstName || 'there';
  const resetLink = payload.resetLink;
  const expiresIn = payload.expiresInMinutes || 30;

  const subject = `Reset your ${config.platformName} password`;

  const htmlContent = `
    <h1>Reset Your Password</h1>

    <p>Hi ${firstName},</p>

    <p>We received a request to reset the password for your ${config.platformName} account.</p>

    <p style="text-align: center;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </p>

    <p style="text-align: center; color: #71717a; font-size: 14px;">
      This link expires in <strong>${expiresIn} minutes</strong>
    </p>

    <div class="warning-box">
      <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>

    <div class="info-box">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">${resetLink}</p>
    </div>

    <p>For security reasons, this link can only be used once. If you need to reset your password again, please request a new link.</p>
  `;

  const textContent = `Reset Your Password

Hi ${firstName},

We received a request to reset the password for your ${config.platformName} account.

Reset your password: ${resetLink}

This link expires in ${expiresIn} minutes.

DIDN'T REQUEST THIS?
If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, this link can only be used once. If you need to reset your password again, please request a new link.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
