import { z } from "zod";
import { footballMatchStatuses, footballTournamentStatuses } from "./types";

const nullableText = z.preprocess((value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable());

const nullableDate = z.preprocess((value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable());

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

export const tournamentFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre."),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones."),
  season: z.string().trim().min(2, "Ingresá una temporada."),
  category: z.string().trim().min(2, "Ingresá una categoría."),
  status: z.enum(footballTournamentStatuses),
  startsAt: nullableDate,
  endsAt: nullableDate,
  description: nullableText,
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
    scheduledAt: nullableDate,
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
