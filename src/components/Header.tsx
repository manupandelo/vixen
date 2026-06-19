"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "./Button";

type HeaderCta = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function Header() {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const whatsappHref = buildWhatsAppUrl("Hola! Quiero más info sobre Vixen Club.");
  const ctas: HeaderCta[] = [
    {
      label: "Reservá pádel",
      href: content.site.padelReservationUrl,
      variant: "secondary",
    },
    { label: "WhatsApp", href: whatsappHref },
  ];
  const mobileActionClass =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition";

  const closeMenu = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  const renderDesktopCtas = () =>
    ctas.map((cta) => (
      <Button key={cta.label} href={cta.href} variant={cta.variant}>
        {cta.label}
      </Button>
    ));

  const renderMobileCtas = () =>
    ctas.map((cta) => {
      const variantClass =
        cta.variant === "secondary"
          ? "border border-[var(--color-ink)]/40 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          : "bg-[var(--color-accent)] text-[var(--color-base)] hover:brightness-110";

      return (
        <a
          key={cta.label}
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
          className={`${mobileActionClass} ${variantClass}`}
        >
          {cta.label}
        </a>
      );
    });

  // Move focus to close button when menu opens
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const getFocusableElements = () =>
      dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
          ).filter(
            (element) =>
              !element.hasAttribute("disabled") &&
              element.getAttribute("aria-hidden") !== "true",
          )
        : [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      if (e.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey && activeElement === first) {
        e.preventDefault();
        last.focus();
        return;
      }

      if (!e.shiftKey && activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--color-base)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
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

        <nav aria-label="Principal" className="hidden items-center gap-4 md:flex lg:gap-6">
          {content.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-[var(--color-ink)] transition hover:text-[var(--color-accent)]"
            >
              {n.label}
            </Link>
          ))}
          {renderDesktopCtas()}
        </nav>

        <button
          ref={openerRef}
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
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
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--color-base)] px-5 py-4"
        >
          <div className="flex items-center justify-between">
            <Link href="/" aria-label={content.site.name} onClick={closeMenu}>
              <Image
                src="/logo_vixen.svg"
                alt={content.site.name}
                width={168}
                height={50}
                priority
                className="h-auto w-32"
              />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Cerrar menú"
              onClick={closeMenu}
              className="text-2xl"
            >
              ✕
            </button>
          </div>
          <nav aria-label="Menú móvil" className="mt-12 flex flex-col gap-6">
            {content.nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={closeMenu}
                className="text-display-sm text-3xl"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">{renderMobileCtas()}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
