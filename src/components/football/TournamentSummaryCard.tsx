import Link from "next/link";
import { Fragment } from "react";

import {
  footballTournamentFormatLabels,
  type PublicFootballTournament,
} from "@/features/football-tournaments/types";

const statusLabels = {
  draft: "Borrador",
  published: "Publicado",
  active: "En juego",
  completed: "Finalizado",
  archived: "Archivado",
} satisfies Record<PublicFootballTournament["status"], string>;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getNextMatch(tournament: PublicFootballTournament) {
  return tournament.matches.find((match) => match.status === "scheduled");
}

function formatDate(date: string | null) {
  if (!date) return "Fecha a confirmar";
  return dateFormatter.format(new Date(date)).replace(".", "");
}

function getProgressLabel(completed: number, total: number) {
  if (total === 0) return "Sin partidos";
  return `${completed} / ${total} partidos`;
}

export function TournamentSummaryCard({
  tournament,
}: {
  tournament: PublicFootballTournament;
}) {
  const nextMatch = getNextMatch(tournament);
  const totalMatches = tournament.matches.length;
  const completedMatches = tournament.matches.filter(
    (match) => match.status === "completed",
  ).length;

  const isCompleted = tournament.status === "completed";
  const mainHref = `/futbol/torneos/${tournament.slug}`;
  
  // Render categories
  const categoryRender = () => {
    if (!tournament.categories || tournament.categories.length === 0) {
      return (
        <span className="text-white/60 font-medium">
          {tournament.category} <span className="mx-1.5 opacity-40">·</span> {tournament.teams.length} equipos
        </span>
      );
    }

    const cats = tournament.categories;
    const catLinks = cats.map((cat, index) => (
      <Fragment key={cat.slug}>
        <Link
          href={`${mainHref}/${cat.slug}`}
          className="relative z-10 text-white/80 hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm transition-colors"
        >
          {cat.name}
        </Link>
        {index < cats.length - 1 && <span className="mx-1.5 text-white/30">·</span>}
      </Fragment>
    ));

    return (
      <span className="text-white/60 font-medium leading-relaxed">
        {catLinks}
        {cats.length === 1 && (
          <>
            <span className="mx-1.5 text-white/30">—</span> {tournament.teams.length} equipos
          </>
        )}
      </span>
    );
  };

  return (
    <article className="group h-full editorial-panel relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/30 hover:bg-[linear-gradient(180deg,rgb(60_191_113_/_0.04),transparent)]">
      
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              isCompleted ? "bg-white/20" : "bg-[var(--color-accent)]"
            }`}
          />
          <span className={`text-[0.65rem] font-bold uppercase tracking-[0.18em] ${isCompleted ? 'text-white/40' : 'text-white/70'}`}>
            {statusLabels[tournament.status]}
          </span>
        </div>

        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/30">
          {footballTournamentFormatLabels[tournament.format]} · {tournament.season}
        </p>
      </header>

      {/* Body */}
      <div className="px-5 py-5 pb-6">
        <h3 className="text-[clamp(1.25rem,3vw,1.5rem)] leading-tight font-bold text-[var(--color-ink)] line-clamp-2">
          <Link
            href={mainHref}
            className="before:absolute before:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] rounded-sm"
          >
            {tournament.name}
          </Link>
        </h3>
        <div className="mt-3 text-[0.85rem]">
          {categoryRender()}
        </div>
      </div>

      {/* Next Match or Status */}
      <div className="px-5 pb-5">
        {nextMatch ? (
          <div className="border-t border-white/5 pt-5">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Próximo partido <span className="text-white/30 font-normal">·</span> <span className="text-white/60">{nextMatch.roundLabel}</span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 text-[0.95rem] font-medium text-white/90">
                <span className="truncate">
                  {nextMatch.homeTeamName || "Por definir"}
                </span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/20 shrink-0">
                  vs
                </span>
                <span className="truncate">
                  {nextMatch.awayTeamName || "Por definir"}
                </span>
              </div>
              <span className="text-xs text-white/40 shrink-0">
                {formatDate(nextMatch.scheduledAt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/5 pt-5 flex items-center justify-between">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/30">
              Resultados
            </span>
            <span className="text-xs text-white/40 font-medium">Resultados disponibles</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <span className="text-[0.75rem] font-medium tracking-wide text-white/40">
          {getProgressLabel(completedMatches, totalMatches)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[var(--color-accent)] transition-colors group-hover:brightness-110">
          Ver torneo
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </footer>
    </article>
  );
}
