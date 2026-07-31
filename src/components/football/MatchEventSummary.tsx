import type { PublicMatchEvent } from "@/features/football-tournaments/types";

type PlayerLine = {
  playerId: string;
  displayName: string;
  shirtNumber: number | null;
  goals: number;
  yellowCards: number;
  redCards: number;
};

/** Una fila por jugador, con todo lo que hizo en el partido junto. */
function groupByPlayer(events: PublicMatchEvent[]): PlayerLine[] {
  const byPlayer = new Map<string, PlayerLine>();

  for (const event of events) {
    const current = byPlayer.get(event.playerId) ?? {
      playerId: event.playerId,
      displayName: event.displayName,
      shirtNumber: event.shirtNumber ?? null,
      goals: 0,
      yellowCards: 0,
      redCards: 0,
    };

    if (event.eventType === "goal") current.goals += event.quantity;
    if (event.eventType === "yellow_card") {
      current.yellowCards += event.quantity;
    }
    if (event.eventType === "red_card") current.redCards += event.quantity;

    byPlayer.set(event.playerId, current);
  }

  // Primero los que convirtieron, después el resto por nombre.
  return [...byPlayer.values()].sort(
    (a, b) =>
      b.goals - a.goals || a.displayName.localeCompare(b.displayName, "es"),
  );
}

function Marker({
  symbol,
  label,
  count,
}: {
  symbol: string;
  label: string;
  count: number;
}) {
  if (count === 0) return null;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 text-xs"
      title={`${count} ${label}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span className="sr-only">
        {count} {label}
      </span>
      <span aria-hidden="true" className="tabular-nums text-white/60">
        x{count}
      </span>
    </span>
  );
}

function TeamColumn({
  events,
  align,
}: {
  events: PublicMatchEvent[];
  align: "left" | "right";
}) {
  const lines = groupByPlayer(events);
  const isRight = align === "right";

  return (
    <div className={`min-w-0 ${isRight ? "sm:text-right" : ""}`}>
      {lines.length > 0 ? (
        <ul className="grid gap-1.5">
          {lines.map((line) => (
            <li
              key={line.playerId}
              className={`flex min-w-0 items-center gap-2 text-sm text-white/85 ${
                isRight ? "sm:flex-row-reverse" : ""
              }`}
            >
              <span className="min-w-0 truncate">
                {line.shirtNumber !== null ? (
                  <span className="mr-1.5 tabular-nums text-white/45">
                    #{line.shirtNumber}
                  </span>
                ) : null}
                {line.displayName}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1.5 ${
                  isRight ? "flex-row-reverse" : ""
                }`}
              >
                <Marker symbol="⚽" label="goles" count={line.goals} />
                <Marker
                  symbol="🟨"
                  label="amarillas"
                  count={line.yellowCards}
                />
                <Marker symbol="🟥" label="rojas" count={line.redCards} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">Sin registros.</p>
      )}
    </div>
  );
}

/** Goles y tarjetas del partido, un equipo de cada lado del marcador. */
export function MatchEventSummary({
  events,
  homeTeamId,
  awayTeamId,
}: {
  events: PublicMatchEvent[];
  homeTeamId: string | null;
  awayTeamId: string | null;
}) {
  if (events.length === 0) return null;

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <TeamColumn
          events={events.filter((event) => event.teamId === homeTeamId)}
          align="left"
        />
        <TeamColumn
          events={events.filter((event) => event.teamId === awayTeamId)}
          align="right"
        />
      </div>
    </div>
  );
}
