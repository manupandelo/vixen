import type { PublicMatchEvent } from "@/features/football-tournaments/types";

type EventKind = PublicMatchEvent["eventType"];

/** Agrupa los eventos de un equipo por jugador, para leerlos de un vistazo. */
function groupByPlayer(events: PublicMatchEvent[], kind: EventKind) {
  const byPlayer = new Map<string, { displayName: string; quantity: number }>();

  for (const event of events) {
    if (event.eventType !== kind) continue;

    const current = byPlayer.get(event.playerId);
    byPlayer.set(event.playerId, {
      displayName: event.displayName,
      quantity: (current?.quantity ?? 0) + event.quantity,
    });
  }

  return [...byPlayer.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es"),
  );
}

function TeamColumn({
  teamName,
  events,
  align,
}: {
  teamName: string;
  events: PublicMatchEvent[];
  align: "left" | "right";
}) {
  const goals = groupByPlayer(events, "goal");
  const yellows = groupByPlayer(events, "yellow_card");
  const reds = groupByPlayer(events, "red_card");
  const alignment = align === "right" ? "sm:text-right" : "";

  const lines: Array<{ key: string; label: string; marker: string; tone: string }> =
    [
      ...goals.map((row) => ({
        key: `goal-${row.displayName}`,
        label: row.quantity > 1 ? `${row.displayName} (${row.quantity})` : row.displayName,
        marker: "⚽",
        tone: "text-white",
      })),
      ...yellows.map((row) => ({
        key: `yellow-${row.displayName}`,
        label: row.quantity > 1 ? `${row.displayName} (${row.quantity})` : row.displayName,
        marker: "🟨",
        tone: "text-white/70",
      })),
      ...reds.map((row) => ({
        key: `red-${row.displayName}`,
        label: row.displayName,
        marker: "🟥",
        tone: "text-white/70",
      })),
    ];

  return (
    <div className={`min-w-0 ${alignment}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        {teamName}
      </p>
      {lines.length > 0 ? (
        <ul className="mt-3 grid gap-1.5">
          {lines.map((line) => (
            <li
              key={line.key}
              className={`flex items-center gap-2 text-sm ${line.tone} ${
                align === "right" ? "sm:flex-row-reverse" : ""
              }`}
            >
              <span aria-hidden="true" className="shrink-0 text-xs">
                {line.marker}
              </span>
              <span className="min-w-0 truncate">{line.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted)]">Sin registros.</p>
      )}
    </div>
  );
}

/**
 * Goles y tarjetas del partido, un equipo de cada lado del marcador.
 */
export function MatchEventSummary({
  events,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: {
  events: PublicMatchEvent[];
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
}) {
  if (events.length === 0) return null;

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <TeamColumn
          teamName={homeTeamName}
          events={events.filter((event) => event.teamId === homeTeamId)}
          align="left"
        />
        <TeamColumn
          teamName={awayTeamName}
          events={events.filter((event) => event.teamId === awayTeamId)}
          align="right"
        />
      </div>
    </div>
  );
}
