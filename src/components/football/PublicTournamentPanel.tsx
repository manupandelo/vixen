"use client";

import { useState } from "react";
import {
  footballTournamentFormatLabels,
  type PublicFootballTournament,
} from "@/features/football-tournaments/types";

import { StandingsTable } from "./StandingsTable";
import { PublicBracketViewer } from "./PublicBracketViewer";
import { CompactFixture } from "./CompactFixture";
import { PublicMatchDetailOverlay } from "./PublicMatchDetailOverlay";
import type { PublicFootballMatch } from "@/features/football-tournaments/types";

export function PublicTournamentPanel({
  tournament,
  showHeader = true,
}: {
  tournament: PublicFootballTournament;
  showHeader?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"regular" | "playoffs">("regular");
  const [selectedMatch, setSelectedMatch] = useState<PublicFootballMatch | null>(null);

  const isCup = tournament.format === "cup";
  const isLeaguePlayoff = tournament.format === "league_playoff";

  const activeMatches = tournament.matches.filter((match) => !match.isKnockout);
  const knockoutMatches = tournament.matches.filter((match) => match.isKnockout);

  const header = (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        <span>{tournament.category}</span>
        <span className="text-white/30">/</span>
        <span>{footballTournamentFormatLabels[tournament.format]}</span>
        <span className="text-white/30">/</span>
        <span>Temporada {tournament.season}</span>
      </div>
      <h3 className="mt-3 text-display-sm text-2xl">{tournament.name}</h3>
      {tournament.description && (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
          {tournament.description}
        </p>
      )}
    </div>
  );

  const cupLayout = (
    <div className="mt-8 grid gap-8 lg:grid-cols-3 items-start">
      <div className="lg:col-span-2 min-w-0">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Llaves del Torneo
        </h4>
        <PublicBracketViewer matches={tournament.matches} onMatchClick={setSelectedMatch} />
      </div>

      <div className="lg:col-span-1 min-w-0">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Fixture
        </h4>
        <CompactFixture matches={knockoutMatches} onMatchClick={setSelectedMatch} />
      </div>
    </div>
  );

  if (isCup) {
    return (
      <article className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
        {showHeader ? header : null}
        {cupLayout}

        <PublicMatchDetailOverlay
          match={selectedMatch}
          open={!!selectedMatch}
          onOpenChange={(open) => !open && setSelectedMatch(null)}
        />
      </article>
    );
  }

  return (
    <article className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
      {showHeader || isLeaguePlayoff ? (
        <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          {showHeader ? header : <div />}

          {isLeaguePlayoff && (
            <div className="flex bg-[#111612] p-1 rounded-lg border border-white/10 w-fit lg:justify-self-end shadow-inner">
              <button
                onClick={() => setActiveTab("regular")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  activeTab === "regular"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                Fase Regular
              </button>
              <button
                onClick={() => setActiveTab("playoffs")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  activeTab === "playoffs"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                Playoffs
              </button>
            </div>
          )}
        </div>
      ) : null}

      {isLeaguePlayoff && activeTab === "playoffs" ? (
        cupLayout
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 min-w-0">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              Tabla de Posiciones
            </h4>
            <StandingsTable rows={tournament.standings} />
          </div>

          <div className="lg:col-span-1 min-w-0">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              Fixture
            </h4>
            <CompactFixture matches={activeMatches} />
          </div>
        </div>
      )}

      <PublicMatchDetailOverlay
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      />
    </article>
  );
}
