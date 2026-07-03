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

export type GroupPlayoffFixtureOptions = {
  groupCount: number;
  qualifiersPerGroup: number;
  startsAt: string | null;
  kickoffTime: string | null;
  daysBetweenGroupRounds: number;
  daysBetweenPlayoffRounds: number;
};

export type GeneratedGroupTeam = FixtureTeam & {
  seed: number;
};

export type GeneratedTournamentGroup = {
  id: string;
  name: string;
  position: number;
  teams: GeneratedGroupTeam[];
};

export type GeneratedGroupFixtureMatch = GeneratedFixtureMatch & {
  groupId: string;
};

export type GeneratedGroupFixtureRound = Omit<
  GeneratedFixtureRound,
  "matches"
> & {
  groupId: string;
  groupName: string;
  matches: GeneratedGroupFixtureMatch[];
};

export type GeneratedGroupPlayoffFixture = {
  groups: GeneratedTournamentGroup[];
  groupRounds: GeneratedGroupFixtureRound[];
  playoffMatches: GeneratedBracketMatch[];
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

function getScheduledAtFromDate(date: string | null, kickoffTime: string | null) {
  if (!date || !kickoffTime) return null;

  return `${date}T${kickoffTime}:00-03:00`;
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

function getGroupName(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return `Zona ${alphabet[index] ?? index + 1}`;
}

function nextPowerOfTwo(value: number) {
  let size = 2;
  while (size < value) size *= 2;
  return size;
}

function getPlayoffMatchCount(qualifiers: number) {
  return nextPowerOfTwo(Math.max(2, qualifiers)) - 1;
}

function getPlayoffDepth(matchIndex: number, totalMatches: number) {
  let remaining = totalMatches;
  let offset = 0;
  let depth = Math.log2(totalMatches + 1) - 1;

  while (remaining > 0) {
    const roundMatches = Math.pow(2, depth);
    if (matchIndex < offset + roundMatches) return depth;
    offset += roundMatches;
    remaining -= roundMatches;
    depth -= 1;
  }

  return 0;
}

function buildPlaceholderPlayoff(
  totalQualifiers: number,
  startsAt: string | null,
  kickoffTime: string | null,
  daysBetweenRounds: number,
) {
  const matchCount = getPlayoffMatchCount(totalQualifiers);
  const matches: GeneratedBracketMatch[] = Array.from({
    length: matchCount,
  }).map((_, index) => {
    const depth = getPlayoffDepth(index, matchCount);
    const matchesInRound = Math.pow(2, depth);
    const roundOffset = Math.log2(matchCount + 1) - 1 - depth;
    const date = startsAt ? addDays(startsAt, roundOffset * daysBetweenRounds) : null;

    return {
      id: crypto.randomUUID(),
      roundLabel: getBracketRoundLabel(matchesInRound),
      scheduledAt: getScheduledAtFromDate(date, kickoffTime),
      homeTeamId: null,
      awayTeamId: null,
      nextMatchId: null,
    };
  });

  let roundStart = 0;
  let roundSize = Math.pow(2, Math.log2(matchCount + 1) - 1);

  while (roundSize > 1) {
    const nextRoundStart = roundStart + roundSize;
    for (let index = 0; index < roundSize; index += 1) {
      matches[roundStart + index].nextMatchId =
        matches[nextRoundStart + Math.floor(index / 2)].id;
    }
    roundStart = nextRoundStart;
    roundSize /= 2;
  }

  return matches;
}

export function buildGroupPlayoffFixture(
  teams: FixtureTeam[],
  options: GroupPlayoffFixtureOptions,
): GeneratedGroupPlayoffFixture {
  if (teams.length < 2) {
    throw new Error("Necesitás al menos dos equipos.");
  }

  if (options.groupCount < 1) {
    throw new Error("Necesitás al menos una zona.");
  }

  if (options.groupCount > teams.length) {
    throw new Error("No puede haber más zonas que equipos.");
  }

  if (options.qualifiersPerGroup < 1) {
    throw new Error("Tiene que clasificar al menos un equipo por zona.");
  }

  const totalQualifiers = options.groupCount * options.qualifiersPerGroup;
  if (totalQualifiers < 2) {
    throw new Error("El playoff necesita al menos dos clasificados.");
  }

  const groups: GeneratedTournamentGroup[] = Array.from({
    length: options.groupCount,
  }).map((_, index) => ({
    id: `group-${index + 1}`,
    name: getGroupName(index),
    position: index + 1,
    teams: [],
  }));

  teams.forEach((team, index) => {
    const group = groups[index % options.groupCount];
    group.teams.push({
      ...team,
      seed: group.teams.length + 1,
    });
  });

  const groupRounds = groups.flatMap((group) => {
    const rounds = buildLeagueFixture(group.teams, {
      legs: 1,
      startsAt: options.startsAt,
      kickoffTime: options.kickoffTime,
      daysBetweenRounds: options.daysBetweenGroupRounds,
    });

    return rounds.map((round) => ({
      groupId: group.id,
      groupName: group.name,
      label: `${group.name} - ${round.label}`,
      scheduledAt: round.scheduledAt,
      matches: round.matches.map((match) => ({
        ...match,
        roundLabel: `${group.name} - ${match.roundLabel}`,
        groupId: group.id,
      })),
    }));
  });

  const groupRoundCount = Math.max(
    0,
    ...groups.map((group) =>
      buildLeagueFixture(group.teams, {
        legs: 1,
        startsAt: null,
        kickoffTime: null,
        daysBetweenRounds: options.daysBetweenGroupRounds,
      }).length,
    ),
  );
  const playoffStart = options.startsAt
    ? addDays(
        options.startsAt,
        Math.max(0, groupRoundCount - 1) * options.daysBetweenGroupRounds +
          options.daysBetweenPlayoffRounds,
      )
    : null;

  return {
    groups,
    groupRounds,
    playoffMatches: buildPlaceholderPlayoff(
      totalQualifiers,
      playoffStart,
      options.kickoffTime,
      options.daysBetweenPlayoffRounds,
    ),
  };
}

export type BracketInputMatch = {
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type GeneratedBracketMatch = {
  id: string;
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
};

export function getBracketRoundLabel(matchesInRound: number): string {
  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semifinal";
  if (matchesInRound === 4) return "Cuartos de final";
  if (matchesInRound === 8) return "Octavos de final";
  if (matchesInRound === 16) return "16avos de final";
  if (matchesInRound === 32) return "32avos de final";
  return `Fase Previa (${matchesInRound} partidos)`;
}

export function buildBracketFixture(
  initialMatches: BracketInputMatch[],
  startsAt: string | null,
  daysBetweenRounds: number,
): GeneratedBracketMatch[] {
  if (initialMatches.length === 0) return [];

  // Enforce power of 2
  const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n > 0;
  if (!isPowerOfTwo(initialMatches.length)) {
    throw new Error("Initial matches must be a power of 2 (e.g. 2, 4, 8)");
  }

  const allMatches: GeneratedBracketMatch[] = [];

  // Helper to generate UUID-like string for linking matches before DB insert
  const generateTempId = () => crypto.randomUUID();

  // Create first round matches
  let currentRoundMatches: GeneratedBracketMatch[] = initialMatches.map((m) => ({
    id: generateTempId(),
    roundLabel: getBracketRoundLabel(initialMatches.length),
    scheduledAt: startsAt ? `${startsAt}T10:00:00-03:00` : null,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    nextMatchId: null,
  }));

  allMatches.push(...currentRoundMatches);

  let roundCount = 1;
  let matchesInCurrentRound = currentRoundMatches.length;

  while (matchesInCurrentRound > 1) {
    const nextRoundMatches: GeneratedBracketMatch[] = [];
    matchesInCurrentRound /= 2;
    const roundLabel = getBracketRoundLabel(matchesInCurrentRound);

    for (let i = 0; i < matchesInCurrentRound; i++) {
      const nextMatchDate = startsAt ? addDays(startsAt, roundCount * daysBetweenRounds) : null;
      const nextMatch: GeneratedBracketMatch = {
        id: generateTempId(),
        roundLabel,
        scheduledAt: nextMatchDate ? `${nextMatchDate}T10:00:00-03:00` : null,
        homeTeamId: null,
        awayTeamId: null,
        nextMatchId: null,
      };

      const prevHomeMatch = currentRoundMatches[i * 2];
      const prevAwayMatch = currentRoundMatches[i * 2 + 1];

      // Auto-advance logic (Byes)
      if (prevHomeMatch.homeTeamId && !prevHomeMatch.awayTeamId) {
        nextMatch.homeTeamId = prevHomeMatch.homeTeamId;
      } else if (!prevHomeMatch.homeTeamId && prevHomeMatch.awayTeamId) {
        nextMatch.homeTeamId = prevHomeMatch.awayTeamId;
      }

      if (prevAwayMatch.homeTeamId && !prevAwayMatch.awayTeamId) {
        nextMatch.awayTeamId = prevAwayMatch.homeTeamId;
      } else if (!prevAwayMatch.homeTeamId && prevAwayMatch.awayTeamId) {
        nextMatch.awayTeamId = prevAwayMatch.awayTeamId;
      }

      // Link matches
      prevHomeMatch.nextMatchId = nextMatch.id;
      prevAwayMatch.nextMatchId = nextMatch.id;

      nextRoundMatches.push(nextMatch);
    }

    allMatches.push(...nextRoundMatches);
    currentRoundMatches = nextRoundMatches;
    roundCount++;
  }

  return allMatches;
}
