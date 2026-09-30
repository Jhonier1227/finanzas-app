"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations";
import { useFinanceStore } from "@/store/finance-store";
import { Input, Select } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EXPENSE_CATEGORIES, type Expense } from "@/types";
import { useEffect, useState } from "react";
import { expensesApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const ctxYear = useFinanceStore((s) => s.year);
  const ctxMonth = useFinanceStore((s) => s.month);
  const isEditing = !!expense;
  /** Historial de gastos anteriores (únicos por nombre, el más reciente primero). */
  const [history, setHistory] = useState<Expense[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fecha por defecto: hoy si el contexto es el mes actual; si navegaste a
  // otro mes, el día 1 de ese mes (evita gastos "invisibles" en la lista).
  const defaultDate = () => {
    const now = new Date();
    const isCurrentMonth =
      ctxYear === now.getFullYear() && ctxMonth === now.getMonth() + 1;
    return isCurrentMonth
      ? now.toISOString().slice(0, 10)
      : `${ctxYear}-${String(ctxMonth).padStart(2, "0")}-01`;
  };

  const form = useForm<ExpenseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- incompatibilidad conocida de tipos RHF + Zod 4 (ver AGENTS.md)
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: undefined as unknown as ExpenseFormData["category"],
      productName: "",
      description: "" as unknown as ExpenseFormData["description"],
      price: undefined as unknown as ExpenseFormData["price"],
      type: undefined as unknown as ExpenseFormData["type"],
      date: defaultDate(),
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        category: expense.category,
        productName: expense.productName,
        description: expense.description,
        price: expense.price,
        type: expense.type,
        date: expense.date,
      });
    } else {
      form.reset({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío para select no elegido (ver AGENTS.md)
        category: undefined as any,
        productName: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío (ver AGENTS.md)
        description: "" as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío para input numérico (ver AGENTS.md)
        price: undefined as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío para radio no elegido (ver AGENTS.md)
        type: undefined as any,
        date: defaultDate(),
      } as ExpenseFormData);
    }
  }, [expense, open, form]); // eslint-disable-line react-hooks/exhaustive-deps -- defaultDate deriva del contexto de mes del store

  const productNameValue =
    useWatch({ control: form.control, name: "productName" }) ?? "";

  // Al abrir el diálogo para un gasto nuevo, traer todo el historial para
  // sugerir gastos repetidos (arriendo, servicios...): un clic rellena el
  // formulario y solo se ajustan los valores que cambiaron.
  useEffect(() => {
    if (!open || expense) return;
    let cancelled = false;
    expensesApi
      .list()
      .then((all) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const unique = all.filter((e) => {
          const key = e.productName.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setHistory(unique.slice(0, 100));
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, expense]);

  const suggestions =
    !isEditing && productNameValue.trim().length > 0
      ? history
          .filter((h) =>
            h.productName.toLowerCase().includes(productNameValue.trim().toLowerCase())
          )
          .slice(0, 6)
      : [];

  /** Rellena el formulario con un gasto anterior; el precio queda como punto de partida editable. */
  const applySuggestion = (s: Expense) => {
    form.setValue("productName", s.productName);
    form.setValue("category", s.category);
    form.setValue("description", s.description ?? "");
    form.setValue("price", s.price);
    form.setValue("type", s.type);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (isEditing && expense) {
      await updateExpense(expense.id, data);
    } else {
      await addExpense(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Gasto" : "Nuevo Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select
                label="Categoria"
                placeholder="Selecciona una categoria"
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.category?.message}
              />
            )}
          />

          <div className="relative">
            <Input
              id="productName"
              label="Nombre del producto/servicio"
              placeholder="Ej: Mercado, Netflix, Gasolina..."
              autoComplete="off"
              {...form.register("productName")}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              error={form.formState.errors.productName?.message}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(s)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {s.productName}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {s.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {formatCurrency(s.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-slate-300"
            >
              Descripcion (opcional)
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="Detalle del gasto..."
              className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              {...form.register("description")}
            />
          </div>

          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <CurrencyInput
                id="price"
                label="Precio (COP)"
                placeholder="150.000"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={form.formState.errors.price?.message}
              />
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-slate-300">
              Tipo de gasto
            </label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="realizado" id="realizado" />
                    <label htmlFor="realizado" className="text-sm cursor-pointer dark:text-zinc-300">
                      Ya realizado
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="planificado" id="planificado" />
                    <label htmlFor="planificado" className="text-sm cursor-pointer dark:text-zinc-300">
                      Planificado a futuro
                    </label>
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <Input
            id="date"
            type="date"
            label="Fecha"
            {...form.register("date")}
            error={form.formState.errors.date?.message}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEditing ? "Guardar Cambios" : "Registrar Gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}