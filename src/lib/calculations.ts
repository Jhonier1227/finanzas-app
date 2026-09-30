import type { Expense, ExpenseCategory, ExpenseType } from "@/types";

/**
 * Motores de cálculo de la app (PROYECTO.md §10).
 * Funciones puras: las usan tanto la API como los componentes.
 * Todos los montos son enteros en COP.
 */

/** Suma de precios de los gastos de un tipo dado. */
export function totalPorTipo(expenses: Expense[], type: ExpenseType): number {
  return expenses
    .filter((e) => e.type === type)
    .reduce((sum, e) => sum + e.price, 0);
}

/** Total de gastos ya ejecutados. */
export function totalRealizado(expenses: Expense[]): number {
  return totalPorTipo(expenses, "realizado");
}

/** Total comprometido (gastos planificados). */
export function totalPlanificado(expenses: Expense[]): number {
  return totalPorTipo(expenses, "planificado");
}

/** Saldo disponible = ingreso − gastado − comprometido. Puede ser negativo. */
export function saldoDisponible(
  income: number,
  totalGastado: number,
  comprometido: number
): number {
  return income - totalGastado - comprometido;
}

/** % del ingreso ya gastado (gasto realizado / ingreso × 100). */
export function porcentajeGasto(totalGastado: number, income: number): number {
  return income > 0 ? (totalGastado / income) * 100 : 0;
}

/** Semáforo del % de gasto: >100 rojo, >80 ámbar, resto verde. */
export function colorPorcentaje(pct: number): "verde" | "ambar" | "rojo" {
  if (pct > 100) return "rojo";
  if (pct > 80) return "ambar";
  return "verde";
}

/** Ahorro del mes = ingreso − gasto realizado. */
export function ahorroDelMes(income: number, totalGastado: number): number {
  return income - totalGastado;
}

/** Totales por categoría (solo gastos del tipo indicado). */
export function totalesPorCategoria(
  expenses: Expense[],
  type: ExpenseType = "realizado"
): Partial<Record<ExpenseCategory, number>> {
  const totals: Partial<Record<ExpenseCategory, number>> = {};
  for (const e of expenses) {
    if (e.type !== type) continue;
    totals[e.category] = (totals[e.category] ?? 0) + e.price;
  }
  return totals;
}

/** Totales realizado/planificado por categoría. */
export function totalesPorCategoriaYTipo(
  expenses: Expense[]
): Partial<Record<ExpenseCategory, { realizado: number; planificado: number }>> {
  const totals: Partial<
    Record<ExpenseCategory, { realizado: number; planificado: number }>
  > = {};
  for (const e of expenses) {
    const entry = (totals[e.category] ??= { realizado: 0, planificado: 0 });
    entry[e.type] += e.price;
  }
  return totals;
}

/** Filtra los gastos que pertenecen a un mes/año por su campo date ("YYYY-MM-DD"). */
export function gastosDelMes(
  expenses: Expense[],
  year: number,
  month: number
): Expense[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return expenses.filter((e) => e.date.startsWith(prefix));
}

// --- Módulo Vivienda VIS (pagos libres hacia el inmueble propio) ---

export interface HousingPaymentLike {
  amount: number;
}

/** Total personal acumulado: Σ de todos los pagos registrados. */
export function totalPagadoVivienda(payments: HousingPaymentLike[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

/** Saldo restante = valor del inmueble − total pagado. Puede ser negativo (se pagó de más). */
export function restanteVivienda(propertyValue: number, totalPagado: number): number {
  return propertyValue - totalPagado;
}

/** % del inmueble ya pagado (0-100+, sin tope para ver sobrepagos). */
export function porcentajeVivienda(totalPagado: number, propertyValue: number): number {
  return propertyValue > 0 ? (totalPagado / propertyValue) * 100 : 0;
}
