"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  housingConfigSchema,
  type HousingConfigFormData,
  type HousingPaymentFormData,
} from "@/lib/validations";
import {
  housingApi,
  ApiError,
  type HousingPaymentDto,
} from "@/lib/api/client";
import { notify } from "@/lib/notify";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  totalPagadoVivienda,
  restanteVivienda,
  porcentajeVivienda,
} from "@/lib/calculations";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { HousingPaymentForm } from "@/components/housing-payment-form";
import { HousePlus, Pencil, Plus, Trash2 } from "lucide-react";
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

/**
 * Módulo Vivienda VIS: valor del inmueble + registro libre de pagos.
 * Independiente del dashboard mensual: aquí se lleva el acumulado personal
 * (cuánto se ha pagado y cuánto resta), con fechas pasadas para el saldo inicial.
 */
export function Vivienda() {
  const [data, setData] = useState<{
    propertyValue: number | null;
    payments: HousingPaymentDto[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HousingPaymentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HousingPaymentDto | null>(null);

  // Carga inicial y recargas (mismo patrón que Historial: sin setState
  // síncrono en el effect, solo dentro de la tarea async con cancelación).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [config, list] = await Promise.all([
          housingApi.getConfig(),
          housingApi.list(),
        ]);
        if (cancelled) return;
        setData({ propertyValue: config?.propertyValue ?? null, payments: list });
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : "No se pudo cargar la vivienda. ¿Está el servidor disponible?"
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setError(null);
    setData(null);
    setReloadKey((k) => k + 1);
  };

  const onSubmitPayment = async (data: HousingPaymentFormData) => {
    if (editing) {
      const updated = await housingApi.update(editing.id, data);
      setData((prev) =>
        prev && {
          ...prev,
          payments: prev.payments
            .map((p) => (p.id === updated.id ? updated : p))
            .sort((a, b) => b.date.localeCompare(a.date)),
        }
      );
      notify("Pago actualizado correctamente");
    } else {
      const created = await housingApi.create(data);
      setData((prev) =>
        prev && {
          ...prev,
          payments: [created, ...prev.payments].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }
      );
      notify("Pago registrado correctamente");
    }
    setEditing(null);
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    await housingApi.remove(deleteTarget.id);
    const id = deleteTarget.id;
    setData((prev) => prev && { ...prev, payments: prev.payments.filter((p) => p.id !== id) });
    setDeleteTarget(null);
    notify("Pago eliminado");
  };

  if (data === null) {
    if (error) {
      return (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <span>{error}</span>
          <button
            onClick={retry}
            className="font-medium underline underline-offset-2 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Cargando tu vivienda...
      </div>
    );
  }

  const { propertyValue, payments } = data;
  const totalPagado = totalPagadoVivienda(payments);
  const restante = propertyValue !== null ? restanteVivienda(propertyValue, totalPagado) : 0;
  const pct = propertyValue !== null ? porcentajeVivienda(totalPagado, propertyValue) : 0;

  return (
    <div className="space-y-6">
      {/* Valor del inmueble + avance */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
        <PropertyValueForm
          key={propertyValue ?? "sin-valor"}
          initialValue={propertyValue}
          onSaved={(v) => {
            setData((prev) => (prev ? { ...prev, propertyValue: v } : prev));
            notify("Valor del inmueble guardado");
          }}
        />

        {propertyValue !== null && propertyValue > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-900/30">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Total pagado
                </p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                  {formatCurrency(totalPagado)}
                </p>
              </div>
              <div className={`rounded-lg px-4 py-3 ${restante < 0 ? "bg-red-50 dark:bg-red-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}>
                <p className={`text-xs font-medium ${restante < 0 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                  Saldo restante
                </p>
                <p className={`text-xl font-bold ${restante < 0 ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                  {formatCurrency(Math.abs(restante))}
                  {restante < 0 && <span className="text-xs ml-1">(pagado de más)</span>}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/30">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Avance
                </p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  {pct.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Pagos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Pagos registrados
          </h2>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Registrar pago
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
            <HousePlus className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              Aún no hay pagos. Registra el primero (vale con fecha pasada si ya
              habías pagado antes).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Registrar primer pago
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Fecha
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Valor
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Nota
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/30"
                  >
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                      {p.note || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          className="rounded-lg p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HousingPaymentForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        payment={editing}
        onSubmit={onSubmitPayment}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pago</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar el pago de {deleteTarget && formatCurrency(deleteTarget.amount)} del{" "}
              {deleteTarget && formatDate(deleteTarget.date)}? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDelete()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Formulario del valor del inmueble. Se monta con `key` desde el padre para
 * precargar el valor guardado sin setState en effects (regla react-hooks v6).
 */
function PropertyValueForm({
  initialValue,
  onSaved,
}: {
  initialValue: number | null;
  onSaved: (value: number) => void;
}) {
  const form = useForm<HousingConfigFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- incompatibilidad conocida de tipos RHF + Zod 4 (ver AGENTS.md)
    resolver: zodResolver(housingConfigSchema) as any,
    defaultValues: {
      propertyValue: (initialValue ?? undefined) as unknown as number,
    },
  });

  const onSubmit = async (data: HousingConfigFormData) => {
    const saved = await housingApi.saveConfig(data.propertyValue);
    onSaved(saved.propertyValue);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1">
        <Controller
          control={form.control}
          name="propertyValue"
          render={({ field }) => (
            <CurrencyInput
              id="property-value"
              label="Valor del inmueble (COP)"
              placeholder="Ej: 239.203.565"
              value={field.value ?? null}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={form.formState.errors.propertyValue?.message}
            />
          )}
        />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
