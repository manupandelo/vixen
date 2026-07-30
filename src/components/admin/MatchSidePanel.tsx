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
  MatchResultClearDialog,
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
  clearResultAction: (prevState: ActionState) => Promise<ActionState>;
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
  clearResultAction,
  onClose,
  roundLabel,
}: MatchSidePanelProps) {
  const hasResult =
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null;
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
        <MatchResultForm
          key={`${match.id}-${match.homeScore}-${match.awayScore}-${match.status}`}
          action={updateResultAction}
          onSaved={onClose}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePenaltyScore={match.homePenaltyScore}
          awayPenaltyScore={match.awayPenaltyScore}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
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

      <div className="grid gap-2 border-t border-white/5 p-5 pb-8">
        <MatchEditDialog
          action={updateMatchAction}
          match={match}
          teams={teams}
        />
        {hasResult ? (
          <MatchResultClearDialog
            action={clearResultAction}
            roundLabel={roundLabel ?? match.roundLabel}
          />
        ) : null}
      </div>
    </AdminSheet>
  );
}
