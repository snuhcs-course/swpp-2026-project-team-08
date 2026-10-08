# Meal Check-in implementation plan

Reference: `specs/meal-checkin/spec.md`, `specs/ui-components/spec.md`, `docs/architecture.md`, and the onboarding Screen / Hook / View / rules pattern.

## Commit-sized work

1. Record this plan before implementation.
2. Add shared Meal / Food models, pure validation rules, child-scoped durable drafts and meal records, Query mutations, cancellable prototype recognition, and SDK-compatible photo dependencies.
3. Build five-segment meal flow: details/date overlay, photo input/preview/full view, analysis consent/progress/recovery, food review/editor/traits selector, exposure selection/help and completion. Centralize English/Korean copy and colors; keep UI props-based.
4. Connect Home draft resume and review intent, saved Meal ID and After-meal Review entry. Validate and fix with lint, TypeScript, rule/storage regression checks and available runtime preview.

## State and persistence

- A feature hook owns the current draft, food editing draft and trait editing draft. Confirm/cancel are explicit.
- Autosave writes are serialized; restore must finish before showing inputs. In-flight recognition resumes at the method selection screen after restart.
- Final save is idempotent by draft/meal ID; retain input on failure. Invalidate child-specific Home/Meal queries only after persistence succeeds.
- AI suggestions stay unconfirmed until Save food or Confirm food items; no exposure stage comes from onboarding.
- Persist copied native photo files outside picker caches. Web uses a durable data URL. Requests are mutations; late/cancelled recognition results cannot overwrite a changed draft.

## Prototype boundaries

There is no recognition backend or After-meal Review implementation in the current client. Recognition must explicitly disclose mock data and never label mock output as real analysis. After-meal Review entry loads the saved Meal by ID and explains the unimplemented review feature. It never accepts an incomplete draft as a saved Meal.

## Verification

Run `npm run lint` and `npx tsc --noEmit`. Cover date validation, food confirmation, trait cardinality, invalid/empty drafts, cancelled analysis, serialized autosave and duplicate-safe save. Exercise available RN web runtime, with device-only camera/permissions called out when a native runtime is unavailable.
