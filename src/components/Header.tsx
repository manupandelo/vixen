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
