# SuqET Cinematic Editorial Design System

Source: UI/UX Pro Max — luxury fashion ecommerce + Exaggerated Minimalism + Editorial Grid + Marketplace Directory

## Intent

Premium second-hand marketplace that feels like Vestiaire / editorial fashion e-commerce — not a SaaS dashboard or classifieds template.

## Style blend

- **Exaggerated Minimalism** — oversized type, extreme whitespace, black/white + single gold accent
- **Editorial Grid / Magazine** — asymmetric compositions, large imagery
- **Marketplace Directory** — search-first discovery, accessible carousels
- Light **parallax / reveal** motion (respect `prefers-reduced-motion`)

## Palette

| Role | Hex |
|------|-----|
| Ink / primary | `#0C0A09` |
| Soft ink | `#1C1917` |
| Accent (gold CTA) | `#A16207` |
| Background | `#FAFAF9` |
| Surface | `#FFFFFF` |
| Muted | `#78716C` |
| Border | `#E7E5E4` |

## Typography

- Display: **Cormorant** (editorial serif)
- Body/UI: **Montserrat**

## Composition rules

- Full-bleed heroes and feature bands
- Transparent nav over dark heroes → solid on scroll
- Mobile bottom tab bar
- Horizontal carousels for trending / categories
- Asymmetric featured collections
- Product cards: tall image, hover zoom, minimal chrome
- Detail: gallery-led, sticky buy rail

## Motion

- Reveal on scroll (opacity + translateY)
- 300–600ms ease, no bounce
- Carousel snap + keyboard controls
- Disable transforms under reduced motion
