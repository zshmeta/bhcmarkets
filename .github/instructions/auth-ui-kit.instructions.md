---
applyTo: 'packages/ui/**'
---

# Shared UI Kit Agent Instructions (`packages/ui`)

## Mission
Provide a reusable, theme-driven UI component library consumed by apps (including `apps/auth`) via `@repo/ui`.

## Source of truth
- Components live in `packages/ui/src/components/**`.
- Public exports are wired through:
  - `packages/ui/src/components/index.ts`
  - `packages/ui/src/index.ts`

If an app needs a shared component (e.g., `DatePicker`, `Alert`), it must be added here and exported.

## Existing components to reuse first
Before building new components, confirm whether an equivalent already exists in `packages/ui/src/components`.
Notable existing auth-relevant components include:
- Inputs: `EmailInput`, `PasswordInput`, `AddressInput`, `PhoneInput`, `NumInput`, `SearchInput`
- Info: `Modal`, `Toast`, `Notification`, `Tooltip`, `Loader`, `Progress`

If the request is for “Notif/Notifications”, prefer `Notification` or `Toast`.
If the request is for “Alerts”, either:
- reuse `Notification` (if it meets the UX), or
- add an `Alert` component (typically a static/inline variant), then export it.

## Design + implementation rules
- Use `styled-components` (consistent with this package).
- Use existing theme tokens (colors, spacing, typography, z-index, elevations).
- Do not hardcode new colors/fonts/shadows.
- Ensure accessibility: labels, error text semantics, focus styles, keyboard handling.

## API shape
- Keep props small and composable.
- Forward refs when appropriate (inputs, dialogs).
- Provide sensible defaults, but do not hide important behavior.

## Commenting (highly advised)
Write human-language comments when implementing:
- tricky layout/styling decisions
- accessibility behaviors
- edge-case behavior (masking, formatting, validation)
