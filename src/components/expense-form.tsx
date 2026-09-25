"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations";
import { useFinanceStore } from "@/store/finance-store";
import { Input, Select } from "@/components/ui/input";
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
import { useEffect } from "react";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const isEditing = !!expense;

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: undefined as unknown as ExpenseFormData["category"],
      productName: "",
      description: "" as unknown as ExpenseFormData["description"],
      price: undefined as unknown as ExpenseFormData["price"],
      type: undefined as unknown as ExpenseFormData["type"],
      date: new Date().toISOString().slice(0, 10),
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
        category: undefined as any,
        productName: "",
        description: "" as any,
        price: undefined as any,
        type: undefined as any,
        date: new Date().toISOString().slice(0, 10),
      } as ExpenseFormData);
    }
  }, [expense, open, form]);

  const onSubmit = (data: ExpenseFormData) => {
    if (isEditing && expense) {
      updateExpense(expense.id, data);
    } else {
      addExpense(data);
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

          <Input
            id="productName"
            label="Nombre del producto/servicio"
            placeholder="Ej: Mercado, Netflix, Gasolina..."
            {...form.register("productName")}
            error={form.formState.errors.productName?.message}
          />

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

          <Input
            id="price"
            type="number"
            label="Precio (COP)"
            placeholder="150000"
            {...form.register("price", { valueAsNumber: true })}
            error={form.formState.errors.price?.message}
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