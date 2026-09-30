import type { Expense } from "@/types";
import type { ExpenseFormData, SalaryFormData } from "@/lib/validations";

/**
 * Capa de cliente para la API (T3.1).
 * - Tipada: las respuestas usan los DTOs del dominio.
 * - Si el servidor responde 401, se redirige a /login (sesión vencida).
 * - El resto de errores lanzan ApiError con el mensaje del servidor (español).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SalaryDto {
  id: string;
  year: number;
  month: number;
  amount: number;
}

export interface ImportResult {
  expensesImported: number;
  salaryRegistered: boolean;
}

export interface ProfileDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface HousingConfigDto {
  propertyValue: number;
  updatedAt: string;
}

export interface HousingPaymentDto {
  id: string;
  date: string;
  amount: number;
  note: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    // Sesión inexistente o vencida: de vuelta al login (RNF-14).
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Sesión no válida", 401);
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      body?.error ?? `Error del servidor (HTTP ${res.status})`,
      res.status
    );
  }

  return body as T;
}

function monthQuery(year?: number, month?: number): string {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (month !== undefined) params.set("month", String(month));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const expensesApi = {
  list: (year?: number, month?: number) =>
    request<Expense[]>(`/api/expenses${monthQuery(year, month)}`),
  create: (data: ExpenseFormData) =>
    request<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ExpenseFormData>) =>
    request<Expense>(`/api/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/api/expenses/${id}`, { method: "DELETE" }),
};

export const salariesApi = {
  list: (year?: number, month?: number) =>
    request<SalaryDto[]>(`/api/salaries${monthQuery(year, month)}`),
  /** Upsert: crea o actualiza el sueldo del mes/año indicado. */
  save: (data: SalaryFormData) =>
    request<SalaryDto>("/api/salaries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const profileApi = {
  /** Perfil del usuario actual (correo + nombre y apellido). */
  me: () => request<ProfileDto>("/api/auth/me"),
  update: (data: { firstName?: string; lastName?: string }) =>
    request<ProfileDto>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  /** Elimina la cuenta y todos sus datos (irreversible). */
  remove: () =>
    request<{ ok: true }>("/api/auth/me", { method: "DELETE" }),
};

export const importApi = {
  /** Importa una sola vez los datos guardados en localStorage (RF-24). */
  send: (data: { income?: number; expenses?: ExpenseFormData[] }) =>
    request<ImportResult>("/api/import", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const housingApi = {
  /** Valor del inmueble (null si aún no se configuró). */
  getConfig: () => request<HousingConfigDto | null>("/api/housing/config"),
  saveConfig: (propertyValue: number) =>
    request<HousingConfigDto>("/api/housing/config", {
      method: "PUT",
      body: JSON.stringify({ propertyValue }),
    }),
  list: () => request<HousingPaymentDto[]>("/api/housing/payments"),
  create: (data: { date: string; amount: number; note?: string }) =>
    request<HousingPaymentDto>("/api/housing/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{ date: string; amount: number; note: string }>) =>
    request<HousingPaymentDto>(`/api/housing/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/api/housing/payments/${id}`, { method: "DELETE" }),
};
