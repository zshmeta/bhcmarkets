/**
 * Email Provider Factory
 * Creates provider instances based on configuration
 */

import type { IEmailProvider, EmailProvider, EmailWorkerEnv } from '../types';
import { ResendProvider } from './resend';
import { SendGridProvider } from './sendgrid';
import { MailgunProvider } from './mailgun';
import { PostmarkProvider } from './postmark';

/**
 * Factory function to create the appropriate email provider
 */
export function createEmailProvider(env: EmailWorkerEnv): IEmailProvider {
  const provider = env.EMAIL_PROVIDER as EmailProvider;

  switch (provider) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is required for Resend provider');
      }
      return new ResendProvider(env.RESEND_API_KEY);

    case 'sendgrid':
      if (!env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
      }
      return new SendGridProvider(env.SENDGRID_API_KEY);

    case 'mailgun':
      if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
        throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
      }
      return new MailgunProvider(env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);

    case 'postmark':
      if (!env.POSTMARK_API_KEY) {
        throw new Error('POSTMARK_API_KEY is required for Postmark provider');
      }
      return new PostmarkProvider(env.POSTMARK_API_KEY);

    default:
      throw new Error(`Unknown email provider: ${provider}. Supported: resend, sendgrid, mailgun, postmark`);
  }
}

export { ResendProvider } from './resend';
export { SendGridProvider } from './sendgrid';
export { MailgunProvider } from './mailgun';
export { PostmarkProvider } from './postmark';
