"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  housingPaymentSchema,
  type HousingPaymentFormData,
} from "@/lib/validations";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { HousingPaymentDto } from "@/lib/api/client";

interface HousingPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: HousingPaymentDto | null;
  onSubmit: (data: HousingPaymentFormData) => Promise<void>;
}

/** Diálogo crear/editar pago de vivienda (fecha + valor + nota opcional). */
export function HousingPaymentForm({
  open,
  onOpenChange,
  payment,
  onSubmit,
}: HousingPaymentFormProps) {
  const isEditing = !!payment;

  const form = useForm<HousingPaymentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- incompatibilidad conocida de tipos RHF + Zod 4 (ver AGENTS.md)
    resolver: zodResolver(housingPaymentSchema) as any,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío para input numérico (ver AGENTS.md)
      amount: undefined as any,
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        payment
          ? { date: payment.date, amount: payment.amount, note: payment.note ?? "" }
          : {
              date: new Date().toISOString().slice(0, 10),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- placeholder vacío (ver AGENTS.md)
              amount: undefined as any,
              note: "",
            }
      );
    }
  }, [open, payment, form]);

  const submit = async (data: HousingPaymentFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar pago" : "Registrar pago de vivienda"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4 mt-4">
          <Input
            id="housing-date"
            type="date"
            label="Fecha del pago"
            {...form.register("date")}
            error={form.formState.errors.date?.message}
          />

          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput
                id="housing-amount"
                label="Valor pagado (COP)"
                placeholder="500.000"
                value={field.value ?? null}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={form.formState.errors.amount?.message}
              />
            )}
          />

          <Input
            id="housing-note"
            label="Nota (opcional)"
            placeholder="Ej: Recibo 123, abono extra..."
            maxLength={200}
            {...form.register("note")}
            error={form.formState.errors.note?.message}
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
              {isEditing ? "Guardar cambios" : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
