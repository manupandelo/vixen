# Vixen Club Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, fully responsive marketing site for Vixen Club (fútbol 7 + pádel + eventos venue in Pilar) with Next.js, clearly outclassing the current vixen.com.ar.

**Architecture:** Next.js 15 App Router with a single scroll-based home page plus two detail pages (`/futbol`, `/padel`). All copy/contact/links live in one typed content module so text/prices swap in one place. Presentational components are small and single-purpose. Imagery uses CSS gradient placeholders now, with an `ImagePlaceholder`/content image-field pattern so real photos drop in later.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4 (CSS-first `@theme`), `next/font`, Vitest + React Testing Library, ESLint + Prettier.

## Global Constraints

- **Framework:** Next.js 15.x, App Router, TypeScript strict mode.
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme` in `globals.css`). No `tailwind.config.js` unless required.
- **Node:** v22 (installed).
- **Language of all UI copy:** Spanish (Argentina). Reuse content verbatim from spec.
- **Real contact facts (use exactly):** phone/WhatsApp `(011) 15 3773 0713` → WhatsApp number digits `5491137730713`; email `info@vixen.com.ar`; address `Las Azucenas 3941, Alberti, Pilar, Buenos Aires`; sponsor `PUMA`.
- **Color tokens:** base near-black `#0B0B0C`, surface `#141416`, off-white text `#F5F5F0`, volt accent `#C6F000`, warm secondary `#FF5C39`.
- **Accent usage:** volt green sparingly — CTAs/highlights only.
- **Responsive:** mobile-first; verify at 375px / 768px / 1280px.
- **Accessibility:** semantic HTML, keyboard-accessible nav, alt text, respect `prefers-reduced-motion`.
- **Visual quality:** when building UI, follow the `frontend-design` skill for typography, spacing, and distinctiveness.
- **Commits:** conventional commit messages; commit at the end of each task.

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: a running Next.js app; root `layout.tsx` exporting `metadata` and wrapping `{children}`.

- [ ] **Step 1: Scaffold with create-next-app**

```bash
cd /Users/manu/repos/vixen
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --no-import-alias --use-npm --yes
```

Expected: project files created in place. If the directory-not-empty prompt blocks (because `docs/` exists), re-run with `--yes` already passed; create-next-app ignores existing unrelated dirs.

- [ ] **Step 2: Initialize git and first commit**

```bash
cd /Users/manu/repos/vixen
git init
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

- [ ] **Step 3: Verify dev server boots**

Run: `npm run dev` (then stop with Ctrl-C after confirming)
Expected: "Ready" / Local: http://localhost:3000 with no compile errors.

- [ ] **Step 4: Verify production build**

Run: `npm run build`
Expected: build completes, no type errors.

- [ ] **Step 5: Commit any lockfile/config changes**

```bash
git add -A && git commit -m "chore: verify build" --allow-empty
```

---

### Task 2: Install test tooling and design tokens

**Files:**
- Modify: `package.json` (scripts + devDeps)
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `src/app/globals.css` (theme tokens + fluid type)
- Modify: `src/app/layout.tsx` (fonts + metadata)

**Interfaces:**
- Produces: CSS custom properties / Tailwind theme tokens `--color-base`, `--color-surface`, `--color-ink`, `--color-accent`, `--color-warm`; font CSS vars `--font-display`, `--font-body`; npm script `test`.

- [ ] **Step 1: Install dev dependencies**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier
```

- [ ] **Step 2: Add test scripts to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 4: Create vitest.setup.ts**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Write theme tokens in globals.css**

Replace the contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-base: #0b0b0c;
  --color-surface: #141416;
  --color-ink: #f5f5f0;
  --color-muted: #a1a1a6;
  --color-accent: #c6f000;
  --color-warm: #ff5c39;
  --font-display: var(--font-display), "Arial Narrow", sans-serif;
  --font-body: var(--font-body), system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}

body {
  background: var(--color-base);
  color: var(--color-ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* Fluid display headings */
.text-display {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  font-size: clamp(2.5rem, 6vw + 1rem, 6rem);
}

.text-display-sm {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  font-size: clamp(1.75rem, 3vw + 1rem, 3rem);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 6: Wire fonts + metadata in layout.tsx**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Vixen Club — Fútbol 7 y Pádel en Pilar",
  description:
    "Torneos de fútbol 7 masculino y femenino, pádel, clases y eventos en Pilar, Buenos Aires. Inscripción temporada 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Run tests (none yet) and build**

Run: `npm test` → Expected: "No test files found" (exit 0 is fine) or passes.
Run: `npm run build` → Expected: success.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add design tokens, fonts, and test tooling"
```

---

### Task 3: Content model + WhatsApp link helper (TDD)

**Files:**
- Create: `src/lib/whatsapp.ts`, `src/lib/whatsapp.test.ts`
- Create: `src/content.ts`
- Create: `src/content.test.ts`

**Interfaces:**
- Produces:
  - `buildWhatsAppUrl(message?: string): string` — returns `https://wa.me/5491137730713` optionally with `?text=` URL-encoded message.
  - `content` object (typed) with shape: `site` (`{ name, phoneDisplay, email, address, whatsappNumber, instagram, facebook }`), `nav: { label: string; href: string }[]`, `hero`, `disciplines: { id, title, blurb, href }[]`, `futbol`, `padel`, `eventos`, `sede`, used by all sections/pages.

- [ ] **Step 1: Write failing test for buildWhatsAppUrl**

`src/lib/whatsapp.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl } from "./whatsapp";

describe("buildWhatsAppUrl", () => {
  it("returns base wa.me link with no message", () => {
    expect(buildWhatsAppUrl()).toBe("https://wa.me/5491137730713");
  });

  it("appends URL-encoded message text", () => {
    expect(buildWhatsAppUrl("Hola, quiero reservar")).toBe(
      "https://wa.me/5491137730713?text=Hola%2C%20quiero%20reservar",
    );
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/lib/whatsapp.test.ts`
Expected: FAIL — cannot find module `./whatsapp`.

- [ ] **Step 3: Implement whatsapp.ts**

```ts
const WHATSAPP_NUMBER = "5491137730713";

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run src/lib/whatsapp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write failing test for content shape**

`src/content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { content } from "./content";

describe("content", () => {
  it("exposes real contact facts", () => {
    expect(content.site.email).toBe("info@vixen.com.ar");
    expect(content.site.phoneDisplay).toBe("(011) 15 3773 0713");
    expect(content.site.address).toContain("Pilar");
    expect(content.site.whatsappNumber).toBe("5491137730713");
  });

  it("has the five primary nav links", () => {
    expect(content.nav.map((n) => n.href)).toEqual([
      "/futbol",
      "/padel",
      "/#eventos",
      "/#sede",
      "/#contacto",
    ]);
  });

  it("lists fútbol and pádel disciplines", () => {
    expect(content.disciplines.map((d) => d.id)).toEqual(["futbol", "padel"]);
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npx vitest run src/content.test.ts`
Expected: FAIL — cannot find module `./content`.

- [ ] **Step 7: Implement content.ts**

```ts
export type NavLink = { label: string; href: string };
export type Discipline = {
  id: "futbol" | "padel";
  title: string;
  blurb: string;
  href: string;
};

export const content = {
  site: {
    name: "Vixen Club",
    phoneDisplay: "(011) 15 3773 0713",
    email: "info@vixen.com.ar",
    address: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    whatsappNumber: "5491137730713",
    instagram: "https://instagram.com/vixen.club",
    facebook: "https://facebook.com/vixen.club",
    sponsor: "PUMA",
  },
  nav: [
    { label: "Fútbol", href: "/futbol" },
    { label: "Pádel", href: "/padel" },
    { label: "Eventos", href: "/#eventos" },
    { label: "Sede", href: "/#sede" },
    { label: "Contacto", href: "/#contacto" },
  ] as NavLink[],
  hero: {
    kicker: "Pilar · Buenos Aires",
    title: "Viví el deporte\nen Vixen",
    subtitle:
      "Torneos de fútbol 7 y pádel, clases, alquiler de canchas y eventos. Inscripción temporada 2026 abierta.",
    primaryCta: { label: "Inscripción 2026", message: "Hola! Quiero inscribirme en la temporada 2026." },
    secondaryCta: { label: "Reservar cancha", message: "Hola! Quiero reservar una cancha." },
  },
  disciplines: [
    {
      id: "futbol",
      title: "Fútbol 7",
      blurb: "Torneos masculino y femenino, formato 7 vs 7. Sumá tu equipo.",
      href: "/futbol",
    },
    {
      id: "padel",
      title: "Pádel",
      blurb: "Torneos americanos, clases y alquiler de canchas.",
      href: "/padel",
    },
  ] as Discipline[],
  futbol: {
    title: "Fútbol 7",
    intro:
      "Jugá en las mejores canchas de Pilar. Torneos masculino y femenino, formato 7 vs 7, todos los niveles.",
    points: [
      { title: "Masculino y Femenino", body: "Categorías para todos. Armá tu equipo o sumate a uno." },
      { title: "Formato 7 vs 7", body: "Partidos dinámicos en canchas de césped sintético." },
      { title: "Copas y torneos", body: "Fixture organizado, premios y la mejor competencia." },
    ],
    cta: { label: "Inscripción 2026", message: "Hola! Quiero anotar mi equipo de fútbol 7 para 2026." },
  },
  padel: {
    title: "Pádel",
    intro:
      "Torneos americanos, clases con profes y alquiler de canchas. Para jugar suelto o competir.",
    points: [
      { title: "Torneos americanos", body: "Diversión y juego asegurado para todos los niveles." },
      { title: "Clases", body: "Mejorá tu juego con nuestros profesores." },
      { title: "Alquiler de canchas", body: "Reservá tu turno por WhatsApp en segundos." },
    ],
    cta: { label: "Reservar cancha", message: "Hola! Quiero reservar una cancha de pádel." },
  },
  eventos: {
    title: "Eventos y Bar",
    body: "Cumpleaños, despedidas, after del partido. Nuestro espacio con bar es ideal para juntarte después de jugar.",
    cta: { label: "Consultar por un evento", message: "Hola! Quiero consultar por un evento." },
  },
  sede: {
    title: "La Sede",
    addressLabel: "Las Azucenas 3941, Alberti, Pilar",
    mapQuery: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    amenities: ["Canchas de fútbol 7", "Canchas de pádel", "Bar y eventos", "Estacionamiento"],
  },
} as const;
```

- [ ] **Step 8: Run all tests, verify pass**

Run: `npm test`
Expected: PASS (whatsapp + content suites).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add typed content model and WhatsApp helper"
```

---

### Task 4: Primitive components (Button, SectionShell, SectionHeading, ImagePlaceholder, Stat)

**Files:**
- Create: `src/components/Button.tsx`, `src/components/SectionShell.tsx`, `src/components/SectionHeading.tsx`, `src/components/ImagePlaceholder.tsx`, `src/components/Stat.tsx`
- Create: `src/components/Button.test.tsx`

**Interfaces:**
- Produces:
  - `Button({ href, variant?, children, className? })` — `variant: "primary" | "secondary" | "ghost"` (default `primary`); renders an `<a>`.
  - `SectionShell({ id?, className?, children })` — `<section>` with id anchor + responsive padding + max-width container.
  - `SectionHeading({ kicker?, title, align? })` — eyebrow + display heading.
  - `ImagePlaceholder({ label?, className?, tone? })` — gradient placeholder block (`tone: "accent" | "warm" | "neutral"`).
  - `Stat({ value, label })`.

- [ ] **Step 1: Write failing test for Button**

`src/components/Button.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a link with the given href and label", () => {
    render(<Button href="/futbol">Inscribite</Button>);
    const link = screen.getByRole("link", { name: "Inscribite" });
    expect(link).toHaveAttribute("href", "/futbol");
  });

  it("applies the secondary variant class", () => {
    render(
      <Button href="#" variant="secondary">
        X
      </Button>,
    );
    expect(screen.getByRole("link", { name: "X" }).className).toContain("border");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/components/Button.test.tsx`
Expected: FAIL — cannot find module `./Button`.

- [ ] **Step 3: Implement Button.tsx**

```tsx
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-base)] hover:brightness-110",
  secondary:
    "border border-[var(--color-ink)]/40 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  ghost: "text-[var(--color-ink)] hover:text-[var(--color-accent)]",
};

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");
  const cls = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${styles[variant]} ${className}`;
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run src/components/Button.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement SectionShell.tsx**

```tsx
export function SectionShell({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:py-32 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
```

- [ ] **Step 6: Implement SectionHeading.tsx**

```tsx
export function SectionHeading({
  kicker,
  title,
  align = "left",
}: {
  kicker?: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {kicker && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {kicker}
        </p>
      )}
      <h2 className="text-display-sm">{title}</h2>
    </div>
  );
}
```

- [ ] **Step 7: Implement ImagePlaceholder.tsx**

```tsx
const tones: Record<string, string> = {
  accent: "from-[var(--color-accent)]/30 to-[var(--color-surface)]",
  warm: "from-[var(--color-warm)]/30 to-[var(--color-surface)]",
  neutral: "from-[var(--color-surface)] to-[var(--color-base)]",
};

export function ImagePlaceholder({
  label,
  className = "",
  tone = "neutral",
}: {
  label?: string;
  className?: string;
  tone?: "accent" | "warm" | "neutral";
}) {
  return (
    <div
      role="img"
      aria-label={label ?? "Imagen de Vixen Club"}
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} ${className}`}
    >
      {label && (
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Implement Stat.tsx**

```tsx
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-display-sm text-[var(--color-accent)]">{value}</p>
      <p className="mt-1 text-sm uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}
```

- [ ] **Step 9: Run all tests + build**

Run: `npm test` → Expected: PASS.
Run: `npm run build` → Expected: success.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: add primitive UI components"
```

---

### Task 5: Header with responsive mobile menu (TDD on menu toggle)

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `content.nav`, `content.site`, `buildWhatsAppUrl`, `Button`.
- Produces: `Header()` — sticky top bar; desktop inline nav; mobile hamburger that toggles a full-screen overlay menu. Client component (`"use client"`).

- [ ] **Step 1: Write failing test for menu toggle**

`src/components/Header.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

describe("Header", () => {
  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cerrar menú/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: FAIL — cannot find module `./Header`.

- [ ] **Step 3: Implement Header.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "./Button";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--color-base)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="text-display-sm text-lg tracking-tight">
          {content.site.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {content.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-[var(--color-ink)] transition hover:text-[var(--color-accent)]"
            >
              {n.label}
            </Link>
          ))}
          <Button href={buildWhatsAppUrl("Hola! Quiero más info.")}>
            WhatsApp
          </Button>
        </nav>

        <button
          type="button"
          aria-label="Abrir menú"
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <span className="block h-0.5 w-7 bg-[var(--color-ink)]" />
          <span className="mt-1.5 block h-0.5 w-7 bg-[var(--color-ink)]" />
          <span className="mt-1.5 block h-0.5 w-7 bg-[var(--color-ink)]" />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--color-base)] px-5 py-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-display-sm text-lg">{content.site.name}</span>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="text-2xl"
            >
              ✕
            </button>
          </div>
          <nav className="mt-12 flex flex-col gap-6">
            {content.nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-display-sm text-3xl"
              >
                {n.label}
              </Link>
            ))}
            <Button
              href={buildWhatsAppUrl("Hola! Quiero más info.")}
              className="mt-4 self-start"
            >
              WhatsApp
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add responsive header with mobile menu"
```

---

### Task 6: Footer + floating WhatsApp button

**Files:**
- Create: `src/components/Footer.tsx`, `src/components/WhatsAppButton.tsx`

**Interfaces:**
- Consumes: `content.site`, `content.nav`, `buildWhatsAppUrl`.
- Produces: `Footer()` (server component) and `WhatsAppButton()` (fixed bottom-right floating link).

- [ ] **Step 1: Implement WhatsAppButton.tsx**

```tsx
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a
      href={buildWhatsAppUrl("Hola! Quiero más info de Vixen.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-base)] shadow-lg transition hover:scale-105"
    >
      <span className="text-2xl font-bold">✆</span>
    </a>
  );
}
```

- [ ] **Step 2: Implement Footer.tsx**

```tsx
import Link from "next/link";
import { content } from "@/content";

export function Footer() {
  const { site, nav } = content;
  return (
    <footer
      id="contacto"
      className="scroll-mt-20 border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
        <div>
          <p className="text-display-sm text-xl">{site.name}</p>
          <p className="mt-3 max-w-xs text-sm text-[var(--color-muted)]">
            {site.address}
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-[var(--color-muted)]">
            Sponsor oficial · {site.sponsor}
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
            Navegación
          </p>
          <ul className="space-y-2 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-[var(--color-accent)]">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
            Contacto
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:+${site.whatsappNumber}`}>{site.phoneDisplay}</a>
            </li>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li className="flex gap-4 pt-2">
              <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={site.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 px-5 py-6 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add footer and floating WhatsApp button"
```

---

### Task 7: Home section components

**Files:**
- Create: `src/components/sections/Hero.tsx`, `src/components/sections/Disciplines.tsx`, `src/components/sections/HighlightBand.tsx`, `src/components/sections/Eventos.tsx`, `src/components/sections/Sede.tsx`

**Interfaces:**
- Consumes: `content`, `buildWhatsAppUrl`, primitives (`Button`, `SectionShell`, `SectionHeading`, `ImagePlaceholder`, `Stat`).
- Produces: `Hero()`, `Disciplines()`, `HighlightBand({ data, reverse?, tone })` where `data` is `content.futbol` or `content.padel` (shape `{ title, intro, points: {title,body}[], cta: {label,message} }`), `Eventos()`, `Sede()`.

- [ ] **Step 1: Implement Hero.tsx**

```tsx
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/Button";

export function Hero() {
  const { hero } = content;
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-base)] to-[var(--color-base)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(198,240,0,0.15),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
          {hero.kicker}
        </p>
        <h1 className="text-display max-w-4xl whitespace-pre-line">
          {hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
          {hero.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href={buildWhatsAppUrl(hero.primaryCta.message)}>
            {hero.primaryCta.label}
          </Button>
          <Button
            href={buildWhatsAppUrl(hero.secondaryCta.message)}
            variant="secondary"
          >
            {hero.secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement Disciplines.tsx**

```tsx
import Link from "next/link";
import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export function Disciplines() {
  return (
    <SectionShell>
      <SectionHeading kicker="Qué hacemos" title="Elegí tu cancha" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {content.disciplines.map((d) => (
          <Link
            key={d.id}
            href={d.href}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[var(--color-surface)] p-8 transition hover:border-[var(--color-accent)]/60"
          >
            <ImagePlaceholder
              tone={d.id === "futbol" ? "accent" : "warm"}
              className="mb-6 aspect-[16/9]"
              label={d.title}
            />
            <h3 className="text-display-sm text-2xl">{d.title}</h3>
            <p className="mt-2 text-[var(--color-muted)]">{d.blurb}</p>
            <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Ver más →
            </span>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 3: Implement HighlightBand.tsx**

```tsx
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Button } from "@/components/Button";

type BandData = {
  title: string;
  intro: string;
  points: { title: string; body: string }[];
  cta: { label: string; message: string };
};

export function HighlightBand({
  data,
  reverse = false,
  tone = "accent",
}: {
  data: BandData;
  reverse?: boolean;
  tone?: "accent" | "warm";
}) {
  return (
    <SectionShell className="border-t border-white/5">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className={reverse ? "md:order-2" : ""}>
          <SectionHeading kicker="Disciplina" title={data.title} />
          <p className="mt-4 text-[var(--color-muted)]">{data.intro}</p>
          <ul className="mt-6 space-y-4">
            {data.points.map((p) => (
              <li key={p.title}>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-[var(--color-muted)]">{p.body}</p>
              </li>
            ))}
          </ul>
          <Button
            href={buildWhatsAppUrl(data.cta.message)}
            className="mt-8"
          >
            {data.cta.label}
          </Button>
        </div>
        <ImagePlaceholder
          tone={tone}
          label={data.title}
          className={`aspect-[4/5] w-full ${reverse ? "md:order-1" : ""}`}
        />
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 4: Implement Eventos.tsx**

```tsx
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/Button";

export function Eventos() {
  const { eventos } = content;
  return (
    <SectionShell
      id="eventos"
      className="border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="max-w-2xl">
        <SectionHeading kicker="Después del partido" title={eventos.title} />
        <p className="mt-4 text-[var(--color-muted)]">{eventos.body}</p>
        <Button href={buildWhatsAppUrl(eventos.cta.message)} className="mt-8">
          {eventos.cta.label}
        </Button>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 5: Implement Sede.tsx**

```tsx
import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";

export function Sede() {
  const { sede } = content;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    sede.mapQuery,
  )}&output=embed`;
  return (
    <SectionShell id="sede" className="border-t border-white/5">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <SectionHeading kicker="Dónde estamos" title={sede.title} />
          <p className="mt-4 text-lg">{sede.addressLabel}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-[var(--color-muted)]">
            {sede.amenities.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <span className="text-[var(--color-accent)]">●</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
        <iframe
          title="Mapa de Vixen Club"
          src={mapSrc}
          loading="lazy"
          className="h-72 w-full rounded-2xl border border-white/5 md:h-full"
        />
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 6: Build to verify all sections compile**

Run: `npm run build`
Expected: success (these aren't imported anywhere yet; build still type-checks files? Note: unused files are still type-checked by `tsc` during build only if referenced. To force a check, proceed to Task 8 which imports them, then build.)

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add home page section components"
```

---

### Task 8: Assemble home page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Header`, `Footer`, `WhatsAppButton`, all section components, `content`.

- [ ] **Step 1: Replace page.tsx**

```tsx
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Hero } from "@/components/sections/Hero";
import { Disciplines } from "@/components/sections/Disciplines";
import { HighlightBand } from "@/components/sections/HighlightBand";
import { Eventos } from "@/components/sections/Eventos";
import { Sede } from "@/components/sections/Sede";
import { content } from "@/content";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Disciplines />
        <HighlightBand data={content.futbol} tone="accent" />
        <HighlightBand data={content.padel} tone="warm" reverse />
        <Eventos />
        <Sede />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
```

- [ ] **Step 2: Build + run dev, verify home renders**

Run: `npm run build` → Expected: success, no type errors.
Run: `npm run dev`, open http://localhost:3000 → Expected: full home page renders with all sections, no console errors. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: assemble home page"
```

---

### Task 9: Fútbol detail page

**Files:**
- Create: `src/app/futbol/page.tsx`

**Interfaces:**
- Consumes: `Header`, `Footer`, `WhatsAppButton`, `HighlightBand`, `SectionShell`, `SectionHeading`, `Stat`, `content.futbol`, `buildWhatsAppUrl`.

- [ ] **Step 1: Create futbol/page.tsx**

```tsx
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/Button";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Fútbol 7 — Vixen Club",
  description:
    "Torneos de fútbol 7 masculino y femenino en Pilar. Inscripción temporada 2026.",
};

export default function FutbolPage() {
  const { futbol } = content;
  return (
    <>
      <Header />
      <main>
        <SectionShell className="pt-28">
          <SectionHeading kicker="Pilar · Buenos Aires" title={futbol.title} />
          <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            {futbol.intro}
          </p>
          <div className="mt-10 flex gap-10">
            <Stat value="7v7" label="Formato" />
            <Stat value="M/F" label="Categorías" />
            <Stat value="2026" label="Inscripción" />
          </div>
          <ImagePlaceholder
            tone="accent"
            label="Fútbol 7"
            className="mt-10 aspect-[21/9] w-full"
          />
        </SectionShell>

        <SectionShell className="border-t border-white/5 bg-[var(--color-surface)]">
          <div className="grid gap-8 md:grid-cols-3">
            {futbol.points.map((p) => (
              <div key={p.title}>
                <h3 className="text-display-sm text-xl">{p.title}</h3>
                <p className="mt-2 text-[var(--color-muted)]">{p.body}</p>
              </div>
            ))}
          </div>
          <Button href={buildWhatsAppUrl(futbol.cta.message)} className="mt-10">
            {futbol.cta.label}
          </Button>
        </SectionShell>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
```

- [ ] **Step 2: Build + verify route**

Run: `npm run build` → Expected: success, `/futbol` listed as a route.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add fútbol detail page"
```

---

### Task 10: Pádel detail page

**Files:**
- Create: `src/app/padel/page.tsx`

**Interfaces:**
- Consumes: same components as Task 9, `content.padel`.

- [ ] **Step 1: Create padel/page.tsx**

```tsx
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/Button";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Pádel — Vixen Club",
  description:
    "Torneos americanos, clases y alquiler de canchas de pádel en Pilar.",
};

export default function PadelPage() {
  const { padel } = content;
  return (
    <>
      <Header />
      <main>
        <SectionShell className="pt-28">
          <SectionHeading kicker="Pilar · Buenos Aires" title={padel.title} />
          <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            {padel.intro}
          </p>
          <div className="mt-10 flex gap-10">
            <Stat value="Americanos" label="Torneos" />
            <Stat value="Clases" label="Con profes" />
            <Stat value="Alquiler" label="Por turno" />
          </div>
          <ImagePlaceholder
            tone="warm"
            label="Pádel"
            className="mt-10 aspect-[21/9] w-full"
          />
        </SectionShell>

        <SectionShell className="border-t border-white/5 bg-[var(--color-surface)]">
          <div className="grid gap-8 md:grid-cols-3">
            {padel.points.map((p) => (
              <div key={p.title}>
                <h3 className="text-display-sm text-xl">{p.title}</h3>
                <p className="mt-2 text-[var(--color-muted)]">{p.body}</p>
              </div>
            ))}
          </div>
          <Button href={buildWhatsAppUrl(padel.cta.message)} className="mt-10">
            {padel.cta.label}
          </Button>
        </SectionShell>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
```

- [ ] **Step 2: Build + verify route**

Run: `npm run build` → Expected: success, `/padel` listed as a route.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add pádel detail page"
```

---

### Task 11: Responsive + accessibility + final verification

**Files:**
- Modify: any component needing fixes found during verification.

**Interfaces:** none new.

- [ ] **Step 1: Lint + format + test + build**

```bash
npx prettier --write .
npm run lint
npm test
npm run build
```

Expected: prettier formats, lint clean (fix any warnings), tests pass, build succeeds.

- [ ] **Step 2: Responsive verification at three widths**

Run `npm run dev`. In a browser, use device toolbar to check each route (`/`, `/futbol`, `/padel`) at **375px**, **768px**, **1280px**:
- Header collapses to hamburger below `md`; full-screen menu opens/closes and links navigate.
- Hero headline scales fluidly, never overflows horizontally.
- Discipline cards: 1 column at 375px, 2 at ≥768px.
- HighlightBand: image stacks under text on mobile, side-by-side on desktop; `reverse` band alternates correctly on desktop.
- Footer grid: 1 column mobile, 3 columns desktop.
- No horizontal scrollbars at any width.

Record any issues and fix the relevant component, then re-run Step 1.

- [ ] **Step 3: Accessibility spot check**

- Tab through home: focus is visible and reaches nav links, CTAs, WhatsApp button.
- Each `ImagePlaceholder`/iframe/social link has an accessible name.
- `html lang="es-AR"` present.
- Run Lighthouse (Chrome DevTools) on `/`: aim for Accessibility ≥ 90, Performance ≥ 90. Fix obvious flagged issues (contrast, missing labels).

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: responsive, a11y, and quality pass"
```

---

## Self-Review

**Spec coverage:**
- Home sections (header, hero, disciplines, fútbol band, pádel band, eventos, sede, contacto/footer, footer) → Tasks 5–8. ✓
- `/futbol`, `/padel` detail pages → Tasks 9, 10. ✓
- Design system (tokens, fonts, primitives, motion via reduced-motion guard) → Tasks 2, 4. ✓
- Content model in one typed source → Task 3. ✓
- Responsive strategy (mobile-first, clamp, reflow, hamburger) → Tasks 2, 5, 7, 11. ✓
- Tech & quality (TS, Tailwind v4, lint/prettier, a11y, build) → Tasks 1, 2, 11. ✓
- Contact facts exact → enforced by Task 3 test. ✓
- WhatsApp inquiry flow (booking via WhatsApp) → Task 3 helper + CTAs throughout. ✓

**Note on images:** spec allows placeholder imagery; this plan uses gradient `ImagePlaceholder` blocks plus image-labelled content so real `next/image` photos can replace them later without restructuring. ✓

**Placeholder scan:** No "TBD"/"implement later" steps; every code step shows complete code. ✓

**Type consistency:** `content.futbol`/`content.padel` shape (`{title, intro, points[], cta}`) matches `HighlightBand`'s `BandData` and detail-page usage. `buildWhatsAppUrl(message?)` signature consistent across all callers. `Button` props consistent. ✓
