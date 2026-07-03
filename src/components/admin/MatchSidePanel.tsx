"use client";

import { X } from "lucide-react";
import type {
  AdminMatch,
  AdminTeam,
  MatchResultRosterEntry,
  StaffProfile,
} from "@/features/football-tournaments/data";
import { type ActionState } from "@/features/football-tournaments/actions";
import {
  MatchEditDialog,
  MatchResultForm,
  MatchViewerAssignmentForm,
} from "./AdminForms";

type MatchAction = (
  prevState: ActionState,
  payload: FormData,
) => Promise<ActionState>;

interface MatchSidePanelProps {
  match: AdminMatch;
  teams: Pick<AdminTeam, "id" | "name">[];
  viewers: StaffProfile[];
  rosterEntries: MatchResultRosterEntry[];
  isKnockout: boolean;
  updateResultAction: MatchAction;
  assignViewerAction: MatchAction;
  updateMatchAction: MatchAction;
  onClose: () => void;
  roundLabel?: string;
}

export function MatchSidePanel({
  match,
  teams,
  viewers,
  rosterEntries,
  isKnockout,
  updateResultAction,
  assignViewerAction,
  updateMatchAction,
  onClose,
  roundLabel,
}: MatchSidePanelProps) {
  const getTeamName = (id: string | null) => {
    if (!id) return "Por definirse";
    return teams.find((t) => t.id === id)?.name || "Por definirse";
  };

  const homeTeamName = getTeamName(match.homeTeamId);
  const awayTeamName = getTeamName(match.awayTeamId);

  return (
    <div className="w-full h-[600px] md:w-[360px] shrink-0 bg-[#0F1411] border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl relative z-20">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{roundLabel ?? match.roundLabel}</h3>
          <p className="text-xs text-white/50 mt-1">
            {match.scheduledAt 
              ? new Date(match.scheduledAt).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
              : "Sin fecha asignada"}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors p-2 -mr-2 bg-white/5 rounded-full"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5">
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] mb-3">Resultado</h4>
            <p className="mb-4 text-xs leading-5 text-[var(--color-muted)]">
              {homeTeamName} vs {awayTeamName}
            </p>
          </div>
          <MatchResultForm
            action={updateResultAction}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            homePenaltyScore={match.homePenaltyScore}
            awayPenaltyScore={match.awayPenaltyScore}
            homeTeamId={match.homeTeamId}
            awayTeamId={match.awayTeamId}
            isKnockout={isKnockout}
            rosterEntries={rosterEntries}
          />
        </div>

        <hr className="border-white/5 mx-5" />

        <div className="p-5">
          <MatchViewerAssignmentForm 
            action={assignViewerAction}
            viewers={viewers}
            assignedViewerId={match.assignedViewerId}
          />
        </div>

        <hr className="border-white/5 mx-5" />
        
        <div className="p-5 flex justify-center pb-8">
          <MatchEditDialog
            action={updateMatchAction}
            match={match}
            teams={teams}
          />
        </div>
      </div>
    </div>
  );
}
