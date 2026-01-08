# Email Worker

A stateless, low-latency Cloudflare Worker for sending transactional emails from the trading platform.

## Features

- ✅ **Multiple Email Types**: Welcome, 2FA, password reset, registration, trade notifications, and more
- ✅ **Provider Agnostic**: Supports Resend, SendGrid, Mailgun, and Postmark
- ✅ **Beautiful Templates**: Responsive HTML + plaintext emails
- ✅ **Rate Limiting**: Optional KV-based rate limiting
- ✅ **Secure**: API key authentication, timing-safe comparison
- ✅ **Traceable**: `emailRef` for external audit/logging
- ✅ **Stateless**: No internal persistence, fully RFC-compliant

## Quick Start

### 1. Install Dependencies

```bash
cd packages/email-worker
bun install
```

### 2. Configure Secrets

```bash
# Required
wrangler secret put API_KEY          # API key for authentication
wrangler secret put SENDER_EMAIL     # Sender email (e.g., noreply@email.yourdomain.com)

# Provider API key (based on EMAIL_PROVIDER in wrangler.jsonc)
wrangler secret put RESEND_API_KEY   # If using Resend
# OR
wrangler secret put SENDGRID_API_KEY # If using SendGrid
# OR
wrangler secret put MAILGUN_API_KEY  # If using Mailgun
wrangler secret put MAILGUN_DOMAIN   # If using Mailgun
# OR
wrangler secret put POSTMARK_API_KEY # If using Postmark
```

### 3. Update Configuration

Edit `wrangler.jsonc` to set your platform details:

```jsonc
"vars": {
  "PLATFORM_NAME": "Your Platform",
  "PLATFORM_URL": "https://yourplatform.com",
  "SUPPORT_EMAIL": "support@yourplatform.com",
  "SENDER_NAME": "Your Platform",
  "EMAIL_PROVIDER": "resend"  // or "sendgrid", "mailgun", "postmark"
}
```

### 4. Run Locally

```bash
bun run dev
```

### 5. Deploy

```bash
bun run deploy                # Development
bun run deploy:staging        # Staging
bun run deploy:production     # Production
```

## API Reference

### `POST /send-email`

Send a transactional email.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: <your-api-key>` (required)

**Request Body:**

```json
{
  "type": "welcome",
  "to": "user@example.com",
  "userId": "USR_123",
  "emailRef": "welcome_USR_123_2026-01-08",
  "payload": {
    "firstName": "John",
    "loginUrl": "https://platform.example.com/login"
  }
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "emailRef": "welcome_USR_123_2026-01-08",
  "providerId": "re_abc123...",
  "message": "Email sent successfully via resend"
}
```

**Response (Error - 4xx/5xx):**

```json
{
  "success": false,
  "error": "Error description",
  "emailRef": "welcome_USR_123_2026-01-08",
  "code": "BAD_REQUEST"
}
```

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "service": "email-worker",
  "timestamp": "2026-01-08T22:30:00.000Z"
}
```

## Supported Email Types

| Type | Description | Required Payload Fields |
|------|-------------|------------------------|
| `welcome` | Welcome/onboarding | `firstName?`, `loginUrl?` |
| `2fa` | 2FA code delivery | `code` |
| `registration_confirmation` | Email verification | `confirmationLink` |
| `reset_password` | Password reset | `resetLink` |
| `email_change` | Email change confirmation | `newEmail`, `confirmationLink` |
| `withdrawal_processed` | Withdrawal notification | `amount`, `currency`, `withdrawalMethod`, `transactionId`, `processedAt` |
| `deposit_confirmation` | Deposit confirmation | `amount`, `currency`, `depositMethod`, `transactionId`, `confirmedAt` |
| `trade_opened` | Trade opened notification | `symbol`, `side`, `quantity`, `price`, `orderId`, `openedAt` |
| `trade_closed` | Trade closed notification | `symbol`, `side`, `quantity`, `openPrice`, `closePrice`, `orderId`, `closedAt`, `pnl`, `pnlPercentage` |
| `notification` | General notification | `subject`, `message` |

## Example Requests

### Welcome Email

```bash
curl -X POST https://email-worker.your-account.workers.dev/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "welcome",
    "to": "user@example.com",
    "userId": "USR_001",
    "emailRef": "welcome_USR_001_1704758400",
    "payload": {
      "firstName": "John"
    }
  }'
```

### 2FA Code

```bash
curl -X POST https://email-worker.your-account.workers.dev/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "2fa",
    "to": "user@example.com",
    "userId": "USR_001",
    "emailRef": "2fa_USR_001_1704758400",
    "payload": {
      "code": "123456",
      "expiresInMinutes": 10
    }
  }'
```

### Trade Opened

```bash
curl -X POST https://email-worker.your-account.workers.dev/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "trade_opened",
    "to": "trader@example.com",
    "userId": "USR_001",
    "emailRef": "trade_EURUSD_BUY_1.0850_20260108_2230",
    "payload": {
      "firstName": "John",
      "symbol": "EUR/USD",
      "side": "BUY",
      "quantity": "1.0",
      "price": "1.0850",
      "orderId": "ORD_12345",
      "openedAt": "2026-01-08 22:30:00 UTC",
      "leverage": "100",
      "stopLoss": "1.0800",
      "takeProfit": "1.0950"
    }
  }'
```

## Environment Variables

### Required Secrets

| Name | Description |
|------|-------------|
| `API_KEY` | API key for authenticating requests |
| `SENDER_EMAIL` | Email address to send from |

### Provider Secrets (choose one set)

| Provider | Required Secrets |
|----------|-----------------|
| Resend | `RESEND_API_KEY` |
| SendGrid | `SENDGRID_API_KEY` |
| Mailgun | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` |
| Postmark | `POSTMARK_API_KEY` |

### Configuration Variables

| Name | Description | Default |
|------|-------------|---------|
| `PLATFORM_NAME` | Platform name for emails | "Trading Platform" |
| `PLATFORM_URL` | Platform URL | - |
| `SUPPORT_EMAIL` | Support email address | - |
| `SENDER_NAME` | Display name for sender | "Trading Platform" |
| `EMAIL_PROVIDER` | Provider to use | "resend" |
| `REPLY_TO_EMAIL` | Reply-to address (optional) | - |

## Rate Limiting

Optional rate limiting using Cloudflare KV:

1. Create KV namespace:
   ```bash
   wrangler kv:namespace create RATE_LIMIT_KV
   ```

2. Add to `wrangler.jsonc`:
   ```jsonc
   "kv_namespaces": [
     {
       "binding": "RATE_LIMIT_KV",
       "id": "your-namespace-id"
     }
   ]
   ```

Default limits: 100 requests per minute per API key.

## Email Deliverability

For best deliverability:

1. **Use a dedicated subdomain** (e.g., `email.yourdomain.com`)
2. **Configure SPF, DKIM, DMARC** via your provider
3. **Verify domain** in your email provider dashboard
4. **Avoid freemail senders** (no `@gmail.com`)

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Platform       │  POST   │  Email Worker    │  HTTPS  │  Email Provider │
│  Backend        │────────▶│  (Cloudflare)    │────────▶│  (Resend, etc)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                    │
                                    │ emailRef
                                    ▼
                            ┌──────────────────┐
                            │  External Logs   │
                            │  (Caller's DB)   │
                            └──────────────────┘
```

## Project Structure

```
src/
├── index.ts              # Worker entry point
├── types/
│   └── index.ts          # TypeScript types
├── templates/
│   ├── base.ts           # Base HTML template
│   ├── welcome.ts        # Welcome email
│   ├── 2fa.ts            # 2FA code email
│   ├── registration-confirmation.ts
│   ├── reset-password.ts
│   ├── email-change.ts
│   ├── withdrawal-processed.ts
│   ├── deposit-confirmation.ts
│   ├── trade-opened.ts
│   ├── trade-closed.ts
│   ├── notification.ts   # Generic notification
│   └── index.ts          # Template renderer
├── providers/
│   ├── resend.ts
│   ├── sendgrid.ts
│   ├── mailgun.ts
│   ├── postmark.ts
│   └── index.ts          # Provider factory
├── middleware/
│   ├── auth.ts           # API key validation
│   ├── validation.ts     # Request validation
│   ├── rate-limiter.ts   # Rate limiting
│   └── index.ts
└── utils/
    ├── response.ts       # HTTP response helpers
    └── index.ts
```

## License

Private - Trading Platform
