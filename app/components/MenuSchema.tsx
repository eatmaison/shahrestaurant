"use client";

import type { Product } from "../lib/types";
import { useLang } from "../providers";
import { localePath } from "../lib/locale";

/** Uses only the real dishes supplied to the visible menu; no seed prices. */
export function MenuSchema({ products }: { products: Product[] }) {
  const { lang } = useLang();
  const dishes = products.filter(product => product.brand === "tandoor" && Number.isFinite(product.price) && product.price >= 0);
  if (!dishes.length) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `https://shahrestaurant.nl${localePath("/order", lang)}#menu`,
    name: lang === "nl" ? "Menukaart van Shah Restaurant" : "Shah Restaurant menu",
    inLanguage: lang,
    url: `https://shahrestaurant.nl${localePath("/order", lang)}`,
    hasMenuSection: [...new Set(dishes.map(product => product.category))].map(category => ({
      "@type": "MenuSection",
      name: category,
      hasMenuItem: dishes.filter(product => product.category === category).map(product => ({
        "@type": "MenuItem",
        name: product.name,
        description: lang === "nl" ? product.descriptionNl || product.description : product.description,
        offers: { "@type": "Offer", price: product.price.toFixed(2), priceCurrency: "EUR" },
      })),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}
