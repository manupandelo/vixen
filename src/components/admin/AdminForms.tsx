"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import {
  CalendarDays,
  CheckCircle2,
  CalendarPlus,
  ListChecks,
  Pencil,
  Plus,
  Minus,
  Trash2,
  Trophy,
  Settings,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { InteractiveBracketBuilder } from "@/components/admin/InteractiveBracketBuilder";
import { type MatchNode } from "@/lib/tree-generator";
import { useActionToast } from "@/components/admin/AdminToast";
import type { ActionState } from "@/features/football-tournaments/actions";
import {
  buildGroupPlayoffFixture,
  buildLeagueFixture,
} from "@/features/football-tournaments/fixture";
import type {
  AdminMatch,
  AdminPlayer,
  AdminRosterEntry,
  AdminTeam,
  AdminTournament,
  MatchResultRosterEntry,
  StaffProfile,
} from "@/features/football-tournaments/data";
import {
  footballFormLimits,
  teamPhotoMaxBytes,
  teamPhotoMaxLabel,
} from "@/features/football-tournaments/limits";
import {
  footballMatchStatuses,
  footballDocumentationStatuses,
  footballDocumentationStatusLabels,
  footballRosterEntryStatuses,
  footballRosterEntryStatusLabels,
  footballTournamentFormatLabels,
  footballTournamentFormats,
  footballTournamentStatuses,
  type FootballDocumentationStatus,
  type FootballMatchStatus,
  type FootballRosterEntryStatus,
  type FootballTournamentFormat,
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

type MatchAdminAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type FixtureGeneratorAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type DeleteTournamentAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export type TournamentFormProps = {
  action: TournamentFormAction;
  tournament?: AdminTournament;
  submitLabel?: string;
  onSuccess?: () => void;
  layout?: "standard" | "stepped";
};

type TournamentWizardValues = {
  name: string;
  category: string;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  startsAt: string;
  endsAt: string;
  description: string;
};

type TournamentWizardStep = {
  title: string;
  description: string;
};

type TeamFormProps = {
  action: TeamFormAction;
  availableTeams?: Pick<AdminTeam, "id" | "name" | "shortName">[];
  onSuccess?: () => void;
  team?: AdminTeam;
  submitLabel?: string;
};

type TeamCreatePanelProps = TeamFormProps;

type TeamEditDialogProps = {
  action: TeamFormAction;
  team: AdminTeam;
};

type TeamRemoveDialogProps = {
  action: TeamFormAction;
  teamName: string;
};

type RosterEntryFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type RosterEntryFormProps = {
  action: RosterEntryFormAction;
  availablePlayers?: AdminPlayer[];
  onSuccess?: () => void;
  rosterEntry?: AdminRosterEntry;
  submitLabel?: string;
};

type RosterEntryCreateDialogProps = {
  action: RosterEntryFormAction;
  availablePlayers: AdminPlayer[];
  teamName: string;
};

type RosterEntryEditDialogProps = {
  action: RosterEntryFormAction;
  rosterEntry: AdminRosterEntry;
};

type RosterEntryRemoveDialogProps = {
  action: RosterEntryFormAction;
  playerName: string;
};

type MatchFormProps = {
  action: MatchFormAction;
  teams: Pick<AdminTeam, "id" | "name">[];
  match?: AdminMatch;
  submitLabel?: string;
  onSuccess?: () => void;
};

type MatchCreateDialogProps = MatchFormProps;

type MatchEditDialogProps = {
  action: MatchFormAction;
  match: AdminMatch;
  teams: Pick<AdminTeam, "id" | "name">[];
};

type MatchDeleteDialogProps = {
  action: MatchAdminAction;
  matchLabel: string;
};

type FixtureGeneratorDialogProps = {
  action: FixtureGeneratorAction;
  teams: Pick<AdminTeam, "id" | "name">[];
};

type FixtureGeneratorState = {
  legs: "1" | "2";
  startsAt: string;
  kickoffTime: string;
  daysBetweenRounds: string;
};

type FixtureGeneratorField = keyof FixtureGeneratorState;

const initialFixtureGeneratorState: FixtureGeneratorState = {
  legs: "1",
  startsAt: "",
  kickoffTime: "",
  daysBetweenRounds: "7",
};

function fixtureGeneratorReducer(
  state: FixtureGeneratorState,
  action: { field: FixtureGeneratorField; value: string },
): FixtureGeneratorState {
  if (action.field === "legs") {
    return { ...state, legs: action.value === "2" ? "2" : "1" };
  }

  return {
    ...state,
    [action.field]: action.value,
  };
}

type MatchViewerAssignmentFormProps = {
  action: MatchAdminAction;
  viewers: Pick<StaffProfile, "id" | "email">[];
  assignedViewerId: string | null;
};

type MatchResultFormProps = {
  action: MatchAdminAction;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  isKnockout?: boolean;
  rosterEntries?: MatchResultRosterEntry[];
  submitLabel?: string;
};

type DeleteTournamentFormProps = {
  action: DeleteTournamentAction;
  tournamentName: string;
};

const initialState: ActionState = {
  ok: false,
  message: "",
};

const EMPTY_AVAILABLE_TEAMS: Pick<AdminTeam, "id" | "name" | "shortName">[] =
  [];
const EMPTY_AVAILABLE_PLAYERS: AdminPlayer[] = [];

const tournamentWizardSteps: TournamentWizardStep[] = [
  {
    title: "Nombre",
    description: "Usá el nombre que el club reconoce para este torneo.",
  },
  {
    title: "Formato",
    description: "Definí si se juega como liga, copa o liga con playoff.",
  },
  {
    title: "Fechas",
    description: "Indicá entre qué fechas se juega el torneo.",
  },
  {
    title: "Publicación",
    description: "Dejá el torneo como borrador hasta terminar la carga.",
  },
];

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
  "min-h-11 rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-3 text-sm text-white caret-white outline-none transition placeholder:text-white/34 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 [&>option]:bg-[var(--color-surface)] [&>option]:text-white";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]/70";

const compactButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

const dangerCompactButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--color-warm)]/18 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

const primaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-fit";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

const formatDescriptions: Record<FootballTournamentFormat, string> = {
  league: "Todos contra todos. La tabla ordena el torneo.",
  cup: "Llaves o eliminación directa. Ideal para torneos cortos.",
  league_playoff: "Zonas de fase regular y definición por playoffs.",
};

function isOverLimit(value: string, max: number) {
  return value.length > max;
}

function CharacterCounter({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  const isInvalid = isOverLimit(value, max);

  return (
    <span
      className={
        isInvalid
          ? "text-xs font-semibold text-[var(--color-warm)]"
          : "text-xs font-semibold text-white/42"
      }
      aria-live="polite"
    >
      {value.length}/{max}
    </span>
  );
}

function FieldLabel({
  children,
  value,
  max,
}: {
  children: ReactNode;
  value: string;
  max: number;
}) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span className={labelClass}>{children}</span>
      <CharacterCounter value={value} max={max} />
    </span>
  );
}

function TournamentStepHeader({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-start">
      <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 text-sm font-semibold text-[var(--color-accent)]">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function TournamentSection({
  children,
  isStepped,
}: {
  children: ReactNode;
  isStepped: boolean;
}) {
  return (
    <section
      className={
        isStepped
          ? "grid gap-5 border-t border-white/10 pt-6 first:border-t-0 first:pt-0"
          : "grid gap-4"
      }
    >
      {children}
    </section>
  );
}

function TournamentIdentityStep({
  setWizardValues,
  wizardValues,
}: {
  setWizardValues: Dispatch<SetStateAction<TournamentWizardValues>>;
  wizardValues: TournamentWizardValues;
}) {
  return (
    <div className="grid gap-5">
      <label className="grid gap-2">
        <FieldLabel
          value={wizardValues.name}
          max={footballFormLimits.tournamentName}
        >
          Nombre del torneo
        </FieldLabel>
        <input
          aria-label="Nombre del torneo"
          value={wizardValues.name}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          required
          className={`${inputClass} min-h-14 text-base`}
          placeholder="Apertura Vixen"
        />
      </label>

      <label className="grid gap-2">
        <FieldLabel
          value={wizardValues.category}
          max={footballFormLimits.tournamentCategory}
        >
          Categoría
        </FieldLabel>
        <input
          aria-label="Categoría"
          value={wizardValues.category}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              category: event.target.value,
            }))
          }
          className={`${inputClass} min-h-14 text-base`}
          placeholder="Libre"
        />
      </label>
    </div>
  );
}

function TournamentFormatStep({
  setWizardValues,
  wizardValues,
}: {
  setWizardValues: Dispatch<SetStateAction<TournamentWizardValues>>;
  wizardValues: TournamentWizardValues;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold text-white">Elegí el formato</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          Esto define cómo se interpreta la competencia y qué espera ver el
          administrador al cargar partidos.
        </p>
      </div>

      <div className="grid gap-3">
        {footballTournamentFormats.map((format) => {
          const isSelected = wizardValues.format === format;

          return (
            <button
              key={format}
              type="button"
              aria-label={footballTournamentFormatLabels[format]}
              aria-pressed={isSelected}
              onClick={() =>
                setWizardValues((current) => ({
                  ...current,
                  format,
                }))
              }
              className={
                isSelected
                  ? "grid gap-2 rounded-[0.95rem] border border-[var(--color-accent)] bg-[var(--color-accent)]/10 p-4 text-left"
                  : "grid gap-2 rounded-[0.95rem] border border-white/10 bg-black/14 p-4 text-left transition hover:border-[var(--color-accent)]/55 hover:bg-white/[0.04]"
              }
            >
              <span className="text-base font-semibold text-white">
                {footballTournamentFormatLabels[format]}
              </span>
              <span className="text-sm leading-6 text-[var(--color-muted)]">
                {formatDescriptions[format]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TournamentDatesStep({
  setWizardValues,
  wizardValues,
}: {
  setWizardValues: Dispatch<SetStateAction<TournamentWizardValues>>;
  wizardValues: TournamentWizardValues;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2">
        <span className={labelClass}>Fecha de inicio</span>
        <input
          type="date"
          value={wizardValues.startsAt}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              startsAt: event.target.value,
            }))
          }
          required
          className={`${inputClass} min-h-14 text-base`}
        />
      </label>

      <label className="grid gap-2">
        <span className={labelClass}>Fecha de fin</span>
        <input
          type="date"
          value={wizardValues.endsAt}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              endsAt: event.target.value,
            }))
          }
          required
          className={`${inputClass} min-h-14 text-base`}
        />
      </label>
    </div>
  );
}

function TournamentPublishStep({
  isFinalConfirmed,
  setIsFinalConfirmed,
  setWizardValues,
  wizardValues,
}: {
  isFinalConfirmed: boolean;
  setIsFinalConfirmed: Dispatch<SetStateAction<boolean>>;
  setWizardValues: Dispatch<SetStateAction<TournamentWizardValues>>;
  wizardValues: TournamentWizardValues;
}) {
  return (
    <div className="grid gap-5">
      <label className="grid gap-2">
        <span className={labelClass}>Estado</span>
        <select
          value={wizardValues.status}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              status: event.target.value as FootballTournamentStatus,
            }))
          }
          className={`${inputClass} min-h-14 text-base`}
        >
          {footballTournamentStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <FieldLabel
          value={wizardValues.description}
          max={footballFormLimits.tournamentDescription}
        >
          Descripción opcional
        </FieldLabel>
        <textarea
          aria-label="Descripción opcional"
          value={wizardValues.description}
          onChange={(event) =>
            setWizardValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={6}
          className={`${inputClass} resize-y py-3 text-base leading-7`}
          placeholder="Notas visibles del torneo"
        />
      </label>

      <label className="flex items-start gap-3 rounded-[0.85rem] border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/78">
        <input
          type="checkbox"
          checked={isFinalConfirmed}
          onChange={(event) => setIsFinalConfirmed(event.target.checked)}
          className="mt-1 size-4 accent-[var(--color-accent)]"
        />
        <span>Confirmo que quiero crear este torneo</span>
      </label>
    </div>
  );
}

function TournamentSteppedForm({
  canContinue,
  formAction,
  isFinalConfirmed,
  isPending,
  setIsFinalConfirmed,
  setStep,
  setWizardValues,
  step,
  submitLabel,
  wizardValues,
}: {
  canContinue: boolean;
  formAction: (formData: FormData) => void;
  isFinalConfirmed: boolean;
  isPending: boolean;
  setIsFinalConfirmed: Dispatch<SetStateAction<boolean>>;
  setStep: Dispatch<SetStateAction<number>>;
  setWizardValues: Dispatch<SetStateAction<TournamentWizardValues>>;
  step: number;
  submitLabel: string;
  wizardValues: TournamentWizardValues;
}) {
  const currentStep = tournamentWizardSteps[step];
  const progressValue = ((step + 1) / tournamentWizardSteps.length) * 100;

  return (
    <form
      action={formAction}
      className="rounded-[1.15rem] border border-white/10 bg-[#111612] p-5 shadow-[0_22px_80px_rgb(0_0_0_/_0.24)] sm:p-7"
    >
      <input type="hidden" name="name" value={wizardValues.name} />
      <input type="hidden" name="category" value={wizardValues.category} />
      <input type="hidden" name="format" value={wizardValues.format} />
      <input type="hidden" name="status" value={wizardValues.status} />
      <input type="hidden" name="startsAt" value={wizardValues.startsAt} />
      <input type="hidden" name="endsAt" value={wizardValues.endsAt} />
      <input type="hidden" name="description" value={wizardValues.description} />

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-accent)]">
                Paso {step + 1} de {tournamentWizardSteps.length}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {currentStep.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              {tournamentWizardSteps.map((item, index) => (
                <span
                  key={item.title}
                  className={
                    index === step
                      ? "inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[#07110a]"
                      : index < step
                        ? "inline-flex size-8 items-center justify-center rounded-full border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/44"
                  }
                >
                  {index < step ? <CheckCircle2 size={16} /> : index + 1}
                </span>
              ))}
            </div>
          </div>

          <Progress.Root
            value={progressValue}
            className="h-2 overflow-hidden rounded-full bg-white/10"
          >
            <Progress.Indicator
              className="h-full rounded-full bg-[var(--color-accent)] transition-transform duration-300"
              style={{ transform: `translateX(-${100 - progressValue}%)` }}
            />
          </Progress.Root>
        </div>

        <section className="min-h-[24rem] rounded-[1rem] border border-white/10 bg-black/18 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              {step === 0 ? (
                <Trophy size={20} />
              ) : step === 1 ? (
                <ListChecks size={20} />
              ) : step === 2 ? (
                <CalendarDays size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </span>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {step === 1 ? "Formato del torneo" : currentStep.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                {currentStep.description}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            {step === 0 ? (
              <TournamentIdentityStep
                setWizardValues={setWizardValues}
                wizardValues={wizardValues}
              />
            ) : null}
            {step === 1 ? (
              <TournamentFormatStep
                setWizardValues={setWizardValues}
                wizardValues={wizardValues}
              />
            ) : null}
            {step === 2 ? (
              <TournamentDatesStep
                setWizardValues={setWizardValues}
                wizardValues={wizardValues}
              />
            ) : null}
            {step === 3 ? (
              <TournamentPublishStep
                isFinalConfirmed={isFinalConfirmed}
                setIsFinalConfirmed={setIsFinalConfirmed}
                setWizardValues={setWizardValues}
                wizardValues={wizardValues}
              />
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                className={secondaryButtonClass}
              >
                Volver
              </button>
            ) : null}

            {step < tournamentWizardSteps.length - 1 ? (
              <button
                type="button"
                disabled={!canContinue}
                onClick={() =>
                  setStep((current) =>
                    Math.min(tournamentWizardSteps.length - 1, current + 1),
                  )
                }
                className={primaryButtonClass}
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending || !canContinue || !isFinalConfirmed}
                className={primaryButtonClass}
              >
                {isPending ? "Guardando..." : submitLabel}
              </button>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

export function TournamentForm({
  action,
  tournament,
  submitLabel = "Crear torneo",
  onSuccess,
  layout = "standard",
}: TournamentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state, { onSuccess });

  const isStepped = layout === "stepped";
  const [step, setStep] = useState(0);
  const [isFinalConfirmed, setIsFinalConfirmed] = useState(false);
  const [wizardValues, setWizardValues] = useState<TournamentWizardValues>({
    name: tournament?.name ?? "",
    category: tournament?.category ?? "Libre",
    format: tournament?.format ?? "league",
    status: tournament?.status ?? "draft",
    startsAt: tournament?.startsAt ?? "",
    endsAt: tournament?.endsAt ?? "",
    description: tournament?.description ?? "",
  });
  const hasValidDateRange =
    Boolean(wizardValues.startsAt && wizardValues.endsAt) &&
    wizardValues.startsAt <= wizardValues.endsAt;
  const hasValidTournamentName =
    wizardValues.name.trim().length >= 2 &&
    !isOverLimit(wizardValues.name, footballFormLimits.tournamentName);
  const hasValidTournamentCategory = !isOverLimit(
    wizardValues.category,
    footballFormLimits.tournamentCategory,
  );
  const hasValidTournamentDescription = !isOverLimit(
    wizardValues.description,
    footballFormLimits.tournamentDescription,
  );
  const canContinue =
    (step === 0 && hasValidTournamentName && hasValidTournamentCategory) ||
    step === 1 ||
    (step === 2 && hasValidDateRange) ||
    (step === 3 && hasValidTournamentDescription);

  if (isStepped) {
    return (
      <TournamentSteppedForm
        canContinue={canContinue}
        formAction={formAction}
        isFinalConfirmed={isFinalConfirmed}
        isPending={isPending}
        setIsFinalConfirmed={setIsFinalConfirmed}
        setStep={setStep}
        setWizardValues={setWizardValues}
        step={step}
        submitLabel={submitLabel}
        wizardValues={wizardValues}
      />
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <TournamentSection isStepped={isStepped}>
        <div className="grid gap-4">
          <label className="grid gap-2">
            <FieldLabel
              value={wizardValues.name}
              max={footballFormLimits.tournamentName}
            >
              Nombre
            </FieldLabel>
            <input
              name="name"
              aria-label="Nombre"
              value={wizardValues.name}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              className={inputClass}
              placeholder="Apertura Vixen"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel
              value={wizardValues.category}
              max={footballFormLimits.tournamentCategory}
            >
              Categoría
            </FieldLabel>
            <input
              name="category"
              aria-label="Categoría"
              value={wizardValues.category}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              required
              className={inputClass}
              placeholder="Libre"
            />
          </label>
        </div>
      </TournamentSection>

      <TournamentSection isStepped={isStepped}>
        {isStepped ? (
          <TournamentStepHeader
            number={2}
            title="Formato y publicación"
            description="Elegí cómo se compite y si el torneo ya puede aparecer en la página pública."
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Formato</span>
            <select
              name="format"
              value={wizardValues.format}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  format: event.target.value as FootballTournamentFormat,
                }))
              }
              className={inputClass}
            >
              {footballTournamentFormats.map((format) => (
                <option key={format} value={format}>
                  {footballTournamentFormatLabels[format]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Estado</span>
            <select
              name="status"
              value={wizardValues.status}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  status: event.target.value as FootballTournamentStatus,
                }))
              }
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
      </TournamentSection>

      <TournamentSection isStepped={isStepped}>
        {isStepped ? (
          <TournamentStepHeader
            number={3}
            title="Fechas y descripción"
            description="Completá el rango visible y una nota breve para la página de fútbol."
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Inicio</span>
            <input
              name="startsAt"
              type="date"
              value={wizardValues.startsAt}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
              className={inputClass}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Fin</span>
            <input
              name="endsAt"
              type="date"
              value={wizardValues.endsAt}
              onChange={(event) =>
                setWizardValues((current) => ({
                  ...current,
                  endsAt: event.target.value,
                }))
              }
              className={inputClass}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <FieldLabel
            value={wizardValues.description}
            max={footballFormLimits.tournamentDescription}
          >
            Descripción
          </FieldLabel>
          <textarea
            name="description"
            aria-label="Descripción"
            value={wizardValues.description}
            onChange={(event) =>
              setWizardValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            className={`${inputClass} resize-y py-3 leading-6`}
            placeholder="Notas visibles del torneo"
          />
        </label>
      </TournamentSection>

      <button
        type="submit"
        disabled={
          isPending ||
          !hasValidTournamentName ||
          !hasValidTournamentCategory ||
          !hasValidTournamentDescription
        }
        className={primaryButtonClass}
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export function TeamForm({
  action,
  availableTeams = EMPTY_AVAILABLE_TEAMS,
  onSuccess,
  team,
  submitLabel,
}: TeamFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = Boolean(team);
  const [existingTeamId, setExistingTeamId] = useState("");
  const [teamValues, setTeamValues] = useState({
    name: team?.name ?? "",
    shortName: team?.shortName ?? "",
    captainName: team?.captainName ?? "",
    contactPhone: team?.contactPhone ?? "",
    notes: team?.notes ?? "",
  });
  const [teamPhotoError, setTeamPhotoError] = useState("");
  const isUsingExistingTeam = existingTeamId.length > 0;
  const hasInvalidTeamText =
    isOverLimit(teamValues.name, footballFormLimits.teamName) ||
    isOverLimit(teamValues.shortName, footballFormLimits.teamShortName) ||
    isOverLimit(teamValues.captainName, footballFormLimits.teamCaptainName) ||
    isOverLimit(teamValues.contactPhone, footballFormLimits.teamContactPhone) ||
    isOverLimit(teamValues.notes, footballFormLimits.teamNotes);
  const canSubmitTeam =
    isUsingExistingTeam ||
    (teamValues.name.trim().length >= 2 &&
      !hasInvalidTeamText &&
      teamPhotoError.length === 0);

  useActionToast(state, {
    onSuccess: () => {
      if (!isEditing) {
        setExistingTeamId("");
        setTeamValues({
          name: "",
          shortName: "",
          captainName: "",
          contactPhone: "",
          notes: "",
        });
        setTeamPhotoError("");
      }
      onSuccess?.();
    },
  });

  function updateTeamValue(field: keyof typeof teamValues, value: string) {
    setTeamValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form action={formAction} className="grid gap-5">
      {!isEditing && availableTeams.length > 0 ? (
        <label className="grid gap-2">
          <span className={labelClass}>Usar equipo existente</span>
          <select
            name="existingTeamId"
            value={existingTeamId}
            onChange={(event) => {
              setExistingTeamId(event.target.value);
              setTeamPhotoError("");
            }}
            className={inputClass}
          >
            <option value="">Crear un equipo nuevo</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.shortName ? ` (${team.shortName})` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="existingTeamId" value="" />
      )}

      {isUsingExistingTeam ? (
        <p className="rounded-[0.85rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm leading-6 text-white/82">
          El equipo se va a sumar a este torneo usando sus datos ya guardados.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr]">
            <label className="grid gap-2">
              <FieldLabel
                value={teamValues.name}
                max={footballFormLimits.teamName}
              >
                Nombre
              </FieldLabel>
              <input
                name="name"
                aria-label="Nombre"
                value={teamValues.name}
                onChange={(event) =>
                  updateTeamValue("name", event.target.value)
                }
                required
                className={inputClass}
                placeholder="Deportivo Vixen"
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel
                value={teamValues.shortName}
                max={footballFormLimits.teamShortName}
              >
                Nombre corto
              </FieldLabel>
              <input
                name="shortName"
                aria-label="Nombre corto"
                value={teamValues.shortName}
                onChange={(event) =>
                  updateTeamValue("shortName", event.target.value)
                }
                className={inputClass}
                placeholder="DVX"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel
                value={teamValues.captainName}
                max={footballFormLimits.teamCaptainName}
              >
                Capitán
              </FieldLabel>
              <input
                name="captainName"
                aria-label="Capitán"
                value={teamValues.captainName}
                onChange={(event) =>
                  updateTeamValue("captainName", event.target.value)
                }
                className={inputClass}
                placeholder="Nombre del responsable"
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel
                value={teamValues.contactPhone}
                max={footballFormLimits.teamContactPhone}
              >
                Teléfono
              </FieldLabel>
              <input
                name="contactPhone"
                aria-label="Teléfono"
                value={teamValues.contactPhone}
                onChange={(event) =>
                  updateTeamValue("contactPhone", event.target.value)
                }
                className={inputClass}
                placeholder="+54 9 11 5555-1212"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={labelClass}>
              {isEditing ? "Nueva foto del equipo" : "Foto del equipo"}
            </span>
            <input
              name="teamPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setTeamPhotoError(
                  file && file.size > teamPhotoMaxBytes
                    ? `La imagen no puede superar ${teamPhotoMaxLabel}.`
                    : "",
                );
              }}
              className={`${inputClass} file:mr-3 file:rounded-[0.65rem] file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white`}
            />
          </label>

          <label className="grid gap-2">
            <FieldLabel
              value={teamValues.notes}
              max={footballFormLimits.teamNotes}
            >
              Notas privadas
            </FieldLabel>
            <textarea
              name="notes"
              aria-label="Notas privadas"
              value={teamValues.notes}
              onChange={(event) =>
                updateTeamValue("notes", event.target.value)
              }
              rows={4}
              className={`${inputClass} resize-y py-3 leading-6`}
              placeholder="Información interna del equipo"
            />
          </label>
        </>
      )}

      {teamPhotoError ? (
        <p
          className="rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-4 py-3 text-sm text-white/86"
          aria-live="polite"
        >
          {teamPhotoError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSubmitTeam}
        className={primaryButtonClass}
      >
        {isPending
          ? "Guardando..."
          : submitLabel ??
            (isUsingExistingTeam
              ? "Agregar al torneo"
              : isEditing
                ? "Guardar equipo"
                : "Crear equipo")}
      </button>
    </form>
  );
}

export function DeleteTournamentForm({
  action,
  tournamentName,
}: DeleteTournamentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim() === tournamentName.trim();
  useActionToast(state);

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.8rem] border border-[var(--color-warm)]/45 bg-[var(--color-warm)]/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          <Trash2 size={16} aria-hidden="true" />
          Eliminar torneo
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <div>
            <AlertDialog.Title className="text-2xl font-semibold text-white">
              Eliminar torneo
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Se borran el torneo, sus equipos, partidos y datos relacionados.
              Las fotos subidas quedan guardadas en Supabase Storage.
            </AlertDialog.Description>
          </div>

          <form action={formAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Escribí el nombre para confirmar</span>
              <input
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClass}
                placeholder={tournamentName}
                autoComplete="off"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                type="submit"
                disabled={isPending || !canDelete}
                className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-[var(--color-warm)]/50 bg-[var(--color-warm)]/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/26 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
              >
                {isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function TeamCreatePanel({
  action,
  availableTeams = EMPTY_AVAILABLE_TEAMS,
}: TeamCreatePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`${primaryButtonClass} gap-2`}>
          <Plus size={17} aria-hidden="true" />
          Agregar equipo
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Agregar equipo
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Usá un equipo ya guardado o cargá uno nuevo con su información de
            coordinación.
          </Dialog.Description>
          <div className="mt-6">
            <TeamForm
              action={action}
              availableTeams={availableTeams}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TeamEditDialog({ action, team }: TeamEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={compactButtonClass}>
          <Pencil size={14} aria-hidden="true" />
          Editar equipo
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Editar equipo
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Actualizá los datos públicos y la información privada de
            coordinación.
          </Dialog.Description>
          <div className="mt-6">
            <TeamForm
              action={action}
              team={team}
              submitLabel="Guardar equipo"
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TeamRemoveDialog({
  action,
  teamName,
}: TeamRemoveDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const canRemove = confirmation.trim() === teamName.trim();

  useActionToast(state, {
    onSuccess: () => {
      setOpen(false);
      setConfirmation("");
    },
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button type="button" className={dangerCompactButtonClass}>
          <Trash2 size={14} aria-hidden="true" />
          Quitar del torneo
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[1rem] border border-[var(--color-warm)]/35 bg-[#17100d] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <div>
            <AlertDialog.Title className="text-2xl font-semibold text-white">
              Quitar equipo
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-white/68">
              Se quita de este torneo, pero el equipo queda guardado para usarlo
              en otros torneos. No se puede quitar si ya tiene partidos
              cargados.
            </AlertDialog.Description>
          </div>

          <form action={formAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Escribí el equipo para confirmar</span>
              <input
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClass}
                placeholder={teamName}
                autoComplete="off"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                type="submit"
                disabled={isPending || !canRemove}
                className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-[var(--color-warm)]/50 bg-[var(--color-warm)]/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/26 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
              >
                {isPending ? "Quitando..." : "Quitar definitivamente"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function getPlayerDisplayName(player: AdminPlayer) {
  const displayName =
    player.publicName ?? `${player.firstName} ${player.lastName}`.trim();

  return displayName || "Jugador sin nombre";
}

function RosterEntryForm({
  action,
  availablePlayers = EMPTY_AVAILABLE_PLAYERS,
  onSuccess,
  rosterEntry,
  submitLabel,
}: RosterEntryFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = Boolean(rosterEntry);
  const [mode, setMode] = useState<"new" | "existing">(
    availablePlayers.length > 0 ? "existing" : "new",
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [playerNotes, setPlayerNotes] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    availablePlayers[0]?.id ?? "",
  );
  const [shirtNumber, setShirtNumber] = useState(
    rosterEntry?.shirtNumber === null || rosterEntry?.shirtNumber === undefined
      ? ""
      : String(rosterEntry.shirtNumber),
  );
  const [status, setStatus] = useState<FootballRosterEntryStatus>(
    rosterEntry?.status ?? "active",
  );
  const [medicalStatus, setMedicalStatus] =
    useState<FootballDocumentationStatus>(
      rosterEntry?.medicalStatus ?? "pending",
    );
  const [insuranceStatus, setInsuranceStatus] =
    useState<FootballDocumentationStatus>(
      rosterEntry?.insuranceStatus ?? "pending",
    );
  const [rosterNotes, setRosterNotes] = useState(rosterEntry?.notes ?? "");
  const canSubmit =
    isEditing ||
    (mode === "existing"
      ? Boolean(selectedPlayerId)
      : firstName.trim().length >= 2 && lastName.trim().length >= 2);

  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-5">
      {!isEditing ? (
        <section className="grid gap-4">
          <input type="hidden" name="mode" value={mode} />
          <div className="grid gap-2">
            <span className={labelClass}>Jugador</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "existing"}
                onClick={() => setMode("existing")}
                disabled={availablePlayers.length === 0}
                className={
                  mode === "existing"
                    ? "rounded-[0.8rem] border border-[var(--color-accent)] bg-[var(--color-accent)]/12 px-4 py-3 text-left text-sm font-semibold text-white"
                    : "rounded-[0.8rem] border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm font-semibold text-white/68 transition hover:border-[var(--color-accent)]/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                }
              >
                Existente
              </button>
              <button
                type="button"
                aria-pressed={mode === "new"}
                onClick={() => setMode("new")}
                className={
                  mode === "new"
                    ? "rounded-[0.8rem] border border-[var(--color-accent)] bg-[var(--color-accent)]/12 px-4 py-3 text-left text-sm font-semibold text-white"
                    : "rounded-[0.8rem] border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm font-semibold text-white/68 transition hover:border-[var(--color-accent)]/45 hover:text-white"
                }
              >
                Nuevo
              </button>
            </div>
          </div>

          {mode === "existing" ? (
            <label className="grid gap-2">
              <span className={labelClass}>Jugador guardado</span>
              <select
                name="playerId"
                value={selectedPlayerId}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                className={inputClass}
                disabled={availablePlayers.length === 0}
              >
                {availablePlayers.length === 0 ? (
                  <option value="">No hay jugadores disponibles</option>
                ) : null}
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {getPlayerDisplayName(player)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel
                    value={firstName}
                    max={footballFormLimits.playerFirstName}
                  >
                    Nombre
                  </FieldLabel>
                  <input
                    name="firstName"
                    aria-label="Nombre del jugador"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className={inputClass}
                    required={mode === "new"}
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel
                    value={lastName}
                    max={footballFormLimits.playerLastName}
                  >
                    Apellido
                  </FieldLabel>
                  <input
                    name="lastName"
                    aria-label="Apellido del jugador"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className={inputClass}
                    required={mode === "new"}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel
                    value={publicName}
                    max={footballFormLimits.playerPublicName}
                  >
                    Nombre público
                  </FieldLabel>
                  <input
                    name="publicName"
                    aria-label="Nombre público"
                    value={publicName}
                    onChange={(event) => setPublicName(event.target.value)}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel
                    value={documentNumber}
                    max={footballFormLimits.playerDocumentNumber}
                  >
                    DNI
                  </FieldLabel>
                  <input
                    name="documentNumber"
                    aria-label="DNI"
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className={labelClass}>Nacimiento</span>
                  <input
                    name="birthDate"
                    aria-label="Nacimiento"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel value={phone} max={footballFormLimits.playerPhone}>
                    Teléfono
                  </FieldLabel>
                  <input
                    name="phone"
                    aria-label="Teléfono del jugador"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <FieldLabel
                  value={playerNotes}
                  max={footballFormLimits.playerNotes}
                >
                  Notas del jugador
                </FieldLabel>
                <textarea
                  name="playerNotes"
                  aria-label="Notas del jugador"
                  value={playerNotes}
                  onChange={(event) => setPlayerNotes(event.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y py-3 leading-6`}
                  placeholder="Opcional"
                />
              </label>
            </div>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 border-t border-white/10 pt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Camiseta</span>
            <input
              name="shirtNumber"
              aria-label="Número de camiseta"
              type="number"
              min={0}
              max={99}
              value={shirtNumber}
              onChange={(event) => setShirtNumber(event.target.value)}
              className={inputClass}
              placeholder="Sin número"
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Estado</span>
            <select
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as FootballRosterEntryStatus)
              }
              className={inputClass}
            >
              {footballRosterEntryStatuses.map((entryStatus) => (
                <option key={entryStatus} value={entryStatus}>
                  {footballRosterEntryStatusLabels[entryStatus]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Apto médico</span>
            <select
              name="medicalStatus"
              value={medicalStatus}
              onChange={(event) =>
                setMedicalStatus(
                  event.target.value as FootballDocumentationStatus,
                )
              }
              className={inputClass}
            >
              {footballDocumentationStatuses.map((documentationStatus) => (
                <option key={documentationStatus} value={documentationStatus}>
                  {footballDocumentationStatusLabels[documentationStatus]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Seguro</span>
            <select
              name="insuranceStatus"
              value={insuranceStatus}
              onChange={(event) =>
                setInsuranceStatus(
                  event.target.value as FootballDocumentationStatus,
                )
              }
              className={inputClass}
            >
              {footballDocumentationStatuses.map((documentationStatus) => (
                <option key={documentationStatus} value={documentationStatus}>
                  {footballDocumentationStatusLabels[documentationStatus]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <FieldLabel value={rosterNotes} max={footballFormLimits.rosterNotes}>
            Notas de inscripción
          </FieldLabel>
          <textarea
            name="rosterNotes"
            aria-label="Notas de inscripción"
            value={rosterNotes}
            onChange={(event) => setRosterNotes(event.target.value)}
            rows={3}
            className={`${inputClass} resize-y py-3 leading-6`}
            placeholder="Opcional"
          />
        </label>
      </section>

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className={primaryButtonClass}
      >
        {isPending
          ? "Guardando..."
          : submitLabel ?? (isEditing ? "Guardar jugador" : "Agregar jugador")}
      </button>
    </form>
  );
}

export function RosterEntryCreateDialog({
  action,
  availablePlayers,
  teamName,
}: RosterEntryCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`${secondaryButtonClass} gap-2`}>
          <Plus size={15} aria-hidden="true" />
          Agregar jugador
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Agregar jugador
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Sumá un jugador al plantel de {teamName}.
          </Dialog.Description>
          <div className="mt-6">
            <RosterEntryForm
              action={action}
              availablePlayers={availablePlayers}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function RosterEntryEditDialog({
  action,
  rosterEntry,
}: RosterEntryEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={compactButtonClass}>
          <Pencil size={14} aria-hidden="true" />
          Editar jugador
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Editar jugador
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Ajustá camiseta, estado y documentación de{" "}
            {getPlayerDisplayName(rosterEntry.player)}.
          </Dialog.Description>
          <div className="mt-6">
            <RosterEntryForm
              action={action}
              rosterEntry={rosterEntry}
              submitLabel="Guardar jugador"
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function RosterEntryRemoveDialog({
  action,
  playerName,
}: RosterEntryRemoveDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button type="button" className={dangerCompactButtonClass}>
          <Trash2 size={14} aria-hidden="true" />
          Quitar jugador
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[1rem] border border-[var(--color-warm)]/35 bg-[#17100d] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <div>
            <AlertDialog.Title className="text-2xl font-semibold text-white">
              Quitar jugador
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-white/68">
              {playerName} sale de este plantel, pero el jugador queda guardado
              para futuros torneos.
            </AlertDialog.Description>
          </div>

          <form action={formAction} className="flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button type="button" className={secondaryButtonClass}>
                Cancelar
              </button>
            </AlertDialog.Cancel>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-[var(--color-warm)]/50 bg-[var(--color-warm)]/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/26 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              {isPending ? "Quitando..." : "Quitar jugador"}
            </button>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function FixtureGeneratorDialog({
  action,
  teams,
}: FixtureGeneratorDialogProps) {
  const [parent] = useAutoAnimate();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [fixtureState, dispatchFixtureState] = useReducer(
    fixtureGeneratorReducer,
    initialFixtureGeneratorState,
  );
  const { daysBetweenRounds, kickoffTime, legs, startsAt } = fixtureState;
  const hasEnoughTeams = teams.length >= 2;
  const preview = useMemo(
    () =>
      buildLeagueFixture(teams, {
        legs: legs === "2" ? 2 : 1,
        startsAt: startsAt || null,
        kickoffTime: kickoffTime || null,
        daysBetweenRounds: Number(daysBetweenRounds) || 7,
      }),
    [daysBetweenRounds, kickoffTime, legs, startsAt, teams],
  );
  const matchCount = preview.flatMap((round) => round.matches).length;

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={!hasEnoughTeams}
          className={`${primaryButtonClass} gap-2`}
        >
          <CalendarPlus size={17} aria-hidden="true" />
          Generar fixture
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,58rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Generar fixture
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Armá automáticamente las fechas del torneo y revisá la vista previa
            antes de guardar.
          </Dialog.Description>

          <form action={formAction} className="mt-6 grid gap-6">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr_0.8fr_0.8fr]">
              <label className="grid gap-2">
                <span className={labelClass}>Formato</span>
                <select
                  name="legs"
                  value={legs}
                  onChange={(event) =>
                    dispatchFixtureState({
                      field: "legs",
                      value: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="1">Ida</option>
                  <option value="2">Ida y vuelta</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Inicio</span>
                <input
                  name="startsAt"
                  type="date"
                  aria-label="Inicio"
                  value={startsAt}
                  onChange={(event) =>
                    dispatchFixtureState({
                      field: "startsAt",
                      value: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Hora</span>
                <input
                  name="kickoffTime"
                  type="time"
                  aria-label="Hora"
                  value={kickoffTime}
                  onChange={(event) =>
                    dispatchFixtureState({
                      field: "kickoffTime",
                      value: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Cada</span>
                <select
                  name="daysBetweenRounds"
                  value={daysBetweenRounds}
                  onChange={(event) =>
                    dispatchFixtureState({
                      field: "daysBetweenRounds",
                      value: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="3">3 días</option>
                  <option value="1">1 día</option>
                </select>
              </label>
            </div>

            <section className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                    Vista previa
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Fixture de {matchCount} partidos
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {teams.length} equipos · {preview.length} fechas
                </p>
              </div>

              <div ref={parent} className="mt-4 grid max-h-[400px] gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                {preview.map((round) => (
                  <div
                    key={round.label}
                    className="flex flex-col gap-3"
                  >
                    {/* Encabezado de la Fecha */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
                        <span className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-wider">
                          {round.label}
                        </span>
                        {round.scheduledAt && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="text-xs font-medium text-white/60">
                              {round.scheduledAt.slice(0, 16).replace("T", " ")}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    {/* Partidos de la Fecha */}
                    <div className="grid gap-2">
                      {round.matches.map((match) => {
                        const home = teams.find(
                          (team) => team.id === match.homeTeamId,
                        );
                        const away = teams.find(
                          (team) => team.id === match.awayTeamId,
                        );

                        return (
                          <div
                            key={`${match.homeTeamId}-${match.awayTeamId}`}
                            className="group relative flex items-center justify-between rounded-xl border border-white/5 bg-[#1A211D] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                          >
                            <div className="flex-1 text-right">
                              <span className="text-sm font-semibold text-white group-hover:text-[var(--color-accent)] transition-colors">
                                {home?.name ?? "Local"}
                              </span>
                            </div>

                            <div className="mx-4 flex shrink-0 items-center justify-center">
                              <div className="flex h-6 w-8 items-center justify-center rounded bg-black/40 text-[10px] font-black text-white/40">
                                VS
                              </div>
                            </div>

                            <div className="flex-1 text-left">
                              <span className="text-sm font-semibold text-white group-hover:text-[var(--color-accent)] transition-colors">
                                {away?.name ?? "Visitante"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending || !hasEnoughTeams || matchCount === 0}
                className={primaryButtonClass}
              >
                {isPending ? "Guardando..." : "Guardar fixture"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type BracketGeneratorDialogProps = {
  action: (state: ActionState, payload: FormData) => Promise<ActionState>;
  teams: Pick<AdminTeam, "id" | "name">[];
};

export type GroupPlayoffGeneratorDialogProps = {
  action: (state: ActionState, payload: FormData) => Promise<ActionState>;
  teams: Pick<AdminTeam, "id" | "name">[];
};

export function GroupPlayoffGeneratorDialog({
  action,
  teams,
}: GroupPlayoffGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [groupCount, setGroupCount] = useState("2");
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState("1");
  const [startsAt, setStartsAt] = useState("");
  const [kickoffTime, setKickoffTime] = useState("");
  const [daysBetweenGroupRounds, setDaysBetweenGroupRounds] = useState("7");
  const [daysBetweenPlayoffRounds, setDaysBetweenPlayoffRounds] = useState("7");

  const preview = useMemo(() => {
    try {
      return buildGroupPlayoffFixture(teams, {
        groupCount: Number(groupCount) || 2,
        qualifiersPerGroup: Number(qualifiersPerGroup) || 1,
        startsAt: startsAt || null,
        kickoffTime: kickoffTime || null,
        daysBetweenGroupRounds: Number(daysBetweenGroupRounds) || 7,
        daysBetweenPlayoffRounds: Number(daysBetweenPlayoffRounds) || 7,
      });
    } catch {
      return null;
    }
  }, [
    daysBetweenGroupRounds,
    daysBetweenPlayoffRounds,
    groupCount,
    kickoffTime,
    qualifiersPerGroup,
    startsAt,
    teams,
  ]);
  const groupMatchCount =
    preview?.groupRounds.flatMap((round) => round.matches).length ?? 0;
  const playoffMatchCount = preview?.playoffMatches.length ?? 0;
  const totalMatchCount = groupMatchCount + playoffMatchCount;
  const hasEnoughTeams = teams.length >= 2;

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={!hasEnoughTeams}
          className={`${primaryButtonClass} gap-2`}
        >
          <CalendarPlus size={17} aria-hidden="true" />
          Generar zonas + playoff
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Generar zonas + playoff
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Armá zonas balanceadas, fixture de grupos y una llave final con
            clasificados pendientes.
          </Dialog.Description>

          <form action={formAction} className="mt-6 grid gap-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2">
                <span className={labelClass}>Zonas</span>
                <input
                  name="groupCount"
                  type="number"
                  min="1"
                  max={Math.max(1, teams.length)}
                  aria-label="Zonas"
                  value={groupCount}
                  onChange={(event) => setGroupCount(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Clasifican por zona</span>
                <input
                  name="qualifiersPerGroup"
                  type="number"
                  min="1"
                  aria-label="Clasifican por zona"
                  value={qualifiersPerGroup}
                  onChange={(event) =>
                    setQualifiersPerGroup(event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Inicio</span>
                <input
                  name="startsAt"
                  type="date"
                  aria-label="Inicio"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Hora</span>
                <input
                  name="kickoffTime"
                  type="time"
                  aria-label="Hora"
                  value={kickoffTime}
                  onChange={(event) => setKickoffTime(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Cada fecha</span>
                <select
                  name="daysBetweenGroupRounds"
                  value={daysBetweenGroupRounds}
                  onChange={(event) =>
                    setDaysBetweenGroupRounds(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="3">3 días</option>
                  <option value="1">1 día</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Cada fase playoff</span>
                <select
                  name="daysBetweenPlayoffRounds"
                  value={daysBetweenPlayoffRounds}
                  onChange={(event) =>
                    setDaysBetweenPlayoffRounds(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="3">3 días</option>
                  <option value="1">1 día</option>
                </select>
              </label>
            </div>

            <section className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                    Vista previa
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {totalMatchCount} partidos totales
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {groupMatchCount} de grupos · {playoffMatchCount} playoff
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {preview?.groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-[0.85rem] border border-white/10 bg-black/10 p-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {group.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {group.teams.map((team) => team.name).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending || !preview || totalMatchCount === 0}
                className={primaryButtonClass}
              >
                {isPending ? "Guardando..." : "Guardar zonas + playoff"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function BracketGeneratorDialog({
  action,
  teams,
}: BracketGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [showErrors, setShowErrors] = useState(false);

  const [bracketMatches, setBracketMatches] = useState<MatchNode[]>([]);

  const handleAction = (formData: FormData) => {
    const hasEmptyInitialSlots = bracketMatches.some(m =>
       (m.homeSourceType === "INITIAL" && !m.homeTeamId) ||
       (m.awaySourceType === "INITIAL" && !m.awayTeamId)
    );

    if (hasEmptyInitialSlots) {
       setShowErrors(true);
       return;
    }
    setShowErrors(false);

    const payload = {
      initialMatches: bracketMatches,
      startsAt: formData.get("startsAt") as string || null,
      daysBetweenRounds: Number(formData.get("daysBetweenRounds")) || 7,
    };
    formData.set("bracketData", JSON.stringify(payload));
    formAction(formData);
  };

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={teams.length < 2}
          className={`${primaryButtonClass} gap-2`}
        >
          <CalendarPlus size={17} aria-hidden="true" />
          Armar Llave
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[95vh] w-[95vw] lg:w-[min(95vw,90rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Armar Llave Inicial
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Asigná los cruces iniciales. El resto de la llave se armará automáticamente.
          </Dialog.Description>

          <form action={handleAction} className="mt-6 grid gap-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <label className="grid gap-2">
                <span className={labelClass}>Fecha de inicio</span>
                <input
                  type="date"
                  name="startsAt"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>Días entre fases</span>
                <select
                  name="daysBetweenRounds"
                  defaultValue="7"
                  className={inputClass}
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="3">3 días</option>
                  <option value="1">1 día</option>
                </select>
              </label>
            </div>

            <div className="flex-1 min-h-[500px]">
              <InteractiveBracketBuilder
                teams={teams}
                onMatchesChange={setBracketMatches}
                showErrors={showErrors}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className={primaryButtonClass}
              >
                {isPending ? "Generando..." : "Generar Llave"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MatchCreateDialog({ action, teams }: MatchCreateDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className={`${primaryButtonClass} gap-2`}>
          <Plus size={17} aria-hidden="true" />
          Nuevo partido
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,52rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Nuevo partido
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Programá el partido y, si ya terminó, podés cargar el resultado en
            el mismo paso.
          </Dialog.Description>
          <div className="mt-6">
            <MatchForm action={action} teams={teams} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MatchEditDialog({
  action,
  match,
  teams,
}: MatchEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={compactButtonClass}>
          <Pencil size={14} aria-hidden="true" />
          Editar partido
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,52rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Editar partido
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Corregí fecha, equipos, estado o resultado si hubo un error de
            carga.
          </Dialog.Description>
          <div className="mt-6">
            <MatchForm
              action={action}
              teams={teams}
              match={match}
              submitLabel="Guardar partido"
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MatchDeleteDialog({
  action,
  matchLabel,
}: MatchDeleteDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const canDelete = confirmation.trim() === matchLabel.trim();

  useActionToast(state, {
    onSuccess: () => {
      setOpen(false);
      setConfirmation("");
    },
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button type="button" className={dangerCompactButtonClass}>
          <Trash2 size={14} aria-hidden="true" />
          Eliminar partido
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[1rem] border border-[var(--color-warm)]/35 bg-[#17100d] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <div>
            <AlertDialog.Title className="text-2xl font-semibold text-white">
              Eliminar partido
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-white/68">
              Esta acción borra el partido y su resultado. Usá editar si solo
              necesitás postergar, cancelar o corregir datos.
            </AlertDialog.Description>
          </div>

          <form action={formAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Escribí la ronda para confirmar</span>
              <input
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClass}
                placeholder={matchLabel}
                autoComplete="off"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className={secondaryButtonClass}>
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                type="submit"
                disabled={isPending || !canDelete}
                className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-[var(--color-warm)]/50 bg-[var(--color-warm)]/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/26 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
              >
                {isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function formatDatetimeLocal(value: string | null) {
  if (!value) return "";

  return value.slice(0, 16);
}

function MatchForm({
  action,
  teams,
  match,
  submitLabel = "Crear partido",
  onSuccess,
}: MatchFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const hasEnoughTeams = teams.length >= 2;
  const [roundLabel, setRoundLabel] = useState(match?.roundLabel ?? "");
  const hasValidRoundLabel =
    roundLabel.trim().length >= 1 &&
    !isOverLimit(roundLabel, footballFormLimits.matchRoundLabel);
  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr]">
        <label className="grid gap-2">
          <FieldLabel
            value={roundLabel}
            max={footballFormLimits.matchRoundLabel}
          >
            Ronda
          </FieldLabel>
          <input
            name="roundLabel"
            aria-label="Ronda"
            value={roundLabel}
            onChange={(event) => setRoundLabel(event.target.value)}
            required
            className={inputClass}
            placeholder="Fecha 1"
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Día y hora</span>
          <input
            name="scheduledAt"
            type="datetime-local"
            defaultValue={formatDatetimeLocal(match?.scheduledAt ?? null)}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Estado</span>
          <select
            name="status"
            defaultValue={match?.status ?? "scheduled"}
            className={inputClass}
          >
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
            defaultValue={match?.homeTeamId ?? ""}
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
            defaultValue={match?.awayTeamId ?? ""}
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
            defaultValue={match?.homeScore ?? ""}
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
            defaultValue={match?.awayScore ?? ""}
            placeholder="0"
          />
        </label>
      </div>

      {!hasEnoughTeams ? (
        <p className="rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-4 py-3 text-sm text-white/70">
          Cargá al menos dos equipos antes de crear partidos.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !hasEnoughTeams || !hasValidRoundLabel}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-fit"
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export function MatchViewerAssignmentForm({
  action,
  viewers,
  assignedViewerId,
}: MatchViewerAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state);
  const [selectedViewerId, setSelectedViewerId] = useState(
    assignedViewerId ?? "",
  );

  useEffect(() => {
    setSelectedViewerId(assignedViewerId ?? "");
  }, [assignedViewerId]);

  return (
    <form action={formAction} className="grid gap-2">
      <label className="grid gap-2">
        <span className={labelClass}>Veedor</span>
        <select
          name="assignedViewerId"
          value={selectedViewerId}
          onChange={(event) => setSelectedViewerId(event.target.value)}
          className={inputClass}
        >
          <option value="">Sin veedor</option>
          {viewers.map((viewer) => (
            <option key={viewer.id} value={viewer.id}>
              {viewer.email}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={isPending} className={compactButtonClass}>
        {isPending ? "Guardando..." : "Asignar"}
      </button>
    </form>
  );
}

export function MatchResultForm({
  action,
  homeScore,
  awayScore,
  homePenaltyScore = null,
  awayPenaltyScore = null,
  homeTeamId = null,
  awayTeamId = null,
  isKnockout = false,
  rosterEntries = [],
  submitLabel = "Guardar resultado",
}: MatchResultFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state);

  const [localHome, setLocalHome] = useState(homeScore ?? 0);
  const [localAway, setLocalAway] = useState(awayScore ?? 0);
  const [localHomePenalties, setLocalHomePenalties] = useState(
    homePenaltyScore ?? 0,
  );
  const [localAwayPenalties, setLocalAwayPenalties] = useState(
    awayPenaltyScore ?? 0,
  );

  useEffect(() => {
    setLocalHome(homeScore ?? 0);
    setLocalAway(awayScore ?? 0);
    setLocalHomePenalties(homePenaltyScore ?? 0);
    setLocalAwayPenalties(awayPenaltyScore ?? 0);
  }, [awayPenaltyScore, awayScore, homePenaltyScore, homeScore]);

  const homeRosterEntries = useMemo(
    () => rosterEntries.filter((entry) => entry.teamId === homeTeamId),
    [homeTeamId, rosterEntries],
  );
  const awayRosterEntries = useMemo(
    () => rosterEntries.filter((entry) => entry.teamId === awayTeamId),
    [awayTeamId, rosterEntries],
  );
  const shouldShowPenalties = isKnockout && localHome === localAway;
  const hasRosterEntries =
    homeRosterEntries.length > 0 || awayRosterEntries.length > 0;

  const updateScore = (team: "home" | "away", delta: number) => {
    if (team === "home") {
      setLocalHome((currentScore) => Math.max(0, currentScore + delta));
    } else {
      setLocalAway((currentScore) => Math.max(0, currentScore + delta));
    }
  };

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Local */}
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center">
          <span className={labelClass}>Local</span>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Restar gol local"
              onClick={() => updateScore("home", -1)}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white transition hover:bg-white/10 active:scale-95"
            >
              <Minus size={24} />
            </button>
            <span className="text-3xl font-bold text-white tabular-nums">
              {localHome}
            </span>
            <button
              type="button"
              aria-label="Sumar gol local"
              onClick={() => updateScore("home", 1)}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white transition hover:bg-white/10 active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
          <input type="hidden" name="homeScore" value={localHome} />
        </div>

        {/* Visitante */}
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center">
          <span className={labelClass}>Visitante</span>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Restar gol visitante"
              onClick={() => updateScore("away", -1)}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white transition hover:bg-white/10 active:scale-95"
            >
              <Minus size={24} />
            </button>
            <span className="text-3xl font-bold text-white tabular-nums">
              {localAway}
            </span>
            <button
              type="button"
              aria-label="Sumar gol visitante"
              onClick={() => updateScore("away", 1)}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white transition hover:bg-white/10 active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
          <input type="hidden" name="awayScore" value={localAway} />
        </div>
      </div>

      {shouldShowPenalties ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 p-4">
          <div>
            <p className={labelClass}>Definición por penales</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              Necesario en copa o playoff cuando el partido termina empatado.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-white/70">Local</span>
              <input
                type="number"
                name="homePenaltyScore"
                min={0}
                value={localHomePenalties}
                onChange={(event) =>
                  setLocalHomePenalties(Math.max(0, Number(event.target.value)))
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-white/70">
                Visitante
              </span>
              <input
                type="number"
                name="awayPenaltyScore"
                min={0}
                value={localAwayPenalties}
                onChange={(event) =>
                  setLocalAwayPenalties(Math.max(0, Number(event.target.value)))
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>
      ) : null}

      {hasRosterEntries ? (
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div>
            <p className={labelClass}>Detalle opcional</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              Podés asignar goles y tarjetas ahora, o guardar solo el resultado.
            </p>
          </div>

          {([
            ["Local", homeRosterEntries],
            ["Visitante", awayRosterEntries],
          ] as const).map(([title, entries]) =>
            entries.length > 0 ? (
              <div key={title} className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  {title}
                </p>
                <div className="grid gap-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid gap-2 rounded-xl border border-white/8 bg-black/10 p-3 sm:grid-cols-[minmax(0,1fr)_4rem_4rem_4rem] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {entry.shirtNumber !== null
                            ? `#${entry.shirtNumber} `
                            : ""}
                          {entry.displayName}
                        </p>
                      </div>
                      <label className="grid gap-1">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/42">
                          Goles
                        </span>
                        <input
                          type="number"
                          name={`goals:${entry.id}`}
                          min={0}
                          max={50}
                          placeholder="0"
                          className={inputClass}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/42">
                          Amar.
                        </span>
                        <input
                          type="number"
                          name={`yellowCards:${entry.id}`}
                          min={0}
                          max={2}
                          placeholder="0"
                          className={inputClass}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/42">
                          Roja
                        </span>
                        <input
                          type="number"
                          name={`redCards:${entry.id}`}
                          min={0}
                          max={1}
                          placeholder="0"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-[var(--color-muted)]">
          No hay jugadores cargados para estos equipos. Podés guardar el
          resultado igual.
        </div>
      )}

      <button type="submit" disabled={isPending} className={`${primaryButtonClass} w-full sm:w-full`}>
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export type TournamentSettingsDialogProps = {
  tournament: AdminTournament;
  updateAction: TournamentFormAction;
  deleteAction: DeleteTournamentAction;
};

export function TournamentSettingsDialog({
  tournament,
  updateAction,
  deleteAction,
}: TournamentSettingsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.06] hover:text-white"
        >
          <Settings size={17} aria-hidden="true" />
          Configuración
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Configuración del torneo
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Editá los detalles o eliminá el torneo permanentemente.
          </Dialog.Description>

          <div className="mt-6 grid gap-8">
            <section>
              <h3 className="mb-4 text-lg font-semibold text-white">Detalles del torneo</h3>
              <TournamentForm
                action={updateAction}
                tournament={tournament}
                submitLabel="Guardar cambios"
                onSuccess={() => setOpen(false)}
              />
            </section>

            <section className="rounded-[1rem] border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-lg font-semibold text-white">Zona de peligro</h3>
              <p className="mb-4 mt-1 text-sm text-[var(--color-muted)]">
                El estado define si el torneo aparece en la página pública. Borrar es una acción permanente.
              </p>
              <DeleteTournamentForm
                action={deleteAction}
                tournamentName={tournament.name}
              />
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
