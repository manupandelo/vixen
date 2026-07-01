import Image from "next/image";
import Link from "next/link";
import { content } from "@/content";

const COPYRIGHT_YEAR = 2026;

export function Footer() {
  const { site, nav } = content;
  const sectionLabelClass =
    "text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]";
  const linkClass =
    "rounded-sm text-sm text-white/76 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

  return (
    <footer
      id="contacto"
      className="scroll-mt-20 border-t border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))]"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="border-t border-white/6 pt-10">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="max-w-xl">
              <Link href="/" aria-label={site.name} className="inline-flex">
                <Image
                  src="/logo_vixen.svg"
                  alt={site.name}
                  width={210}
                  height={64}
                  className="h-auto w-44 sm:w-48"
                />
              </Link>
              <p className="mt-6 max-w-md text-sm/7 text-[var(--color-muted)]">
                {site.address}
              </p>
              <div className="mt-8 border-y border-white/8 py-4">
                <p id="footer-sponsors" className={sectionLabelClass}>
                  Sponsors
                </p>
                <ul
                  aria-label="Sponsors"
                  aria-labelledby="footer-sponsors"
                  className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/72"
                >
                  {site.sponsors.map((sponsor) => (
                    <li key={sponsor}>{sponsor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div>
                <p className={sectionLabelClass}>Contacto</p>
                <ul className="mt-4 space-y-3">
                  <li>
                    <a href={`tel:+${site.whatsappNumber}`} className={linkClass}>
                      {site.phoneDisplay}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${site.email}`} className={linkClass}>
                      {site.email}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className={sectionLabelClass}>Social</p>
                <nav aria-label="Redes sociales" className="mt-4">
                  <ul className="space-y-3">
                    <li>
                      <a
                        href={site.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a
                        href={site.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        Facebook
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-5 border-t border-white/6 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <nav
              aria-label="Navegación secundaria"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-sm text-xs font-semibold uppercase tracking-[0.16em] text-white/46 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-[var(--color-muted)]">
              © {COPYRIGHT_YEAR} {site.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
