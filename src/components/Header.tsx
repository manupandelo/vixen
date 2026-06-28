"use client";

import Image from "next/image";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { content } from "@/content";

type HeaderCta = {
  label: string;
  href: string;
  icon: "instagram" | "facebook";
};

function SocialIcon({ icon }: { icon: HeaderCta["icon"] }) {
  if (icon === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[1.1rem] w-[1.1rem] fill-none stroke-current"
      >
        <rect
          x="3.25"
          y="3.25"
          width="17.5"
          height="17.5"
          rx="5.25"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="4.1" strokeWidth="1.7" />
        <circle
          cx="17.45"
          cy="6.55"
          r="1.15"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem] fill-current"
    >
      <path d="M13.64 21v-7.05h2.37l.36-2.75h-2.73V9.44c0-.8.22-1.34 1.36-1.34h1.45V5.64c-.7-.08-1.4-.12-2.1-.12-2.08 0-3.5 1.27-3.5 3.6v2.08H8.5v2.75h2.35V21h2.79Z" />
    </svg>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const ctas: HeaderCta[] = [
    { label: "Instagram", href: content.site.instagram, icon: "instagram" },
    { label: "Facebook", href: content.site.facebook, icon: "facebook" },
  ];
  const mobileActionClass =
    "inline-flex w-full items-center justify-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

  const renderDesktopCtas = () =>
    ctas.map((cta) => (
      <a
        key={cta.label}
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={cta.label}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.025] text-white/80 transition duration-200 hover:-translate-y-px hover:border-white/22 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
      >
        <SocialIcon icon={cta.icon} />
      </a>
    ));

  const renderMobileCtas = () =>
    ctas.map((cta) => {
      return (
        <a
          key={cta.label}
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-menu-link="true"
          className={`${mobileActionClass} border border-[var(--color-ink)]/40 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
          onClick={() => closeMobileMenu()}
        >
          <SocialIcon icon={cta.icon} />
          {cta.label}
        </a>
      );
    });

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (isMobileMenuOpen) {
      closeButtonRef.current?.focus();
    }
  }, [closeMobileMenu, isMobileMenuOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = isMobileMenuOpen ? "hidden" : "";

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        event.preventDefault();
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.documentElement.style.overflow = "";
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("disabled"));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--color-base)]/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4 lg:gap-8 lg:py-5">
          <Link href="/" aria-label={content.site.name} className="shrink-0">
            <Image
              src="/logo_vixen.svg"
              alt={content.site.name}
              width={168}
              height={50}
              priority
              className="h-auto w-32 sm:w-40"
            />
          </Link>

          <nav
            aria-label="Principal"
            className="hidden flex-1 items-center justify-center gap-6 rounded-full border border-white/10 bg-white/[0.025] px-7 py-3 lg:flex lg:gap-9"
          >
            {content.nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-sm text-sm font-medium tracking-[0.08em] text-[var(--color-ink)]/80 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div
            role="group"
            aria-label="Redes sociales"
            className="hidden shrink-0 items-center gap-2 lg:flex lg:pl-4"
          >
            {renderDesktopCtas()}
          </div>

          <button
            ref={toggleButtonRef}
            id="mobile-menu-open"
            type="button"
            aria-label="Abrir menú"
            aria-controls="mobile-menu-root"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] lg:hidden"
          >
            <span className="sr-only">Abrir menú</span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[1.15rem] w-[1.15rem] fill-none stroke-current"
            >
              <path d="M4 7.5H20" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M7 12H20" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M10 16.5H20" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div id="mobile-menu-root" className="fixed inset-0 z-[70]">
          <button
            id="mobile-menu-backdrop"
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => closeMobileMenu()}
            className="absolute inset-0 bg-[rgb(5_7_6_/_0.78)] backdrop-blur-md lg:hidden"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            onKeyDown={handleDialogKeyDown}
            className="relative flex h-full w-full flex-col overflow-y-auto bg-[linear-gradient(180deg,var(--color-surface-2),var(--color-base)_78%)] px-4 py-4 sm:px-6"
          >
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  aria-label={content.site.name}
                  data-mobile-menu-link="true"
                  onClick={() => closeMobileMenu()}
                >
                  <Image
                    src="/logo_vixen.svg"
                    alt={content.site.name}
                    width={168}
                    height={50}
                    priority
                    className="h-auto w-28"
                  />
                </Link>
                <button
                  ref={closeButtonRef}
                  id="mobile-menu-close"
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => closeMobileMenu()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-2xl text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-10 border-t border-white/8 pt-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Navegación
                </p>
              </div>

              <nav aria-label="Menú móvil" className="mt-4 flex flex-col">
                {content.nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    data-mobile-menu-link="true"
                    onClick={() => closeMobileMenu()}
                    className="border-b border-white/8 py-4 text-display-sm text-[clamp(1.7rem,7vw,2.6rem)] leading-[0.94]"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-10">
                <div className="border-t border-white/8 pt-5">
                  <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/46">
                    Seguinos
                  </p>
                  <div className="flex flex-col gap-3">
                    {renderMobileCtas()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
