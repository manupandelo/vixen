"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { AdminTeam } from "@/features/football-tournaments/data";
import { generatePrunedTree, generateStepladderByes, generateBalancedByes, type MatchNode, type InitialSlot } from "@/lib/tree-generator";

type InteractiveBracketBuilderProps = {
  teams: Pick<AdminTeam, "id" | "name">[];
  onMatchesChange: (matches: MatchNode[]) => void;
  showErrors?: boolean;
};

export function InteractiveBracketBuilder({
  teams,
  onMatchesChange,
  showErrors = false,
}: InteractiveBracketBuilderProps) {
  const nextPowerOfTwo = (n: number) => {
    let p = 2;
    while (p < n) p *= 2;
    return p;
  };

  const defaultP = nextPowerOfTwo(Math.max(2, teams.length));
  const maxStepladderSlots = Math.pow(2, Math.max(1, teams.length - 1));

  // The size of the "perfect tree" we are operating on
  const [baseSize, setBaseSize] = useState<number>(defaultP / 2);

  // The perfect tree state
  const [perfectSlots, setPerfectSlots] = useState<InitialSlot[]>(() => {
    const byes = generateBalancedByes(defaultP, teams.length);
    return Array.from({ length: defaultP }).map((_, i) => ({ teamId: null, isBye: byes[i] }));
  });

  // Pruned tree (derived from perfect slots)
  const prunedTree = useMemo(() => {
    return generatePrunedTree(perfectSlots);
  }, [perfectSlots]);

  // Sync to parent
  useEffect(() => {
    onMatchesChange(prunedTree);
  }, [prunedTree, onMatchesChange]);

  const handleSizeChange = (newSizeMatches: number) => {
    const newSlotsCount = newSizeMatches * 2;
    setBaseSize(newSizeMatches);

    // Auto re-distribute byes based on whether they chose a stepladder size
    const isStepladder = newSlotsCount > defaultP;
    const byes = isStepladder
      ? generateStepladderByes(newSlotsCount, teams.length)
      : generateBalancedByes(newSlotsCount, teams.length);

    setPerfectSlots(Array.from({ length: newSlotsCount }).map((_, i) => ({
       teamId: null, // Reset teams on format change to prevent breaking the structure
       isBye: byes[i]
    })));
  };

  const randomize = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const newSlotsCount = baseSize * 2;
    const isStepladder = newSlotsCount > defaultP;

    const byes = isStepladder
      ? generateStepladderByes(newSlotsCount, teams.length)
      : generateBalancedByes(newSlotsCount, teams.length);

    const newSlots: InitialSlot[] = Array.from({ length: newSlotsCount }).map((_, i) => ({
      teamId: null,
      isBye: byes[i]
    }));

    let teamIdx = 0;
    for (let i = 0; i < newSlotsCount; i++) {
      if (!newSlots[i].isBye && teamIdx < shuffled.length) {
        newSlots[i].teamId = shuffled[teamIdx].id;
        teamIdx++;
      }
    }

    setPerfectSlots(newSlots);
  };

  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const highlightedNodes = useMemo(() => {
    const set = new Set<string>();
    let current = hoveredNodeId;
    while (current) {
       set.add(current);
       const node = prunedTree.find(n => n.id === current);
       current = node?.nextMatchId || null;
    }
    return set;
  }, [hoveredNodeId, prunedTree]);

  const assignedTeamIds = new Set(perfectSlots.map(s => s.teamId).filter(Boolean));
  const unassignedTeams = teams.filter((t) => !assignedTeamIds.has(t.id));

  const [teamsListRef] = useAutoAnimate<HTMLDivElement>();

  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData("text/plain", teamId);
  };

  const handleDrop = (e: React.DragEvent, matchId: string, side: "home" | "away") => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData("text/plain");

    if (teamId) {
       const match = prunedTree.find(m => m.id === matchId);
       if (!match) return;

       // Find exactly which perfect slot corresponds to this dropzone.
       // Because non-byes map 1-to-1 to the grid row of the first column, we just search for the first available non-bye slot in this span.
       const targetSpanStart = side === "home"
         ? match.gridRowStart - 1
         : Math.floor((match.gridRowStart + match.gridRowEnd) / 2) - 1;

       const targetSpanEnd = side === "home"
         ? Math.floor((match.gridRowStart + match.gridRowEnd) / 2) - 1
         : match.gridRowEnd - 1;

       let targetPerfectSlotIndex = targetSpanStart;
       // Find the first Non-Bye slot in this span
       for (let i = targetSpanStart; i < targetSpanEnd; i++) {
          if (!perfectSlots[i]?.isBye) {
             targetPerfectSlotIndex = i;
             break;
          }
       }

       setPerfectSlots(prev => {
          const next = [...prev];
          for (let i = 0; i < next.length; i++) {
             if (next[i].teamId === teamId) next[i].teamId = null;
          }
          if (targetPerfectSlotIndex < next.length) {
             next[targetPerfectSlotIndex].teamId = teamId;
          }
          return next;
       });
    }
    setDragOverSlot(null);
  };

  const updateMatch = (matchId: string, side: "home" | "away", teamId: string | null) => {
     if (teamId === null) {
       const match = prunedTree.find(m => m.id === matchId);
       if (!match) return;
       const teamToClear = side === "home" ? match.homeTeamId : match.awayTeamId;
       if (!teamToClear) return;

       setPerfectSlots(prev => {
          const next = [...prev];
          for (let i = 0; i < next.length; i++) {
             if (next[i].teamId === teamToClear) next[i].teamId = null;
          }
          return next;
       });
     }
  };

  const getTeamName = (id: string | null) => {
    if (!id) return "";
    return teams.find((t) => t.id === id)?.name || "";
  };

  const treeSizeOptions = [
    { label: "Semifinales (4 equipos max)", value: 2 },
    { label: "Cuartos de final (8 equipos max)", value: 4 },
    { label: "Octavos de final (16 equipos max)", value: 8 },
    { label: "16avos de final (32 equipos max)", value: 16 },
  ].filter(opt => opt.value >= defaultP / 2 && opt.value <= maxStepladderSlots / 2);

  const maxDepth = Math.log2(baseSize * 2) - 1;
  const columns: number[] = [];
  for (let d = maxDepth; d >= 0; d--) {
     columns.push(d);
  }

  const innerWidth = 64 + columns.length * 280 + Math.max(0, columns.length - 1) * 48; // Using wider 280px nodes
  const rowHeight = 120;
  const innerHeight = baseSize * 2 * rowHeight + 96; // 120px rows for generous padding

  const availableWidth = 900;
  const availableHeight = 420;
  const fitScale = Math.min(1.1, Math.min(availableWidth / innerWidth, availableHeight / innerHeight));
  
  const isSmall = innerWidth <= availableWidth && innerHeight <= availableHeight;
  const minZoom = isSmall ? fitScale : fitScale * 0.7;

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-black/20 p-2 px-4 rounded-lg border border-white/5">
          <label className="text-xs font-semibold text-white/70">Comenzar desde:</label>
          <select
            value={baseSize}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            className="bg-[#1A211D] text-sm text-white px-2 py-1 rounded border border-white/10 outline-none focus:border-[var(--color-accent)]"
          >
            {treeSizeOptions.map(opt => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(180px,220px)_1fr] gap-6 overflow-hidden">
        <div className="flex flex-col h-[450px] bg-black/20 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 bg-white/5 border-b border-white/10 flex flex-col gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Equipos ({unassignedTeams.length})</h4>
              <p className="text-xs text-[var(--color-muted)] mt-1">Arrastrá al casillero</p>
            </div>
            <button
              type="button"
              onClick={randomize}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-black transition-transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
              Sorteo Aleatorio
            </button>
          </div>
          <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2 custom-scrollbar" ref={teamsListRef}>
            {unassignedTeams.map((team) => (
              <div
                key={team.id}
                draggable
                onDragStart={(e) => handleDragStart(e, team.id)}
                className="px-3 py-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-lg text-sm font-medium border border-[var(--color-accent)]/20 cursor-grab active:cursor-grabbing hover:bg-[var(--color-accent)]/20 transition-colors"
              >
                {team.name}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden h-[450px] bg-black/10 rounded-xl border border-white/5 relative">
          <TransformWrapper
             key={`bracket-zoom-${baseSize}`}
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
                 ref={containerRef}
              >
                 {(() => {
                   const rowHeight = 120;
                   const totalRows = baseSize * 2;
                   const totalHeight = totalRows * rowHeight;
                   const gridStartY = 96;

                   return (
                     <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {prunedTree.map(node => {
                      if (!node.nextMatchId) return null;
                      const nextNode = prunedTree.find(n => n.id === node.nextMatchId);
                      if (!nextNode) return null;

                      const getCenterY = (rowStart: number, rowEnd: number) => {
                         const mid = (rowStart + rowEnd) / 2;
                         return gridStartY + ((mid - 1) / totalRows) * totalHeight;
                      };

                      const startY = getCenterY(node.gridRowStart, node.gridRowEnd);
                      const endY = getCenterY(nextNode.gridRowStart, nextNode.gridRowEnd);

                      const colWidth = 12 * 16; // w-48 = 192px
                      const gap = 3 * 16; // gap-12 = 48px
                      // Add 32px (2rem) for the p-8 padding on the container X axis
                      const paddingX = 32;

                      const startColIndex = maxDepth - node.depth;
                      const endColIndex = maxDepth - nextNode.depth;

                      const startX = paddingX + startColIndex * (colWidth + gap) + colWidth;
                      const endX = paddingX + endColIndex * (colWidth + gap);

                      const midX = startX + gap / 2;
                      
                      const isHighlighted = highlightedNodes.has(node.id) && highlightedNodes.has(nextNode.id);
                      const isHoveredLine = hoveredNodeId !== null; // If anything is hovered, dim others

                      return (
                        <path
                           key={`path-${node.id}`}
                           d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`}
                           fill="none"
                           stroke={isHighlighted ? "var(--color-accent)" : isHoveredLine ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.15)"}
                           strokeWidth={isHighlighted ? "3" : "2"}
                           className={isHighlighted ? "transition-all duration-300" : "transition-all duration-300"}
                        />
                      );
                   })}
                 </svg>

                 {columns.map(depth => {
                    const nodesInCol = prunedTree.filter(n => n.depth === depth);
                    if (nodesInCol.length === 0) return null;

                    const colLabel = nodesInCol[0].roundLabel;

                    return (
                      <div 
                        key={depth} 
                        className="w-48 relative z-10" 
                        style={{ 
                          display: 'grid', 
                          gridTemplateRows: `repeat(${baseSize * 2}, 1fr)`,
                          height: totalHeight,
                          marginTop: 48
                        }}
                      >
                         <div className="absolute -top-10 left-0 right-0 text-center text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] pointer-events-none">
                           {colLabel}
                         </div>
                         {nodesInCol.map(node => {
                            const isNodeHighlighted = highlightedNodes.has(node.id);
                            const hasErrorHome = showErrors && node.homeSourceType === "INITIAL" && !node.homeTeamId;
                            const hasErrorAway = showErrors && node.awaySourceType === "INITIAL" && !node.awayTeamId;

                            return (
                               <div
                                 key={node.id}
                                 className={`relative bg-[#1A211D] rounded-lg overflow-hidden flex flex-col justify-center m-1 self-center h-[72px] transition-all duration-300 ${isNodeHighlighted ? 'shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.3)] border border-[var(--color-accent)]/50' : 'shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10'}`}
                                 style={{ gridRow: `${node.gridRowStart} / ${node.gridRowEnd}` }}
                                 onMouseEnter={() => setHoveredNodeId(node.id)}
                                 onMouseLeave={() => setHoveredNodeId(null)}
                               >
                                 <div 
                                 className={`px-3 flex-1 flex items-center border-b transition-colors ${dragOverSlot === `${node.id}-home` ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]' : !node.homeTeamId ? 'bg-black/30 border-dashed border-white/5' : 'border-white/5'} ${hasErrorHome ? 'border-red-500 bg-red-500/10' : ''}`}
                                 onDragOver={(e) => e.preventDefault()}
                                 onDragEnter={() => node.homeSourceType === "INITIAL" && setDragOverSlot(`${node.id}-home`)}
                                 onDragLeave={() => setDragOverSlot(null)}
                                 onDrop={(e) => { setDragOverSlot(null); if (node.homeSourceType === "INITIAL") handleDrop(e, node.id, "home"); }}
                               >
                                 {node.homeTeamId ? (
                                    <div 
                                      className="flex justify-between items-center group w-full cursor-grab active:cursor-grabbing"
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, node.homeTeamId!)}
                                    >
                                      <span className="font-medium text-white truncate text-sm" title={getTeamName(node.homeTeamId)}>
                                        {getTeamName(node.homeTeamId)}
                                      </span>
                                      <button type="button" onClick={() => updateMatch(node.id, "home", null)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-2 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                      </button>
                                    </div>
                                 ) : (
                                    <span className="text-white/30 italic text-[11px] w-full text-center tracking-wide pointer-events-none">
                                       {node.homeSourceType === "INITIAL" ? "Arrastrá equipo" : "Ganador llave previa"}
                                    </span>
                                 )}
                               </div>
                               <div 
                                 className={`px-3 flex-1 flex items-center border-t transition-colors ${dragOverSlot === `${node.id}-away` ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]' : !node.awayTeamId ? 'bg-black/30 border-dashed border-white/5' : 'border-transparent'} ${hasErrorAway ? 'border-red-500 bg-red-500/10' : ''}`}
                                 onDragOver={(e) => e.preventDefault()}
                                 onDragEnter={() => node.awaySourceType === "INITIAL" && setDragOverSlot(`${node.id}-away`)}
                                 onDragLeave={() => setDragOverSlot(null)}
                                 onDrop={(e) => { setDragOverSlot(null); if (node.awaySourceType === "INITIAL") handleDrop(e, node.id, "away"); }}
                               >
                                 {node.awayTeamId ? (
                                    <div 
                                      className="flex justify-between items-center group w-full cursor-grab active:cursor-grabbing"
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, node.awayTeamId!)}
                                    >
                                      <span className="font-medium text-white truncate text-sm" title={getTeamName(node.awayTeamId)}>
                                        {getTeamName(node.awayTeamId)}
                                      </span>
                                      <button type="button" onClick={() => updateMatch(node.id, "away", null)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-2 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                      </button>
                                    </div>
                                 ) : (
                                    <span className="text-white/30 italic text-[11px] w-full text-center tracking-wide pointer-events-none">
                                       {node.awaySourceType === "INITIAL" ? "Arrastrá equipo" : "Ganador llave previa"}
                                    </span>
                                 )}
                               </div>
                               </div>
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
      </div>
    </div>
  );
}
