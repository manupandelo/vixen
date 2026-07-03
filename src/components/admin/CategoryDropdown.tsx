"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminTournamentCategory } from "@/features/football-tournaments/data";
import { ChevronDown } from "lucide-react";

export function CategoryDropdown({
  categories,
  selectedCategory,
}: {
  categories: AdminTournamentCategory[];
  selectedCategory: AdminTournamentCategory | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (categories.length === 0 || !selectedCategory) return null;

  return (
    <div className="relative group cursor-pointer">
      <select
        value={selectedCategory.slug}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("category", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer appearance-none"
        aria-label="Seleccionar categoría"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      
      <div
        className="pointer-events-none inline-flex h-9 items-center justify-between gap-2.5 rounded-[0.55rem] border border-white/10 bg-white/[0.035] pl-3 pr-2.5 text-sm font-semibold text-white/80 transition-colors group-hover:bg-white/[0.06] group-hover:text-white"
        aria-hidden="true"
      >
        <span><span className="font-medium text-white/50 mr-1.5">Categoría</span> {selectedCategory.name}</span>
        <ChevronDown size={14} className="opacity-50" />
      </div>
    </div>
  );
}
