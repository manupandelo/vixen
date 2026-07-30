"use client";

import { MatchResultForm } from "@/components/admin/AdminForms";
import type { ActionState } from "@/features/football-tournaments/actions";
import type { ViewerAssignedMatch } from "@/features/football-tournaments/data";

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Solo la hora si fue hoy; con fecha si no, para que no parezca reciente. */
function formatLoadedAt(value: string) {
  const loadedAt = new Date(value);
  const isToday =
    new Date().toDateString() === loadedAt.toDateString();

  return isToday
    ? `Cargado ${timeFormatter.format(loadedAt)}`
    : `Cargado ${dateTimeFormatter.format(loadedAt)}`;
}

type ViewerMatchCardProps = {
  match: ViewerAssignedMatch;
  submitAction: (
    prevState: ActionState,
    payload: FormData,
  ) => Promise<ActionState>;
};

/** Una fila del marcador: equipo a la izquierda, número a la derecha. */
function ScoreRow({
  name,
  score,
  penalties,
  isWinner,
  isFirst,
}: {
  name: string;
  score: number | null;
  penalties: number | null;
  isWinner: boolean;
  isFirst: boolean;
}) {
  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-3 ${
        isFirst ? "border-b border-white/8" : ""
      } ${isWinner ? "bg-white/[0.03]" : ""}`}
    >
      {isWinner ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-[var(--color-accent)]"
        />
      ) : null}
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold ${
          isWinner ? "text-white" : "text-white/70"
        }`}
      >
        {name}
      </span>
      {penalties !== null ? (
        <span className="shrink-0 text-sm text-white/50 tabular-nums">
          ({penalties})
        </span>
      ) : null}
      <span
        className={`w-8 shrink-0 text-center text-2xl font-bold tabular-nums ${
          isWinner ? "text-[var(--color-accent)]" : "text-white"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

export function ViewerMatchCard({ match, submitAction }: ViewerMatchCardProps) {
  // Ojo: data.ts rellena homeTeamName con "Equipo local" cuando el partido
  // todavía no tiene equipo. El estado "por definirse" se deriva del id.
  const homeName = match.homeTeamId ? match.homeTeamName : "Por definirse";
  const awayName = match.awayTeamId ? match.awayTeamName : "Por definirse";
  const hasBothTeams = Boolean(match.homeTeamId && match.awayTeamId);
  const hasResult =
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null;
  const isLocked = Boolean(match.resultLockedAt) || hasResult;

  const homeWins =
    match.homeScore !== null &&
    match.awayScore !== null &&
    (match.homeScore > match.awayScore ||
      (match.homeScore === match.awayScore &&
        (match.homePenaltyScore ?? 0) > (match.awayPenaltyScore ?? 0)));
  const awayWins =
    match.homeScore !== null &&
    match.awayScore !== null &&
    (match.awayScore > match.homeScore ||
      (match.homeScore === match.awayScore &&
        (match.awayPenaltyScore ?? 0) > (match.homePenaltyScore ?? 0)));

  return (
    <article className="grid gap-3 self-start rounded-xl border border-white/10 bg-[#121212] p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {match.tournamentName} · {match.roundLabel}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {match.resultLockedAt
            ? formatLoadedAt(match.resultLockedAt)
            : isLocked
              ? "Cargado por un administrador"
              : "Sin fecha"}
        </p>
      </div>

      {isLocked ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <ScoreRow
            name={homeName}
            score={match.homeScore}
            penalties={match.homePenaltyScore}
            isWinner={homeWins}
            isFirst
          />
          <ScoreRow
            name={awayName}
            score={match.awayScore}
            penalties={match.awayPenaltyScore}
            isWinner={awayWins}
            isFirst={false}
          />
        </div>
      ) : hasBothTeams ? (
        <MatchResultForm
          action={submitAction}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePenaltyScore={match.homePenaltyScore}
          awayPenaltyScore={match.awayPenaltyScore}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          homeTeamName={homeName}
          awayTeamName={awayName}
          isKnockout={match.isKnockout}
          rosterEntries={match.rosterEntries}
          submitLabel="Cargar final"
          confirmTitle={`${homeName} vs ${awayName}`}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <ScoreRow
              name={homeName}
              score={null}
              penalties={null}
              isWinner={false}
              isFirst
            />
            <ScoreRow
              name={awayName}
              score={null}
              penalties={null}
              isWinner={false}
              isFirst={false}
            />
          </div>
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Se habilita cuando se cargue la ronda anterior.
          </p>
        </>
      )}
    </article>
  );
}
