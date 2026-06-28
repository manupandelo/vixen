import Link from "next/link";

import { logoutAdmin } from "@/features/football-tournaments/actions";

type AdminShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/torneos", label: "Torneos" },
] as const;

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-base)]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] transition hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              Vixen Admin
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">
              Torneos de fútbol
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav
              aria-label="Administración"
              className="flex flex-wrap gap-2 rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-1"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[0.75rem] px-3 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/72 transition hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-warm)]/55 hover:bg-[var(--color-warm)]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-auto"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
