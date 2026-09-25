"use client";

import { useState, useMemo } from "react";
import { useFinanceStore } from "@/store/finance-store";
import type { Expense, ExpenseCategory, ExpenseType } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Trash2, Search, Filter, Plus } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExpenseList() {
  const expenses = useFinanceStore((s) => s.expenses);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterCategory && e.category !== filterCategory) return false;
        if (filterType && e.type !== filterType) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            e.productName.toLowerCase().includes(s) ||
            e.description?.toLowerCase().includes(s) ||
            e.category.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCategory, filterType, dateFrom, dateTo, search]);

  const getTypeLabel = (type: ExpenseType) => {
    return type === "realizado" ? "Realizado" : "Planificado";
  };

  const getTypeBadgeColor = (type: ExpenseType) => {
    return type === "realizado"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingExpense(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Gastos Registrados
        </h2>
        <Button
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <Select
          options={[
            { value: "", label: "Todas las categorias" },
            ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          value={filterCategory}
          onChange={setFilterCategory}
          className="min-w-[150px]"
        />
        <Select
          options={[
            { value: "", label: "Todos los tipos" },
            { value: "realizado", label: "Realizado" },
            { value: "planificado", label: "Planificado" },
          ]}
          value={filterType}
          onChange={setFilterType}
          className="min-w-[140px]"
        />
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 w-[140px] rounded-lg border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:[color-scheme:dark]"
            title="Desde"
          />
          <span className="text-zinc-400">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 w-[140px] rounded-lg border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:[color-scheme:dark]"
            title="Hasta"
          />
        </div>
        {(filterCategory || filterType || dateFrom || dateTo || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCategory("");
              setFilterType("");
              setDateFrom("");
              setDateTo("");
              setSearch("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            No hay gastos registrados todavia.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingExpense(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Registrar primer gasto
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Producto
                </th>
                <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Categoria
                </th>
                <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Precio
                </th>
                <th className="py-3 px-4 text-center font-medium text-zinc-600 dark:text-zinc-400">
                  Tipo
                </th>
                <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Fecha
                </th>
                <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No se encontraron gastos con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/30"
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {expense.productName}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {expense.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      {expense.category}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(expense.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                          expense.type
                        )}`}
                      >
                        {getTypeLabel(expense.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-sm">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(expense)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        onOpenChange={handleFormClose}
        expense={editingExpense}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar el gasto &quot;
              {deleteTarget?.productName}&quot;? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteExpense(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}