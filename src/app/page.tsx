"use client";

import { useEffect, useState } from "react";
import { IncomeForm } from "@/components/income-form";
import { Dashboard } from "@/components/dashboard";
import { ExpenseList } from "@/components/expense-list";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { ImportLocalData } from "@/components/import-local-data";
import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency } from "@/lib/utils";
import {
  LayoutDashboard,
  ListFilter,
  LogOut,
  Wallet,
} from "lucide-react";

type Tab = "dashboard" | "gastos";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const income = useFinanceStore((s) => s.income);
  const loading = useFinanceStore((s) => s.loading);
  const error = useFinanceStore((s) => s.error);
  const loadMonth = useFinanceStore((s) => s.loadMonth);

  // T3.3: al entrar, cargar sueldo + gastos del mes actual desde la API.
  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Finanzas App
                </h1>
                {income > 0 && (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(income)} / mes
                  </p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("gastos")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "gastos"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <ListFilter className="h-4 w-4" />
                Gastos
              </button>
              <div className="ml-2 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                <DarkModeToggle />
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Importación única de datos locales (RF-24) */}
        <ImportLocalData />

        {/* Error global de carga (RNF-14) */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <span>{error}</span>
            <button
              onClick={() => void loadMonth()}
              className="font-medium underline underline-offset-2 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-500 dark:text-zinc-400">
            Cargando tus datos...
          </div>
        ) : (
          <>
            {/* Income */}
            <div className="max-w-md">
              <IncomeForm />
            </div>

            {/* Content based on active tab */}
            {activeTab === "dashboard" ? <Dashboard /> : <ExpenseList />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Finanzas App &mdash; Control de gastos personales
      </footer>
    </div>
  );
}