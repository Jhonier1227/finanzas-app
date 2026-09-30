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

/**
 * Recuperación de contraseña con código de verificación (uso personal).
 * El código vive en la variable de entorno RECOVERY_CODE (nunca en git);
 * el servidor lo compara y, si coincide, fija la contraseña nueva.
 */
export const recoverSchema = z.object({
  email: z.email("Correo inválido").trim().toLowerCase(),
  code: z.string().trim().min(1, "El código de verificación es obligatorio"),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type RecoverFormData = z.infer<typeof recoverSchema>;

/**
 * Perfil del usuario (N6): nombre y apellido opcionales que se registran
 * dentro de la plataforma, después de crear la cuenta. Se usa en
 * PATCH /api/auth/me (sin defaults: solo actualiza lo enviado).
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres")
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/** Valor del inmueble (módulo Vivienda VIS): único por usuario, editable. */
export const housingConfigSchema = z.object({
  propertyValue: z.coerce
    .number()
    .int()
    .min(1, "El valor del inmueble debe ser mayor a 0"),
});

export type HousingConfigFormData = z.infer<typeof housingConfigSchema>;

const housingPaymentBase = z.object({
  date: dateStringSchema,
  amount: z.coerce.number().int().min(1, "El valor debe ser mayor a 0"),
  note: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

/** Creación de pago: nota por defecto "". */
export const housingPaymentSchema = housingPaymentBase.extend({
  note: z.string().trim().max(200, "Máximo 200 caracteres").optional().default(""),
});

/** PATCH: sin defaults — solo se actualizan los campos enviados. */
export const housingPaymentPatchSchema = housingPaymentBase.partial();

export type HousingPaymentFormData = z.infer<typeof housingPaymentSchema>;