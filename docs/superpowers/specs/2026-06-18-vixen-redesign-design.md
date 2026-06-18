# Vixen Club — Marketing Site Redesign

**Date:** 2026-06-18
**Status:** Approved (design)
**Scope:** Marketing redesign only (no backend, no real booking)

## Goal

Rebuild the marketing site for Vixen Club (sports venue in Pilar, Buenos Aires)
as a modern, distinctive, fully responsive site that clearly outclasses the
current vixen.com.ar. Booking/inquiries continue to flow through WhatsApp and
phone — no reservation backend in this phase.

## Source content (reused from vixen.com.ar)

The venue offers:

- **Fútbol 7** — 7-a-side tournaments, masculino y femenino, "Inscripción
  temporada 2026", plus cups/copas.
- **Pádel** — torneos americanos, clases, alquiler de canchas.
- **Eventos / Bar** — social space and events.

Contact / facts:

- Phone / WhatsApp: `(011) 15 3773 0713`
- Email: `info@vixen.com.ar`
- Address: `Las Azucenas 3941, Alberti, Pilar, Buenos Aires`
- Social: Instagram, Facebook
- Sponsor: PUMA

All copy is Spanish (Argentina). Real photos/logo/prices to be supplied later;
build uses placeholder imagery until then.

## Approach

Next.js (App Router) + TypeScript + Tailwind CSS — a single scroll-based home
page plus two detail pages for the content with real depth. Chosen over a full
multi-page mirror (overkill for the content volume) and over a non-Next static
generator (user wants Next.js, and this keeps a path open to add interactivity
later).

## Site map

- `/` — Home. Single scroll page with sticky anchor navigation.
- `/futbol` — Fútbol detail: torneos 7, masculino/femenino, inscripción 2026,
  copas.
- `/padel` — Pádel detail: torneos americanos, clases, alquiler de canchas.

Every page is reachable from the home nav and footer.

## Home page sections (top → bottom)

1. **Sticky header** — logo, nav (Fútbol · Pádel · Eventos · Sede · Contacto),
   WhatsApp button. Collapses to a full-screen overlay menu on mobile
   (hamburger).
2. **Hero** — full-bleed action photo with dark overlay, large condensed
   headline, subhead, two CTAs: "Inscripción 2026" and "Reservar cancha"
   (WhatsApp). Scroll cue.
3. **Disciplines split** — two large cards (Fútbol, Pádel) linking to their
   detail pages.
4. **Fútbol highlight band** — 7 vs 7, masculino/femenino, inscripción 2026 CTA.
5. **Pádel highlight band** — torneos americanos · clases · alquiler.
6. **Eventos / Bar** — photo-led section for the social/events space.
7. **Sede (venue)** — address, embedded map, hours, amenities, PUMA sponsor
   mark.
8. **Contacto / CTA footer** — phone, email, Instagram/Facebook, prominent
   WhatsApp button.
9. **Footer** — compact nav, social links, copyright.

## Detail pages

- **/futbol** — hero, formato del torneo (7 vs 7), categorías masculino/
  femenino, inscripción temporada 2026 (CTA → WhatsApp), copas, FAQ short,
  contacto CTA.
- **/padel** — hero, torneos americanos, clases (con CTA), alquiler de canchas
  (CTA → WhatsApp), contacto CTA.

## Design system

- **Direction:** bold & sporty with a premium edge. Dark, high-contrast base
  with large action photography.
- **Color:** charcoal / near-black base, off-white text, volt/lime-green accent
  (~`#C6F000`) used sparingly for CTAs and highlights, one warm secondary for
  variety.
- **Typography:** condensed display font for headings (e.g. Oswald/Anton via
  `next/font`), clean sans (Inter) for body. Fluid sizing via `clamp()`.
- **Components (small, single-purpose, reusable):** `Button`, `SectionHeading`,
  `DisciplineCard`, `Stat`, `Header`/`Nav`, `MobileMenu`, `Footer`,
  `WhatsAppButton`, `SectionShell`.
- **Motion:** subtle fade/slide-in on scroll; hover states on cards/buttons.
  Tasteful, not busy. Respects `prefers-reduced-motion`.

## Responsive strategy

- Mobile-first Tailwind breakpoints (`sm`/`md`/`lg`/`xl`).
- Fluid typography with `clamp()` so text scales smoothly between breakpoints.
- CSS Grid/Flex layouts that **reflow** (e.g. cards 1 → 2 → 3 columns) rather
  than merely scale down.
- `next/image` with responsive `sizes` for fast, correctly-sized images.
- Hamburger → full-screen overlay menu on mobile.
- Verified at phone (~375px), tablet (~768px), desktop (~1280px) widths.

## Content model

A single typed content source (`src/content.ts` or `src/content/*`) holds all
copy, contact details, links, and section data. JSX components read from it, so
swapping in real text/prices later means editing one place — no hunting through
markup.

## Tech & quality

- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, `next/font`,
  `next/image`.
- **Tooling:** ESLint + Prettier.
- **Accessibility:** semantic HTML, keyboard-accessible nav, sufficient color
  contrast, alt text, reduced-motion support.
- **Performance:** Lighthouse-friendly; optimized images; minimal client JS
  (interactivity limited to nav menu and scroll animations).
- **Deploy:** static-friendly build, deployable to Vercel.

## Out of scope (this phase)

- Real reservation/booking backend, availability calendar, payments.
- User accounts / tournament registration forms with persistence.
- CMS. (Content lives in the typed content file for now.)

These can be added later as separate phases without reworking the marketing
layer.

## Success criteria

- Visibly more modern and distinctive than current vixen.com.ar.
- Fully responsive and verified at phone/tablet/desktop widths.
- All real contact info and offerings present and accurate.
- Content easy to update via the single content source.
- Clean Lighthouse scores and no accessibility regressions.
