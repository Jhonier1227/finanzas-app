import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Finanzas App",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Finanzas App
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Control personal de gastos mensuales
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
