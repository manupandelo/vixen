export type FixtureTeam = {
  id: string;
  name: string;
};

export type LeagueFixtureOptions = {
  legs: 1 | 2;
  startsAt: string | null;
  kickoffTime: string | null;
  daysBetweenRounds: number;
};

export type GeneratedFixtureMatch = {
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamId: string;
  awayTeamId: string;
};

export type GeneratedFixtureRound = {
  label: string;
  scheduledAt: string | null;
  matches: GeneratedFixtureMatch[];
};

const byeTeam: FixtureTeam = {
  id: "__bye__",
  name: "Libre",
};

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}

function getRoundScheduledAt(
  roundIndex: number,
  options: LeagueFixtureOptions,
) {
  if (!options.startsAt || !options.kickoffTime) return null;

  const date = addDays(options.startsAt, roundIndex * options.daysBetweenRounds);

  return `${date}T${options.kickoffTime}:00-03:00`;
}

function rotateTeams(teams: FixtureTeam[]) {
  return [teams[0], teams[teams.length - 1], ...teams.slice(1, -1)];
}

function buildLegRounds(
  teams: FixtureTeam[],
  options: LeagueFixtureOptions,
  legIndex: number,
  roundOffset: number,
) {
  const rounds: GeneratedFixtureRound[] = [];
  let rotation = [...teams];
  const roundsPerLeg = rotation.length - 1;
  const matchesPerRound = rotation.length / 2;

  for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex += 1) {
    const absoluteRoundIndex = roundOffset + roundIndex;
    const label = `Fecha ${absoluteRoundIndex + 1}`;
    const matches: GeneratedFixtureMatch[] = [];

    for (let pairIndex = 0; pairIndex < matchesPerRound; pairIndex += 1) {
      const left = rotation[pairIndex];
      const right = rotation[rotation.length - 1 - pairIndex];

      if (left.id === byeTeam.id || right.id === byeTeam.id) continue;

      const shouldFlip = (roundIndex + pairIndex + legIndex) % 2 === 1;
      const home = shouldFlip ? right : left;
      const away = shouldFlip ? left : right;

      matches.push({
        roundLabel: label,
        scheduledAt: getRoundScheduledAt(absoluteRoundIndex, options),
        homeTeamId: home.id,
        awayTeamId: away.id,
      });
    }

    rounds.push({
      label,
      scheduledAt: getRoundScheduledAt(absoluteRoundIndex, options),
      matches,
    });
    rotation = rotateTeams(rotation);
  }

  return rounds;
}

export function buildLeagueFixture(
  teams: FixtureTeam[],
  options: LeagueFixtureOptions,
) {
  if (teams.length < 2) return [];

  const normalizedTeams = teams.length % 2 === 0 ? teams : [...teams, byeTeam];
  const roundsPerLeg = normalizedTeams.length - 1;
  const firstLeg = buildLegRounds(normalizedTeams, options, 0, 0);

  if (options.legs === 1) return firstLeg;

  return [
    ...firstLeg,
    ...buildLegRounds(normalizedTeams, options, 1, roundsPerLeg),
  ];
}
