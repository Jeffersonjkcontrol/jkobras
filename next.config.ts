import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem de produção enxuta (Docker) — Next empacota tudo em .next/standalone.
  output: "standalone",
  experimental: {
    serverActions: {
      // Permite upload de fotos/plantas maiores (padrão do Next é 1 MB).
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
