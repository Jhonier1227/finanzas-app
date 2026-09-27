"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [serverError, setServerError] = useState<string | null>(null);

  // El schema es el mismo para login y registro (email + contraseña).
  const form = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- incompatibilidad conocida de tipos RHF + Zod 4 (ver AGENTS.md)
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Ocurrió un error, intenta de nuevo");
      return;
    }

    // Auto-login (registro) o login: la cookie ya quedó fijada por el servidor.
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@correo.com"
        autoComplete="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />

      <Input
        id="password"
        type="password"
        label={mode === "register" ? "Contraseña (mínimo 8 caracteres)" : "Contraseña"}
        placeholder="••••••••"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "Un momento..."
          : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setServerError(null);
          form.reset();
        }}
        className="w-full text-center text-sm text-zinc-500 hover:text-emerald-600 transition-colors cursor-pointer dark:text-zinc-400 dark:hover:text-emerald-400"
      >
        {mode === "login"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </form>
  );
}
