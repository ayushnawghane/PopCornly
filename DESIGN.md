# Design

<!-- impeccable:design-schema 1 -->

## World

**Party lobby.** Popcornly is a multiplayer lobby, not a streaming-service clone. The room code and the people in it are the interface — modeled on the "enter a code, watch your friends' avatars pop in" ritual from Jackbox/Discord watch-parties, not on Netflix/Teleparty-style dark-SaaS-with-gradient-hero.

Chosen as Impeccable's Pick (the builder's own top-ranked candidate) over the dice-assigned direction (late-night broadcast-TV/CRT), in a 4-option decision presented to the user: assigned direction, pick, a third genuinely different alternate (group-chat-at-midnight), and the standing-exit category standard (generic streaming dark mode). Seed key: `0cf9910b`. Full direction contract lives as an HTML comment (first hidden child of `<body>`) in `app/layout.tsx`.

## Color

**Strategy: Full palette (3-4 named roles).** Committed at page scale — accent roles own whole elements (badges, CTAs, avatar chips), not scattered highlights on a neutral ground.

Physical scene forcing dark: friends texting at night from their own dark bedrooms, screen-lit, phone brightness turned down. Dark-only, no light mode.

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#15101e` | Ground — deep warm violet-black |
| `--color-bg-raised` | `#1e1729` | Panels, cards, form fields |
| `--color-bg-raised-2` | `#271f35` | Hover states, nested surfaces |
| `--color-foreground` | `#f6f0e8` | Body text — warm off-white, never pure white |
| `--color-foreground-muted` | `#b6a8c9` | Secondary text — tinted from the violet ground, never gray |
| `--color-border` / `--color-border-strong` | `rgba(246,240,232,.12)` / `.2` | Hairlines |
| `--color-primary` | `#ff6b35` | Coral — primary CTAs, host badges, "your pick" |
| `--color-secondary` | `#a855f7` | Violet — secondary actions, names in chat |
| `--color-tertiary` | `#34d399` | Emerald — "live"/online status, success |
| `--color-danger` | `#fb4570` | Errors only — kept visually distinct from primary coral |

Avatar chips cycle through 6 buckets: the 3 named roles plus a `color-mix(in srgb, <role> 65%, white)` lighter tint of each, so groups larger than 3 stay individually legible without introducing hues outside the committed palette.

`AvatarChip` has two renders, chosen by context, not by whim: solid color + initials by default (functional — member lists, chat, call tiles, anywhere recognizing a specific person matters), or a generative 5×5 symmetric identicon pattern (`pattern` prop, `lib/identicon.ts`, seeded per user) for decorative contexts at `md`/`lg` size only — the hero's chip cluster, not small trios. The pattern is illegible below ~36px, so `size="sm"` always forces the solid render regardless of the `pattern` prop, enforced in the component itself, not left to callers to remember.

No raster images or photos anywhere in the app (no image-generation tool available in this build) — every visual is CSS, SVG, or Next's `ImageResponse` (which renders JSX to PNG at request time via the framework's built-in Satori/resvg pipeline, not an external tool).

## Type

- **Display** (`--font-display`, Unbounded, weights 500-800): room codes, page headlines, the wordmark, primary-CTA labels. Reserved for moments that deserve weight — not used for every button.
- **Body** (`--font-sans`, Hanken Grotesk): everything else — labels, chat, forms, secondary buttons.
- Room codes and any counters/timestamps get `.tnum` (tabular numerals).

## Signature component: RoomCode

`components/ui/RoomCode.tsx` — each character of a room slug renders in its own bordered box (`bg-bg-raised`, `border-border-strong`, `rounded-lg`), Unbounded, tabular. Raised from a scoreboard/digit-display challenger weighed against the assigned direction during the concept round. Present on: the landing hero (decorative), `room/new` (dimmed placeholder preview), the join/lobby screen, and the live room header — the code is the throughline from first impression to the actual product surface.

## Components

- **Button** (`components/ui/Button.tsx`) — variants `primary` (solid coral) / `secondary` (outlined, bg-raised) / `ghost` / `danger`; polymorphic (`href` prop renders a `next/link` instead of nesting interactive elements). `display` prop switches the label to Unbounded for hero-weight CTAs.
- **Input** — `bg-bg-raised`, `border-border`, focuses to `border-tertiary` (not primary — keeps focus state visually distinct from action color).
- **AvatarChip** — colored circle, initials, deterministic color from a seed hash across the 6-bucket palette above.
- Radii: `rounded-xl`/`rounded-2xl` (14-16px+) for panels and buttons; `rounded-full` reserved for avatar chips and small pill badges only, per the craft floor's "pills are for small controls" rule.
- Elevation: declared once — border **or** shadow, never both stacked on the same panel.

## Brand marks

Favicon/app icon (`app/icon.tsx`, `app/apple-icon.tsx`, Next's file-convention + `ImageResponse`): a single boxed "P" — literally one box from the `RoomCode` component's own vocabulary (dark `bg-raised` fill, coral border, coral letter), not a separate mark invented for the icon slot. `proxy.ts`'s matcher explicitly excludes `icon`/`apple-icon` from the auth check — these routes must stay reachable logged-out, since a logged-out visitor's browser requests the favicon before any auth state exists.

## Motion

One authored entrance: hero avatar chips and the room-code boxes pop in staggered (`animate-chip-in`, `cubic-bezier(0.16,1,0.3,1)`, ~120ms stagger) on the landing page only — not repeated as a generic per-section reveal elsewhere. A `live-pulse` animation (opacity pulse) marks "LIVE"/online status dots. Both respect `prefers-reduced-motion`.

## Iconography

`lucide-react` — consistent single-weight stroke icons. No emoji or unicode glyphs standing in for icons anywhere in the app.

## Mode notes

- **Persuade** (landing page): full commitment — hero motif, illustrated "prove the mechanism" room-preview panel with labeled-synthetic demo chat/names, honest closing section (no fabricated testimonials or user counts, per PRODUCT.md).
- **Operate** (the actual room screen, auth forms): same palette/type/component language, but restrained — the world announces itself once at the top of each screen (avatar-chip trio on auth pages, room-code strip on the room screen) rather than competing with the player/chat/controls for attention. Host-only controls stay visually primary; follower-only states stay muted and clearly secondary.

## Known gaps / not yet designed

- No PWA/mobile-app chrome (matches PRODUCT.md — responsive web only).
- No light mode (deliberate — see Color).
- Empty chat state and empty member states are minimal by necessity (pre-launch, no real usage data to design around yet).
