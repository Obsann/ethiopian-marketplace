# SuqET Design System

Source: UI/UX Pro Max (`classifieds buy-sell` + `marketplace P2P` product rules)

## Product analysis

| Dimension | Decision |
|-----------|----------|
| Category | Classifieds / Buy-Sell + Marketplace (P2P) |
| Users | Ethiopian buyers & sellers of second-hand goods; admins reviewing KYC |
| Goals | Find items fast, trust sellers, message, pay safely, list & manage inventory |
| Primary flows | Search → listing → chat/buy; Sell wizard; Orders; KYC/Admin |
| Pattern | **Marketplace / Directory** — Hero search → Categories → Featured → Trust → Seller CTA |
| Style | **Flat Design** + **Minimalism & Swiss** — clean grids, high contrast, typography-led |
| Icons | Lucide SVG only (no emoji icons) |

## Colors (Classifieds palette)

| Role | Hex | Token |
|------|-----|-------|
| Primary | `#2563EB` | `brand-600` |
| Primary hover | `#1D4ED8` | `brand-700` |
| Primary soft | `#EFF6FF` | `brand-50` |
| Accent / price / success | `#16A34A` | `accent-600` |
| Accent soft | `#DCFCE7` | `accent-50` |
| Background | `#F8FAFC` | `paper` (neutral bg per classifieds notes) |
| Foreground | `#0F172A` | `ink` |
| Muted text | `#64748B` | `muted` |
| Card | `#FFFFFF` | `surface` |
| Border | `#E2E8F0` | `border` |
| Destructive | `#DC2626` | `danger` |
| Ring / focus | `#2563EB` | `ring` |

Notes from Pro Max: listing blue + price green + verified seller badge. Avoid purple AI gradients, glassmorphism, heavy shadows.

## Typography

- **Heading:** Outfit (`font-display`)
- **Body:** Work Sans (`font-sans`)
- Scale: display 2.5–3rem / h1 1.875rem / h2 1.5rem / h3 1.125rem / body 0.875–1rem / caption 0.75rem
- Weights: 400 body, 500 labels, 600 headings, 700 prices

## Spacing & radius

- Base unit: 4px → 8 / 12 / 16 / 24 / 32 / 48
- Page max width: `max-w-6xl` (1152px)
- Radius: controls `rounded-lg` (8px), cards `rounded-xl` (12px) — not oversized pills
- Shadows: none by default; optional `shadow-card` = `0 1px 2px rgba(15,23,42,0.06)` only

## Component hierarchy

1. Shell: Navbar (search + List item CTA) → main → Footer  
2. Primitives: Button, Input, Textarea, Select, Card, Badge, Spinner, EmptyState, Alert  
3. Domain: ListingCard, filters, chat thread, KPI tiles, tables  
4. Pages compose primitives only

## Interaction

- Transitions: 150–200ms ease (Flat Design)
- Hover: color/opacity/border shift — not lift/glow
- Focus: visible `ring-2 ring-brand-500 ring-offset-2`
- `cursor-pointer` on all clickable elements
- Respect `prefers-reduced-motion`

## Accessibility

- Text contrast ≥ 4.5:1
- Labels on all inputs (not placeholder-only)
- Icon buttons need `aria-label`
- Decorative icons `aria-hidden`
- Empty / loading / error states always present

## Anti-patterns (do not use)

- Emoji as icons
- Purple-on-lavender SaaS look
- Excessive gradients, glass, multi-layer shadows
- Hidden filters on browse
- Text-heavy walls without hierarchy
- Inconsistent spacing or type

## Page map

| Page | Notes |
|------|-------|
| Home | Marketplace Directory sections |
| /listings | Filter-heavy grid, visible filters |
| Listing detail | Gallery + price green + trust + CTA |
| Auth | Centered card, clear labels |
| Dashboard / Admin | KPI tiles + tables, Swiss density |
| Inbox / Chat | List + thread, readable density |
| Orders / Payments | Status badges, clear actions |
| Sell / Verify | Stepped forms, progress |
