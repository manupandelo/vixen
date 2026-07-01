import { z } from "zod";
import {
  footballMatchStatuses,
  footballTournamentFormats,
  footballTournamentStatuses,
  staffRoles,
} from "./types";
import { footballFormLimits } from "./limits";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_LOCAL_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATETIME_WITH_TIMEZONE_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const nullableText = z.preprocess((value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable());

function isValidCalendarDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTime(hour: string, minute: string, second = "00") {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const parsedSecond = Number(second);

  return (
    parsedHour >= 0 &&
    parsedHour <= 23 &&
    parsedMinute >= 0 &&
    parsedMinute <= 59 &&
    parsedSecond >= 0 &&
    parsedSecond <= 59
  );
}

const tournamentDate = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z
    .string()
    .refine(
      isValidCalendarDate,
      "Ingresá una fecha válida con formato AAAA-MM-DD.",
    )
    .nullable(),
);

const scheduledDateTime = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    if (trimmed === "") return null;

    const localMatch = trimmed.match(DATETIME_LOCAL_PATTERN);

    if (localMatch) {
      const [, date, hour, minute, second = "00"] = localMatch;

      if (!isValidCalendarDate(date) || !isValidTime(hour, minute, second)) {
        return trimmed;
      }

      return `${date}T${hour}:${minute}:${second}-03:00`;
    }

    return trimmed;
  },
  z
    .string()
    .refine((value) => {
      const timezoneMatch = value.match(DATETIME_WITH_TIMEZONE_PATTERN);

      if (!timezoneMatch) return false;

      const [, date, hour, minute, second = "00"] = timezoneMatch;

      if (!isValidCalendarDate(date) || !isValidTime(hour, minute, second)) {
        return false;
      }

      return !Number.isNaN(Date.parse(value));
    }, "Ingresá una fecha y hora válida.")
    .nullable(),
);

const nullableScore = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : Number(trimmed);
    }

    return value;
  },
  z
    .number()
    .int("Ingresá goles enteros.")
    .min(0, "Los goles no pueden ser negativos.")
    .nullable(),
);

export const tournamentFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ingresá un nombre.")
      .max(
        footballFormLimits.tournamentName,
        `El nombre no puede superar ${footballFormLimits.tournamentName} caracteres.`,
      ),
    category: nullableText.refine(
      (value) =>
        value === null || value.length <= footballFormLimits.tournamentCategory,
      `La categoría no puede superar ${footballFormLimits.tournamentCategory} caracteres.`,
    ),
    format: z.enum(footballTournamentFormats),
    status: z.enum(footballTournamentStatuses),
    startsAt: tournamentDate,
    endsAt: tournamentDate,
    description: nullableText.refine(
      (value) =>
        value === null ||
        value.length <= footballFormLimits.tournamentDescription,
      `La descripción no puede superar ${footballFormLimits.tournamentDescription} caracteres.`,
    ),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "La fecha de fin no puede ser anterior al inicio.",
      });
    }
  });

export const teamFormSchema = z.object({
  existingTeamId: nullableText,
  name: nullableText.refine(
    (value) => value === null || value.length <= footballFormLimits.teamName,
    `El nombre del equipo no puede superar ${footballFormLimits.teamName} caracteres.`,
  ),
  shortName: nullableText.refine(
    (value) =>
      value === null || value.length <= footballFormLimits.teamShortName,
    `El nombre corto no puede superar ${footballFormLimits.teamShortName} caracteres.`,
  ),
  captainName: nullableText.refine(
    (value) =>
      value === null || value.length <= footballFormLimits.teamCaptainName,
    `El capitán no puede superar ${footballFormLimits.teamCaptainName} caracteres.`,
  ),
  contactPhone: nullableText.refine(
    (value) =>
      value === null || value.length <= footballFormLimits.teamContactPhone,
    `El teléfono no puede superar ${footballFormLimits.teamContactPhone} caracteres.`,
  ),
  notes: nullableText.refine(
    (value) => value === null || value.length <= footballFormLimits.teamNotes,
    `Las notas no pueden superar ${footballFormLimits.teamNotes} caracteres.`,
  ),
}).superRefine((value, ctx) => {
  if (!value.existingTeamId && (!value.name || value.name.length < 2)) {
    ctx.addIssue({
      code: "custom",
      path: ["name"],
      message: "Ingresá el nombre del equipo.",
    });
  }
});

export const matchFormSchema = z
  .object({
    roundLabel: z
      .string()
      .trim()
      .min(1, "Ingresá la fecha o ronda.")
      .max(
        footballFormLimits.matchRoundLabel,
        `La ronda no puede superar ${footballFormLimits.matchRoundLabel} caracteres.`,
      ),
    scheduledAt: scheduledDateTime,
    homeTeamId: z.string().trim().min(1, "Elegí el local."),
    awayTeamId: z.string().trim().min(1, "Elegí el visitante."),
    status: z.enum(footballMatchStatuses),
    homeScore: nullableScore,
    awayScore: nullableScore,
  })
  .superRefine((value, ctx) => {
    if (value.homeTeamId === value.awayTeamId) {
      ctx.addIssue({
        code: "custom",
        path: ["awayTeamId"],
        message: "El visitante debe ser distinto al local.",
      });
    }

    if (
      value.status === "completed" &&
      (value.homeScore === null || value.awayScore === null)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["homeScore"],
        message: "Un partido finalizado necesita ambos goles.",
      });
    }
  })
  .transform((value) => {
    if (value.status === "completed") return value;

    return {
      ...value,
      homeScore: null,
      awayScore: null,
    };
  });

export const matchResultFormSchema = z.object({
  homeScore: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    },
    z
      .number({ error: "Ingresá los goles del local." })
      .int("Ingresá goles enteros.")
      .min(0, "Los goles no pueden ser negativos."),
  ),
  awayScore: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    },
    z
      .number({ error: "Ingresá los goles del visitante." })
      .int("Ingresá goles enteros.")
      .min(0, "Los goles no pueden ser negativos."),
  ),
});

export const fixtureGenerationSchema = z.object({
  legs: z.preprocess(
    (value) => Number(value),
    z.union([z.literal(1), z.literal(2)]),
  ),
  startsAt: tournamentDate,
  kickoffTime: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z
      .string()
      .refine((value) => {
        const match = value.match(TIME_PATTERN);

        if (!match) return false;

        const [, hour, minute] = match;

        return isValidTime(hour, minute);
      }, "Ingresá una hora válida.")
      .nullable(),
  ),
  daysBetweenRounds: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return 7;

      return Number(value);
    },
    z
      .number()
      .int("Ingresá una cantidad de días entera.")
      .min(1, "Debe haber al menos un día entre fechas.")
      .max(30, "No puede haber más de 30 días entre fechas."),
  ),
});

export const matchViewerAssignmentSchema = z.object({
  assignedViewerId: nullableText,
});

const staffEmail = z
  .string()
  .trim()
  .email("Ingresá un email válido.")
  .toLowerCase();

export const staffCreateFormSchema = z.object({
  email: staffEmail,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(staffRoles),
});

export const staffRoleFormSchema = z.object({
  role: z.enum(staffRoles),
});

export const staffSuspendFormSchema = z.object({
  reason: nullableText,
});

export const staffDeleteFormSchema = z.object({
  confirmation: z.string().trim(),
});

export type TournamentFormInput = z.infer<typeof tournamentFormSchema>;
export type TeamFormInput = z.infer<typeof teamFormSchema>;
export type MatchFormInput = z.infer<typeof matchFormSchema>;
export type MatchResultFormInput = z.infer<typeof matchResultFormSchema>;
