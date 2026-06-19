# Vixen Club — Home Premium Redesign

**Date:** 2026-06-19
**Status:** Approved (design)
**Scope:** Full visual redesign of the home page (`/`) using the current content
model, real club photography, the real Vixen logo, and the WhatsApp SVG in
`public/`

## Goal

Replace the current “assembled landing page” feel with a more professional home
page that reads as a real sports club brand:

- darker, more premium, more editorial
- greener, aligned with the club identity and WhatsApp
- less generic UI, fewer boxed sections, fewer component-looking patterns
- stronger first impression, cleaner hierarchy, and better overall polish

The redesign must keep the real conversion model:

- **WhatsApp** for general contact, fútbol, eventos, and inscripciones
- **ATC Sports** for direct pádel reservations

## Design Thesis

The page should feel like a **premium sports club** rather than a startup
landing page. The visual language should combine:

- **club premium**
  - darker palette
  - cleaner header
  - more elegant spacing
  - institutional footer
- **deportivo editorial**
  - stronger typography
  - bolder hero composition
  - photography used as proof, not just fill
  - fewer UI artifacts and more poster-like rhythm

The result should feel intentional, adult, and branded.

## Problems In The Current Home

The current page still has several issues even after the earlier clean-up:

1. **The color system is inconsistent**
   - the yellow/lime accent reads disconnected from the Vixen identity
   - WhatsApp introduces a strong green that feels separate from the rest of the
     page instead of integrated into it

2. **The layout still feels component-driven**
   - several sections look like assembled blocks rather than one coherent brand
     system
   - some borders, panels, and spacing decisions feel “vibecoded” rather than
     art-directed

3. **The hero is improved but not yet premium**
   - it still risks reading like a generic split hero
   - the relation between text and photography needs tighter composition

4. **The header still needs stronger design control**
   - it should feel lighter, more deliberate, and less like a navigation bar
     with CTA boxes attached

5. **Some proof treatments add little value**
   - the removed chips were bad, but the replacement line still needs more
     intentional visual integration

## Visual System

### Palette

The home page should move to a **green-led** palette.

- base background: deep black / graphite
- surface: very dark green-black and charcoal layers
- primary accent: Vixen green
- secondary accent: darker, richer green for gradients and overlays
- muted text: cooler grey-green neutrals

Rules:

- green replaces yellow as the primary brand accent
- bright green is reserved for key actions and controlled highlights
- no yellow-first CTA system
- WhatsApp should feel native to the site because it lives inside the same
  palette family

### Typography

- display typography remains strong and condensed, but spacing and line breaks
  must be better controlled
- headlines should feel poster-like, not just large
- secondary text should become cleaner and more readable, with less washed-out
  grey
- uppercase usage should be purposeful, not everywhere

### Shapes And Chrome

- keep border radius low and consistent
- remove any remaining “soft capsule UI” language except where a specific CTA
  truly benefits from it
- borders, glows, and panels should be reduced unless they improve structure
- sections should rely more on layout, scale, and imagery than on boxed frames

## Page Structure

The home page structure stays broadly similar, but the presentation changes
substantially.

### 1. Header

The header should become cleaner and more premium:

- real Vixen logo on the left
- simple nav in the center or center-left with more breathing room
- only one top-level CTA: **WhatsApp**
- no `Reservá pádel` button in the header
- lighter blur / glow treatment
- desktop and mobile should both feel deliberate rather than “default nav plus
  CTA”

Design target:

- the header should feel like a luxury club masthead, not a SaaS nav bar

### 2. Hero

The hero is the main visual investment of the whole redesign.

Requirements:

- stronger integration between photography and copy
- darker, more atmospheric image treatment if needed through overlay control
- green accent details, but not loud green blocks
- both conversion actions remain in the hero:
  - `WhatsApp`
  - `Reservá pádel en ATC`
- supporting facts stay in the hero, but must look integrated and useful

Hero facts should communicate:

- location
- sports offering
- tournaments / activity
- operational trust

The hero should feel like the first screen of a real venue brand.

### 3. Mid-Page Sections

The section stack should feel less like repeated component types.

Rules:

- no obvious card-grid feeling
- no section should repeat the same visual idea as the previous one
- each section should have one clear job:
  - explain the sports offer
  - prove the club is active
  - show the venue
  - reinforce legitimacy

Use cases:

- **Fútbol** and **Pádel** still need separate conversion logic
- but they should feel like two facets of one club identity, not two generic
  boxes

Tournaments and events:

- should look like real proof of life and momentum
- trophy and venue images should carry trust

Sede:

- should feel practical and premium at the same time
- facts and amenities should be easy to scan without looking like a settings
  panel

### 4. Footer

The footer should become purely institutional.

Requirements:

- remove the promotional closing panel entirely
- lead with logo and brand presence
- show address, contact, and social links clearly
- show **Sponsors** as typography for now
- keep the structure easy to upgrade later when SVG sponsor logos are added

The footer should close the page with confidence, not with another marketing
push.

### 5. Floating WhatsApp

The floating WhatsApp action remains, but it must be calmer and more integrated.

Requirements:

- use the real WhatsApp SVG from `public/`
- keep visibility and clarity
- reduce the “widget pasted on top” feeling
- make its green consistent with the site palette

## Content Direction

The tone should stay in Spanish (Argentina), but copy must become cleaner and
less generic.

Rules:

- fewer filler statements
- more operational, real, venue-backed lines
- each section says one useful thing
- if a line sounds like placeholder marketing copy, rewrite it

## Component Implications

This redesign affects both structure and styling in:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/Header.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/UseCases.tsx`
- `src/components/sections/Tournaments.tsx`
- `src/components/sections/Eventos.tsx`
- `src/components/sections/Sede.tsx`
- `src/components/Footer.tsx`
- `src/components/WhatsAppButton.tsx`
- `src/content.ts`

Tests should be updated only where semantics or CTA visibility meaningfully
change.

## Out Of Scope

- redesign of `/futbol` and `/padel` detail pages
- CMS or content tooling
- live booking embed from ATC
- sponsor SVG integration in this pass
- new backend features

## Success Criteria

The redesign succeeds if:

- the home page no longer feels generic or component-driven
- the color system feels consistently Vixen-green rather than yellow-first
- the first viewport looks materially more premium and intentional
- the header feels cleaner and more professional
- WhatsApp looks integrated into the brand system
- the footer feels institutional and branded
- the site still preserves the real conversion flow:
  - WhatsApp for general contact
  - ATC for pádel reservations
