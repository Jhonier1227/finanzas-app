"use client";

import { useFinanceStore } from "@/store/finance-store";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Selector de mes global (RF-15/RF-16). Cambia el mes en contexto del store;
 * dashboard, lista y formularios reaccionan automáticamente.
 */
export function MonthSelector() {
  const year = useFinanceStore((s) => s.year);
  const month = useFinanceStore((s) => s.month);
  const setMonth = useFinanceStore((s) => s.setMonth);

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const change = (delta: number) => {
    const total = year * 12 + (month - 1) + delta;
    void setMonth(Math.floor(total / 12), (total % 12) + 1);
  };

  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
  const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
      <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400 ml-1" />
      <button
        onClick={() => change(-1)}
        title="Mes anterior"
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[150px] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">
        {labelCapitalized}
      </span>
      <button
        onClick={() => change(1)}
        title="Mes siguiente"
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => void setMonth(now.getFullYear(), now.getMonth() + 1)}
          className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer dark:text-emerald-400 dark:hover:bg-emerald-900/30"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
