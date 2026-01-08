/**
 * Auth Email Notifications
 *
 * Email notification triggers for authentication-related events.
 * This module provides functions to send emails after auth operations.
 */

import type { IEmailClient } from '../../services/email/index.js';
import type { User } from './auth.types.js';

export interface AuthEmailConfig {
  platformUrl: string;
  platformName: string;
}

export interface AuthEmailService {
  /** Send welcome email after registration */
  sendWelcomeEmail(user: User): Promise<void>;

  /** Send registration confirmation with verification link */
  sendRegistrationConfirmation(user: User, confirmationToken: string): Promise<void>;

  /** Send 2FA code */
  send2FACode(user: User, code: string, expiresInMinutes?: number): Promise<void>;

  /** Send password reset email */
  sendPasswordResetEmail(user: User, resetToken: string): Promise<void>;

  /** Send email change confirmation */
  sendEmailChangeConfirmation(user: User, newEmail: string, confirmationToken: string): Promise<void>;
}

/**
 * Create auth email notification service.
 */
export function createAuthEmailService(
  emailClient: IEmailClient,
  config: AuthEmailConfig
): AuthEmailService {
  const { platformUrl, platformName } = config;

  return {
    async sendWelcomeEmail(user: User): Promise<void> {
      try {
        await emailClient.sendWelcome(user.email, user.id, {
          firstName: extractFirstName(user),
          platformName,
          loginUrl: `${platformUrl}/login`,
        });
      } catch (error) {
        // Log but don't fail the registration
        console.error('Failed to send welcome email:', error);
      }
    },

    async sendRegistrationConfirmation(user: User, confirmationToken: string): Promise<void> {
      try {
        const confirmationLink = `${platformUrl}/verify-email?token=${encodeURIComponent(confirmationToken)}`;
        await emailClient.sendRegistrationConfirmation(user.email, user.id, {
          firstName: extractFirstName(user),
          confirmationLink,
          expiresInHours: 24,
        });
      } catch (error) {
        console.error('Failed to send registration confirmation email:', error);
      }
    },

    async send2FACode(user: User, code: string, expiresInMinutes = 10): Promise<void> {
      try {
        await emailClient.send2FA(user.email, user.id, {
          firstName: extractFirstName(user),
          code,
          expiresInMinutes,
        });
      } catch (error) {
        console.error('Failed to send 2FA code email:', error);
      }
    },

    async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
      try {
        const resetLink = `${platformUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
        await emailClient.sendPasswordReset(user.email, user.id, {
          firstName: extractFirstName(user),
          resetLink,
          expiresInMinutes: 60,
        });
      } catch (error) {
        console.error('Failed to send password reset email:', error);
      }
    },

    async sendEmailChangeConfirmation(user: User, newEmail: string, confirmationToken: string): Promise<void> {
      try {
        const confirmationLink = `${platformUrl}/confirm-email-change?token=${encodeURIComponent(confirmationToken)}`;

        // Send to the NEW email address
        await emailClient.sendEmailChange(newEmail, user.id, {
          firstName: extractFirstName(user),
          newEmail,
          confirmationLink,
          expiresInHours: 24,
        });
      } catch (error) {
        console.error('Failed to send email change confirmation:', error);
      }
    },
  };
}

/**
 * Extract first name from user (placeholder - extend with profile data).
 */
function extractFirstName(user: User): string | undefined {
  // If user has a profile with firstName, return it
  // For now, we don't have profile data in User type
  // Could parse from email or return undefined
  return undefined;
}
