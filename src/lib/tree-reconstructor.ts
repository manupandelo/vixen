import type { MatchSlot } from "@/features/football-tournaments/bracket-progression";

import type { MatchNode } from "./tree-generator";

export type TreeReconstructableMatch = {
  id: string;
  nextMatchId?: string | null;
  nextMatchSlot?: MatchSlot | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  roundLabel?: string;
};

export function reconstructTreeFromMatches(matches: TreeReconstructableMatch[]): MatchNode[] {
  const nodes = new Map<string, MatchNode>();
  const childrenMap = new Map<string, TreeReconstructableMatch[]>();

  // Find children for each match
  for (const match of matches) {
    if (match.nextMatchId) {
      if (!childrenMap.has(match.nextMatchId)) {
        childrenMap.set(match.nextMatchId, []);
      }
      childrenMap.get(match.nextMatchId)!.push(match);
    }
  }

  // Determine the root (Final), which has no nextMatchId or whose nextMatchId is not in the list
  const roots = matches.filter(
    (m) => !m.nextMatchId || !matches.some((other) => other.id === m.nextMatchId),
  );

  if (roots.length === 0) {
    return []; // Invalid tree
  }

  // Assuming a single elimination bracket, there should be one root.
  // We'll process the primary root.
  const root = roots[0];
  const maxDepth = calculateMaxDepth(root, childrenMap);

  // Span is the total number of grid rows needed. 
  // A perfect binary tree of depth D needs 2^D rows.
  const maxSpan = Math.pow(2, maxDepth);

  function traverse(
    match: TreeReconstructableMatch,
    depth: number,
    start: number,
    end: number,
    isHomeInNext: boolean,
  ) {
    const children = childrenMap.get(match.id) ?? [];
    
    // Si conocemos el slot destino, lo usamos: el alimentador del lado "home"
    // se dibuja arriba. Si falta el dato (llaves previas a la migración),
    // caemos al orden por id, que es estable.
    const hasSlots = children.some((child) => Boolean(child.nextMatchSlot));

    if (hasSlots) {
      const rank = (slot: MatchSlot | null | undefined) =>
        slot === "home" ? 0 : 1;
      children.sort((a, b) => rank(a.nextMatchSlot) - rank(b.nextMatchSlot));
    } else {
      children.sort((a, b) => a.id.localeCompare(b.id));
    }

    let homeSourceType: "INITIAL" | "MATCH" = "INITIAL";
    let awaySourceType: "INITIAL" | "MATCH" = "INITIAL";

    const mid = start + Math.floor((end - start) / 2);

    if (children.length > 0) {
      const topChild = children[0];
      homeSourceType = "MATCH";
      traverse(topChild, depth + 1, start, mid, true);
    }

    if (children.length > 1) {
      const bottomChild = children[1];
      awaySourceType = "MATCH";
      traverse(bottomChild, depth + 1, mid, end, false);
    }

    nodes.set(match.id, {
      id: match.id,
      homeTeamId: match.homeTeamId ?? null,
      awayTeamId: match.awayTeamId ?? null,
      nextMatchId: match.nextMatchId ?? null,
      isHomeSlotInNextMatch: isHomeInNext,
      roundLabel: match.roundLabel || "",
      depth,
      gridRowStart: start,
      gridRowEnd: end,
      homeSourceType,
      awaySourceType,
    });
  }

  traverse(root, 0, 1, 1 + maxSpan, true);

  return Array.from(nodes.values());
}

function calculateMaxDepth(
  root: TreeReconstructableMatch,
  childrenMap: Map<string, TreeReconstructableMatch[]>,
): number {
  let max = 0;
  function dfs(node: TreeReconstructableMatch, depth: number) {
    if (depth > max) max = depth;
    const children = childrenMap.get(node.id) ?? [];
    for (const child of children) {
      dfs(child, depth + 1);
    }
  }
  dfs(root, 0);
  return max;
}
