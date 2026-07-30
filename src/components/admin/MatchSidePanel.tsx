"use client";

import type {
  AdminMatch,
  AdminTeam,
  MatchResultRosterEntry,
  StaffProfile,
} from "@/features/football-tournaments/data";
import { type ActionState } from "@/features/football-tournaments/actions";
import { AdminSheet } from "./AdminSheet";
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
    <AdminSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={roundLabel ?? match.roundLabel}
      description={
        match.scheduledAt
          ? new Date(match.scheduledAt).toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Sin fecha asignada"
      }
    >
      <div className="p-5">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Resultado
        </h4>
        <p className="mb-4 text-xs leading-5 text-[var(--color-muted)]">
          {homeTeamName} vs {awayTeamName}
        </p>
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
          matchEvents={match.events}
        />
      </div>

      <div className="border-t border-white/5 p-5">
        <MatchViewerAssignmentForm
          action={assignViewerAction}
          viewers={viewers}
          assignedViewerId={match.assignedViewerId}
        />
      </div>

      <div className="flex justify-center border-t border-white/5 p-5 pb-8">
        <MatchEditDialog
          action={updateMatchAction}
          match={match}
          teams={teams}
        />
      </div>
    </AdminSheet>
  );
}
