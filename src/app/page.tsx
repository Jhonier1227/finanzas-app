"use client";

import { useEffect, useState } from "react";
import { IncomeForm } from "@/components/income-form";
import { Dashboard } from "@/components/dashboard";
import { ExpenseList } from "@/components/expense-list";
import { Historial } from "@/components/historial";
import { Vivienda } from "@/components/vivienda";
import { MonthSelector } from "@/components/month-selector";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { ImportLocalData } from "@/components/import-local-data";
import { ProfileDialog } from "@/components/profile-dialog";
import { useFinanceStore } from "@/store/finance-store";
import { profileApi, type ProfileDto } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import {
  History,
  House,
  LayoutDashboard,
  ListFilter,
  LogOut,
  UserRound,
  Wallet,
} from "lucide-react";

type Tab = "dashboard" | "gastos" | "historial" | "vivienda";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const income = useFinanceStore((s) => s.income);
  const loading = useFinanceStore((s) => s.loading);
  const error = useFinanceStore((s) => s.error);
  const loadMonth = useFinanceStore((s) => s.loadMonth);

  // T3.3: al entrar, cargar sueldo + gastos del mes actual desde la API.
  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  // N6: perfil de la sesión (correo + nombre/apellido). Si la sesión venció,
  // el cliente API redirige a /login (401), así que aquí basta ignorar el error.
  useEffect(() => {
    profileApi.me().then(setProfile).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-6xl px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30 shrink-0">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  Finanzas App
                </h1>
                {income > 0 && (
                  <p className="hidden sm:block text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(income)} / mes
                  </p>
                )}
              </div>
            </div>

            {/* Navigation — en móvil solo iconos, texto desde sm (RF-27) */}
            <nav className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("gastos")}
                className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "gastos"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <ListFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Gastos</span>
              </button>
              <button
                onClick={() => setActiveTab("historial")}
                className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "historial"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </button>
              <button
                onClick={() => setActiveTab("vivienda")}
                className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "vivienda"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <House className="h-4 w-4" />
                <span className="hidden sm:inline">Vivienda</span>
              </button>
              <div className="ml-1 sm:ml-2 border-l border-zinc-200 pl-1 sm:pl-2 dark:border-zinc-700">
                <DarkModeToggle />
              </div>
              <button
                onClick={() => setProfileOpen(true)}
                title={profile?.email ?? "Mi perfil"}
                className="flex items-center gap-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <UserRound className="h-4 w-4" />
                {profile?.firstName && (
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {profile.firstName}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex items-center gap-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800"
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
            {/* Selector de mes (RF-15) — no aplica a Historial (selector de
                año propio) ni a Vivienda (acumulado total, sin meses) */}
            {activeTab !== "historial" && activeTab !== "vivienda" && (
              <div className="flex justify-center sm:justify-start">
                <MonthSelector />
              </div>
            )}

            {/* Income: solo en meses con dashboard/gastos */}
            {activeTab !== "historial" && activeTab !== "vivienda" && (
              <div className="max-w-md">
                <IncomeForm />
              </div>
            )}

            {/* Content based on active tab */}
            {activeTab === "dashboard" ? (
              <Dashboard />
            ) : activeTab === "gastos" ? (
              <ExpenseList />
            ) : activeTab === "vivienda" ? (
              <Vivienda />
            ) : (
              <Historial />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Finanzas App &mdash; Control de gastos personales
      </footer>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
        onUpdated={setProfile}
      />
    </div>
  );
}