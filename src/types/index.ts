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