import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indiaas eten bestellen in Amsterdam-Noord",
  description: "Bestel Indiase gerechten, tandoori, curry en naan bij Shah Restaurant in Amsterdam-Noord. Bekijk het menu en kies afhalen of bezorgen.",
  alternates: { canonical: "/order" },
  twitter: { card: "summary_large_image", title: "Indiaas eten bestellen in Amsterdam-Noord", images: ["/shah-social-card.png"] },
  openGraph: {
    title: "Indiaas eten bestellen in Amsterdam-Noord | Shah Restaurant",
    description: "Bestel Indiase gerechten, tandoori, curry en naan bij Shah Restaurant in Amsterdam-Noord. Bekijk het menu en kies afhalen of bezorgen.",
    url: "/order",
    type: "website",
    images: [{ url: "/shah-social-card.png", width: 1200, height: 630 }],
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
