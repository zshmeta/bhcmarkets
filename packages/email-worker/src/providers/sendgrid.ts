/**
 * SendGrid Email Provider
 * https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

import type { IEmailProvider, EmailMessage, ProviderSendResult } from '../types';

export class SendGridProvider implements IEmailProvider {
  name = 'sendgrid' as const;
  private apiKey: string;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      // Parse 'from' field - could be "Name <email@domain.com>" or just "email@domain.com"
      const fromMatch = message.from.match(/^(.+?)\s*<(.+)>$/);
      const fromEmail = fromMatch ? fromMatch[2] : message.from;
      const fromName = fromMatch ? fromMatch[1].trim() : undefined;

      const payload: Record<string, unknown> = {
        personalizations: [
          {
            to: [{ email: message.to }],
          },
        ],
        from: fromName
          ? { email: fromEmail, name: fromName }
          : { email: fromEmail },
        subject: message.subject,
        content: [
          { type: 'text/plain', value: message.text },
          { type: 'text/html', value: message.html },
        ],
      };

      if (message.replyTo) {
        payload.reply_to = { email: message.replyTo };
      }

      // Add custom args for tracking
      if (message.metadata) {
        (payload.personalizations as Array<Record<string, unknown>>)[0].custom_args = {
          email_ref: message.metadata.emailRef,
          user_id: message.metadata.userId,
        };
      }

      // Add categories/tags
      if (message.tags && message.tags.length > 0) {
        payload.categories = message.tags;
      }

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // SendGrid returns 202 on success with no body
      if (response.status === 202) {
        // Extract message ID from headers
        const messageId = response.headers.get('X-Message-Id');
        return {
          success: true,
          providerId: messageId || 'sent',
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `SendGrid API error: ${response.status} - ${JSON.stringify(errorData)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `SendGrid provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
