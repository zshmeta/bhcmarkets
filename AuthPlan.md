I want you to generate an action plane using this current file structure for the auth part of our app. This should cover the entire auth part of the app. add that ui components are available in /packages/ui/ and that all needed ui  such as PasswordInput or EmailInput or AdressInput or Modal or Notif or Alerts or DatePicker etc... etc... are available If any isnt found, it should be built and stored in the ui library.

PS: If there is existing code or files, assume the file is either empty or the code is not suitable and in need of improvement. Only if the existing code is of enterprise grade standards and cant be improved we can keep it 

With the writing of the code, it is higly advised to comment as we go. comments should reflect what it is being done in human language


**Key enterprise rule**
If a component needs API data, routing, or state → it **does not belong here**.

---

# 2. `/packages/backend/src/domains/auth`

**Enterprise-grade auth domain (policy-driven, auditable, extensible)**

> This is your **security boundary**.
> HTTP, cookies, headers, and frameworks are *outside* this domain.

```
packages/backend/src/domains/auth/
├── core/
│   ├── auth.service.ts               # Orchestrates all auth use-cases
│   ├── auth.errors.ts                # Typed auth error codes
│   ├── auth.policies.ts              # Password, session, MFA, device policies
│   ├── auth.config.ts                # TTLs, limits, feature flags
│   └── auth.types.ts                 # Domain contracts (you already have this)
│
├── controllers/
│   ├── login.controller.ts           # HTTP adapter: login
│   ├── register.controller.ts        # HTTP adapter: register
│   ├── refresh.controller.ts         # Token refresh endpoint
│   ├── logout.controller.ts          # Logout single session
│   └── sessions.controller.ts        # List / revoke sessions
│
├── routes/
│   └── auth.routes.ts                # HTTP route wiring only
│
├── repositories/
│   ├── user.repository.ts            # User persistence interface
│   ├── credential.repository.ts      # Password + lockout persistence
│   ├── session.repository.ts         # Session persistence
│   └── repositories.pg.ts            # Postgres implementations
│
├── tokens/
│   ├── token.manager.ts              # Abstract token issuance/parsing
│   ├── jwt.access.ts                 # Access token implementation
│   └── jwt.refresh.ts                # Refresh token implementation
│
├── security/
│   ├── password.policy.ts            # Length, entropy, breached password checks
│   ├── rate.limit.ts                 # Per-IP & per-account limits
│   ├── anomaly.detector.ts           # Token reuse, geo change, device drift
│   └── device.fingerprint.ts         # Stable device identifiers
│
├── mfa/
│   ├── mfa.service.ts                # MFA orchestration
│   ├── totp.provider.ts              # RFC-6238 TOTP
│   ├── recovery.codes.ts             # One-time recovery codes
│   └── mfa.repository.ts             # MFA persistence
│
├── flows/
│   ├── password.reset.ts             # Reset token lifecycle
│   ├── email.verification.ts         # Email verification flow
│   └── account.recovery.ts           # Locked account recovery
│
├── events/
│   ├── auth.events.ts                # Domain events (login, logout, etc.)
│   ├── auth.audit.ts                 # Immutable audit log writer
│   └── auth.alerts.ts                # Security alerts (email, webhook)
│
├── validators/
│   ├── login.schema.ts
│   ├── register.schema.ts
│   ├── refresh.schema.ts
│   └── logout.schema.ts
│
└── __tests__/
    ├── auth.service.test.ts
    ├── refresh.flow.test.ts
    └── password.policy.test.ts
```

**Enterprise principle**
Auth behavior changes via **policy files**, not service rewrites.

---

# 3. `/apps/auth`

**Dedicated Auth Frontend (Vite + React + TS)**

> This app handles **only identity flows**.
> No dashboards, no business logic, no data ownership.

```
apps/auth/
├── src/
│   ├── app/
│   │   ├── App.tsx                   # App root
│   │   ├── router.tsx                # Route definitions
│   │   └── providers.tsx             # Context providers (auth, theme)
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx             # Login flow
│   │   ├── RegisterPage.tsx          # Registration
│   │   ├── VerifyEmailPage.tsx       # Email verification
│   │   ├── ForgotPasswordPage.tsx    # Request reset
│   │   ├── ResetPasswordPage.tsx     # Perform reset
│   │   ├── MfaChallengePage.tsx      # MFA challenge
│   │   ├── SessionsPage.tsx          # Active sessions management
│   │   ├── SecurityPage.tsx          # Password, MFA, devices
│   │   └── ErrorPage.tsx             # Unified error handling
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.api.ts           # HTTP calls to backend auth
│   │   │   ├── auth.types.ts         # Frontend auth contracts
│   │   │   ├── auth.store.ts         # Auth state (tokens, user)
│   │   │   └── auth.hooks.ts         # useAuth(), useSession()
│   │   │
│   │   ├── sessions/
│   │   │   ├── sessions.api.ts
│   │   │   └── sessions.hooks.ts
│   │   │
│   │   └── security/
│   │       ├── password.api.ts
│   │       └── mfa.api.ts
│   │
│   ├── components/
│   │   └── auth/                     # Composed components using @repo/ui
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       ├── PasswordResetForm.tsx
│   │       ├── MfaForm.tsx
│   │       └── SessionManager.tsx
│   │
│   ├── lib/
│   │   ├── http.ts                   # Fetch wrapper (CSRF, retries)
│   │   ├── storage.ts                # Token storage abstraction
│   │   ├── csp.ts                    # CSP helpers
│   │   └── analytics.ts              # Security-safe analytics
│   │
│   ├── config/
│   │   ├── env.ts                    # Runtime env validation
│   │   └── auth.ts                   # Feature flags
│   │
│   └── main.tsx                      # Vite entry
│
├── index.html                        # Strict CSP, no inline scripts
├── vite.config.ts                    # Security-hardened build
└── package.json
```
