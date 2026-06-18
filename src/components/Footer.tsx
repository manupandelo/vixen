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
