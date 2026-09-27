"use client";

import { useState, useSyncExternalStore } from "react";
import { useFinanceStore } from "@/store/finance-store";
import { importApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import type { ExpenseFormData } from "@/lib/validations";

/**
 * Importación única de datos locales (RF-24, T3.5).
 * Detecta los datos que Zustand persist guardaba en localStorage
 * (clave "finanzas-app-storage") y los envía a la BD del usuario.
 * Tras importar (o al ignorar) marca "finanzas-app-imported" para no repetir.
 *
 * La lectura de localStorage usa useSyncExternalStore: es estado del navegador,
 * no de React; getServerSnapshot=null mantiene la hidratación consistente.
 */

const STORAGE_KEY = "finanzas-app-storage";
const IMPORTED_FLAG = "finanzas-app-imported";

interface LocalData {
  income: number;
  expenses: ExpenseFormData[];
}

function readLocalData(): LocalData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const income = Number(parsed?.state?.income) || 0;
    const expenses = Array.isArray(parsed?.state?.expenses)
      ? (parsed.state.expenses as ExpenseFormData[])
      : [];
    if (income <= 0 && expenses.length === 0) return null;
    return { income, expenses };
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

// El snapshot de useSyncExternalStore DEBE ser referencialmente estable:
// si devuelve un objeto nuevo en cada llamada, React re-renderiza en bucle
// ("The result of getSnapshot should be cached" / "Maximum update depth").
let cachedSnapshot: LocalData | null = null;
let snapshotComputed = false;

function getClientSnapshot(): LocalData | null {
  if (!snapshotComputed) {
    snapshotComputed = true;
    cachedSnapshot = localStorage.getItem(IMPORTED_FLAG)
      ? null
      : readLocalData();
  }
  return cachedSnapshot;
}

const getServerSnapshot = (): LocalData | null => null;

export function ImportLocalData() {
  const loadMonth = useFinanceStore((s) => s.loadMonth);
  const data = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!data || hidden) return null;

  const dismiss = () => {
    localStorage.setItem(IMPORTED_FLAG, "1");
    setHidden(true);
  };

  const handleImport = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await importApi.send({
        income: data.income,
        expenses: data.expenses,
      });
      localStorage.setItem(IMPORTED_FLAG, "1");
      await loadMonth();
      setDone(
        `Importación completa: ${result.expensesImported} gasto(s)` +
          (result.salaryRegistered ? " y el sueldo del mes actual" : "")
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron importar los datos. Intenta de nuevo."
      );
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        <span>{done}</span>
        <button
          onClick={() => setHidden(true)}
          className="p-1 hover:bg-emerald-100 rounded-md cursor-pointer dark:hover:bg-emerald-900/50"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/30">
      <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
      <p className="text-sm text-blue-800 dark:text-blue-200 flex-1">
        Encontramos datos guardados en este dispositivo (
        {data.expenses.length} gasto(s)
        {data.income > 0 ? " y un ingreso" : ""}). ¿Quieres importarlos a tu
        cuenta? Es una acción única.
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={handleImport} disabled={busy}>
          {busy ? "Importando..." : "Importar"}
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss} disabled={busy}>
          Ignorar
        </Button>
      </div>
    </div>
  );
}
