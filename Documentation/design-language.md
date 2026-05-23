# Design Language — Landing Page

Summary of the visual system extracted from the landing page and site components. Use this as the single source of truth when making visual or UX changes.

## Palette
- canvas: #faf9f7 — warm off-white page background
- text (default): #1c1917 — primary body text
- primary: #2563eb — interactive primary action (buttons, links)
- muted / hint: #94a3b8 / #64748b — muted copy and helper text
- accent-1 (peach): #e8a87c
- accent-2 (teal): #c8e6df
- accent-3 (blue-bleed): #d4e4f7
- surface / card bg: white / white/80 (translucent)
- soft-border: hsla(20,6%,90%,.9) (derived from Tailwind `border-stone-200/90`)
- strong-border / ui-ink: #334155 (used for stronger borders and dark UI surfaces)

Also present as small gradients on cards: `from-white via #f5f0eb to #e8f0ee`.

## Typography
- Display: `var(--font-display)` (serif stack) used for headings on landing
- Body: `var(--font-sans)` (system sans stack)
- Sizes used repeatedly: headline ~ 3rem / 2.25rem (Tailwind `text-4xl` / `text-3xl`), body ~ 1rem (`text-base`), micro labels `text-xs`.

## Shapes & Spacing
- Primary card radius: `rounded-3xl` (~1.5rem+)
- Large radius token: `4xl` == `2rem` (configured in tailwind)
- Spacing rhythm uses Tailwind spacing scale (p-6, p-8, gap-4, etc.) — keep grid + padding consistent with containers at `max-w-6xl`.

## Interaction patterns
- Cards have subtle borders `border-stone-200/90`, light shadows, and a small hover lift (`hover:-translate-y-0.5` + `hover:shadow-lg`).
- Primary CTA uses strong blue background and white text with bold weight.
- Secondary CTAs use dark surface with lighter text and an inset border.

## Component primitives (how to apply)
- `--color-canvas`: page background
- `--color-text`: default body copy
- `--color-primary`: buttons & important links
- `--color-muted`: helper text and hints
- `--color-surface`: card backgrounds (usually white or translucent)
- `--color-border`: soft borders for cards
- `--radius-lg`: the `rounded-3xl` radius

Keep components accessible: maintain minimum contrast for body text, use the primary blue for actions, and keep motion subtle (0.15s–0.3s). When refactoring other pages, prefer reusing these primitives (CSS variables or shared tokens) rather than hardcoded hex values.

## Where to store tokens
- User-visible documentation: this file (`Documentation/design-language.md`).
- Code tokens: export a shared token object in `packages/shared/src/designTokens.ts` and surface CSS variables in `web/app/globals.css`.

## Migration notes
- Avoid global visual breaking changes in one PR — migrate one page at a time and confirm contrast and spacing.
