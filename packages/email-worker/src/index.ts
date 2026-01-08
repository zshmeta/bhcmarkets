/**
 * Email Worker
 *
 * Stateless, low-latency email sending service for the trading platform.
 *
 * Endpoints:
 *   POST /send-email - Send a transactional email
 *   GET  /health     - Health check endpoint
 *
 * Authentication: Requires X-API-Key header
 *
 * @see README.md for full documentation
 */

import type {
  EmailWorkerEnv,
  SendEmailRequest,
  SendEmailResponse,
  EmailMessage,
  TemplateContext,
} from './types';
import { createEmailProvider } from './providers';
import { createTemplateRenderer } from './templates';
import {
  validateApiKey,
  validateSendEmailRequest,
  checkRateLimit,
  getRateLimitKey
} from './middleware';
import {
  successResponse,
  badRequest,
  unauthorized,
  notFound,
  methodNotAllowed,
  tooManyRequests,
  serverError,
  serviceUnavailable,
  corsPreflightResponse,
  withCors,
  jsonResponse,
} from './utils';

/**
 * Main request handler
 */
async function handleRequest(
  request: Request,
  env: EmailWorkerEnv
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // Route: Health check
  if (path === '/health' || path === '/') {
    if (request.method !== 'GET') {
      return methodNotAllowed(['GET']);
    }
    return jsonResponse({
      status: 'ok',
      service: 'email-worker',
      timestamp: new Date().toISOString(),
    });
  }

  // Route: Send email
  if (path === '/send-email') {
    if (request.method !== 'POST') {
      return methodNotAllowed(['POST']);
    }
    return handleSendEmail(request, env);
  }

  // 404 for unknown routes
  return notFound(`Unknown endpoint: ${path}`);
}

/**
 * Handle POST /send-email
 */
async function handleSendEmail(
  request: Request,
  env: EmailWorkerEnv
): Promise<Response> {
  // 1. Authenticate
  const authResult = validateApiKey(request, env);
  if (!authResult.authenticated) {
    return unauthorized(authResult.error);
  }

  // 2. Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  const rateLimitResult = await checkRateLimit(rateLimitKey, env);
  if (!rateLimitResult.allowed) {
    return tooManyRequests(rateLimitResult.resetAt);
  }

  // 3. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON in request body');
  }

  // 4. Validate request
  const validationResult = validateSendEmailRequest(body);
  if (!validationResult.valid || !validationResult.data) {
    return badRequest(validationResult.error || 'Invalid request');
  }

  const emailRequest = validationResult.data;
  const { type, to, userId, emailRef, payload } = emailRequest;

  try {
    // 5. Render template
    const templateRenderer = createTemplateRenderer(env);
    const templateContext: TemplateContext = {
      to,
      userId,
      emailRef,
      payload,
    };
    const rendered = templateRenderer.render(type, templateContext);

    // 6. Build email message
    const senderName = env.SENDER_NAME || 'Trading Platform';
    const senderEmail = env.SENDER_EMAIL;

    if (!senderEmail) {
      console.error('SENDER_EMAIL not configured');
      return serviceUnavailable('Email service not properly configured', emailRef);
    }

    const emailMessage: EmailMessage = {
      to,
      from: `${senderName} <${senderEmail}>`,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: env.REPLY_TO_EMAIL,
      tags: [type, `user:${userId}`],
      metadata: {
        emailRef,
        userId,
        type,
      },
    };

    // 7. Send via provider
    const provider = createEmailProvider(env);
    const sendResult = await provider.send(emailMessage);

    if (!sendResult.success) {
      console.error(`Email send failed via ${provider.name}:`, sendResult.error);
      return serverError(
        `Failed to send email: ${sendResult.error}`,
        emailRef
      );
    }

    // 8. Return success response
    const response: SendEmailResponse = {
      success: true,
      emailRef,
      providerId: sendResult.providerId,
      message: `Email sent successfully via ${provider.name}`,
    };

    console.log(`Email sent: type=${type}, to=${to}, ref=${emailRef}, providerId=${sendResult.providerId}`);

    return successResponse(response);

  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return serverError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      emailRef
    );
  }
}

/**
 * Cloudflare Worker export
 */
export default {
  async fetch(request: Request, env: EmailWorkerEnv, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await handleRequest(request, env);
      // Add CORS headers to all responses
      return withCors(response);
    } catch (error) {
      console.error('Unhandled error:', error);
      return withCors(serverError('Internal server error'));
    }
  },
} satisfies ExportedHandler<EmailWorkerEnv>;

// Re-export types for consumers
export type {
  SendEmailRequest,
  SendEmailResponse,
  EmailType,
  EmailPayload,
} from './types';
