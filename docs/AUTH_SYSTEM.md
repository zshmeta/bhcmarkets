# Enterprise-Grade Auth System

This document provides an overview of the enterprise-grade authentication system implemented for BHC Markets.

## 🏗️ Architecture Overview

The auth system follows a clean architecture pattern with strict separation of concerns:

### Backend (`/packages/backend/src/domains/auth`)

```
auth/
├── core/                   # Domain logic & business rules
│   ├── auth.service.ts     # Orchestrates all auth use-cases
│   ├── auth.errors.ts      # Typed error codes (70+ error types)
│   ├── auth.policies.ts    # Security policies (password, session, MFA, etc.)
│   ├── auth.config.ts      # Centralized configuration
│   └── auth.types.ts       # Domain contracts & interfaces
│
├── controllers/            # HTTP adapters (framework-agnostic)
│   ├── login.controller.ts
│   ├── register.controller.ts
│   ├── refresh.controller.ts
│   ├── logout.controller.ts
│   └── sessions.controller.ts
│
├── routes/                 # HTTP route wiring
│   └── auth.routes.ts
│
├── repositories/           # Data persistence
│   └── repositories.pg.ts # PostgreSQL implementations
│
├── tokens/                 # JWT token management
│   ├── token.manager.ts    # Abstract interface
│   ├── jwt.access.ts       # Access token (15 min TTL)
│   ├── jwt.refresh.ts      # Refresh token (30 day TTL)
│   └── jwt.token.manager.ts # Combined manager
│
├── security/               # Security features
│   ├── password.policy.ts  # Password validation & strength
│   ├── rate.limit.ts       # IP & account rate limiting
│   ├── anomaly.detector.ts # Threat detection
│   └── device.fingerprint.ts # Device identification
│
├── mfa/ (planned)          # Multi-factor authentication
├── flows/ (planned)        # Auth flows (reset, verify, etc.)
├── events/ (planned)       # Domain events & audit
└── validators/             # Input validation (Zod schemas)
    └── auth.validator.ts
```

### Frontend (`/apps/auth`)

```
auth/
├── app/                    # App configuration
│   ├── router.tsx          # Client-side routing
│   └── providers.tsx       # Context providers
│
├── pages/                  # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── (more pages planned)
│
├── features/               # Feature modules
│   └── auth/
│       ├── auth.api.ts     # API client
│       ├── auth.types.ts   # Type definitions
│       ├── auth.store.ts   # State management (React Context)
│       └── auth.hooks.ts   # Custom hooks
│
├── components/             # Reusable components
│   └── auth/ (planned)
│
├── lib/                    # Shared utilities
│   ├── http.ts             # HTTP client with retry
│   └── storage.ts          # Token storage
│
└── config/                 # Configuration
    └── env.ts              # Environment validation
```

## 🔒 Security Features

### Implemented

1. **Token Management**
   - Separate access (15 min) and refresh (30 day) tokens
   - Different JWT secrets for access and refresh
   - Token rotation on refresh
   - Session invalidation on password change

2. **Password Security**
   - Configurable strength requirements
   - Entropy calculation
   - Common password detection
   - Breach check support (HaveIBeenPwned integration ready)
   - Password history to prevent reuse

3. **Rate Limiting**
   - Per-IP login attempts
   - Per-IP registration attempts
   - Per-IP password reset attempts
   - Per-session refresh attempts
   - Configurable time windows and limits

4. **Anomaly Detection**
   - Token reuse detection
   - Impossible travel detection
   - Concurrent location tracking
   - Configurable actions (log, alert, challenge, block)

5. **Device Fingerprinting**
   - User agent tracking
   - IP address tracking
   - Timezone, language, platform tracking
   - Fingerprint comparison & change detection

6. **Account Lockout**
   - Failed attempt tracking
   - Configurable lockout duration
   - Exponential backoff support
   - Reset on successful login

### Planned (Not Yet Implemented)

1. **Multi-Factor Authentication (MFA)**
   - TOTP (RFC-6238) support
   - Recovery codes
   - Trusted device management

2. **Email Verification**
   - Token-based verification
   - Rate-limited resend
   - Automatic cleanup of unverified accounts

3. **Password Reset**
   - Secure token generation
   - Time-limited reset links
   - Session invalidation on reset

4. **Audit Logging**
   - Immutable event log
   - Security alerts
   - Webhook notifications

## 📊 Security Policies

All security policies are centralized in `auth.policies.ts` and can be configured:

```typescript
// Example: Password Policy
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  preventCommonPasswords: true,
  minEntropy: 50, // bits
};

// Example: Session Policy
const sessionPolicy = {
  accessTokenTtlSeconds: 900, // 15 minutes
  refreshTokenTtlSeconds: 2592000, // 30 days
  maxSessionsPerUser: 10,
  revokeSessionsOnPasswordChange: true,
};

// Example: Rate Limit Policy
const rateLimitPolicy = {
  loginAttemptsPerIp: {
    maxAttempts: 10,
    windowSeconds: 900, // 15 minutes
  },
};
```

## 🔐 Error Handling

70+ typed error codes with HTTP status mapping:

```typescript
// Registration Errors
EMAIL_ALREADY_REGISTERED (409)
EMAIL_INVALID (400)
PASSWORD_TOO_WEAK (400)
PASSWORD_BREACHED (400)

// Authentication Errors
INVALID_CREDENTIALS (401)
USER_NOT_ACTIVE (403)
USER_SUSPENDED (403)
ACCOUNT_LOCKED (403)
TOO_MANY_ATTEMPTS (429)

// Token Errors
REFRESH_TOKEN_INVALID (401)
REFRESH_TOKEN_REUSED (401)
SESSION_EXPIRED (401)

// Security Errors
SUSPICIOUS_ACTIVITY (403)
RATE_LIMIT_EXCEEDED (429)
IP_BLOCKED (403)
```

## 🚀 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with credentials
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout single session
- `POST /auth/logout-all` - Logout all sessions
- `GET /auth/sessions` - List active sessions

### Planned

- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password
- `POST /auth/enable-mfa` - Enable MFA
- `POST /auth/verify-mfa` - Verify MFA code

## 💻 Frontend Usage

### Basic Authentication

```typescript
import { useAuth } from './features/auth/auth.hooks';

function MyComponent() {
  const { login, register, logout, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'password' });
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.email}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Protected Routes

```typescript
import { useRequireAuth } from './features/auth/auth.hooks';

function ProtectedPage() {
  const { isAuthenticated, loading } = useRequireAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null; // Will redirect to login

  return <div>Protected Content</div>;
}
```

### Role-Based Access

```typescript
import { useHasRole } from './features/auth/auth.hooks';

function AdminPanel() {
  const isAdmin = useHasRole('admin');

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Panel</div>;
}
```

## 🧪 Testing

(Tests planned but not yet implemented)

```bash
# Run backend tests
npm run test --workspace=@repo/backend

# Run frontend tests
npm run test --workspace=auth
```

## 📝 Configuration

### Backend Environment Variables

```bash
# JWT Secrets (required, min 32 characters)
AUTH_JWT_ACCESS_SECRET=your-access-secret-here-min-32-chars
AUTH_JWT_REFRESH_SECRET=your-refresh-secret-here-min-32-chars

# JWT Configuration
AUTH_JWT_ISSUER=bhcmarkets
AUTH_JWT_AUDIENCE=bhcmarkets-api

# Token TTLs (seconds)
AUTH_ACCESS_TOKEN_TTL=900      # 15 minutes
AUTH_REFRESH_TOKEN_TTL=2592000 # 30 days

# Session Configuration
AUTH_MAX_SESSIONS=10

# Feature Flags
AUTH_ENABLE_REGISTRATION=true
AUTH_ENABLE_MFA=true
AUTH_ENABLE_EMAIL_VERIFICATION=true
AUTH_ENABLE_PASSWORD_RESET=true
AUTH_ENABLE_RATE_LIMITING=true
AUTH_ENABLE_ANOMALY_DETECTION=true

# Email Configuration (optional)
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@bhcmarkets.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password

# Redis Configuration (optional, for distributed rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Frontend Environment Variables

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:3001/api

# App Configuration
VITE_APP_NAME=BHC Markets Auth
```

## 🎯 Next Steps

### High Priority

1. **Implement MFA**
   - TOTP provider (RFC-6238)
   - Recovery codes
   - MFA repository

2. **Add Email Verification**
   - Token generation and validation
   - Email service integration
   - Verification flow UI

3. **Complete Password Reset**
   - Reset token lifecycle
   - Email delivery
   - Reset form UI

4. **Add Tests**
   - Unit tests for core services
   - Integration tests for auth flows
   - E2E tests for critical paths

### Medium Priority

1. **Session Management UI**
   - View active sessions
   - Revoke individual sessions
   - Device information display

2. **Security Dashboard**
   - Recent activity
   - Security alerts
   - Password strength indicator

3. **Audit Logging**
   - Immutable event log
   - Security event tracking
   - Admin audit interface

### Low Priority

1. **Social Login**
   - OAuth providers (Google, GitHub, etc.)
   - Account linking

2. **Advanced Security**
   - Biometric authentication
   - Hardware security keys
   - Risk-based authentication

## 📚 References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

## 📄 License

Proprietary - BHC Markets

---

**Last Updated:** 2026-01-03

**Status:** ✅ Core Implementation Complete | 🚧 Additional Features In Progress
