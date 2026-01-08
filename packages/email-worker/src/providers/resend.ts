/**
 * Resend Email Provider
 * https://resend.com/docs/api-reference/emails/send-email
 */

import type { IEmailProvider, EmailMessage, ProviderSendResult } from '../types';

export class ResendProvider implements IEmailProvider {
  name = 'resend' as const;
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          tags: message.tags?.map(tag => ({ name: tag, value: tag })),
          headers: message.metadata ? {
            'X-Email-Ref': message.metadata.emailRef,
            'X-User-Id': message.metadata.userId,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Resend API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json() as { id: string };
      return {
        success: true,
        providerId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Resend provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
