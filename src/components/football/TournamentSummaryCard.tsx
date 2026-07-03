import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  footballTournamentFormatLabels,
  type PublicFootballTournament,
} from "@/features/football-tournaments/types";

const statusLabels = {
  draft: "Borrador",
  published: "Publicado",
  active: "En juego",
  completed: "Finalizado",
  archived: "Archivado",
} satisfies Record<PublicFootballTournament["status"], string>;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getNextMatch(tournament: PublicFootballTournament) {
  return tournament.matches.find((match) => match.status === "scheduled");
}

function formatDate(date: string | null) {
  if (!date) return "A confirmar";
  return dateFormatter.format(new Date(date)).replace(".", "");
}

function getInitials(name: string) {
  if (!name || name === "Por definirse") return "?";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function TournamentSummaryCard({
  tournament,
}: {
  tournament: PublicFootballTournament;
}) {
  const nextMatch = getNextMatch(tournament);
  const totalMatches = tournament.matches.length;
  const completedMatches = tournament.matches.filter(
    (match) => match.status === "completed",
  ).length;
  
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const isCup = tournament.format === "cup";
  const glowColor = isCup ? "rgba(255, 60, 0, 0.05)" : "rgba(0, 255, 100, 0.05)";
  const accentColor = isCup ? "text-orange-400" : "text-[var(--color-accent)]";
  const accentBg = isCup ? "bg-orange-500" : "bg-[var(--color-accent)]";
  const href = tournament.categorySlug
    ? `/futbol/torneos/${tournament.slug}/${tournament.categorySlug}`
    : `/futbol/torneos/${tournament.slug}`;

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] relative isolate"
    >
      <div 
        className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-xl"
        style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 60%)` }}
      />
      <article className="relative z-10 grid h-full gap-5 rounded-xl border border-white/10 bg-[#111612]/90 backdrop-blur-sm p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
        
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
          <span className={`px-2 py-1 rounded-md bg-white/5 border border-white/10 ${accentColor}`}>{statusLabels[tournament.status]}</span>
          <span className="text-white/30">/</span>
          <span>{footballTournamentFormatLabels[tournament.format]}</span>
          <span className="text-white/30">/</span>
          <span>{tournament.season}</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-display-sm text-2xl group-hover:text-white transition-colors">{tournament.name}</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {tournament.categoriesCount && tournament.categoriesCount > 1
              ? `${tournament.categoriesCount} categorías`
              : tournament.category}{" "}
            • {tournament.teams.length} equipos
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.1em] text-white/50">
            <span>Progreso</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${accentBg} rounded-full transition-all duration-1000 ease-out`} 
              style={{ width: `${progressPercent}%`, boxShadow: `0 0 10px ${accentBg}` }}
            />
          </div>
        </div>

        {/* Next Match Card */}
        <div className="mt-4 border border-white/10 bg-black/40 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {nextMatch ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 bg-white/5 px-2 py-1 rounded">
                  Próximo Partido
                </span>
                <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {formatDate(nextMatch.scheduledAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/70 shadow-inner">
                    {getInitials(nextMatch.homeTeamName || "")}
                  </div>
                  <span className="text-sm font-semibold text-white truncate w-full text-center">
                    {nextMatch.homeTeamName || "Por definirse"}
                  </span>
                </div>
                
                <div className="text-xs font-black italic text-white/20 uppercase">VS</div>
                
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/70 shadow-inner">
                    {getInitials(nextMatch.awayTeamName || "")}
                  </div>
                  <span className="text-sm font-semibold text-white truncate w-full text-center">
                    {nextMatch.awayTeamName || "Por definirse"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <p className="text-sm font-semibold text-white">Historial disponible</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Resultados y posiciones en el detalle.
              </p>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
          <span className={`text-sm font-bold uppercase tracking-[0.14em] ${accentColor} transition-colors`}>
            Ver torneo completo
          </span>
          <ArrowRight className={`w-5 h-5 ${accentColor} opacity-50 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`} />
        </div>
      </article>
    </Link>
  );
}
