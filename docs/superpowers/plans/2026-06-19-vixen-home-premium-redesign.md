# Vixen Club Home Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/` homepage so it feels like a premium, editorial sports club site with a green-led brand system, a stronger hero, cleaner section rhythm, and a more institutional footer while preserving the real WhatsApp + ATC conversion flow.

**Architecture:** Keep the existing App Router page composition and current content model, but retheme the design system and recompose the homepage sections so they feel like one branded experience instead of stacked components. Favor shared CSS/token changes in `src/app/globals.css` and then tighten each section in place rather than introducing new top-level abstractions.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind utility classes, Vitest, Testing Library

---

## File Map

- Modify: `src/app/globals.css`
  - Replace the yellow-first tone with a green-led brand palette and define calmer surface/metadata treatments.
- Modify: `src/content.ts`
  - Keep the real conversion flow but tighten homepage-facing facts, sponsor typography data, and microcopy hooks.
- Modify: `src/components/Button.tsx`
  - Align CTA styling with the premium/editorial system.
- Modify: `src/components/Header.tsx`
  - Keep a single WhatsApp CTA and make the header feel lighter and more premium.
- Modify: `src/components/sections/Hero.tsx`
  - Strengthen the first viewport composition and integrate the club facts line into the hero.
- Modify: `src/components/sections/UseCases.tsx`
  - Remove remaining “card grid” feeling and move toward editorial blocks.
- Modify: `src/components/sections/Tournaments.tsx`
  - Make the momentum/trust section feel more like proof of life than a reusable panel.
- Modify: `src/components/sections/Eventos.tsx`
  - Keep it secondary but more intentional and club-like.
- Modify: `src/components/sections/Sede.tsx`
  - Make the venue section practical and premium, with better scanning and less panel feel.
- Modify: `src/components/Footer.tsx`
  - Keep it institutional: logo, address, sponsors, contact, socials.
- Modify: `src/components/WhatsAppButton.tsx`
  - Keep the public SVG and soften the “pasted widget” feel.
- Modify: `src/app/page.tsx`
  - Keep the leaner home composition and remove any section that no longer earns its place.
- Modify tests:
  - `src/content.test.ts`
  - `src/components/Header.test.tsx`
  - `src/components/sections/Hero.test.tsx`
  - `src/components/Footer.test.tsx`
  - `src/components/WhatsAppButton.test.tsx`

### Task 1: Rebuild The Shared Brand System

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/Button.tsx`
- Modify: `src/content.ts`
- Test: `src/content.test.ts`

- [ ] **Step 1: Write the failing content test for the premium home data contract**

```ts
it("keeps premium-home sponsor and hero fact data aligned with the green-led redesign", () => {
  expect(content.site.sponsors).toEqual(["PUMA"]);
  expect(content.hero.proof).toEqual([
    "Pilar / Del Viso",
    "Pádel en ATC",
    "Fútbol 7",
    "Torneos y eventos",
  ]);
});
```

- [ ] **Step 2: Run the targeted test to verify the content contract fails if the current data drifts**

Run: `npm test -- src/content.test.ts`
Expected: FAIL if `site.sponsors` or `hero.proof` values do not match the premium-home contract exactly.

- [ ] **Step 3: Apply the green-led brand system and shared CTA treatment**

```ts
// src/content.ts
site: {
  ...,
  sponsors: ["PUMA"],
},
hero: {
  ...,
  proof: [
    "Pilar / Del Viso",
    "Pádel en ATC",
    "Fútbol 7",
    "Torneos y eventos",
  ],
},
```

```css
/* src/app/globals.css */
@theme {
  --color-base: #090b0a;
  --color-surface: #111512;
  --color-surface-2: #171d18;
  --color-ink: #f5f6f0;
  --color-muted: #98a29a;
  --color-accent: #3cbf71;
  --color-accent-strong: #25d366;
}

.metadata-strip li + li::before {
  background: rgb(60 191 113 / 0.22);
}

.editorial-panel {
  border: 1px solid rgb(255 255 255 / 0.06);
  background: linear-gradient(180deg, rgb(255 255 255 / 0.03), rgb(255 255 255 / 0.015));
}
```

```tsx
// src/components/Button.tsx
const styles: Record<Variant, string> = {
  primary: "bg-[var(--color-accent)] text-[#07110a] hover:brightness-105",
  secondary:
    "border border-white/18 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  ghost: "text-[var(--color-ink)] hover:text-[var(--color-accent)]",
};
```

- [ ] **Step 4: Run the targeted test again**

Run: `npm test -- src/content.test.ts`
Expected: PASS with the sponsor array and hero facts matching the new contract.

- [ ] **Step 5: Commit the shared brand-system task**

```bash
git add src/app/globals.css src/components/Button.tsx src/content.ts src/content.test.ts
git commit -m "feat: retheme the landing brand system"
```

### Task 2: Recompose Header And Hero

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Header.test.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Modify: `src/components/sections/Hero.test.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing tests for the premium header/hero contract**

```ts
// src/components/Header.test.tsx
it("shows WhatsApp as the only desktop header CTA", () => {
  render(<Header />);
  expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /reservá pádel/i })).not.toBeInTheDocument();
});
```

```ts
// src/components/sections/Hero.test.tsx
it("renders the club facts line inside the hero as a labeled list", () => {
  render(<Hero />);
  expect(screen.getByRole("list", { name: /datos del club/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted component tests**

Run: `npm test -- src/components/Header.test.tsx src/components/sections/Hero.test.tsx`
Expected: FAIL if the header still exposes a pádel CTA or the hero facts line is not labeled as `Datos del club`.

- [ ] **Step 3: Implement the cleaner header and the stronger hero composition**

```tsx
// src/components/Header.tsx
const ctas: HeaderCta[] = [
  { label: "WhatsApp", href: content.hero.primaryCta.href },
];

return (
  <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--color-base)]/86 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
      ...
      <nav className="hidden flex-1 items-center justify-center gap-4 md:flex lg:gap-8">
        ...
      </nav>
      <div className="hidden md:flex">{renderDesktopCtas()}</div>
    </div>
  </header>
);
```

```tsx
// src/components/sections/Hero.tsx
<section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(60,191,113,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_44%)] px-5 pb-12 pt-10 sm:px-8 lg:pb-18">
  <div className="mx-auto grid max-w-7xl gap-10 lg:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
    ...
    <ul aria-label="Datos del club" className="metadata-strip mt-8">
      {hero.proof.map((item) => (
        <li key={item} className="inline-flex items-center">{item}</li>
      ))}
    </ul>
  </div>
</section>
```

```tsx
// src/app/page.tsx
<main>
  <Hero />
  <UseCases />
  <Tournaments />
  <Eventos />
  <Sede />
</main>
```

- [ ] **Step 4: Run the targeted tests again**

Run: `npm test -- src/components/Header.test.tsx src/components/sections/Hero.test.tsx`
Expected: PASS with the single-CTA header and the hero facts line now anchored inside the hero.

- [ ] **Step 5: Commit the header/hero task**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx src/components/sections/Hero.tsx src/components/sections/Hero.test.tsx src/app/page.tsx
git commit -m "feat: recompose the landing header and hero"
```

### Task 3: Turn The Mid-Page Into Editorial Club Sections

**Files:**
- Modify: `src/components/sections/UseCases.tsx`
- Modify: `src/components/sections/Tournaments.tsx`
- Modify: `src/components/sections/Eventos.tsx`
- Modify: `src/components/sections/Sede.tsx`

- [ ] **Step 1: Add a failing semantic check for the section stack staying coherent**

```ts
it("keeps the section stack focused on club offer, momentum, events, and venue", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { name: /fútbol por whatsapp\. pádel por atc\./i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /copas, torneos y movimiento real/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /eventos y bar/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /la sede/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused homepage rendering test**

Run: `npm test -- src/components/sections/Hero.test.tsx src/components/Footer.test.tsx`
Expected: PASS or FAIL only on actual semantic regressions; do not proceed until the existing render tree is stable enough to refactor visually.

- [ ] **Step 3: Rewrite the mid-page sections to reduce the card-grid feel**

```tsx
// src/components/sections/UseCases.tsx
<div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
  <article className="grid gap-6 border-t border-white/8 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
    ...
  </article>
  <article className="grid gap-6 border-t border-white/8 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
    ...
  </article>
</div>
```

```tsx
// src/components/sections/Tournaments.tsx
<SectionShell id="torneos" className="border-t border-white/5 bg-[linear-gradient(180deg,var(--color-surface),var(--color-base))]">
  ...
</SectionShell>
```

```tsx
// src/components/sections/Eventos.tsx
<SectionShell id="eventos" className="border-t border-white/5">
  ...
</SectionShell>
```

```tsx
// src/components/sections/Sede.tsx
<div className="mt-8 grid gap-4 border-t border-white/8 pt-6 sm:grid-cols-2">
  ...
</div>
```

- [ ] **Step 4: Run the full test suite after the section rewrites**

Run: `npm test`
Expected: PASS with `28 passed` or higher if new tests are added.

- [ ] **Step 5: Commit the mid-page redesign task**

```bash
git add src/components/sections/UseCases.tsx src/components/sections/Tournaments.tsx src/components/sections/Eventos.tsx src/components/sections/Sede.tsx
git commit -m "feat: redesign the landing section stack"
```

### Task 4: Institutional Footer And Integrated WhatsApp

**Files:**
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Footer.test.tsx`
- Modify: `src/components/WhatsAppButton.tsx`
- Modify: `src/components/WhatsAppButton.test.tsx`

- [ ] **Step 1: Write the failing tests for the new footer and floating CTA**

```ts
// src/components/Footer.test.tsx
it("renders the institutional footer without the closing CTA panel", () => {
  render(<Footer />);
  expect(screen.queryByText(/cerrá la visita con una acción clara/i)).not.toBeInTheDocument();
  expect(screen.getByText(/sponsors/i)).toBeInTheDocument();
});
```

```ts
// src/components/WhatsAppButton.test.tsx
it("uses the public WhatsApp SVG inside the floating CTA", () => {
  render(<WhatsAppButton />);
  expect(screen.getByRole("img", { name: /whatsapp/i })).toHaveAttribute(
    "src",
    expect.stringContaining("whatsapp-color-svgrepo-com.svg"),
  );
});
```

- [ ] **Step 2: Run the targeted footer/WhatsApp tests**

Run: `npm test -- src/components/Footer.test.tsx src/components/WhatsAppButton.test.tsx`
Expected: FAIL if the old promotional footer block remains or the floating CTA still uses local vector markup instead of the public SVG.

- [ ] **Step 3: Implement the institutional footer and calmer floating WhatsApp**

```tsx
// src/components/Footer.tsx
<div className="grid gap-12 border-t border-white/5 pt-10 md:grid-cols-[1.05fr_0.8fr_0.9fr]">
  <div className="max-w-sm">
    <Link href="/" aria-label={site.name} className="inline-flex">
      <Image src="/logo_vixen.svg" alt={site.name} width={210} height={64} className="h-auto w-44 sm:w-48" />
    </Link>
    <p className="mt-5 max-w-xs text-sm text-[var(--color-muted)]">{site.address}</p>
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Sponsors</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/76">
        {site.sponsors.map((sponsor) => <span key={sponsor}>{sponsor}</span>)}
      </div>
    </div>
  </div>
  ...
</div>
```

```tsx
// src/components/WhatsAppButton.tsx
<a className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-md border border-[#25D366]/30 bg-[linear-gradient(135deg,#25D366,#17A884)] px-3 py-3 text-white shadow-[0_16px_34px_rgba(23,168,132,0.22)] ...">
  <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/14">
    <Image
      src="/whatsapp-color-svgrepo-com.svg"
      alt="WhatsApp"
      width={24}
      height={24}
      className="h-6 w-6"
    />
  </span>
  ...
</a>
```

- [ ] **Step 4: Run targeted tests, full suite, and production build**

Run: `npm test -- src/components/Footer.test.tsx src/components/WhatsAppButton.test.tsx`
Expected: PASS

Run: `npm test`
Expected: PASS with `0 failed`

Run: `npm run build`
Expected: PASS with Next.js finishing static generation successfully.

- [ ] **Step 5: Commit the footer and floating CTA task**

```bash
git add src/components/Footer.tsx src/components/Footer.test.tsx src/components/WhatsAppButton.tsx src/components/WhatsAppButton.test.tsx
git commit -m "feat: institutionalize the landing footer"
```

### Task 5: Browser QA And Final Polish Sweep

**Files:**
- Modify as needed after QA: `src/app/globals.css`, `src/components/Header.tsx`, `src/components/sections/Hero.tsx`, `src/components/Footer.tsx`, `src/components/WhatsAppButton.tsx`

- [ ] **Step 1: Reload the local homepage and inspect the three critical areas**

Run browser QA on `http://127.0.0.1:3001/`
Check:
- header feels clean and only exposes WhatsApp as a top-level CTA
- hero reads as one premium composition, not a split-template
- footer feels institutional and the floating WhatsApp no longer looks pasted on

- [ ] **Step 2: Make the smallest necessary polish patch**

```css
/* Example follow-up patch targets */
.text-display { letter-spacing: -0.03em; }
.metadata-strip { color: rgb(245 246 240 / 0.72); }
```

```tsx
// Example follow-up patch targets
<header className="... bg-[var(--color-base)]/90 ...">
<Hero ... />
<Footer ... />
```

- [ ] **Step 3: Re-run the full verification after the polish patch**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Confirm the browser state again**

Re-check on `http://127.0.0.1:3001/`
Expected:
- no yellow-first accent remains
- the first viewport feels premium and green-led
- the floating WhatsApp feels integrated instead of bolted on

- [ ] **Step 5: Commit the final polish**

```bash
git add src/app/globals.css src/components/Header.tsx src/components/sections/Hero.tsx src/components/Footer.tsx src/components/WhatsAppButton.tsx
git commit -m "feat: polish the premium landing finish"
```
