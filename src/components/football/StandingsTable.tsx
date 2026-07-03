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
    <div className="overflow-x-auto rounded-lg border border-white/8 bg-black/20">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-white/[0.04] text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={`whitespace-nowrap px-3 py-3 ${
                  column === "Equipo" ? "text-left" :
                  column === "#" ? "w-10 text-center" : "w-10 sm:w-12 text-center"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, index) => {
            const isTop1 = index === 0;
            const isTop2 = index === 1;
            const isTop3 = index === 2;

            let rowClass = "text-white/80 transition-colors hover:bg-white/[0.04] even:bg-white/[0.01]";
            let numberClass = "text-white/40";

            if (isTop1) {
              rowClass = "text-white bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10 relative after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-[var(--color-accent)] after:shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]";
              numberClass = "text-[var(--color-accent)] font-bold drop-shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.5)]";
            } else if (isTop2) {
              rowClass = "text-white/90 bg-white/[0.03] hover:bg-white/[0.06] relative after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-white/40";
              numberClass = "text-white/80 font-semibold";
            } else if (isTop3) {
              rowClass = "text-white/80 bg-white/[0.02] hover:bg-white/[0.05] relative after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-white/20";
              numberClass = "text-white/60 font-medium";
            }

            return (
              <tr key={row.teamId} className={rowClass}>
                <td className={`whitespace-nowrap w-10 px-3 py-3.5 text-center ${numberClass}`}>
                  {index + 1}
                </td>
                <td className="px-3 py-3.5 text-left font-semibold text-white">
                  {row.teamName}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3.5 text-center font-bold text-[var(--color-accent)]">
                  {row.points}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center">
                  {row.played}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center">
                  {row.won}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center">
                  {row.drawn}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center">
                  {row.lost}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center text-white/40">
                  {row.goalsFor}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center text-white/40">
                  {row.goalsAgainst}
                </td>
                <td className="whitespace-nowrap w-10 sm:w-12 px-3 py-3 text-center text-white/40">
                  {formatGoalDifference(row.goalDifference)}
                </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
