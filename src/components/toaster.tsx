"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Muestra los avisos enviados con `notify()` como mensaje flotante
 * inferior que desaparece solo (3,5 s). Sin librerías externas.
 */
export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 3500);
    };
    window.addEventListener("finanzas:notify", handler);
    return () => {
      window.removeEventListener("finanzas:notify", handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-emerald-500 dark:text-zinc-950">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
