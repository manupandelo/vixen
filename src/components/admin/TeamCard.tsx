"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Users } from "lucide-react";

import type { AdminTeam } from "@/features/football-tournaments/data";
import { AdminSheet } from "./AdminSheet";

type TeamCardProps = {
  team: AdminTeam;
  /**
   * El plantel llega ya renderizado desde el server component: no se pueden
   * cruzar funciones a un client component.
   */
  playerCount: number;
  rosterSlot: ReactNode;
  editSlot: ReactNode;
  removeSlot: ReactNode;
  rosterCreateSlot: ReactNode;
};

export function TeamCard({
  team,
  playerCount,
  rosterSlot,
  editSlot,
  removeSlot,
  rosterCreateSlot,
}: TeamCardProps) {
  const [rosterOpen, setRosterOpen] = useState(false);
  const playerLabel =
    playerCount === 1 ? "1 jugador" : `${playerCount} jugadores`;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#121212] p-4">
      <div className="flex min-w-0 items-center gap-3">
        {team.photoUrl ? (
          <Image
            src={team.photoUrl}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="size-12 shrink-0 rounded-[0.7rem] object-cover"
          />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-[0.7rem] border border-white/10 bg-white/[0.035] text-base font-semibold text-white">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {team.name}
          </h3>
          {team.shortName ? (
            <p className="truncate text-xs text-[var(--color-muted)]">
              {team.shortName}
            </p>
          ) : null}
        </div>
      </div>

      {/* Capitán y teléfono solo si existen: "Sin capitán" no aporta nada. */}
      {team.captainName || team.contactPhone ? (
        <dl className="grid gap-1 text-xs text-white/70">
          {team.captainName ? <dd>{team.captainName}</dd> : null}
          {team.contactPhone ? <dd>{team.contactPhone}</dd> : null}
        </dl>
      ) : null}

      <button
        type="button"
        onClick={() => setRosterOpen(true)}
        className="inline-flex min-h-11 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-sm font-semibold text-white/80 transition hover:border-[var(--color-accent)]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <span className="inline-flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Ver plantel
        </span>
        <span className="text-[var(--color-muted)]">{playerLabel}</span>
      </button>

      <div className="grid gap-2">
        {editSlot}
        {removeSlot}
      </div>

      <AdminSheet
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        title={`Plantel de ${team.name}`}
        description={playerLabel}
      >
        <div className="grid gap-3 p-5">
          {rosterCreateSlot}

          {playerCount > 0 ? (
            <div className="grid gap-2">{rosterSlot}</div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Sin jugadores cargados.
            </p>
          )}
        </div>
      </AdminSheet>
    </article>
  );
}
