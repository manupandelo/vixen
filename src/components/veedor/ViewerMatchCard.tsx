"use client";

import { MatchResultForm } from "@/components/admin/AdminForms";
import type { ActionState } from "@/features/football-tournaments/actions";
import type { ViewerAssignedMatch } from "@/features/football-tournaments/data";

const scheduledAtFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

type ViewerMatchCardProps = {
  match: ViewerAssignedMatch;
  submitAction: (
    prevState: ActionState,
    payload: FormData,
  ) => Promise<ActionState>;
};

export function ViewerMatchCard({ match, submitAction }: ViewerMatchCardProps) {
  // Ojo: data.ts rellena homeTeamName con "Equipo local" cuando el partido
  // todavía no tiene equipo. El estado "por definirse" se deriva del id.
  const homeName = match.homeTeamId ? match.homeTeamName : "Por definirse";
  const awayName = match.awayTeamId ? match.awayTeamName : "Por definirse";

  return (
    <article className="grid gap-4 rounded-xl border border-white/10 bg-[#121212] p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {match.tournamentName} · {match.roundLabel}
        </p>
        <div className="mt-3 grid gap-1">
          <p className="text-lg font-semibold text-white">{homeName}</p>
          <p className="text-lg font-semibold text-white">{awayName}</p>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {match.scheduledAt
            ? scheduledAtFormatter.format(new Date(match.scheduledAt))
            : "Sin fecha"}
        </p>
      </div>

      {match.resultLockedAt ? (
        <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-2xl font-semibold tabular-nums text-white">
            {match.homeScore} - {match.awayScore}
          </p>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Resultado final cargado. Para corregirlo, avisale a un
            administrador.
          </p>
        </div>
      ) : (
        <MatchResultForm
          action={submitAction}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePenaltyScore={match.homePenaltyScore}
          awayPenaltyScore={match.awayPenaltyScore}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          isKnockout={match.isKnockout}
          rosterEntries={match.rosterEntries}
          submitLabel="Cargar final"
          confirmTitle={`${homeName} vs ${awayName}`}
        />
      )}
    </article>
  );
}
