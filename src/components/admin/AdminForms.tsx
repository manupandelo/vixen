"use client";

import { useActionState } from "react";

import type { ActionState } from "@/features/football-tournaments/actions";
import type {
  AdminTeam,
  AdminTournament,
} from "@/features/football-tournaments/data";
import {
  footballMatchStatuses,
  footballTournamentStatuses,
  type FootballMatchStatus,
  type FootballTournamentStatus,
} from "@/features/football-tournaments/types";

type TournamentFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type TeamFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type MatchFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type TournamentFormProps = {
  action: TournamentFormAction;
  tournament?: AdminTournament;
  submitLabel: string;
};

type TeamFormProps = {
  action: TeamFormAction;
};

type MatchFormProps = {
  action: MatchFormAction;
  teams: Pick<AdminTeam, "id" | "name">[];
};

const initialState: ActionState = {
  ok: false,
  message: "",
};

const statusLabels: Record<FootballTournamentStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
};

const matchStatusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  postponed: "Postergado",
  cancelled: "Cancelado",
};

const inputClass =
  "min-h-11 rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-white/30 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]/70";

export function TournamentForm({
  action,
  tournament,
  submitLabel,
}: TournamentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Nombre</span>
          <input
            name="name"
            defaultValue={tournament?.name ?? ""}
            required
            className={inputClass}
            placeholder="Apertura Vixen"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Slug</span>
          <input
            name="slug"
            defaultValue={tournament?.slug ?? ""}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={inputClass}
            placeholder="apertura-vixen"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className={labelClass}>Temporada</span>
          <input
            name="season"
            defaultValue={tournament?.season ?? ""}
            required
            className={inputClass}
            placeholder="2026"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Categoría</span>
          <input
            name="category"
            defaultValue={tournament?.category ?? ""}
            required
            className={inputClass}
            placeholder="Libre"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Estado</span>
          <select
            name="status"
            defaultValue={tournament?.status ?? "draft"}
            className={inputClass}
          >
            {footballTournamentStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Inicio</span>
          <input
            name="startsAt"
            type="date"
            defaultValue={tournament?.startsAt ?? ""}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Fin</span>
          <input
            name="endsAt"
            type="date"
            defaultValue={tournament?.endsAt ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className={labelClass}>Descripción</span>
        <textarea
          name="description"
          defaultValue={tournament?.description ?? ""}
          rows={4}
          className={`${inputClass} resize-y py-3 leading-6`}
          placeholder="Notas visibles del torneo"
        />
      </label>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-[0.8rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-white/86"
              : "rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-4 py-3 text-sm text-white/86"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-fit"
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export function TeamForm({ action }: TeamFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr]">
        <label className="grid gap-2">
          <span className={labelClass}>Nombre</span>
          <input
            name="name"
            required
            className={inputClass}
            placeholder="Deportivo Vixen"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Nombre corto</span>
          <input name="shortName" className={inputClass} placeholder="DVX" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Capitán</span>
          <input
            name="captainName"
            className={inputClass}
            placeholder="Nombre del responsable"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Teléfono</span>
          <input
            name="contactPhone"
            className={inputClass}
            placeholder="+54 9 11 5555-1212"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className={labelClass}>Notas privadas</span>
        <textarea
          name="notes"
          rows={4}
          className={`${inputClass} resize-y py-3 leading-6`}
          placeholder="Información interna del equipo"
        />
      </label>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-[0.8rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-white/86"
              : "rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-4 py-3 text-sm text-white/86"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-fit"
      >
        {isPending ? "Guardando..." : "Crear equipo"}
      </button>
    </form>
  );
}

export function MatchForm({ action, teams }: MatchFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const hasEnoughTeams = teams.length >= 2;

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr]">
        <label className="grid gap-2">
          <span className={labelClass}>Ronda</span>
          <input
            name="roundLabel"
            required
            className={inputClass}
            placeholder="Fecha 1"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Día y hora</span>
          <input name="scheduledAt" type="datetime-local" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Estado</span>
          <select name="status" defaultValue="scheduled" className={inputClass}>
            {footballMatchStatuses.map((status) => (
              <option key={status} value={status}>
                {matchStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Local</span>
          <select
            name="homeTeamId"
            required
            className={inputClass}
            defaultValue=""
            disabled={!hasEnoughTeams}
          >
            <option value="" disabled>
              Elegí local
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Visitante</span>
          <select
            name="awayTeamId"
            required
            className={inputClass}
            defaultValue=""
            disabled={!hasEnoughTeams}
          >
            <option value="" disabled>
              Elegí visitante
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Goles local</span>
          <input
            name="homeScore"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={inputClass}
            placeholder="0"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Goles visitante</span>
          <input
            name="awayScore"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={inputClass}
            placeholder="0"
          />
        </label>
      </div>

      {!hasEnoughTeams ? (
        <p className="rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-4 py-3 text-sm text-white/70">
          Cargá al menos dos equipos antes de crear partidos.
        </p>
      ) : null}

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-[0.8rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-white/86"
              : "rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-4 py-3 text-sm text-white/86"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !hasEnoughTeams}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-fit"
      >
        {isPending ? "Guardando..." : "Crear partido"}
      </button>
    </form>
  );
}
