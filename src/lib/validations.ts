import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/types";

export const incomeSchema = z.object({
  income: z.coerce.number().min(1, "El ingreso debe ser mayor a 0"),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  productName: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  type: z.enum(["realizado", "planificado"]),
  date: z.string().min(1, "La fecha es obligatoria"),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;