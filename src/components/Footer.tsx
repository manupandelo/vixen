import Image from "next/image";
import Link from "next/link";
import { content } from "@/content";

const COPYRIGHT_YEAR = 2026;

export function Footer() {
  const { site, nav } = content;
  const sectionLabelClass =
    "text-xs font-semibold uppercase tracking-[0.16em] text-white/45";
  const linkClass =
    "rounded-sm text-sm text-white/76 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

  return (
    <footer id="contacto" className="bg-[linear-gradient(180deg,var(--color-surface),var(--color-base))]">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-24">
            <div className="max-w-lg">
              <Link href="/" aria-label={site.name} className="inline-flex">
                <Image
                  src="/logo_vixen.svg"
                  alt={site.name}
                  width={210}
                  height={64}
                  className="h-auto w-40 sm:w-44"
                />
              </Link>
              <p className="mt-5 max-w-sm text-sm/7 text-[var(--color-muted)]">
                Fútbol 7, pádel y vida de club en Pilar.
              </p>
              <address className="mt-4 max-w-sm text-sm/7 not-italic text-white/72">
                {site.address}
              </address>
            </div>

            <div>
              <h2 className={sectionLabelClass}>Explorá</h2>
              <nav aria-label="Navegación secundaria" className="mt-5">
                <ul className="grid grid-cols-2 gap-x-12 gap-y-3 lg:grid-cols-1 lg:gap-x-0">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div>
              <h2 className={sectionLabelClass}>Contacto & Social</h2>
              <nav aria-label="Redes sociales y contacto" className="mt-5">
                <ul className="flex flex-col gap-y-3">
                  <li>
                    <a href={`mailto:${site.email}`} className={linkClass}>
                      Email
                    </a>
                  </li>
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

          <div className="mt-14 flex flex-col gap-3 border-t border-white/7 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--color-muted)]">
              © {COPYRIGHT_YEAR} {site.name}. Todos los derechos reservados.
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-white/32">
              Alberti · Pilar · Buenos Aires
            </p>
          </div>
        </div>
      </footer>
  );
}
