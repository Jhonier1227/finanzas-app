"use client";

import { useEffect, useState } from "react";
import {
  expensesApi,
  salariesApi,
  ApiError,
  type SalaryDto,
} from "@/lib/api/client";
import type { Expense } from "@/types";
import {
  gastosDelMes,
  totalRealizado,
  totalPlanificado,
  ahorroDelMes,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

/**
 * Vista Historial (RF-21 gráfico + RF-22 tabla anual).
 * Agrega por mes: sueldo, gastado, comprometido y ahorro del año seleccionado.
 */

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface MonthRow {
  month: number; // 1-12
  sueldo: number;
  gastado: number;
  comprometido: number;
  ahorro: number;
}

function buildRows(salaries: SalaryDto[], expenses: Expense[], year: number): MonthRow[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const salary = salaries.find((s) => s.year === year && s.month === m);
    const delMes = gastosDelMes(expenses, year, m);
    const gastado = totalRealizado(delMes);
    return {
      month: m,
      sueldo: salary?.amount ?? 0,
      gastado,
      comprometido: totalPlanificado(delMes),
      ahorro: salary ? ahorroDelMes(salary.amount, gastado) : 0,
    };
  });
}

function monthFullName(month: number): string {
  const label = new Intl.DateTimeFormat("es-CO", { month: "long" }).format(
    new Date(2000, month - 1, 1)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function Historial() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [rows, setRows] = useState<MonthRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [salaries, expenses] = await Promise.all([
          salariesApi.list(year),
          expensesApi.list(year),
        ]);
        if (cancelled) return;
        setRows(buildRows(salaries, expenses, year));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : "No se pudo cargar el historial. ¿Está el servidor disponible?"
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Cargando historial...
      </div>
    );
  }

  const hasData = rows.some((r) => r.sueldo > 0 || r.gastado > 0);

  const chartData = rows.map((r) => ({
    name: MONTH_NAMES_SHORT[r.month - 1],
    Ingreso: r.sueldo,
    Gastado: r.gastado,
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      sueldo: acc.sueldo + r.sueldo,
      gastado: acc.gastado + r.gastado,
      comprometido: acc.comprometido + r.comprometido,
      ahorro: acc.ahorro + r.ahorro,
    }),
    { sueldo: 0, gastado: 0, comprometido: 0, ahorro: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Historial del año
        </h2>
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
          <button
            onClick={() => setYear((y) => y - 1)}
            title="Año anterior"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[60px] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            title="Año siguiente"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No hay datos registrados en {year}.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico ingreso vs gastado por mes (RF-21) */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Ingreso vs Gastado por mes
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e4e4e7"
                />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickFormatter={(value: number) =>
                    value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : value >= 1000
                        ? `${(value / 1000).toFixed(0)}k`
                        : value.toString()
                  }
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- formatter de recharts (TValue genérico)
                  formatter={(value: any) => formatCurrency(value as number)}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e4e4e7",
                    background: "#fff",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Ingreso"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="Gastado"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla resumen anual (RF-22) */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Mes
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Sueldo
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Gastado
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Comprometido
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Ahorro
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.month}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-700"
                  >
                    <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {monthFullName(r.month)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {r.sueldo > 0 ? formatCurrency(r.sueldo) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {r.gastado > 0 ? formatCurrency(r.gastado) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {r.comprometido > 0 ? formatCurrency(r.comprometido) : "—"}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-medium ${
                        r.ahorro < 0
                          ? "text-red-600 dark:text-red-400"
                          : r.sueldo > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {r.sueldo > 0 ? formatCurrency(r.ahorro) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-zinc-200 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50 font-semibold">
                  <td className="py-2.5 px-4 text-zinc-900 dark:text-zinc-100">
                    Total
                  </td>
                  <td className="py-2.5 px-4 text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(totals.sueldo)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(totals.gastado)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(totals.comprometido)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right ${
                      totals.ahorro < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(totals.ahorro)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
