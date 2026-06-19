import Image from "next/image";
import Link from "next/link";
import { content } from "@/content";

export function Footer() {
  const { site, nav } = content;
  return (
    <footer
      id="contacto"
      className="scroll-mt-20 border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-12 border-t border-white/5 pt-10 md:grid-cols-[1.05fr_0.8fr_0.9fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label={site.name} className="inline-flex">
              <Image
                src="/logo_vixen.svg"
                alt={site.name}
                width={210}
                height={64}
                className="h-auto w-44 sm:w-48"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm text-[var(--color-muted)]">
              {site.address}
            </p>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Sponsors
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/76">
                {site.sponsors.map((sponsor) => (
                  <span key={sponsor}>{sponsor}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
              Navegación
            </p>
            <ul className="space-y-2 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="rounded-sm transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                  >
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
                <a
                  href={`tel:+${site.whatsappNumber}`}
                  className="rounded-sm transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="rounded-sm transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  {site.email}
                </a>
              </li>
              <li className="flex gap-4 pt-2">
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Instagram
                </a>
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-5 py-6 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
