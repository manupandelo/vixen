"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FootballMatchStatus } from "@/features/football-tournaments/types";
import type { UIFootballMatch } from "@/features/football-tournaments/types";

const statusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Prog",
  completed: "Fin",
  postponed: "Post",
  cancelled: "Canc",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

function formatMatchDate(date: string | null) {
  if (!date) return "A conf.";
  return dateFormatter.format(new Date(date)).replace(",", " ·");
}

function getInitials(name: string) {
  if (!name || name === "Por definirse") return "?";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

type TournamentFixtureProps = {
  matches: UIFootballMatch[];
  onMatchClick?: (match: UIFootballMatch) => void;
  selectedMatchId?: string | null;
};

export function TournamentFixture({
  matches,
  onMatchClick,
  selectedMatchId = null,
}: TournamentFixtureProps) {
  // Group matches by roundLabel
  const groupedMatches = useMemo(() => {
    const map = new Map<string, UIFootballMatch[]>();
    matches.forEach(match => {
      const round = match.roundLabel || "Sin ronda";
      if (!map.has(round)) map.set(round, []);
      map.get(round)!.push(match);
    });
    return Array.from(map.entries())
      .map(([round, roundMatches]) => {
        const scheduledMatches = roundMatches.filter((m) => m.scheduledAt);
        const earliestDate =
          scheduledMatches.length > 0
            ? Math.min(...scheduledMatches.map((m) => new Date(m.scheduledAt!).getTime()))
            : Infinity;
        return {
          round,
          matches: roundMatches,
          earliestDate,
        };
      })
      .sort((a, b) => {
        if (a.earliestDate !== Infinity && b.earliestDate !== Infinity) {
          return a.earliestDate - b.earliestDate;
        }
        if (a.matches.length !== b.matches.length) {
          return b.matches.length - a.matches.length;
        }
        return 0;
      });
  }, [matches]);

  // Find the initial active round (first one with scheduled matches, or last if all completed)
  const initialRoundIndex = useMemo(() => {
    if (groupedMatches.length === 0) return 0;
    const index = groupedMatches.findIndex(g => g.matches.some(m => m.status === "scheduled"));
    return index !== -1 ? index : groupedMatches.length - 1;
  }, [groupedMatches]);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(initialRoundIndex);

  if (groupedMatches.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 text-center text-sm text-[var(--color-muted)]">
        Fixture no disponible.
      </div>
    );
  }

  const currentGroup = groupedMatches[currentRoundIndex];
  const hasPrev = currentRoundIndex > 0;
  const hasNext = currentRoundIndex < groupedMatches.length - 1;

  const handlePrev = () => {
    if (hasPrev) setCurrentRoundIndex(i => i - 1);
  };

  const handleNext = () => {
    if (hasNext) setCurrentRoundIndex(i => i + 1);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0F1411] overflow-hidden flex flex-col h-full max-h-[800px]">
      {/* Header Selector */}
      <div className="flex items-center justify-between px-2 py-3 bg-white/[0.03] border-b border-white/10">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[var(--color-accent)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h5 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90">
          {currentGroup.round}
        </h5>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[var(--color-accent)]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Match List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-white/5">
          {currentGroup.matches.map((match) => {
            const isCompleted = match.status === "completed";
            const isSelected = selectedMatchId === match.id;
            
            return (
              <li key={match.id}>
                <button
                  onClick={() => onMatchClick?.(match)}
                  className={`w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-4 transition-colors focus:outline-none focus-visible:bg-white/[0.05] ${
                    isSelected
                      ? "bg-white/[0.06] shadow-[inset_2px_0_0_var(--color-accent)]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Home Team */}
                  <div className="flex items-center gap-2 justify-end min-w-0">
                    <span className={`text-xs sm:text-sm font-semibold truncate text-right ${isCompleted && (match.homeScore ?? 0) > (match.awayScore ?? 0) ? "text-white" : "text-white/70"}`}>
                      {match.homeTeamName || "Por definirse"}
                    </span>
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
                      {getInitials(match.homeTeamName || "")}
                    </div>
                  </div>

                  {/* Score / Center block */}
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem]">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.1)]">
                        <span className="text-sm font-black text-[var(--color-accent)]">{match.homeScore}</span>
                        <span className="text-[10px] text-[var(--color-accent)]/50">-</span>
                        <span className="text-sm font-black text-[var(--color-accent)]">{match.awayScore}</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-white/60">
                        {statusLabels[match.status]}
                      </div>
                    )}
                    <span className="text-[9px] mt-1 text-white/40 font-medium whitespace-nowrap">
                      {formatMatchDate(match.scheduledAt)}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-2 justify-start min-w-0">
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
                      {getInitials(match.awayTeamName || "")}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold truncate text-left ${isCompleted && (match.awayScore ?? 0) > (match.homeScore ?? 0) ? "text-white" : "text-white/70"}`}>
                      {match.awayTeamName || "Por definirse"}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
