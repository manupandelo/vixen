"use client";

import { useMemo, useState } from "react";

import { ViewerMatchCard } from "./ViewerMatchCard";
import { submitViewerMatchResult } from "@/features/football-tournaments/actions";
import type { ViewerAssignedMatch } from "@/features/football-tournaments/data";

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getDayLabel(value: string | null) {
  if (!value) return "Sin fecha asignada";

  return dayFormatter.format(new Date(value));
}

export function isMatchLoaded(match: ViewerAssignedMatch) {
  return (
    Boolean(match.resultLockedAt) ||
    (match.status === "completed" &&
      match.homeScore !== null &&
      match.awayScore !== null)
  );
}

type Filter = "pendientes" | "cargados" | "todos";

export function ViewerMatchList({
  matches,
}: {
  matches: ViewerAssignedMatch[];
}) {
  const pendingCount = useMemo(
    () => matches.filter((match) => !isMatchLoaded(match)).length,
    [matches],
  );
  const loadedCount = matches.length - pendingCount;

  // Arranca en lo que falta hacer, que es a lo que se entra.
  const [filter, setFilter] = useState<Filter>(
    pendingCount > 0 ? "pendientes" : "todos",
  );

  const visibleMatches = useMemo(() => {
    if (filter === "todos") return matches;
    if (filter === "pendientes") {
      return matches.filter((match) => !isMatchLoaded(match));
    }
    return matches.filter(isMatchLoaded);
  }, [filter, matches]);

  const groups = useMemo(() => {
    const byDay = new Map<string, ViewerAssignedMatch[]>();

    for (const match of visibleMatches) {
      const label = getDayLabel(match.scheduledAt);
      byDay.set(label, [...(byDay.get(label) ?? []), match]);
    }

    return [...byDay.entries()];
  }, [visibleMatches]);

  const filters: Array<{ id: Filter; label: string; count: number }> = [
    { id: "pendientes", label: "Pendientes", count: pendingCount },
    { id: "cargados", label: "Cargados", count: loadedCount },
    { id: "todos", label: "Todos", count: matches.length },
  ];

  return (
    <div className="grid gap-6">
      <div
        role="group"
        aria-label="Filtrar partidos"
        className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1"
      >
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            aria-pressed={filter === option.id}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              filter === option.id
                ? "bg-[var(--color-accent)] text-[#07110a]"
                : "text-white/60 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {option.label}
            <span
              className={
                filter === option.id
                  ? "text-[#07110a]/70 tabular-nums"
                  : "text-white/40 tabular-nums"
              }
            >
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {groups.length > 0 ? (
        <div className="grid gap-8">
          {groups.map(([dayLabel, dayMatches]) => (
            <section key={dayLabel} className="grid gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
                {dayLabel}
              </h2>
              <div className="grid items-start gap-3 lg:grid-cols-2">
                {dayMatches.map((match) => (
                  <ViewerMatchCard
                    key={match.id}
                    match={match}
                    submitAction={submitViewerMatchResult.bind(null, match.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.025] p-6 text-sm leading-6 text-[var(--color-muted)]">
          {filter === "pendientes"
            ? "No te queda ningún partido por cargar."
            : "No hay partidos cargados todavía."}
        </p>
      )}
    </div>
  );
}
