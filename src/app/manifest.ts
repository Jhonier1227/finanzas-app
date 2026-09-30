import type { MetadataRoute } from "next";

// PWA manifest (T5.2) — convención verificada en los docs de Next 16
// (app/manifest.ts es un Route Handler especial, cacheado por defecto).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas App - Control de Gastos Personales",
    short_name: "Finanzas",
    description:
      "Registra tu sueldo mensual, planifica y controla tus gastos mes a mes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981",
    lang: "es-CO",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
