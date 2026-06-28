import type {
  FootballMatchForStandings,
  FootballTeam,
  StandingRow,
} from "./types";

function createEmptyRow(team: FootballTeam): StandingRow {
  return {
    teamId: team.id,
    teamName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyResult(row: StandingRow, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
    return;
  }

  row.lost += 1;
}

export function calculateStandings(
  teams: FootballTeam[],
  matches: FootballMatchForStandings[],
): StandingRow[] {
  const rows = new Map(teams.map((team) => [team.id, createEmptyRow(team)]));

  for (const match of matches) {
    if (
      match.status !== "completed" ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      continue;
    }

    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);

    if (!home || !away) {
      continue;
    }

    applyResult(home, match.homeScore, match.awayScore);
    applyResult(away, match.awayScore, match.homeScore);
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    return a.teamName.localeCompare(b.teamName, "es");
  });
}
