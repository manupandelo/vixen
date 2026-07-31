import type {
  FootballTeam,
  PublicPlayerStat,
} from "@/features/football-tournaments/types";

function StatList({
  title,
  rows,
  teams,
  render,
}: {
  title: string;
  rows: PublicPlayerStat[];
  teams: FootballTeam[];
  render: (stat: PublicPlayerStat) => string;
}) {
  if (rows.length === 0) return null;

  const teamNames = new Map(teams.map((team) => [team.id, team.name]));

  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h5 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        {title}
      </h5>
      <ol className="mt-3 grid gap-2">
        {rows.map((stat, index) => (
          <li
            key={stat.playerId}
            className="flex items-center gap-3 text-sm"
          >
            <span className="w-4 shrink-0 text-right text-xs tabular-nums text-white/35">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-white">
                {stat.displayName}
              </span>
              <span className="block truncate text-xs text-[var(--color-muted)]">
                {teamNames.get(stat.teamId) ?? "Equipo"}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-[var(--color-accent)]">
              {render(stat)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Goleadores y disciplina del torneo, del lado público. */
export function PublicPlayerStats({
  playerStats,
  teams,
}: {
  playerStats: PublicPlayerStat[];
  teams: FootballTeam[];
}) {
  const scorers = playerStats
    .filter((stat) => stat.goals > 0)
    .sort(
      (a, b) => b.goals - a.goals || a.displayName.localeCompare(b.displayName, "es"),
    )
    .slice(0, 10);

  const booked = playerStats
    .filter((stat) => stat.yellowCards > 0 || stat.redCards > 0)
    .sort(
      (a, b) =>
        b.redCards - a.redCards ||
        b.yellowCards - a.yellowCards ||
        a.displayName.localeCompare(b.displayName, "es"),
    )
    .slice(0, 10);

  if (scorers.length === 0 && booked.length === 0) return null;

  return (
    <section className="mt-8">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
        Estadísticas
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatList
          title="Goleadores"
          rows={scorers}
          teams={teams}
          render={(stat) => (stat.goals === 1 ? "1 gol" : `${stat.goals} goles`)}
        />
        <StatList
          title="Disciplina"
          rows={booked}
          teams={teams}
          render={(stat) =>
            [
              stat.yellowCards > 0 ? `${stat.yellowCards} amar.` : null,
              stat.redCards > 0 ? `${stat.redCards} roja` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          }
        />
      </div>
    </section>
  );
}
