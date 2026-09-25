"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, type IncomeFormData } from "@/lib/validations";
import { useFinanceStore } from "@/store/finance-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function IncomeForm() {
  const income = useFinanceStore((s) => s.income);
  const setIncome = useFinanceStore((s) => s.setIncome);
  const [editing, setEditing] = useState(false);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: { income: income || undefined },
  });

  const onSubmit = (data: IncomeFormData) => {
    setIncome(data.income);
    setEditing(false);
  };

  if (!editing && income > 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/30">
        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Ingreso Mensual
          </p>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(income)}
          </p>
        </div>
        <button
          onClick={() => {
            form.reset({ income });
            setEditing(true);
          }}
          className="ml-auto rounded-lg p-2 text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
          title="Editar ingreso"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          id="income"
          type="number"
          label="Ingreso Mensual (COP)"
          placeholder="Ej: 2000000"
          {...form.register("income", { valueAsNumber: true })}
          error={form.formState.errors.income?.message}
        />
      </div>
      <div className="flex gap-1">
        <Button type="submit" size="md">
          <Save className="h-4 w-4" />
        </Button>
        {income > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}