import Link from "next/link";
import { Button } from "@/components/Button";
import { content } from "@/content";

export function Footer() {
  const { site, nav, hero } = content;
  return (
    <footer
      id="contacto"
      className="scroll-mt-20 border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(198,240,0,0.08))] p-6 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <p className="text-display-sm text-2xl">
              Cerrá la visita con una acción clara.
            </p>
            <p className="mt-3 text-sm text-white/72">
              Escribinos por WhatsApp para consultas generales o reservá tu turno
              de pádel en ATC si ya querés entrar a cancha.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">
            <Button href={site.padelReservationUrl} variant="secondary">
              Reservá pádel en ATC
            </Button>
            <Button href={hero.primaryCta.href}>WhatsApp</Button>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
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
