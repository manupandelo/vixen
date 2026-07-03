export type MatchNode = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
  isHomeSlotInNextMatch: boolean;
  roundLabel: string;
  depth: number;
  gridRowStart: number;
  gridRowEnd: number;
  homeSourceType: "INITIAL" | "MATCH";
  awaySourceType: "INITIAL" | "MATCH";
};

// Represents an initial slot.
// isBye=true means this slot is a Pase Libre and will be pruned if not playing against anyone.
export type InitialSlot = {
  teamId: string | null;
  isBye: boolean;
};

// Generates a pruned tree from a set of first-round slots.
export function generatePrunedTree(
  slots: InitialSlot[],
): MatchNode[] {
  const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n > 0;
  if (!isPowerOfTwo(slots.length)) {
    throw new Error("Slots must be a power of 2");
  }

  const genId = () => crypto.randomUUID();

  const getLabel = (matchesCount: number) => {
    if (matchesCount === 1) return "Final";
    if (matchesCount === 2) return "Semifinales";
    if (matchesCount === 4) return "Cuartos de final";
    if (matchesCount === 8) return "Octavos de final";
    if (matchesCount === 16) return "16avos de final";
    return `Fase Previa (${matchesCount})`;
  };

  type TempNode = {
    id: string;
    depth: number;
    homeSource: TempNode | InitialSlot | null;
    awaySource: TempNode | InitialSlot | null;
    activeTeams: number; // Number of Non-Bye slots that flow here
    indexInRound: number;
  };

  let currentRound: (TempNode | InitialSlot | null)[] = [...slots];
  let depth = Math.log2(slots.length);
  const maxDepth = depth;

  const allTempNodes: TempNode[] = [];

  while (currentRound.length > 1) {
    const nextRound: TempNode[] = [];
    depth--;

    for (let i = 0; i < currentRound.length; i += 2) {
      const home = currentRound[i];
      const away = currentRound[i + 1];

      let homeActive = 0;
      if (home && "isBye" in home) homeActive = home.isBye ? 0 : 1;
      else if (home) homeActive = (home as TempNode).activeTeams;

      let awayActive = 0;
      if (away && "isBye" in away) awayActive = away.isBye ? 0 : 1;
      else if (away) awayActive = (away as TempNode).activeTeams;

      const node: TempNode = {
        id: genId(),
        depth,
        homeSource: home,
        awaySource: away,
        activeTeams: homeActive + awayActive,
        indexInRound: i / 2,
      };

      nextRound.push(node);
      allTempNodes.push(node);
    }
    currentRound = nextRound;
  }

  const nodesToKeep = new Set<string>();

  // A node is kept if it has > 1 active Non-Bye slots, OR if it's the Final
  for (const node of allTempNodes) {
    if (node.activeTeams > 1 || node.depth === 0) {
      nodesToKeep.add(node.id);
    }
  }

  const finalNodes: MatchNode[] = [];

  const resolveSource = (source: TempNode | InitialSlot | null): { id: string | null, type: "INITIAL" | "MATCH" | "UNKNOWN" } => {
    if (source === null) return { id: null, type: "UNKNOWN" };
    if ("isBye" in source) {
      if (source.isBye) return { id: null, type: "UNKNOWN" };
      return { id: source.teamId, type: "INITIAL" };
    }

    if (nodesToKeep.has(source.id)) {
      return { id: null, type: "MATCH" };
    }

    const h = resolveSource(source.homeSource);
    if (h.type !== "UNKNOWN") return h;
    const a = resolveSource(source.awaySource);
    if (a.type !== "UNKNOWN") return a;

    return { id: null, type: "UNKNOWN" };
  };

  const tempToMatchNode = new Map<string, MatchNode>();

  for (const tempNode of allTempNodes) {
    if (nodesToKeep.has(tempNode.id)) {
      const matchesInRound = Math.pow(2, tempNode.depth);
      const span = Math.pow(2, maxDepth - tempNode.depth);

      const hSource = resolveSource(tempNode.homeSource);
      const aSource = resolveSource(tempNode.awaySource);

      const node: MatchNode = {
        id: tempNode.id,
        homeTeamId: hSource.id,
        awayTeamId: aSource.id,
        homeSourceType: hSource.type === "MATCH" ? "MATCH" : "INITIAL",
        awaySourceType: aSource.type === "MATCH" ? "MATCH" : "INITIAL",
        nextMatchId: null,
        isHomeSlotInNextMatch: true,
        roundLabel: getLabel(matchesInRound),
        depth: tempNode.depth,
        gridRowStart: 1 + tempNode.indexInRound * span,
        gridRowEnd: 1 + (tempNode.indexInRound + 1) * span,
      };
      finalNodes.push(node);
      tempToMatchNode.set(tempNode.id, node);
    }
  }

  for (const tempNode of allTempNodes) {
    if (nodesToKeep.has(tempNode.id)) {
      let parent: TempNode | null = null;
      for (const p of allTempNodes) {
        if (p.homeSource === tempNode || p.awaySource === tempNode) {
          parent = p;
          break;
        }
      }

      let currentParent = parent;
      let isHome = currentParent?.homeSource === tempNode;

      while (currentParent && !nodesToKeep.has(currentParent.id)) {
        const pNode = currentParent;
        let nextP: TempNode | null = null;
        for (const p of allTempNodes) {
          if (p.homeSource === pNode || p.awaySource === pNode) {
            nextP = p;
            break;
          }
        }
        if (nextP) {
           isHome = nextP.homeSource === currentParent;
        }
        currentParent = nextP;
      }

      if (currentParent && nodesToKeep.has(currentParent.id)) {
         const mn = tempToMatchNode.get(tempNode.id)!;
         mn.nextMatchId = currentParent.id;
         mn.isHomeSlotInNextMatch = isHome;
      }
    }
  }

  return finalNodes;
}

export function generateStepladderByes(slotsCount: number, teamsCount: number): boolean[] {
  const isBye = Array(slotsCount).fill(true);
  // Place non-byes at 0, 1, 2, 4, 8...
  for (let i = 0; i < teamsCount; i++) {
    if (i === 0) isBye[0] = false;
    else {
      const idx = Math.pow(2, i - 1);
      if (idx < slotsCount) isBye[idx] = false;
    }
  }
  return isBye;
}

export function generateBalancedByes(slotsCount: number, teamsCount: number): boolean[] {
  // Simple deterministic bye distribution (not perfect seeding, but spreads them out)
  const isBye = Array(slotsCount).fill(false);
  const byes = slotsCount - teamsCount;

  let left = 0;
  let right = slotsCount - 1;
  let turn = true;

  for (let i = 0; i < byes; i++) {
    if (turn) {
      isBye[left] = true;
      left++;
    } else {
      isBye[right] = true;
      right--;
    }
    turn = !turn;
  }
  return isBye;
}
