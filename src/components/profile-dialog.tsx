"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { profileApi, type ProfileDto } from "@/lib/api/client";
import { notify } from "@/lib/notify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileDto | null;
  /** Se llama con el perfil actualizado tras guardar. */
  onUpdated: (profile: ProfileDto) => void;
}

/**
 * Apartado de perfil (N6): muestra el correo de la sesión actual y permite
 * registrar/actualizar nombre y apellido dentro de la plataforma.
 */
export function ProfileDialog({ open, onOpenChange, profile, onUpdated }: ProfileDialogProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const form = useForm<ProfileFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- incompatibilidad conocida de tipos RHF + Zod 4 (ver AGENTS.md)
    resolver: zodResolver(profileSchema) as any,
    defaultValues: { firstName: "", lastName: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
      });
    }
  }, [open, profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    const updated = await profileApi.update({
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
    });
    onUpdated(updated);
    notify("Perfil actualizado correctamente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Correo electrónico
          </p>
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {profile?.email ?? "…"}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            id="firstName"
            label="Nombre"
            placeholder="Ej: Stiven"
            autoComplete="given-name"
            {...form.register("firstName")}
            error={form.formState.errors.firstName?.message}
          />

          <Input
            id="lastName"
            label="Apellido"
            placeholder="Ej: García"
            autoComplete="family-name"
            {...form.register("lastName")}
            error={form.formState.errors.lastName?.message}
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
              Guardar
            </Button>
          </DialogFooter>
        </form>

        {/* Zona de peligro (N7): eliminación de cuenta con doble confirmación */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Zona de peligro
          </p>
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            Eliminar tu cuenta borra todos tus datos y no se puede deshacer.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="mt-2"
            onClick={() => {
              onOpenChange(false);
              setDeleteOpen(true);
            }}
          >
            Eliminar cuenta…
          </Button>
        </div>
      </DialogContent>

      <DeleteAccountDialog
        key={deleteOpen ? "open" : "closed"}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Dialog>
  );
}
