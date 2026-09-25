"use client";

import { useMemo } from "react";
import { useFinanceStore } from "@/store/finance-store";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingDown,
  CalendarClock,
  PiggyBank,
} from "lucide-react";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Alimentación: "#10b981",
  Transporte: "#3b82f6",
  "Vivienda/Arriendo": "#8b5cf6",
  "Servicios públicos": "#f59e0b",
  Entretenimiento: "#ec4899",
  Salud: "#ef4444",
  Educación: "#6366f1",
  "Ropa/Personal": "#14b8a6",
  "Ahorro/Inversión": "#84cc16",
  Otros: "#64748b",
};

const RADIAN = Math.PI / 180;

function CustomPieLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
}) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    outerRadius = 0,
    percent = 0,
    name,
  } = props;
  if (!name) return null;
  if (percent < 0.05) return null;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      className="fill-zinc-600 dark:fill-zinc-300"
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

export function Dashboard() {
  const income = useFinanceStore((s) => s.income);
  const expenses = useFinanceStore((s) => s.expenses);

  const totalRealizado = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "realizado")
        .reduce((sum, e) => sum + e.price, 0),
    [expenses]
  );

  const totalPlanificado = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "planificado")
        .reduce((sum, e) => sum + e.price, 0),
    [expenses]
  );

  const disponible = income - totalRealizado - totalPlanificado;

  const pieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      categoryTotals[c] = 0;
    });
    expenses
      .filter((e) => e.type === "realizado")
      .forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.price;
      });
    return EXPENSE_CATEGORIES.filter(
      (c) => categoryTotals[c] > 0
    ).map((c) => ({
      name: c,
      value: categoryTotals[c],
    }));
  }, [expenses]);

  const barData = useMemo(() => {
    const categoryTotals: Record<string, { realizado: number; planificado: number }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      categoryTotals[c] = { realizado: 0, planificado: 0 };
    });
    expenses.forEach((e) => {
      if (!categoryTotals[e.category]) {
        categoryTotals[e.category] = { realizado: 0, planificado: 0 };
      }
      if (e.type === "realizado") {
        categoryTotals[e.category].realizado += e.price;
      } else {
        categoryTotals[e.category].planificado += e.price;
      }
    });
    return Object.entries(categoryTotals)
      .filter(([_, v]) => v.realizado > 0 || v.planificado > 0)
      .map(([name, v]) => ({
        name,
        realizado: v.realizado,
        planificado: v.planificado,
      }));
  }, [expenses]);

  const gastoPct = income > 0 ? (totalRealizado / income) * 100 : 0;

  if (income === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          Configura tu ingreso mensual para ver el dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Ingreso Total
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(income)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total Gastado
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalRealizado)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Comprometido (Planificado)
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalPlanificado)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                disponible < 0
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              <PiggyBank
                className={`h-5 w-5 ${
                  disponible < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Saldo Disponible
              </p>
              <p
                className={`text-xl font-bold ${
                  disponible >= 0 ? "text-zinc-900 dark:text-zinc-100" : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(Math.abs(disponible))}
                {disponible < 0 && (
                  <span className="text-xs ml-1">(Negativo)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Gastos realizados respecto al ingreso
          </span>
          <span
            className={`text-sm font-semibold ${
              gastoPct > 100
                ? "text-red-600 dark:text-red-400"
                : gastoPct > 80
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {gastoPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              gastoPct > 100
                ? "bg-red-500"
                : gastoPct > 80
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(gastoPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Distribucion por Categoria
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={CustomPieLabel}
                    isAnimationActive={true}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          CATEGORY_COLORS[entry.name as ExpenseCategory] ??
                          "#64748b"
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value as number)}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid #e4e4e7",
                      background: "#fff",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                Registra gastos realizados para ver la distribucion.
              </p>
            )}
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Realizado vs Planificado por Categoria
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e4e4e7"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                  />
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
                    formatter={(value: any) => formatCurrency(value as number)}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid #e4e4e7",
                    }}
                  />
                  <Legend
                    formatter={(value: any) =>
                      value === "realizado" ? "Realizado" : "Planificado"
                    }
                  />
                  <Bar
                    dataKey="realizado"
                    name="Realizado"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="planificado"
                    name="Planificado"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                Sin gastos para comparar.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}