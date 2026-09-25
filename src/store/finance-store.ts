import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense } from "@/types";
import type { ExpenseFormData } from "@/lib/validations";
import { generateId } from "@/lib/utils";

interface FinanceStore {
  income: number;
  expenses: Expense[];
  setIncome: (income: number) => void;
  addExpense: (data: ExpenseFormData) => void;
  updateExpense: (id: string, data: ExpenseFormData) => void;
  deleteExpense: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      income: 0,
      expenses: [],
      setIncome: (income) => set({ income }),
      addExpense: (data) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            {
              id: generateId(),
              category: data.category,
              productName: data.productName,
              description: data.description ?? "",
              price: data.price,
              type: data.type,
              date: data.date,
            },
          ],
        })),
      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === id
              ? {
                  ...exp,
                  category: data.category,
                  productName: data.productName,
                  description: data.description ?? "",
                  price: data.price,
                  type: data.type,
                  date: data.date,
                }
              : exp
          ),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        })),
    }),
    {
      name: "finanzas-app-storage",
    }
  )
);