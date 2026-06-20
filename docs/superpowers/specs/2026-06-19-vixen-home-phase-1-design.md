# Vixen Club — Home Page Phase 1 Redesign

**Date:** 2026-06-19
**Status:** Approved (design)
**Scope:** Home page redesign only (`/`) using real brand and venue assets

## Goal

Upgrade the Vixen Club home page into a trust-first, conversion-oriented
landing page that outclasses the current site while matching how the venue
actually operates today:

- **WhatsApp** remains the main contact and conversion path for fútbol,
  inscripciones, and general inquiries.
- **ATC Sports** is exposed as a visible, premium secondary conversion path for
  pádel reservations.

This phase focuses on making the home page feel real, active, and worth
contacting, not on adding backend features.

## Verified Inputs

### Real local assets now available

The repo already contains usable venue media in `public/`, including:

- `logo_vixen.svg`
- fútbol imagery: `futbol1.jpg`, `futbol2.jpg`, `futbol3.jpg`
- pádel imagery: `padel1.jpg`, `padel2.jpg`, `padel3.jpg`, `padel4.jpg`,
  `padel5.jpeg`
- venue / club imagery: `vixen1.jpg`, `vixen2.jpg`, `canchas1.jpg`,
  `canchas2.jpg`, `canchas 3.jpg`, `canchas4.jpg`, `canchas5.jpg`
- tournament / cup imagery: `copas_trofeos.jpg`

These photos are good enough to replace placeholder blocks in phase 1.

### Verified ATC reservation path

As of **2026-06-19**, the live ATC Sports venue page is:

- `https://atcsports.io/venues/vixen-club-gba`

Stable facts confirmed from that page:

- venue name: `VIXEN CLUB`
- ATC supports visible **Pádel** reservations for this venue
- the venue listing also references **Fútbol 7**
- amenities shown there include: `Wi-Fi`, `Vestuario`, `Estacionamiento`,
  `Ayuda Médica`, `Torneos`, `Cumpleaños`, `Bar / Restaurante`, `Quincho`

The redesign should use ATC as a trust signal and visible action for pádel,
without depending on live pricing or schedule data inside the marketing site.

## Conversion Model

The home page should use a **dual funnel**:

### Primary funnel

- `Hablar por WhatsApp`
- used for: fútbol, inscripciones, eventos, and general contact

### Secondary funnel

- `Reservá pádel en ATC`
- used for: direct pádel reservations

This is more honest than pretending everything happens in one place, and it
builds trust by reflecting the venue’s real operating flow.

## Primary Audience

The page is optimized first for:

1. teams and players looking for fútbol or pádel
2. people evaluating whether the venue feels legitimate and active
3. people interested in events / bar as a secondary use case

The home page should therefore answer three questions quickly:

1. **What is Vixen?**
2. **Why should I trust it?**
3. **What do I click next?**

## Home Page Structure

Top to bottom:

1. **Sticky header**
   - real logo from `public/logo_vixen.svg`
   - compact nav
   - visible WhatsApp CTA
   - visible ATC CTA for pádel on desktop
   - mobile menu keeps both actions visible

2. **Hero**
   - real Vixen venue image, not a gradient placeholder
   - stronger positioning copy: venue + sports + location
   - two clear actions:
     - primary: `Hablar por WhatsApp`
     - secondary: `Reservá pádel en ATC`
   - short proof line or micro-badges under the CTAs

3. **Trust band**
   - fast proof, no fluff
   - examples:
     - `Pilar / Del Viso`
     - `Fútbol 7`
     - `Pádel`
     - `Torneos`
     - `Bar y eventos`
     - `Reservas en ATC`

4. **Use-case split**
   - replace the generic “discipline cards” feel with two high-intent blocks:
     - **Fútbol**
       - tournaments / inscripciones
       - WhatsApp CTA
     - **Pádel**
       - classes / turnos / covered courts
       - ATC CTA plus optional secondary WhatsApp CTA

5. **Tournament / momentum section**
   - use trophy imagery to prove activity and competition
   - reinforces that Vixen is not just a static venue; it hosts cups/tournaments

6. **Eventos / bar section**
   - keep it secondary, but make it look intentional
   - support copy should position it as an extension of the sports experience

7. **Venue / amenities section**
   - combine local facts and ATC-supported trust cues
   - address, map, amenities, and operational feel

8. **Closing CTA footer**
   - repeat WhatsApp and ATC actions
   - show contact info and social links

## Visual Direction

- **Tone:** sporty, real, premium, operational
- **Mood:** less abstract, more venue-backed
- **Visual hierarchy:** the page should feel like an active club, not a generic
  event brochure
- **Photography use:** images should do trust work, not just decoration
- **Accent color use:** lime-green stays concentrated in conversion moments and
  small proof details

## Copy Direction

Copy should stay in Spanish (Argentina) and move away from generic statements
like “viví el deporte” unless they are supported by concrete proof nearby.

Phase 1 copy principles:

- keep headlines short
- make subheads practical
- connect each CTA to a real next step
- avoid pretending there is a booking backend for every use case

## Component Implications

The existing home-page system can be reused, but several components need a more
specific role:

- `Header` stops using a plain-text wordmark and uses the real logo
- `Hero` becomes image-led and dual-CTA
- `Disciplines` is reframed into action-oriented use-case cards or split panels
- `HighlightBand` may be replaced or upgraded to support real imagery and
  dual-path conversion
- `Eventos`, `Sede`, and `Footer` gain stronger trust content
- `WhatsAppButton` becomes more branded and less generic

## Out of Scope

- booking backend integration
- live ATC inventory embedding
- CMS
- testimonials unless they are real and attributable
- full redesign of `/futbol` and `/padel` detail pages in this phase

## Success Criteria

- The home page looks materially more trustworthy than the current local build.
- The page exposes both conversion paths clearly:
  - WhatsApp for general contact / fútbol / events
  - ATC for pádel reservations
- Real venue assets are used across the hero and supporting sections.
- The page feels like a real sports club with active facilities and tournaments.
- The design remains responsive and accessible on phone, tablet, and desktop.
