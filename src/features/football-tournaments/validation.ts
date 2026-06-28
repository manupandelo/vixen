import { z } from "zod";
import { footballMatchStatuses, footballTournamentStatuses } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_LOCAL_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATETIME_WITH_TIMEZONE_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

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
    name: z.string().trim().min(2, "Ingresá un nombre."),
    slug: z
      .string()
      .trim()
      .min(2, "Ingresá un slug.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Usá minúsculas, números y guiones.",
      ),
    season: z.string().trim().min(2, "Ingresá una temporada."),
    category: z.string().trim().min(2, "Ingresá una categoría."),
    status: z.enum(footballTournamentStatuses),
    startsAt: tournamentDate,
    endsAt: tournamentDate,
    description: nullableText,
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
  name: z.string().trim().min(2, "Ingresá el nombre del equipo."),
  shortName: nullableText,
  captainName: nullableText,
  contactPhone: nullableText,
  notes: nullableText,
});

export const matchFormSchema = z
  .object({
    roundLabel: z.string().trim().min(1, "Ingresá la fecha o ronda."),
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

export type TournamentFormInput = z.infer<typeof tournamentFormSchema>;
export type TeamFormInput = z.infer<typeof teamFormSchema>;
export type MatchFormInput = z.infer<typeof matchFormSchema>;
