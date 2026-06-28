import type {
  FootballMatchStatus,
  PublicFootballMatch,
} from "@/features/football-tournaments/types";

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
        <ol className="mt-4 divide-y divide-white/8 rounded-lg border border-white/8">
          {matches.map((match) => (
            <li
              key={match.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/46">
                  <span>{match.roundLabel}</span>
                  <time dateTime={match.scheduledAt ?? undefined}>
                    {formatMatchDate(match.scheduledAt)}
                  </time>
                </div>
                <p className="mt-2 min-w-0 break-words text-sm font-semibold text-white">
                  {match.homeTeamName}
                  <span className="mx-2 text-white/34">vs</span>
                  {match.awayTeamName}
                </p>
              </div>
              <div className="self-center justify-self-start rounded-md border border-white/8 bg-white/[0.035] px-3 py-2 text-sm font-semibold text-white sm:justify-self-end">
                {formatMatchResult(match)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
