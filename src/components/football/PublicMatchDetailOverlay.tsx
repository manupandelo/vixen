"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicFootballMatch } from "@/features/football-tournaments/types";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getInitials(name: string) {
  if (!name || name === "Por definirse") return "?";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function PublicMatchDetailOverlay({
  match,
  open,
  onOpenChange,
}: {
  match: PublicFootballMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isCompleted = match?.status === "completed";
  const isScheduled = match?.status === "scheduled";
  const dateObj = match?.scheduledAt ? new Date(match.scheduledAt) : null;
  
  const homeInitial = match?.homeTeamShortName || getInitials(match?.homeTeamName || "");
  const awayInitial = match?.awayTeamShortName || getInitials(match?.awayTeamName || "");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && match && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-3xl"
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto outline-none"
              >
                
                <Dialog.Close className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-black transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] z-[110]">
                  <X className="w-6 h-6" />
                </Dialog.Close>

                <div className="w-full max-w-4xl mx-auto relative group">
                  {/* Outer Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                  
                  {/* Glassmorphism Card */}
                  <div className="relative w-full rounded-[2rem] bg-white/[0.02] border border-white/10 overflow-hidden shadow-2xl flex flex-col items-center p-8 md:p-12">
                    
                    {/* Internal Accent Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--color-accent-rgb),0.15)_0%,transparent_70%)] pointer-events-none" />
                    
                    {/* Top Accent Line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50" />

                    {/* Match Header Info */}
                    <div className="mb-10 flex flex-col items-center gap-4 relative z-10">
                      <span className="px-5 py-1.5 rounded-full bg-black/40 border border-white/10 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-accent)]">
                        {match.roundLabel || "Fase Regular"}
                      </span>
                      
                      {dateObj ? (
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-white/70 text-sm uppercase tracking-[0.1em] font-medium">
                            {dateFormatter.format(dateObj)}
                          </p>
                          <p className="text-white font-bold text-xl drop-shadow-md">
                            {timeFormatter.format(dateObj)} hs
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 mt-2">
                          <p className="text-[var(--color-accent)] text-sm uppercase tracking-[0.3em] font-black drop-shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.5)]">
                            A Confirmar
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Teams and Score */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-12 w-full relative z-10">
                      
                      {/* Home Team */}
                      <div className="flex flex-col items-center gap-4 w-full md:w-[35%]">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-xl relative overflow-hidden group-hover:border-[var(--color-accent)]/30 transition-colors duration-500">
                          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/10 to-transparent opacity-50" />
                          <span className="relative z-10 drop-shadow-md">{homeInitial}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-tight">
                          {match.homeTeamName || "Por definirse"}
                        </h3>
                      </div>

                      {/* Score or VS */}
                      <div className="flex flex-col items-center justify-center w-full md:w-[30%]">
                        {isCompleted ? (
                          <div className="flex items-center justify-center gap-4 bg-black/20 rounded-2xl py-4 px-8 border border-white/5">
                            <span className="text-5xl md:text-7xl font-black text-white drop-shadow-md">
                              {match.homeScore}
                            </span>
                            <span className="text-2xl md:text-4xl text-[var(--color-accent)] font-light">-</span>
                            <span className="text-5xl md:text-7xl font-black text-white drop-shadow-md">
                              {match.awayScore}
                            </span>
                          </div>
                        ) : (
                          <div className="text-4xl md:text-6xl font-black italic text-white/10 uppercase drop-shadow-2xl">
                            VS
                          </div>
                        )}

                        {/* Status Tags */}
                        {isCompleted && (
                          <div className="mt-6 px-3 py-1 rounded bg-[var(--color-accent)]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                            Finalizado
                          </div>
                        )}
                        {!isCompleted && dateObj && isScheduled && (
                          <div className="mt-6 px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                            Programado
                          </div>
                        )}
                        {!isCompleted && match?.status === "postponed" && (
                          <div className="mt-6 px-3 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                            Postergado
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center gap-4 w-full md:w-[35%]">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-xl relative overflow-hidden group-hover:border-[var(--color-accent)]/30 transition-colors duration-500">
                          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/10 to-transparent opacity-50" />
                          <span className="relative z-10 drop-shadow-md">{awayInitial}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-tight">
                          {match.awayTeamName || "Por definirse"}
                        </h3>
                      </div>

                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
