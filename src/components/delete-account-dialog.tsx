"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { profileApi } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "aviso" | "prueba" | "seguro";

const COUNTDOWN_SECONDS = 10;

interface Challenge {
  text: string;
  answer: number;
}

/** Genera una operación fácil (suma, resta sin negativos o multiplicación de tablas). */
function newChallenge(): Challenge {
  const kind = Math.floor(Math.random() * 3);
  if (kind === 0) {
    const a = 2 + Math.floor(Math.random() * 9);
    const b = 2 + Math.floor(Math.random() * 9);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (kind === 1) {
    const a = 3 + Math.floor(Math.random() * 12);
    const b = 2 + Math.floor(Math.random() * (a - 1));
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  return { text: `${a} × ${b}`, answer: a * b };
}

/**
 * Eliminación de cuenta (N7) en tres pasos:
 * 1. Aviso de pérdida total de datos + casilla de consentimiento que se
 *    habilita tras 10 segundos (para leer con calma).
 * 2. Prueba matemática aleatoria fácil que verifica que es un humano.
 * 3. Confirmación final "¿Estás seguro?" con decisión explícita.
 * Todos los pasos tienen opción de cancelar; tras eliminar se sale a /login.
 */
export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [step, setStep] = useState<Step>("aviso");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [agreed, setAgreed] = useState(false);
  const [challenge, setChallenge] = useState<Challenge>(() => newChallenge());
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // El padre monta este diálogo solo al abrirlo (`{deleteOpen && ...}`),
  // así el estado inicial ya es el flujo reiniciado sin necesidad de effects.

  // Cronómetro de 10 s: solo entonces se habilita la casilla.
  useEffect(() => {
    if (!open || step !== "aviso" || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, step, secondsLeft]);

  const startChallenge = () => {
    setChallenge(newChallenge());
    setAnswer("");
    setError(null);
    setStep("prueba");
  };

  const verifyAnswer = () => {
    if (Number(answer) !== challenge.answer) {
      setError("Respuesta incorrecta, intenta de nuevo con otra operación.");
      setChallenge(newChallenge());
      setAnswer("");
      return;
    }
    setError(null);
    setStep("seguro");
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await profileApi.remove();
      window.location.href = "/login";
    } catch {
      setError("No se pudo eliminar la cuenta. Intenta de nuevo.");
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] space-y-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <TriangleAlert className="h-5 w-5" />
            Eliminar cuenta
          </DialogTitle>
        </DialogHeader>

        {step === "aviso" && (
          <div className="space-y-4">
            <DialogDescription className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Al eliminar tu cuenta se borrarán <strong>definitivamente todos tus
              datos</strong>: gastos, sueldos y tu perfil. Esta acción{" "}
              <strong>no se puede deshacer</strong> y Finanzas App no se hace
              responsable de la pérdida de información que cause.
            </DialogDescription>

            <label className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-sm text-zinc-700 dark:bg-red-900/20 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={agreed}
                disabled={secondsLeft > 0}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-red-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <span>
                Entiendo que se borrarán todos mis datos y estoy de acuerdo.
                {secondsLeft > 0 && (
                  <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    Podrás marcar esta casilla en {secondsLeft} s…
                  </span>
                )}
              </span>
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!agreed}
                onClick={startChallenge}
              >
                Continuar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "prueba" && (
          <div className="space-y-4">
            <DialogDescription className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Verificación rápida: resuelve esta operación para confirmar que
              eres un humano.
            </DialogDescription>

            <div className="rounded-xl bg-zinc-100 px-4 py-4 text-center dark:bg-zinc-800">
              <p className="text-3xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
                ¿Cuánto es {challenge.text}?
              </p>
            </div>

            <Input
              id="delete-challenge"
              type="number"
              label="Tu respuesta"
              placeholder="Escribe el resultado"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              error={error ?? undefined}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("aviso")}
              >
                Atrás
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={verifyAnswer}
                disabled={answer.trim() === ""}
              >
                Verificar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "seguro" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 px-4 py-5 text-center dark:bg-red-900/20">
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                ¿Estás seguro?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Esta es tu última oportunidad: al confirmar se borrará tu
                cuenta con todos tus datos y no habrá forma de recuperarlos.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="danger"
                className="w-full min-h-[44px]"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando…" : "Sí, eliminar definitivamente"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={() => onOpenChange(false)}
                disabled={deleting}
              >
                No estoy seguro, cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
