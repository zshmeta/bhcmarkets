/**
 * Two-Factor Authentication Email Template
 */

import type { TwoFactorPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function render2FA(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as TwoFactorPayload;
  const firstName = payload.firstName || 'there';
  const code = payload.code;
  const expiresIn = payload.expiresInMinutes || 10;

  const subject = `Your verification code: ${code}`;

  const htmlContent = `
    <h1>Your Verification Code</h1>

    <p>Hi ${firstName},</p>

    <p>You requested a verification code to access your ${config.platformName} account.</p>

    <div class="code-box">
      <span class="code">${code}</span>
    </div>

    <p style="text-align: center; color: #71717a; font-size: 14px;">
      This code expires in <strong>${expiresIn} minutes</strong>
    </p>

    <div class="warning-box">
      <p><strong>Security Notice:</strong> Never share this code with anyone. ${config.platformName} will never ask you for this code over phone or chat.</p>
    </div>

    <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
  `;

  const textContent = `Your Verification Code

Hi ${firstName},

You requested a verification code to access your ${config.platformName} account.

Your code: ${code}

This code expires in ${expiresIn} minutes.

SECURITY NOTICE: Never share this code with anyone. ${config.platformName} will never ask you for this code over phone or chat.

If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
