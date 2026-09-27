import { create } from "zustand";
import type { Expense } from "@/types";
import type { ExpenseFormData } from "@/lib/validations";
import { ApiError, expensesApi, salariesApi } from "@/lib/api/client";

/**
 * Store financiero (T3.2):
 * - Fuente de verdad = la API/BD. Zustand solo cachea en memoria el mes activo.
 * - Ya NO persiste en localStorage (T3.6); la importación de datos locales
 *   se hace en src/components/import-local-data.tsx.
 * - Cada mutación llama primero a la API; si falla, el estado no cambia y el
 *   error queda disponible en `error` para mostrarlo (RNF-14).
 */

interface FinanceStore {
  /** Mes/año en contexto (Fase 4: selector de mes los cambiará). */
  year: number;
  month: number;
  /** Sueldo del mes en contexto (0 = no registrado). */
  income: number;
  /** Gastos del mes en contexto. */
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  /** Carga sueldo + gastos de un mes. Por defecto el mes actual. */
  loadMonth: (year?: number, month?: number) => Promise<void>;
  setIncome: (amount: number) => Promise<void>;
  addExpense: (data: ExpenseFormData) => Promise<void>;
  updateExpense: (id: string, data: ExpenseFormData) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearError: () => void;
}

const now = new Date();

export const useFinanceStore = create<FinanceStore>()((set, get) => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  income: 0,
  expenses: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  loadMonth: async (year, month) => {
    const y = year ?? get().year;
    const m = month ?? get().month;
    set({ year: y, month: m, loading: true, error: null });
    try {
      const [salaries, expenses] = await Promise.all([
        salariesApi.list(y, m),
        expensesApi.list(y, m),
      ]);
      set({
        income: salaries[0]?.amount ?? 0,
        expenses,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error:
          e instanceof ApiError
            ? e.message
            : "No se pudieron cargar los datos. ¿Está el servidor disponible?",
      });
    }
  },

  setIncome: async (amount) => {
    const { year, month } = get();
    await salariesApi.save({ year, month, amount });
    set({ income: amount });
  },

  addExpense: async (data) => {
    const created = await expensesApi.create(data);
    // Si el gasto pertenece al mes en contexto, aparece de inmediato.
    const prefix = `${get().year}-${String(get().month).padStart(2, "0")}`;
    if (created.date.startsWith(prefix)) {
      set((state) => ({ expenses: [created, ...state.expenses] }));
    }
  },

  updateExpense: async (id, data) => {
    const updated = await expensesApi.update(id, data);
    set((state) => ({
      expenses: state.expenses.map((exp) => (exp.id === id ? updated : exp)),
    }));
  },

  deleteExpense: async (id) => {
    await expensesApi.remove(id);
    set((state) => ({
      expenses: state.expenses.filter((exp) => exp.id !== id),
    }));
  },
}));
