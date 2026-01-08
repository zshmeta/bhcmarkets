/**
 * Postmark Email Provider
 * https://postmarkapp.com/developer/api/email-api
 */

import type { IEmailProvider, EmailMessage, ProviderSendResult } from '../types';

export class PostmarkProvider implements IEmailProvider {
  name = 'postmark' as const;
  private apiKey: string;
  private baseUrl = 'https://api.postmarkapp.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      // Parse 'from' field
      const fromMatch = message.from.match(/^(.+?)\s*<(.+)>$/);
      const fromEmail = fromMatch ? fromMatch[2] : message.from;
      const fromName = fromMatch ? fromMatch[1].trim() : undefined;

      const payload: Record<string, unknown> = {
        From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        To: message.to,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        MessageStream: 'outbound',
      };

      if (message.replyTo) {
        payload.ReplyTo = message.replyTo;
      }

      // Add tags (Postmark supports a single tag)
      if (message.tags && message.tags.length > 0) {
        payload.Tag = message.tags[0];
      }

      // Add metadata
      if (message.metadata) {
        payload.Metadata = {
          email_ref: message.metadata.emailRef,
          user_id: message.metadata.userId,
        };
      }

      // Tracking
      payload.TrackOpens = true;
      payload.TrackLinks = 'HtmlOnly';

      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Postmark API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json() as { MessageID: string };
      return {
        success: true,
        providerId: data.MessageID,
      };
    } catch (error) {
      return {
        success: false,
        error: `Postmark provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
