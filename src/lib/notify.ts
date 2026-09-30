/**
 * Avisos de confirmación (ej. "Gasto agregado correctamente").
 * Sistema mínimo sin dependencias: el store u otros módulos llaman a
 * `notify(mensaje)` y el componente <Toaster/> (montado en el layout raíz)
 * lo muestra unos segundos.
 */
export function notify(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>("finanzas:notify", { detail: message }));
}
