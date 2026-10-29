import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Shah Restaurant Amsterdam", short_name: "Shah", description: "Reserveer een tafel of bestel Indiaas eten bij Shah Restaurant in Amsterdam-Noord.",
    start_url: "/", scope: "/", display: "standalone", lang: "nl-NL", background_color: "#fdfcf8", theme_color: "#c49a3a", categories: ["food", "lifestyle"],
    icons: [{ src: "/shah-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/shah-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/shah-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    shortcuts: [{ name: "Tafel reserveren", short_name: "Reserveren", url: "/reservations", icons: [{ src: "/shah-icon-192.png", sizes: "192x192", type: "image/png" }] }, { name: "Online bestellen", short_name: "Bestellen", url: "/order", icons: [{ src: "/shah-icon-192.png", sizes: "192x192", type: "image/png" }] }],
  };
}
