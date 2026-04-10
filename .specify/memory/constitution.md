<!--
## Sync Impact Report

**Version change**: (template) → 1.0.0 (initial ratification)

### Modified Principles
- (none — initial fill from template placeholders)

### Added Sections
- Core Principles (I–V): S.O.L.I.D clean code principles
- UX & Brand Standards
- Technology Stack & Services
- Governance

### Removed Sections
- (none)

### Templates Updated
- ✅ `.specify/templates/plan-template.md` — Constitution Check gate references principles by name; template uses
  dynamic placeholder `[Gates determined based on constitution file]`, no static update required.
- ✅ `.specify/templates/spec-template.md` — No principle-coupled mandatory sections; no update required.
- ✅ `.specify/templates/tasks-template.md` — Services layer mandated; task phases already include
  `src/services/` paths. No structural change required.

### Deferred TODOs
- (none — all placeholders resolved)
-->

# SocialSpreadCart Constitution

## Core Principles

### I. Single Responsibility

Every module, component, service, and function MUST have exactly one reason to change.
React components render UI only — they MUST NOT contain business logic or data-fetching logic.
All business logic and data access MUST live in a dedicated service (`src/services/`).
A violation exists when a component imports a Supabase client directly or performs
non-trivial data transformations inline.

**Rationale**: Keeps components testable in isolation, services reusable across pages,
and avoids the "god component" pattern that degrades long-term maintainability.

### II. Open/Closed

Components and services MUST be open for extension and closed for modification.
New behavior is added by composing or extending existing abstractions — not by editing
stable, working code. Shared UI primitives (buttons, cards, inputs) MUST be extended via
props/variants (using `class-variance-authority`) rather than forked copies.

**Rationale**: Prevents regression in working features when adding new ones. Branding
variants (sage, gold, cream) are expressed as CVA variants, not one-off overrides.

### III. Liskov Substitution

Any service or component that implements an abstract contract MUST honor the full
interface — no silent no-ops, unexpected throws, or shape mismatches. When a Supabase
query is wrapped in a service function, all callers MUST be able to trust the return
type contract (enforced via TypeScript and Zod validation at service boundaries).
Generated TypeScript types from Supabase MUST be kept in sync with the database schema.

**Rationale**: Substitutability ensures the data layer can evolve (e.g., mock vs. real
Supabase client) without breaking callers.

### IV. Interface Segregation

Service interfaces MUST be narrow and purpose-specific. No "mega-service" that handles
unrelated concerns. A booking service handles bookings; an event service handles events;
an email service handles notifications. Components MUST only receive the props they
actually use — no pass-through prop drilling of wide objects.

**Rationale**: Narrow interfaces reduce coupling, simplify testing, and prevent
unintended side-effects when a service's contract evolves.

### V. Dependency Inversion

High-level components and pages MUST depend on service abstractions, not on concrete
Supabase queries or third-party SDKs directly. The Supabase client MUST be instantiated
in one place (`src/lib/supabase/`) and injected or imported via service functions only.
Pages and components MUST NOT instantiate SDK clients directly.

**Rationale**: Centralises the data-access boundary, making it straightforward to swap
implementations, add caching, or introduce mocking without touching UI code.

## UX & Brand Standards

The UI MUST be calm, premium, and uncluttered. Every screen MUST feel like the brand —
warm, elegant, approachable.

**Typography**:
- Headings MUST use `font-heading` (`var(--font-heading)`) — the brand serif/display
  face loaded via `next/font`.
- Body and UI text MUST use `font-sans` (`var(--font-sans)`) — the brand sans-serif.
- No other font families may be introduced without a constitution amendment.

**Color Palette** (Tailwind tokens — do not hard-code hex values in components):
- `cream` (#f8f1e3) — primary background
- `sage` / `sage-500` (#5b733c) — primary action, headings, accents
- `gold` (#b69152) — highlight, premium accent, hover states
- `ink` (#171717) — body text
- Variants (`sage-50` → `sage-900`) for hover, border, and subtle fills.

**Photography & Assets**:
- Brand logos MUST be sourced from `public/brand/logos/`.
- Food and client photography MUST be sourced from `public/food/` and `public/client/`.
- SVG brand templates live in `public/brand/templates/`.
- No stock imagery or off-brand visuals may be introduced without explicit approval.

**Interaction**:
- Motion MUST use Framer Motion (`framer-motion`) with the project's defined `float`
  and `shimmer` keyframes. New animations MUST be added to `tailwind.config.ts`.
- UI feedback (toasts, loading, errors) MUST use `sonner` — no custom toast systems.
- Forms MUST validate with `zod` schemas and surface field-level errors inline.
- Complexity is a UX failure. Screens MUST present only what is necessary for the
  current task. No modal-on-modal patterns; no more than two levels of navigation depth.

## Technology Stack & Services

**Pinned Stack** (versions from `package.json` — do not upgrade without deliberate review):
- Next.js `^15.5.14` (App Router, Server Components, Server Actions)
- React `^19.2.4`
- `@supabase/supabase-js` `^2.102.1` + `@supabase/ssr` `^0.10.0`
- Tailwind CSS `^3.4.17`
- TypeScript `^5.6.3`
- Zod `^4.3.6`

**Services Layer (NON-NEGOTIABLE)**:
- All data access MUST go through `src/services/`. No component or page may call
  Supabase, Resend, or any external SDK directly.
- Service functions MUST be typed end-to-end: input validated with Zod, output typed
  with generated Supabase types or explicit TypeScript interfaces.
- Server-side data fetching MUST use Next.js Server Components or Server Actions.
  Client-side fetching (where needed for interactivity) MUST still call a service
  function — never the SDK client inline.
- Email dispatch MUST go through an email service wrapping `resend`.

**Project Structure**:
```
src/
├── app/            # Next.js App Router pages and layouts
├── components/     # UI components (render only; no direct data access)
├── services/       # All data-access and external-SDK logic
├── lib/
│   ├── supabase/   # Supabase client factory (SSR + browser)
│   └── utils/      # Pure utility functions
└── types/          # Shared TypeScript types and Zod schemas
```

## Governance

- This constitution supersedes all other practices, style guides, or verbal agreements.
- Any amendment MUST: (1) be proposed in a PR, (2) update `LAST_AMENDED_DATE` and
  increment `CONSTITUTION_VERSION` per semantic versioning, (3) include a migration note
  if existing code must change.
- Version bump policy:
  - **MAJOR**: Principle removal, redefinition, or backward-incompatible governance change.
  - **MINOR**: New principle or section added, or material expansion of existing guidance.
  - **PATCH**: Clarifications, wording refinements, typo fixes.
- All PRs MUST include a Constitution Check confirming no principles are violated.
- The services layer mandate (Principle V + Tech Stack section) is non-waivable.
  Any deviation requires a MAJOR version amendment and explicit justification.
- Use `.specify/memory/constitution.md` as the authoritative runtime reference.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
