"use client";

import {
  forwardRef,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  label?: string;
  error?: string;
  /** Valor numérico en COP (sin decimales). `null` = campo vacío. */
  value?: number | null;
  /**
   * Vaciar el campo emite `null` (no `undefined`): React Hook Form descarta
   * `undefined` y restaura el valor inicial del campo, lo que impedía borrar
   * por completo. `null` sí persiste y Zod lo rechaza con mensaje en español.
   */
  onChange?: (value: number | null) => void;
}

/** Máximo de dígitos (999.999.999.999 basta para COP y evita errores de precisión). */
const MAX_DIGITS = 12;

/** Formatea un entero COP con separador de miles es-CO: 1000 → "1.000". */
export function formatCOPInput(value: number | null | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return value.toLocaleString("es-CO");
}

/** Extrae el entero de un texto con puntos de miles: "1.000" → 1000, "" → null. */
export function parseCOPInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
  if (!digits) return null;
  return Number(digits);
}

function countDigits(text: string): number {
  let n = 0;
  for (const ch of text) if (ch >= "0" && ch <= "9") n++;
  return n;
}

/** Posición dentro de `formatted` justo después de `digitIndex` dígitos. */
function caretAfterDigits(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= "0" && formatted[i] <= "9") {
      seen++;
      if (seen === digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * Input de moneda COP con separador de miles mientras se escribe.
 * - Muestra 1.000 / 10.000 / 1.000.000 a medida que se digita.
 * - El cursor se conserva donde corresponde al reformatear.
 * - Borrar un punto separador borra el dígito anterior (como un backspace
 *   normal) y se puede vaciar el campo por completo.
 * - El formulario recibe siempre un número entero (o null si está vacío),
 *   así que los schemas Zod con `z.coerce.number()` siguen funcionando.
 */
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, id, value, onChange, placeholder, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const caret = e.target.selectionStart ?? raw.length;
      const inputType = (e.nativeEvent as InputEvent).inputType ?? "";
      const current =
        value === undefined || value === null || Number.isNaN(value)
          ? ""
          : String(value);

      let digits = raw.replace(/\D/g, "");
      let caretDigitIndex = countDigits(raw.slice(0, caret));

      if (digits === current && digits !== "") {
        // Ningún dígito cambió: se tocó un punto separador.
        if (inputType === "deleteContentBackward" && caretDigitIndex > 0) {
          const drop = caretDigitIndex - 1;
          digits = digits.slice(0, drop) + digits.slice(drop + 1);
          caretDigitIndex = drop;
        } else if (inputType === "deleteContentForward") {
          const drop = Math.min(caretDigitIndex, digits.length - 1);
          digits = digits.slice(0, drop) + digits.slice(drop + 1);
        }
        // Si se digitó un punto a mano, no hay nada que ajustar.
      }

      digits = digits.slice(0, MAX_DIGITS);
      caretDigitIndex = Math.min(caretDigitIndex, digits.length);

      const next = digits === "" ? null : Number(digits);
      onChange?.(next);

      // Reposicionar el cursor tras el reformateo.
      const pos = caretAfterDigits(formatCOPInput(next), caretDigitIndex);
      const el = innerRef.current;
      if (el) requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={(el) => {
            innerRef.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder ?? "1.000.000"}
          value={formatCOPInput(value)}
          onChange={handleChange}
          className={cn(
            "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
            "placeholder:text-zinc-400",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500",
            error && "border-red-500 dark:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
