import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/types";

export const incomeSchema = z.object({
  income: z.coerce.number().min(1, "El ingreso debe ser mayor a 0"),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD");

const expenseBase = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  productName: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().optional(),
  price: z.coerce.number().int().min(1, "El precio debe ser mayor a 0"),
  type: z.enum(["realizado", "planificado"]),
  date: dateStringSchema,
});

/** Creación: description por defecto "". */
export const expenseSchema = expenseBase.extend({
  description: z.string().optional().default(""),
});

/** PATCH: sin defaults — solo se actualizan los campos enviados. */
export const expensePatchSchema = expenseBase.partial();

export type ExpenseFormData = z.infer<typeof expenseSchema>;

/** Sueldo mensual (RF-05/06): un registro por (usuario, año, mes). */
export const salarySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1, "Mes inválido").max(12, "Mes inválido"),
  amount: z.coerce.number().int().min(1, "El sueldo debe ser mayor a 0"),
});

export type SalaryFormData = z.infer<typeof salarySchema>;

/** Filtros de consulta por mes/año (?year=&month=). */
export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type MonthQuery = z.infer<typeof monthQuerySchema>;

export const registerSchema = z.object({
  email: z.email("Correo inválido").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = registerSchema;

export type LoginFormData = z.infer<typeof loginSchema>;