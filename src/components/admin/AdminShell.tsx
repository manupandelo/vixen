import { LogOut, Shield, Trophy, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AdminToastProvider } from "@/components/admin/AdminToast";
import { logoutAdmin } from "@/features/football-tournaments/actions";

type AdminShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Inicio", icon: Shield },
  { href: "/admin/torneos", label: "Torneos", icon: Trophy },
  { href: "/admin/usuarios", label: "Usuarios", icon: UsersRound },
] as const;

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-base)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-base)]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin"
              aria-label="Vixen Club Admin"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              <Image
                src="/logo_vixen.svg"
                alt="Vixen Club"
                width={150}
                height={45}
                priority
                className="h-auto w-32"
              />
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">
              Torneos de fútbol
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
            <nav
              aria-label="Administración"
              className="flex max-w-full gap-1 overflow-x-auto rounded-[1rem] border border-white/10 bg-white/[0.025] p-1"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
                >
                  <item.icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-white/78 transition hover:border-[var(--color-warm)]/55 hover:bg-[var(--color-warm)]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-auto"
              >
                <LogOut size={16} aria-hidden="true" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <AdminToastProvider>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
          {children}
        </main>
      </AdminToastProvider>
    </div>
  );
}
