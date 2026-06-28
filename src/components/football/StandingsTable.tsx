import type { StandingRow } from "@/features/football-tournaments/types";

const columns = [
  "#",
  "Equipo",
  "PTS",
  "PJ",
  "PG",
  "PE",
  "PP",
  "GF",
  "GC",
  "DG",
];

function formatGoalDifference(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-white/8 bg-white/[0.025] px-4 py-5 text-sm text-[var(--color-muted)]">
        La tabla se va a completar cuando haya resultados cargados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/8">
      <table className="min-w-[48rem] w-full border-collapse text-sm">
        <thead className="bg-white/[0.04] text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={`whitespace-nowrap px-3 py-3 text-right first:text-left ${
                  column === "Equipo" ? "min-w-48 text-left" : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row, index) => (
            <tr key={row.teamId} className="text-white/78">
              <td className="whitespace-nowrap px-3 py-3 text-left text-white/46">
                {index + 1}
              </td>
              <td className="min-w-48 px-3 py-3 text-left font-semibold text-white">
                {row.teamName}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-[var(--color-accent)]">
                {row.points}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.played}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.won}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.drawn}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.lost}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.goalsFor}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {row.goalsAgainst}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right">
                {formatGoalDifference(row.goalDifference)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
