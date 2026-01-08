/**
 * Registration Confirmation Email Template
 */

import type { RegistrationConfirmationPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderRegistrationConfirmation(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as RegistrationConfirmationPayload;
  const firstName = payload.firstName || 'there';
  const confirmationLink = payload.confirmationLink;
  const expiresIn = payload.expiresInHours || 24;

  const subject = `Confirm your ${config.platformName} account`;

  const htmlContent = `
    <h1>Confirm Your Email Address</h1>

    <p>Hi ${firstName},</p>

    <p>Thank you for registering with ${config.platformName}. To complete your registration and activate your account, please confirm your email address.</p>

    <p style="text-align: center;">
      <a href="${confirmationLink}" class="btn">Confirm Email Address</a>
    </p>

    <p style="text-align: center; color: #71717a; font-size: 14px;">
      This link expires in <strong>${expiresIn} hours</strong>
    </p>

    <div class="info-box">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">${confirmationLink}</p>
    </div>

    <p>If you didn't create an account with us, you can safely ignore this email.</p>
  `;

  const textContent = `Confirm Your Email Address

Hi ${firstName},

Thank you for registering with ${config.platformName}. To complete your registration and activate your account, please confirm your email address.

Confirm your email: ${confirmationLink}

This link expires in ${expiresIn} hours.

If you didn't create an account with us, you can safely ignore this email.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
