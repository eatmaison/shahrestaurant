import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Shah Restaurant Amsterdam", short_name: "Shah", description: "Reserveer een tafel of bestel Indiaas eten bij Shah Restaurant in Amsterdam-Noord.",
    start_url: "/", scope: "/", display: "standalone", lang: "nl-NL", background_color: "#fbf7ef", theme_color: "#0D4952", categories: ["food", "lifestyle"],
    icons: [{ src: "/brand/shah-icon-192-v1.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/brand/shah-icon-512-v1.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/brand/shah-maskable-512-v1.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    shortcuts: [{ name: "Tafel reserveren", short_name: "Reserveren", url: "/reserveren", icons: [{ src: "/brand/shah-icon-192-v1.png", sizes: "192x192", type: "image/png" }] }, { name: "Online bestellen", short_name: "Bestellen", url: "/menukaart", icons: [{ src: "/brand/shah-icon-192-v1.png", sizes: "192x192", type: "image/png" }] }],
  };
}
