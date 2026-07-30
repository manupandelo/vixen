import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AdminPendingMatch } from "@/features/football-tournaments/data";
import { AdminPanel, AdminStatusPill } from "./AdminUI";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function PendingMatchesPanel({
  matches,
}: {
  matches: AdminPendingMatch[];
}) {
  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Qué falta cargar
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">
          Partidos pendientes
        </h2>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-2">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={match.href}
              className="group grid gap-2 rounded-[0.9rem] border border-white/10 bg-black/16 p-4 transition hover:border-[var(--color-accent)]/35 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {match.homeTeamName ?? "Por definirse"} vs{" "}
                  {match.awayTeamName ?? "Por definirse"}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                  {match.tournamentName}
                  {match.categoryName ? ` · ${match.categoryName}` : ""} ·{" "}
                  {match.roundLabel}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:justify-self-end">
                <AdminStatusPill tone={match.isOverdue ? "warning" : "muted"}>
                  {match.scheduledAt
                    ? dateFormatter.format(new Date(match.scheduledAt))
                    : "Sin fecha"}
                </AdminStatusPill>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-white/40 transition group-hover:text-[var(--color-accent)]"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          No hay partidos esperando resultado. La carga está al día.
        </p>
      )}
    </AdminPanel>
  );
}
