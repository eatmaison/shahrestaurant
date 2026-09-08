import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Shah Restaurant Amsterdam",
    short_name: "Shah",
    description: "Reserve a table or order refined Indian food from Shah Restaurant.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    lang: "en",
    orientation: "portrait",
    background_color: "#fdfcf8",
    theme_color: "#c49a3a",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Terminal",
        short_name: "Terminal",
        description: "Open the Shah Restaurant POS terminal.",
        url: "/terminal",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Reserve a table",
        short_name: "Reserve",
        description: "Open the Shah Restaurant reservation page.",
        url: "/reservations",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Order online",
        short_name: "Order",
        description: "Open the Shah Restaurant order page.",
        url: "/order",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
