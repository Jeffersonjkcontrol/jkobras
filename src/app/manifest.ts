import type { MetadataRoute } from "next";

// Servido em /manifest.webmanifest (App Router). Torna o app instalável no celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JK Obras",
    short_name: "JK Obras",
    description: "Gestão de obras e arquitetura — projetos, cronograma, orçamentos, financeiro e diário de obra.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#2563eb",
    orientation: "portrait",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
