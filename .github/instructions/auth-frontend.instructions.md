---
applyTo: 'apps/auth/**'
---

# Auth Frontend Agent Instructions (`apps/auth`)

## Mission
Build and maintain an **enterprise-grade Auth frontend** that handles identity flows only (login, registration, session handling, MFA challenges, error handling, callback pages).

## Hard boundaries (do not cross)
- This app is for **identity workflows only**.
- Do **not** implement platform/business features (trading, ledger, orders, dashboards) here.
- If something requires domain/business data ownership, move it to the appropriate app/package.

## Repo structure you must follow
- `apps/auth/src/pages/`: route-level pages only (composition + layout)
- `apps/auth/src/components/`: reusable UI compositions (forms, wrappers, view components)
- `apps/auth/src/lib/`: small utilities (redirect helpers, token/session helpers, validation)
- `apps/auth/src/hooks/`, `apps/auth/src/context/`: React state + effects (keep minimal)
- `apps/auth/src/types/`: shared TS types for this app (prefer re-exporting `@repo/types` where possible)

If you need a new folder, it must be justified by repeated use (avoid over-architecture).

## UI components rule (mandatory)
- **All shared UI components live in `packages/ui` and are consumed via `@repo/ui`.**
- Prefer composing with existing exports from `@repo/ui` before creating new UI.

Already available in `@repo/ui` (non-exhaustive, check exports first):
- Inputs: `EmailInput`, `PasswordInput`, `AddressInput`, `PhoneInput`, `NumInput`, `SearchInput`
- Info: `Modal`, `Toast`, `Notification`, `Tooltip`, `Loader`, `Progress`
- Display: `Card`, `Text`, `Skeleton`, `Table`, `Popover`, `Accordion`
- Buttons: `Button`

If you need UI pieces like **Alert** or **DatePicker** and you can’t find them in `packages/ui/src/components`, you must **build them in `packages/ui`** and export them from `packages/ui/src/components/index.ts`.

Design constraints:
- Use the existing theme tokens (`@repo/ui` theme) and `styled-components` patterns used in `packages/ui`.
- Do not introduce new colors/fonts/shadows outside the theme/tokens.
- Ensure accessibility (labels, `aria-*`, keyboard interaction, focus states).

## Security + auth UX requirements
- Treat auth UX as security-sensitive: avoid leaking account existence, internal errors, or token details.
- Display user-facing errors using `Notification` / `Toast` with generic messaging; log detailed errors only in safe dev contexts.
- Prefer server-driven sessions (e.g., HTTP-only cookies) when available; avoid storing long-lived secrets in `localStorage` unless explicitly required by the backend.
- Centralize token/session logic inside `apps/auth/src/lib/` (don’t duplicate across forms/pages).

## “Existing code is not sacred” rule
Assume existing code may be incomplete or non-enterprise-grade.
- Refactor or replace implementations that are insecure, leaky, tightly coupled, or untyped.
- Only keep existing code unchanged if it already meets enterprise standards (security, maintainability, typing, accessibility).

## Commenting (highly advised)
Write comments as you implement to describe **what you’re doing in human language**, especially for:
- security decisions (token storage, redirects, CSRF, session renewal)
- non-obvious validation rules
- tricky UI state transitions (loading, retry, lockout)

Guideline: comments should explain **why** and **what**, not narrate obvious code.

## Routing + navigation
- Routes must map cleanly to pages in `apps/auth/src/pages/`.
- Avoid “magic” redirects; centralize redirect rules in `apps/auth/src/lib/redirectUtils.ts`.
- Ensure post-login redirect is explicit and safe (prevent open-redirect vulnerabilities).

## Data fetching
- Keep HTTP calls in a small, testable client module (typically in `apps/auth/src/lib/` or a `features/auth` area if/when introduced).
- Never sprinkle `fetch()` calls across components.

## Deliverables expectations
When asked to build a feature in Auth UI:
- Update the relevant page
- Compose UI from `@repo/ui`
- Add/extend form components
- Add typed request/response types
- Add safe error handling + user feedback
- Add high-signal comments during implementation
