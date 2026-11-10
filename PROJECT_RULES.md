# Project Rules

These rules are the contract for every change in this repository. They take
priority over convenience or one-off fixes. Keep this file updated as the
codebase evolves.

## 1. UI components (never browser-native)

Always use custom or library components. **Never** use raw browser-native
controls or dialogs, including:

- `alert()`, `confirm()`, `prompt()`, `beforeunload` dialogs.
- Raw `<button>` — always use the shared `Button` component (`src/components/ui/Button.tsx`).
- Raw `<select>` — use antd `Select` (never native). Shared `FormSelect` is antd-backed.
- Raw `<input type="date">` — use antd `DatePicker` (never native). Shared `FormDateInput` is antd-backed.
- Raw `window.confirm` / native confirmation pop-ups — use `confirmAction` from `src/lib/confirm.ts` (antd `Modal.confirm`). Pass the delete/commit logic into `onOk`.
- Native `title` tooltips as the only affordance — use visible UI or a custom tooltip (icon-only buttons get `aria-label`).
- Inline `onClick="..."` or inline event strings; no `dangerouslySetInnerHTML` without review.

Any browser-native feature that shows a system chrome or interrupts the page is
banned. If a control is missing, build a styled component around it rather than
falling back to native.

## 2. Copy: minimal, low-friction

Keep the interface sparse. Reduce friction for the user.

- **Remove text that does not carry information.** No filler, no decorative
  sentences, no redundant labels.
- **No jargon, marketing fluff, or "hard English."** Use plain, frictionless
  language readable in one pass. Never use invented product-y labels as UI
  copy (e.g. "Mission Control", "Autopilot"). Prefer simple, literal labels.
- **No eyebrows / kicker labels** above headings unless they carry a fact.
- **No em dashes (—) or over-punctuation** in UI copy. Prefer plain sentences,
  commas, or full stops.
- **No vague or fluffy microcopy.** Every visible string earns its place.
- Labels name the thing they describe; buttons are a verb + an object.
- Keep empty-state and helper text short; cut it when it teaches nothing.

## 3. Consistency

- One button system (shared `Button`), one radius family, one set of tokens
  (`globals.css` `:root`).
- Reuse existing components (`ui/`, `landing/`) instead of re-implementing.
- **Never** use the Sparkles / Sparkle icon (lucide `Sparkles`) anywhere.
  It reads as generic AI slop; remove it where it already exists.
- The app must be understandable to a normal user. Navigation labels must be
  plain and unambiguous; never expose two near-duplicate destinations that do
  the same thing from the user's view. When sidebar/menu entries overlap, group
  them under one clear item instead of surfacing both.
- Landing copy lives in `src/components/landing/content.ts` — do not scatter
  strings into landing JSX.
- No invented proof, figures, testimonials, or pricing that the brief does not give.

## 3b. Form, search & input consistency

- All fields in one group must read as a single set: same height, same corner
  radius, same background. Where antd `Select`/`DatePicker` sit next to plain
  inputs, match the plain inputs to the antd control's size (default 32px,
  8px radius) instead of adding custom heights.
- Leading icons inside inputs are centered with flexbox (`flex items-center` on
  the wrapper, `ml-*` on the icon) — never absolute-positioned percentages.
- Every populated field gets a clear affordance: antd `allowClear` on `Select`,
  and a visible clear "×" button on text inputs when they hold a value.
- Filter/search panels start collapsed; reveal extra controls only on demand via
  a toggle. Keep the default view to one compact row.
- Keep vertical rhythm tight: use `space-y-4`/`space-y-6` (not `8`).
- Never use glow or gradient effects: no `bg-gradient-to-*` utilities, no glow
  shadows (`shadow-[0_0_...]`, `--primary-glow`), no `glow` props. Use flat,
  solid fills and clean `Button` variants.
- Never use decorative custom spinner/loader elements. For content/async loading
  always use page-customized skeletons (reusable `ui/*Skeleton` or inline themed
  pulse skeletons) — never antd generic `Skeleton`.

## 4. Accessibility & expectations

- Icon-only controls must have an `aria-label`.
- Preserve `type`, `disabled`, `onClick`, and all `aria-*` when refactoring.
- antd `Select`/`DatePicker` deliver the *value* directly in `onChange` (not an event). `DatePicker` uses dayjs; format `'YYYY-MM-DD'`.
- Respect `prefers-reduced-motion`.

## 4b. Responsiveness

Every layout must hold up from ~320px phones up to wide desktop without horizontal
page scroll or clipped content.

- Build mobile-first: `grid-cols-1` (or a stacked flex-col) as the default, then
  step up with `sm:` / `md:` / `lg:` breakpoints.
- Flex rows that must not collide use `flex-wrap` + `gap`; give one child `min-w-0`
  so long text truncates instead of pushing siblings off-screen.
- Avoid fixed heights that force scroll on phones. Prefer `min-h` + natural flow,
  or responsive heights like `h-[440px] md:h-[520px] lg:h-[600px]`.
- Horizontal-scroll regions (`overflow-x-auto` + `min-w-max`) are acceptable for
  card rails on mobile, but keep the rail contained inside its card.
- Prevent overflow with `overflow-hidden` on cards and `truncate` on titles/labels.
- Never let a single element have an intrinsic width wider than the viewport;
  use `max-w-full` / `min-w-0` where needed.
- Navigation: below `lg`, use a slide-in drawer opened by a hamburger in a sticky
  top bar; the fixed sidebar is `lg:`-only. Keep the drawer's footer action (e.g.
  Sign out) pinned to the bottom via `mt-auto` + flex fill.
- Auth pages: the form card is bottom-stacked on mobile (`items-end` by default)
  and vertically centered on desktop (`lg:items-center`).

## 5. Workflow

- Update this file when a rule changes or a new pattern becomes a standing rule.
- Verify changes with `npx tsc --noEmit` and `npx eslint` on the touched files.
