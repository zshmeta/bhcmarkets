---
applyTo: 'packages/backend/src/domains/auth/**'
---

# Auth Backend Domain Agent Instructions (`packages/backend/src/domains/auth`)

## Mission
Maintain an **enterprise-grade, policy-driven Auth domain** that is auditable, secure-by-default, and extensible.

## Architecture boundary (mandatory)
- The Auth domain is a **security boundary**.
- Core domain logic must not depend on HTTP frameworks, cookies, headers, or web/server runtime details.
- Keep adapters (controllers/routes) thin; keep orchestration in `core/`.

## Structure expectations (align with AuthPlan)
Prefer these layers:
- `core/`: use-cases, orchestration, policies, errors, types
- `repositories/`: persistence interfaces + implementations
- `tokens/`: token/session issuance and verification (abstract behind interfaces)
- `security/`: password policy, rate limiting rules, anomaly detection hooks
- `mfa/`: TOTP/recovery flows + storage
- `flows/`: reset/verify/recovery workflows
- `events/`: audit logging and security event emission
- `validators/`: input validation schemas

If existing structure differs, refactor toward this direction as you touch code.

## “Existing code is not sacred” rule
Assume existing code may be incomplete or not enterprise-grade.
- Replace insecure flows (weak password rules, missing audit, unclear error boundaries).
- Improve typing and error modeling.
- Only keep code unchanged if it is already enterprise-grade.

## Security requirements
- Never log secrets (passwords, reset tokens, refresh tokens).
- Ensure password hashing is strong (use a modern KDF).
- Implement rate limiting / lockout policies with clear configuration.
- Support session revocation and multi-session management.
- Emit audit events for high-value actions (login, logout, refresh, password change, MFA enrollment, session revoke).

## Error handling
- Use typed error codes (do not throw raw strings).
- Map domain errors to transport errors at the controller/adapter layer.
- Avoid leaking sensitive details in error messages.

## Commenting (highly advised)
Write comments while implementing to describe:
- threat model assumptions
- why a policy exists / tradeoffs
- tricky edge cases (token reuse, refresh rotation, lockout rules)

Comments should be human-language and security-focused.

## Testing note
Repo rule: do not run tests automatically.
- You may add or update tests when appropriate.
- Provide the exact command(s) for the user to run.
