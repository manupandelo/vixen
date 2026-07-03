"use client";

import { useState } from "react";
import type {
  FootballMatchStatus,
  PublicFootballMatch,
} from "@/features/football-tournaments/types";
import { PublicMatchDetailOverlay } from "./PublicMatchDetailOverlay";

const statusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  postponed: "Postergado",
  cancelled: "Cancelado",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

function formatMatchDate(date: string | null) {
  if (!date) return "A confirmar";
  return dateFormatter.format(new Date(date)).replace(",", "");
}

function formatMatchResult(match: PublicFootballMatch) {
  if (
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null
  ) {
    return `${match.homeScore} - ${match.awayScore}`;
  }

  return statusLabels[match.status];
}

export function MatchList({
  title,
  matches,
}: {
  title: string;
  matches: PublicFootballMatch[];
}) {
  const [selectedMatch, setSelectedMatch] = useState<PublicFootballMatch | null>(null);

  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.roundLabel || "Sin ronda";
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<string, PublicFootballMatch[]>);

  const rounds = Object.keys(groupedMatches);

  return (
    <div className="min-w-0">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
        {title}
      </h4>
      {matches.length === 0 ? (
        <p className="mt-4 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-5 text-sm text-[var(--color-muted)]">
          No hay partidos para mostrar.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {rounds.map((round) => (
            <div key={round} className="rounded-lg border border-white/10 bg-[#0F1411] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <h5 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">{round}</h5>
              </div>
              <ul className="divide-y divide-white/5">
                {groupedMatches[round].map((match) => (
                  <li key={match.id}>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full text-left grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] items-center hover:bg-white/[0.02] hover:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,100,0.02)_100%)] transition-colors focus:outline-none focus-visible:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-white/40">
                          <time dateTime={match.scheduledAt ?? undefined}>
                            {formatMatchDate(match.scheduledAt)}
                          </time>
                        </div>
                        <p className="mt-1.5 min-w-0 break-words text-sm font-semibold text-white">
                          {match.homeTeamName || "Por definirse"}
                          <span className="mx-3 text-white/20 font-normal">vs</span>
                          {match.awayTeamName || "Por definirse"}
                        </p>
                      </div>
                      <div className={`self-center justify-self-start rounded-md px-3 py-1.5 text-sm font-bold sm:justify-self-end ${
                        match.status === "completed" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.1)]" : "border border-white/10 bg-white/5 text-white/80"
                      }`}>
                        {formatMatchResult(match)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <PublicMatchDetailOverlay
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      />
    </div>
  );
}
