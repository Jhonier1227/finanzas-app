import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // T6.2: build standalone (mínimo node_modules para producción) — se compila
  // en el PC personal y se copia al servidor; el PC viejo NUNCA compila (RNF-10).
  output: "standalone",
};

export default nextConfig;
