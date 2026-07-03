"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function PublicCategoryDropdown({
  tournamentSlug,
  categories,
  selectedCategorySlug,
}: {
  tournamentSlug: string;
  categories: { id: string; name: string; slug: string }[];
  selectedCategorySlug: string;
}) {
  const router = useRouter();
  
  if (categories.length <= 1) return null;
  
  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
  if (!selectedCategory) return null;

  return (
    <div className="relative group cursor-pointer w-max">
      <select
        value={selectedCategory.slug}
        onChange={(e) => {
          router.push(`/futbol/torneos/${tournamentSlug}/${e.target.value}`);
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
        className="pointer-events-none inline-flex h-10 items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 pl-4 pr-3 text-sm font-semibold text-[var(--color-accent)] transition-all group-hover:bg-[var(--color-accent)]/10 group-hover:border-[var(--color-accent)]/40 group-hover:shadow-[0_0_15px_rgba(60,191,113,0.15)]"
        aria-hidden="true"
      >
        <span>
          <span className="font-medium opacity-60 mr-1.5">Categoría:</span> 
          {selectedCategory.name}
        </span>
        <ChevronDown size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
