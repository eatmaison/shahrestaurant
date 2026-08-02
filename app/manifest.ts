import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Tandoor Company Amsterdam",
    short_name: "Tandoor Co.",
    description: "Reserve a table or order authentic Indian food from The Tandoor Company.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf3e7",
    theme_color: "#b45309",
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
        description: "Open The Tandoor Company POS terminal.",
        url: "/terminal",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Reserve a table",
        short_name: "Reserve",
        description: "Open The Tandoor Company reservation page.",
        url: "/reservations",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Order online",
        short_name: "Order",
        description: "Open The Tandoor Company order page.",
        url: "/order",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
