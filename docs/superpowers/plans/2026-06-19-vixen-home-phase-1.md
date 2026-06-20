# Vixen Home Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Vixen Club home page so it uses real venue assets, builds trust quickly, and exposes the two real conversion paths: WhatsApp for general contact and ATC for pádel reservations.

**Architecture:** Keep the current Next.js App Router structure and typed content source, but shift the home page away from placeholder-led sections. Reuse the existing shell and CTA primitives where they still fit, add a small image wrapper plus trust-oriented sections, and rewrite the home page composition around real media, stronger proof, and dual-funnel CTAs.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, `next/image`, Vitest, React Testing Library

---

## Global Constraints

- **Framework note:** this repo is on `next@16.2.9`; check the relevant guide in `node_modules/next/dist/docs/` before implementation work that depends on framework behavior.
- **Scope:** phase 1 is home page only. Do not redesign `/futbol` or `/padel` beyond keeping shared components compatible.
- **Primary conversion:** WhatsApp for fútbol, inscripciones, eventos, and general inquiries.
- **Secondary conversion:** ATC at `https://atcsports.io/venues/vixen-club-gba` for pádel reservations.
- **Use the real assets:** `public/logo_vixen.svg` and the new venue photos must replace placeholder media on the home page.
- **Do not hardcode live ATC inventory, prices, or availability.** Use the link as a trust-backed destination only.
- **Language:** all UI copy remains Spanish (Argentina).
- **Verification:** run targeted tests after each task, then `npm test` and `npm run build` before calling the phase complete.

## File Structure

- Modify: `src/content.ts`
  Responsibility: central content source for CTAs, proof points, image paths, and trust copy.
- Modify: `src/content.test.ts`
  Responsibility: guard the real content contract, especially WhatsApp + ATC URLs and required assets.
- Modify: `vitest.setup.ts`
  Responsibility: lightweight `next/image` test mock so UI tests stay simple.
- Create: `src/components/VenueImage.tsx`
  Responsibility: shared media wrapper for real local images with consistent cropping and overlay behavior.
- Create: `src/components/sections/TrustBand.tsx`
  Responsibility: compact proof strip directly after the hero.
- Create: `src/components/sections/UseCases.tsx`
  Responsibility: dual-funnel football/padel split with image-led panels and distinct CTAs.
- Create: `src/components/sections/Tournaments.tsx`
  Responsibility: trophy-led section that proves Vixen hosts cups/tournaments.
- Modify: `src/components/Header.tsx`
  Responsibility: real logo, visible WhatsApp CTA, visible ATC CTA.
- Modify: `src/components/Header.test.tsx`
  Responsibility: menu behavior plus trust/conversion affordances in the header.
- Modify: `src/components/sections/Hero.tsx`
  Responsibility: image-led hero with dual CTA and proof line.
- Create: `src/components/sections/Hero.test.tsx`
  Responsibility: verify hero messaging and both conversion paths.
- Modify: `src/components/sections/Eventos.tsx`
  Responsibility: keep events secondary but intentional and media-backed.
- Modify: `src/components/sections/Sede.tsx`
  Responsibility: operational trust section with venue facts and amenities.
- Modify: `src/components/Footer.tsx`
  Responsibility: closing conversion area that repeats WhatsApp + ATC actions.
- Modify: `src/components/WhatsAppButton.tsx`
  Responsibility: branded floating CTA.
- Modify: `src/app/page.tsx`
  Responsibility: compose the refreshed home page sections in the new order.
- Modify: `src/app/globals.css`
  Responsibility: supporting utility classes and polish for the new sections.

---

### Task 1: Expand The Content Model For Dual Conversion And Real Assets

**Files:**

- Modify: `src/content.ts`
- Modify: `src/content.test.ts`
- Modify: `vitest.setup.ts`

**Interfaces:**

- `content.site.padelReservationUrl: string`
- `content.hero.image`, `content.hero.primaryCta`, `content.hero.secondaryCta`, `content.hero.proof`
- `content.trustPills: string[]`
- `content.useCases.futbol` and `content.useCases.padel`
- `content.tournaments`

- [ ] **Step 1: Write the failing content tests**

Add these checks to `src/content.test.ts`:

```ts
it("exposes the ATC reservation URL for pádel", () => {
  expect(content.site.padelReservationUrl).toBe(
    "https://atcsports.io/venues/vixen-club-gba",
  );
});

it("defines a real hero image and trust pills", () => {
  expect(content.hero.image.src).toBe("/vixen1.jpg");
  expect(content.trustPills).toContain("Reservas en ATC");
});

it("separates fútbol and pádel conversion paths", () => {
  expect(content.useCases.futbol.cta.href).toContain("wa.me");
  expect(content.useCases.padel.primaryCta.href).toBe(
    "https://atcsports.io/venues/vixen-club-gba",
  );
});
```

- [ ] **Step 2: Run the focused content tests and confirm failure**

Run: `npm test -- src/content.test.ts`

Expected: FAIL with missing properties such as `padelReservationUrl`,
`trustPills`, or `useCases`.

- [ ] **Step 3: Mock `next/image` for the UI tests that come later**

Append this to `vitest.setup.ts`:

```ts
import * as React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => {
    // Tests only need DOM-visible image output, not Next image optimization.
    return React.createElement("img", { ...props, alt });
  },
}));
```

- [ ] **Step 4: Expand `src/content.ts` with the new trust-first structure**

Add the new site and home-page data:

```ts
site: {
  name: "Vixen Club",
  phoneDisplay: "(011) 15 3773 0713",
  email: "info@vixen.com.ar",
  address: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
  whatsappNumber: "5491137730713",
  padelReservationUrl: "https://atcsports.io/venues/vixen-club-gba",
  instagram: "https://instagram.com/vixen.club",
  facebook: "https://facebook.com/vixen.club",
  sponsor: "PUMA",
},
hero: {
  kicker: "Pilar · Buenos Aires",
  title: "Club, canchas y torneos en un solo lugar",
  subtitle:
    "Fútbol 7, pádel, eventos y un predio activo para jugar, competir y encontrarte.",
  image: {
    src: "/vixen1.jpg",
    alt: "Vista general del predio de Vixen Club con canchas y sector social",
  },
  primaryCta: {
    label: "Hablar por WhatsApp",
    href: buildWhatsAppUrl("Hola! Quiero más info sobre Vixen Club."),
  },
  secondaryCta: {
    label: "Reservá pádel en ATC",
    href: "https://atcsports.io/venues/vixen-club-gba",
  },
  proof: ["Pádel en ATC", "Fútbol 7", "Torneos", "Bar y eventos"],
},
trustPills: [
  "Pilar / Del Viso",
  "Pádel",
  "Fútbol 7",
  "Torneos",
  "Estacionamiento",
  "Reservas en ATC",
],
```

Also add `useCases`, `tournaments`, and richer `sede` amenities using the
verified ATC-aligned terms.

- [ ] **Step 5: Re-run the focused content tests**

Run: `npm test -- src/content.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/content.ts src/content.test.ts vitest.setup.ts
git commit -m "feat: model trust-first home page content"
```

---

### Task 2: Add The Shared Media And Proof Building Blocks

**Files:**

- Create: `src/components/VenueImage.tsx`
- Create: `src/components/sections/TrustBand.tsx`
- Create: `src/components/sections/TrustBand.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- `VenueImage({ src, alt, priority, className, overlay })`
- `TrustBand()` reads `content.trustPills`

- [ ] **Step 1: Write the failing test for the trust band**

Create `src/components/sections/TrustBand.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBand } from "./TrustBand";

describe("TrustBand", () => {
  it("renders key proof pills from the content source", () => {
    render(<TrustBand />);

    expect(screen.getByText("Reservas en ATC")).toBeInTheDocument();
    expect(screen.getByText("Torneos")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the trust band test and confirm failure**

Run: `npm test -- src/components/sections/TrustBand.test.tsx`

Expected: FAIL because `TrustBand` does not exist yet.

- [ ] **Step 3: Create the shared image wrapper**

Create `src/components/VenueImage.tsx`:

```tsx
import Image from "next/image";

export function VenueImage({
  src,
  alt,
  priority = false,
  overlay = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  overlay?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Create the trust band**

Create `src/components/sections/TrustBand.tsx`:

```tsx
import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";

export function TrustBand() {
  return (
    <SectionShell className="border-y border-white/8 bg-[var(--color-surface)] py-8 lg:py-10">
      <div className="flex flex-wrap gap-3">
        {content.trustPills.map((pill) => (
          <span
            key={pill}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]/88"
          >
            {pill}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 5: Add the supporting utility styles**

Add to `src/app/globals.css`:

```css
.section-eyebrow {
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.surface-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0)),
    var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2rem;
}
```

- [ ] **Step 6: Re-run the new focused test**

Run: `npm test -- src/components/sections/TrustBand.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/VenueImage.tsx src/components/sections/TrustBand.tsx src/components/sections/TrustBand.test.tsx src/app/globals.css
git commit -m "feat: add shared venue imagery and trust band"
```

---

### Task 3: Rebuild The Header And Hero Around Real Branding And Dual CTAs

**Files:**

- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Create: `src/components/sections/Hero.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**

- Header shows the real logo and exposes ATC as a visible action.
- Hero uses a real image plus two clear CTAs.
- `page.tsx` renders `Hero` followed by `TrustBand`.

- [ ] **Step 1: Extend the existing header test before editing the component**

Add these checks to `src/components/Header.test.tsx`:

```ts
it("shows a visible padel reservation link", () => {
  render(<Header />);

  expect(
    screen.getByRole("link", { name: /reservá pádel/i }),
  ).toHaveAttribute("href", "https://atcsports.io/venues/vixen-club-gba");
});

it("renders the logo as the home link label", () => {
  render(<Header />);

  expect(screen.getByRole("link", { name: /vixen club/i })).toHaveAttribute(
    "href",
    "/",
  );
});
```

- [ ] **Step 2: Write the failing hero test**

Create `src/components/sections/Hero.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders WhatsApp and ATC as distinct actions", () => {
    render(<Hero />);

    expect(
      screen.getByRole("link", { name: /hablar por whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("wa.me"));

    expect(
      screen.getByRole("link", { name: /reservá pádel en atc/i }),
    ).toHaveAttribute("href", "https://atcsports.io/venues/vixen-club-gba");
  });
});
```

- [ ] **Step 3: Run the focused header + hero tests and confirm failure**

Run: `npm test -- src/components/Header.test.tsx src/components/sections/Hero.test.tsx`

Expected: FAIL because the ATC CTA and updated hero copy do not exist yet.

- [ ] **Step 4: Rewrite the header around the real logo and the two conversion paths**

Update `src/components/Header.tsx` so the brand link uses the SVG logo and the
desktop nav includes both action buttons:

```tsx
import Image from "next/image";
import Link from "next/link";
import { content } from "@/content";
import { Button } from "./Button";

<Link href="/" aria-label={content.site.name} className="shrink-0">
  <Image
    src="/logo_vixen.svg"
    alt={content.site.name}
    width={168}
    height={50}
    priority
    className="h-auto w-32 sm:w-36"
  />
</Link>

<nav className="hidden items-center gap-6 md:flex">
  {content.nav.map((n) => (
    <Link key={n.href} href={n.href} className="text-sm font-medium">
      {n.label}
    </Link>
  ))}
  <Button href={content.site.padelReservationUrl} variant="secondary">
    Reservá pádel
  </Button>
  <Button href={buildWhatsAppUrl("Hola! Quiero más info.")}>WhatsApp</Button>
</nav>
```

Mirror both actions in the mobile dialog.

- [ ] **Step 5: Rewrite the hero as an image-led split section**

Update `src/components/sections/Hero.tsx` to use the new content and
`VenueImage`:

```tsx
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

export function Hero() {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-8 sm:px-8 lg:pb-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="section-eyebrow mb-4 text-sm font-semibold text-[var(--color-accent)]">
            {hero.kicker}
          </p>
          <h1 className="text-display max-w-3xl">{hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {hero.proof.map((item) => (
              <span key={item} className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80">
                {item}
              </span>
            ))}
          </div>
        </div>

        <VenueImage
          src={hero.image.src}
          alt={hero.image.alt}
          priority
          overlay
          className="aspect-[4/5] min-h-[24rem] lg:aspect-[5/6]"
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Update the page composition to include the trust band**

In `src/app/page.tsx`, replace the old middle imports and render order start:

```tsx
import { TrustBand } from "@/components/sections/TrustBand";

<main>
  <Hero />
  <TrustBand />
  {/* the next tasks replace the old middle sections */}
</main>
```

- [ ] **Step 7: Re-run the focused tests**

Run: `npm test -- src/components/Header.test.tsx src/components/sections/Hero.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx src/components/sections/Hero.tsx src/components/sections/Hero.test.tsx src/app/page.tsx
git commit -m "feat: rebuild header and hero for dual conversion"
```

---

### Task 4: Replace The Generic Middle Stack With Action-Oriented Sections

**Files:**

- Create: `src/components/sections/UseCases.tsx`
- Create: `src/components/sections/UseCases.test.tsx`
- Create: `src/components/sections/Tournaments.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**

- `UseCases()` renders football and padel as separate conversion panels.
- `Tournaments()` uses trophy imagery to reinforce competition and activity.

- [ ] **Step 1: Write the failing use-cases test**

Create `src/components/sections/UseCases.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UseCases } from "./UseCases";

describe("UseCases", () => {
  it("renders separate CTAs for fútbol and pádel", () => {
    render(<UseCases />);

    expect(
      screen.getByRole("link", { name: /consultar fútbol por whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("wa.me"));

    expect(
      screen.getByRole("link", { name: /reservá tu turno en atc/i }),
    ).toHaveAttribute("href", "https://atcsports.io/venues/vixen-club-gba");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/components/sections/UseCases.test.tsx`

Expected: FAIL because `UseCases` does not exist yet.

- [ ] **Step 3: Create the split use-case section**

Create `src/components/sections/UseCases.tsx`:

```tsx
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

export function UseCases() {
  const { futbol, padel } = content.useCases;

  return (
    <SectionShell>
      <SectionHeading
        kicker="Cómo convertir"
        title="Elegí tu deporte y entrá por el canal correcto"
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="surface-panel p-6">
          <VenueImage src={futbol.image.src} alt={futbol.image.alt} className="aspect-[4/3]" />
          <h3 className="text-display-sm mt-6 text-2xl">{futbol.title}</h3>
          <p className="mt-3 text-[var(--color-muted)]">{futbol.body}</p>
          <Button href={futbol.cta.href} className="mt-6">
            {futbol.cta.label}
          </Button>
        </article>

        <article className="surface-panel p-6">
          <VenueImage src={padel.image.src} alt={padel.image.alt} className="aspect-[4/3]" />
          <h3 className="text-display-sm mt-6 text-2xl">{padel.title}</h3>
          <p className="mt-3 text-[var(--color-muted)]">{padel.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={padel.primaryCta.href}>{padel.primaryCta.label}</Button>
            <Button href={padel.secondaryCta.href} variant="secondary">
              {padel.secondaryCta.label}
            </Button>
          </div>
        </article>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 4: Create the tournament proof section**

Create `src/components/sections/Tournaments.tsx`:

```tsx
import { SectionHeading } from "@/components/SectionHeading";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

export function Tournaments() {
  const { tournaments } = content;

  return (
    <SectionShell className="border-t border-white/6 bg-[var(--color-surface)]">
      <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <VenueImage
          src={tournaments.image.src}
          alt={tournaments.image.alt}
          className="aspect-square lg:aspect-[4/5]"
        />
        <div>
          <SectionHeading kicker="Competencia real" title={tournaments.title} />
          <p className="mt-4 max-w-xl text-[var(--color-muted)]">
            {tournaments.body}
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-white/82">
            {tournaments.points.map((point) => (
              <li key={point} className="rounded-2xl border border-white/8 px-4 py-3">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 5: Replace the old middle stack in `page.tsx`**

Update the middle composition:

```tsx
import { UseCases } from "@/components/sections/UseCases";
import { Tournaments } from "@/components/sections/Tournaments";

<main>
  <Hero />
  <TrustBand />
  <UseCases />
  <Tournaments />
  <Eventos />
  <Sede />
</main>
```

Remove the old `Disciplines` and `HighlightBand` imports from the home page.

- [ ] **Step 6: Re-run the focused use-cases test**

Run: `npm test -- src/components/sections/UseCases.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/UseCases.tsx src/components/sections/UseCases.test.tsx src/components/sections/Tournaments.tsx src/app/page.tsx
git commit -m "feat: replace generic home sections with action-oriented panels"
```

---

### Task 5: Upgrade The Bottom Of The Page And Close The Trust Loop

**Files:**

- Modify: `src/components/sections/Eventos.tsx`
- Modify: `src/components/sections/Sede.tsx`
- Modify: `src/components/Footer.tsx`
- Create: `src/components/Footer.test.tsx`
- Modify: `src/components/WhatsAppButton.tsx`
- Run: tests and production build

**Interfaces:**

- Events section uses real club/venue imagery and better secondary positioning.
- Venue section reflects operational amenities.
- Footer repeats both conversion paths.

- [ ] **Step 1: Add the footer test for the closing CTAs**

Append to `src/components/Footer.test.tsx` after creating the file if it does not
exist:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("repeats WhatsApp and ATC actions", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: /reservá pádel en atc/i }),
    ).toHaveAttribute("href", "https://atcsports.io/venues/vixen-club-gba");
    expect(
      screen.getByRole("link", { name: /\(011\) 15 3773 0713/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused footer test and confirm failure**

Run: `npm test -- src/components/Footer.test.tsx`

Expected: FAIL because the footer does not repeat the ATC action yet.

- [ ] **Step 3: Make `Eventos` and `Sede` feel real, not placeholder-like**

Use the existing content model plus real images:

```tsx
// Eventos.tsx
<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
  <div>
    <SectionHeading kicker="Después del partido" title={eventos.title} />
    <p className="mt-4 text-[var(--color-muted)]">{eventos.body}</p>
    <Button href={buildWhatsAppUrl(eventos.cta.message)} className="mt-8">
      {eventos.cta.label}
    </Button>
  </div>
  <VenueImage src="/canchas1.jpg" alt="Sector social y canchas en Vixen Club" className="aspect-[4/3]" />
</div>
```

```tsx
// Sede.tsx
<ul className="mt-6 grid gap-3 sm:grid-cols-2">
  {sede.amenities.map((item) => (
    <li key={item} className="rounded-2xl border border-white/8 px-4 py-3 text-sm text-white/82">
      {item}
    </li>
  ))}
</ul>
```

- [ ] **Step 4: Rewrite the footer and floating CTA for stronger closing conversion**

Update `src/components/Footer.tsx` to include a final CTA row:

```tsx
<div className="surface-panel mb-10 flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <p className="text-display-sm text-2xl">¿Querés jugar o reservar?</p>
    <p className="mt-2 text-sm text-[var(--color-muted)]">
      Escribinos por WhatsApp o reservá tu turno de pádel en ATC.
    </p>
  </div>
  <div className="flex flex-wrap gap-3">
    <Button href={content.site.padelReservationUrl} variant="secondary">
      Reservá pádel en ATC
    </Button>
    <Button href={buildWhatsAppUrl("Hola! Quiero más info de Vixen.")}>
      WhatsApp
    </Button>
  </div>
</div>
```

Update `src/components/WhatsAppButton.tsx` so the floating CTA uses a more
polished icon treatment and hover state, but keep the same destination.

- [ ] **Step 5: Re-run the focused footer test**

Run: `npm test -- src/components/Footer.test.tsx`

Expected: PASS

- [ ] **Step 6: Run the full test suite**

Run: `npm test`

Expected: PASS

- [ ] **Step 7: Run the production build**

Run: `npm run build`

Expected: build completes successfully on Next 16 with no type or lint-time
failures.

- [ ] **Step 8: Manual responsive verification**

Run: `npm run dev`

Check manually at:

- `390x844`
- `768x1024`
- `1280x720`

Verify:

- hero reads clearly at all sizes
- header keeps both conversion paths usable
- ATC CTA remains obvious on mobile
- images crop cleanly
- WhatsApp and ATC buttons are never visually confused with each other

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/Eventos.tsx src/components/sections/Sede.tsx src/components/Footer.tsx src/components/Footer.test.tsx src/components/WhatsAppButton.tsx src/app/globals.css
git commit -m "feat: close the trust loop on the home page"
```
