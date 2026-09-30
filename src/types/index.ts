export type ExpenseCategory =
  | "Alimentación"
  | "Transporte"
  | "Vivienda/Arriendo"
  | "Servicios públicos"
  | "Entretenimiento"
  | "Salud"
  | "Educación"
  | "Ropa/Personal"
  | "Ahorro/Inversión"
  | "Otros";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Alimentación",
  "Transporte",
  "Vivienda/Arriendo",
  "Servicios públicos",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Ropa/Personal",
  "Ahorro/Inversión",
  "Otros",
];

export type ExpenseType = "realizado" | "planificado";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  productName: string;
  description: string;
  price: number;
  type: ExpenseType;
  date: string;
}

export interface AppState {
  income: number;
  expenses: Expense[];
}

/** Pago registrado hacia la vivienda propia (módulo Vivienda VIS). */
export interface HousingPayment {
  id: string;
  /** Día del pago ("YYYY-MM-DD"); admite fechas pasadas para el saldo inicial. */
  date: string;
  /** Valor pagado en COP (entero, > 0). */
  amount: number;
  /** Nota opcional (nro. de recibo, "abono extra"...). */
  note: string;
}