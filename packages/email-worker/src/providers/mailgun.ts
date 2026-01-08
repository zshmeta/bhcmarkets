/**
 * Mailgun Email Provider
 * https://documentation.mailgun.com/en/latest/api-sending-messages.html
 */

import type { IEmailProvider, EmailMessage, ProviderSendResult } from '../types';

export class MailgunProvider implements IEmailProvider {
  name = 'mailgun' as const;
  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  constructor(apiKey: string, domain: string, region: 'us' | 'eu' = 'us') {
    this.apiKey = apiKey;
    this.domain = domain;
    this.baseUrl = region === 'eu'
      ? 'https://api.eu.mailgun.net/v3'
      : 'https://api.mailgun.net/v3';
  }

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    try {
      const formData = new FormData();
      formData.append('from', message.from);
      formData.append('to', message.to);
      formData.append('subject', message.subject);
      formData.append('html', message.html);
      formData.append('text', message.text);

      if (message.replyTo) {
        formData.append('h:Reply-To', message.replyTo);
      }

      // Add tags
      if (message.tags) {
        for (const tag of message.tags) {
          formData.append('o:tag', tag);
        }
      }

      // Add metadata as custom variables
      if (message.metadata) {
        formData.append('v:email_ref', message.metadata.emailRef || '');
        formData.append('v:user_id', message.metadata.userId || '');
      }

      // Tracking options
      formData.append('o:tracking', 'yes');
      formData.append('o:tracking-clicks', 'htmlonly');
      formData.append('o:tracking-opens', 'yes');

      const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.apiKey}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Mailgun API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json() as { id: string; message: string };
      return {
        success: true,
        providerId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Mailgun provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
