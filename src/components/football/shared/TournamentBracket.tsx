"use client";

import { useState, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { UIFootballMatch } from "@/features/football-tournaments/types";
import { reconstructTreeFromMatches } from "@/lib/tree-reconstructor";

function getInitials(name: string) {
  if (!name || name === "Por definirse") return "?";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

type TournamentBracketProps = {
  matches: UIFootballMatch[];
  onMatchClick?: (match: UIFootballMatch) => void;
  selectedMatchId?: string | null;
};

export function TournamentBracket({
  matches,
  onMatchClick,
  selectedMatchId = null,
}: TournamentBracketProps) {
  const { tree, maxDepth } = useMemo(() => {
    const knockoutMatches = matches.filter((match) => match.isKnockout);
    const reconstructed = reconstructTreeFromMatches(knockoutMatches);
    const sortedTree = [...reconstructed].sort((a, b) => a.gridRowStart - b.gridRowStart);
    const depth = sortedTree.length > 0 ? Math.max(...sortedTree.map((n) => n.depth)) : -1;
    return { tree: sortedTree, maxDepth: depth };
  }, [matches]);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const highlightedNodes = useMemo(() => {
    const highlight = new Set<string>();
    if (!hoveredNodeId && !selectedMatchId) return highlight;
    const targetId = hoveredNodeId || selectedMatchId;
    
    // Trace back path
    let current = tree.find((n) => n.id === targetId);
    while (current) {
      highlight.add(current.id);
      const parentId = current.nextMatchId;
      current = parentId ? tree.find((n) => n.id === parentId) : undefined;
    }
    return highlight;
  }, [hoveredNodeId, selectedMatchId, tree]);

  if (tree.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-white/50">
        No hay partidos de eliminatoria disponibles.
      </div>
    );
  }

  const columns: number[] = [];
  for (let d = maxDepth; d >= 0; d--) {
    columns.push(d);
  }

  const baseSize = Math.pow(2, maxDepth) / 2;
  const innerWidth = 64 + columns.length * 280 + Math.max(0, columns.length - 1) * 48;
  const rowHeight = 120;
  const innerHeight = baseSize * 2 * rowHeight + 96;

  const availableWidth = 900;
  const availableHeight = 600;
  const fitScale = Math.min(1.1, Math.min(availableWidth / innerWidth, availableHeight / innerHeight));
  const isSmall = innerWidth <= availableWidth && innerHeight <= availableHeight;
  const minZoom = isSmall ? fitScale : fitScale * 0.5;

  return (
    <div className="overflow-hidden h-[600px] w-full bg-[#111111] sm:rounded-xl sm:border border-white/5 relative isolate">
      <TransformWrapper
        key={`bracket-${matches.length}`}
        initialScale={fitScale}
        minScale={minZoom}
        maxScale={2.5}
        centerOnInit={true}
        centerZoomedOut={true}
        wheel={{ step: 0.1 }}
        limitToBounds={true}
      >
        <TransformComponent wrapperClass="!w-full !h-full custom-scrollbar">
          <div
            className="flex gap-12 px-8 py-12 items-stretch relative isolate"
            style={{ width: innerWidth, height: innerHeight }}
          >
            {(() => {
              const totalRows = baseSize * 2;
              const totalHeight = totalRows * rowHeight;
              const gridStartY = 96;

              return (
                <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {tree.map((node) => {
                      if (!node.nextMatchId) return null;
                      const nextNode = tree.find((n) => n.id === node.nextMatchId);
                      if (!nextNode) return null;

                      const getCenterY = (rowStart: number, rowEnd: number) => {
                        const mid = (rowStart + rowEnd) / 2;
                        return gridStartY + ((mid - 1) / totalRows) * totalHeight;
                      };

                      const startY = getCenterY(node.gridRowStart, node.gridRowEnd);
                      const endY = getCenterY(nextNode.gridRowStart, nextNode.gridRowEnd);
                      const startX = 32 + (maxDepth - node.depth + 1) * 280 + (maxDepth - node.depth) * 48;
                      const endX = startX + 48;
                      const midX = (startX + endX) / 2;

                      const isHighlighted = highlightedNodes.has(node.id) && highlightedNodes.has(nextNode.id);

                      return (
                        <path
                          key={`path-${node.id}`}
                          d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`}
                          fill="none"
                          stroke={isHighlighted ? "rgba(60,191,113,0.5)" : "rgba(255,255,255,0.15)"}
                          strokeWidth={isHighlighted ? "3" : "2"}
                          className="transition-all duration-300"
                        />
                      );
                    })}
                  </svg>

                  {columns.map((depth) => {
                    const columnNodes = tree.filter((n) => n.depth === depth);
                    if (columnNodes.length === 0) return null;
                    
                    const colLabel = columnNodes[0].roundLabel || "Etapa";

                    return (
                      <div
                        key={depth}
                        className="w-[280px] relative z-10"
                        style={{ 
                          display: "grid", 
                          gridTemplateRows: `repeat(${baseSize * 2}, 1fr)`,
                          height: totalHeight,
                          marginTop: 48
                        }}
                      >
                        <div className="absolute -top-10 inset-x-0 flex justify-center h-8">
                          <span className="px-3 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 shadow-sm backdrop-blur-md">
                            {colLabel}
                          </span>
                        </div>
                        {columnNodes.map((node) => {
                          const match = matches.find((m) => m.id === node.id);
                          if (!match) return null;
                          
                          const homeWon = match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
                          const awayWon = match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
                          
                          const isHighlighted = highlightedNodes.has(node.id) || selectedMatchId === node.id;

                          return (
                            <button
                              key={node.id}
                              onClick={() => onMatchClick?.(match)}
                              onMouseEnter={() => setHoveredNodeId(node.id)}
                              onMouseLeave={() => setHoveredNodeId(null)}
                              style={{ gridRow: `${node.gridRowStart} / ${node.gridRowEnd}` }}
                              className={`w-full self-center hover:bg-white/[0.05] rounded-lg overflow-hidden flex flex-col h-[72px] m-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm text-left transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[var(--color-accent)] group ${
                                isHighlighted ? "bg-[#1A211D] shadow-[0_0_15px_rgba(60,191,113,0.3)] border border-[var(--color-accent)]/50" : "bg-black/60 border border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div className={`flex-1 flex items-center border-b border-white/5 py-2 px-3 relative ${homeWon ? 'bg-white/[0.03]' : ''}`}>
                                {homeWon && <div className="absolute left-0 inset-y-0 w-1 bg-[var(--color-accent)]" />}
                                <div className="w-5 h-5 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/70 mr-2 group-hover:bg-[var(--color-accent)]/20 group-hover:text-[var(--color-accent)] transition-colors">
                                  {getInitials(match.homeTeamName || "")}
                                </div>
                                <span className={`flex-1 truncate text-sm font-medium ${homeWon ? "text-white font-bold" : "text-white/70"}`}>
                                  {match.homeTeamName || "Por definirse"}
                                </span>
                                <span className={`text-sm font-bold w-6 text-center ${homeWon ? "text-[var(--color-accent)] drop-shadow-md" : "text-white/40"}`}>
                                  {match.homeScore ?? "-"}
                                </span>
                              </div>
                              <div className={`flex-1 flex items-center py-2 px-3 relative ${awayWon ? 'bg-white/[0.03]' : ''}`}>
                                {awayWon && <div className="absolute left-0 inset-y-0 w-1 bg-[var(--color-accent)]" />}
                                <div className="w-5 h-5 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/70 mr-2 group-hover:bg-[var(--color-accent)]/20 group-hover:text-[var(--color-accent)] transition-colors">
                                  {getInitials(match.awayTeamName || "")}
                                </div>
                                <span className={`flex-1 truncate text-sm font-medium ${awayWon ? "text-white font-bold" : "text-white/70"}`}>
                                  {match.awayTeamName || "Por definirse"}
                                </span>
                                <span className={`text-sm font-bold w-6 text-center ${awayWon ? "text-[var(--color-accent)] drop-shadow-md" : "text-white/40"}`}>
                                  {match.awayScore ?? "-"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
