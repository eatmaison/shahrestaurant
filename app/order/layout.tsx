import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indiaas eten bestellen in Amsterdam-Noord",
  description: "Bestel Indiase gerechten, tandoori, curry en naan bij Shah Restaurant in Amsterdam-Noord. Bekijk het menu en kies afhalen of bezorgen.",
  alternates: { canonical: "/order" },
  openGraph: {
    title: "Indiaas eten bestellen in Amsterdam-Noord | Shah Restaurant",
    description: "Bestel Indiase gerechten, tandoori, curry en naan bij Shah Restaurant in Amsterdam-Noord. Bekijk het menu en kies afhalen of bezorgen.",
    url: "/order",
    type: "website",
    images: ["/shahrestaurant.png"],
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
